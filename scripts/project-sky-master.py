"""Project the browser's six frozen cube views to a 24K PNG, in bounded strips.

Usage: python scripts/project-sky-master.py [width=24576]
Cube faces use the direction/up vectors retained in their export manifest.
The output follows Three SphereGeometry's equirectangular UV convention.
"""
import json
from pathlib import Path
import struct
import sys
import zlib

import numpy as np
from PIL import Image

root = Path("assets/sky/master-24k")
manifest = json.loads((root / "faces/manifest.json").read_text())
width = int(sys.argv[1]) if len(sys.argv) > 1 else 24576
height = width // 2
faces = [np.asarray(Image.open(root / f"faces/{face['name']}.png").convert("RGB")) for face in manifest["faces"]]
size = faces[0].shape[0]
phi = (np.arange(width, dtype=np.float32) + .5) / width * (2 * np.pi)
destination = root / f"layered-sky-{width}.png"

def chunk(file, kind, data):
    file.write(struct.pack(">I", len(data)))
    file.write(kind)
    file.write(data)
    file.write(struct.pack(">I", zlib.crc32(data, zlib.crc32(kind))))

with destination.open("wb") as file:
    file.write(b"\x89PNG\r\n\x1a\n")
    chunk(file, b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    chunk(file, b"sRGB", b"\x00")
    compressor = zlib.compressobj(6)
    for top in range(0, height, 96):
        bottom = min(height, top + 96)
        theta = (np.arange(top, bottom, dtype=np.float32) + .5) / height * np.pi
        y = np.broadcast_to(np.cos(theta)[:, None], (bottom-top, width))
        x = -np.sin(theta)[:, None] * np.cos(phi)[None, :]
        z = np.sin(theta)[:, None] * np.sin(phi)[None, :]
        direction = np.stack([x, y, z], axis=-1)
        dominant = np.argmax(np.abs(direction), axis=-1)
        output = np.empty((bottom-top, width, 3), dtype=np.uint8)
        for index, spec in enumerate(manifest["faces"]):
            forward = np.array(spec["direction"], dtype=np.float32)
            up = np.array(spec["up"], dtype=np.float32)
            right = np.cross(forward, up)
            axis = int(np.argmax(np.abs(forward)))
            mask = (dominant == axis) & (direction[..., axis] * forward[axis] > 0)
            rays = direction[mask]
            depth = rays @ forward
            u = np.clip(((rays @ right) / depth + 1) * .5 * size - .5, 0, size-1)
            v = np.clip(((rays @ up) / depth + 1) * .5 * size - .5, 0, size-1)
            ix, iy = u.astype(np.int32), v.astype(np.int32)
            fx, fy = (u-ix)[:, None], (v-iy)[:, None]
            nx, ny = np.minimum(ix+1, size-1), np.minimum(iy+1, size-1)
            source = faces[index]
            value = (source[iy, ix]*(1-fx)+source[iy, nx]*fx)*(1-fy) + (source[ny, ix]*(1-fx)+source[ny, nx]*fx)*fy
            output[mask] = np.rint(value).astype(np.uint8)
        # PNG filter Sub keeps each strip independent and compression effective.
        filtered = output.copy()
        filtered[:, 1:] = output[:, 1:] - output[:, :-1]
        rows = np.concatenate([np.ones((bottom-top, 1), dtype=np.uint8), filtered.reshape(bottom-top, -1)], axis=1)
        data = compressor.compress(rows.tobytes())
        if data:
            chunk(file, b"IDAT", data)
        if top % 960 == 0:
            print(f"Projected {bottom}/{height} rows", flush=True)
    chunk(file, b"IDAT", compressor.flush())
    chunk(file, b"IEND", b"")
print(destination, flush=True)
