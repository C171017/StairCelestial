#!/usr/bin/env python3
"""Screen the current OrbitSky blend using the shipped desktop and compact assets.

Requires NumPy, Pillow and FFmpeg/imageio-ffmpeg. Run from any directory.
Uses the same conservative thresholds as prepare-sky-video.py; browser review
is still required because CPU thumbnails do not simulate perspective or playback.
"""
import hashlib
import importlib.util
import json
from contextlib import contextmanager
from pathlib import Path
import re
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sky_qa", ROOT / "scripts/prepare-sky-video.py")
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)
shader_path = ROOT / "src/components/sanctuary/OrbitSky.tsx"
shader = shader_path.read_text()
match = re.search(r"float atmosphere = mix\(([\d.]+), ([\d.]+), smoothstep\(([\d.]+), ([\d.]+), skyUv.y\)\)", shader)
if not match:
    raise RuntimeError("Sky blend changed: update this verifier to match the shader.")
low, high, start, end = map(float, match.groups())
width, height = qa.QA_SIZE
y = (1 - (np.arange(height, dtype=np.float32) + 0.5) / height)[:, None, None]

def smooth(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)

weight = low + (high - low) * smooth(start, end, y)
pole = smooth(0.94, 1, np.abs(y * 2 - 1))
decode = qa.decode
report = {"kind": "displayed-sky-composite-screening", "visual_browser_acceptance_required": True,
          "based_on_shader": str(shader_path.relative_to(ROOT)),
          "shader_sha256": hashlib.sha256(shader.encode()).hexdigest(),
          "atmosphere": match.group(0), "video_mix": 1,
          "qa_notes": ["512x256 decoded-frame screening; not a GPU or physical-device benchmark.",
                       "Each format uses its actual shipping still derivative.",
                       "Linear-light sRGB blend and pole taper; introductory fade and effects excluded."],
          "outputs": {}}

for variant, resolution in [("desktop", "8k"), ("compact", "4k")]:
    still_path = ROOT / f"public/textures/sanctuary/cloudscape-360-{resolution}.webp"
    still = qa.LINEAR[np.asarray(Image.open(still_path).convert("RGB").resize(qa.QA_SIZE, Image.Resampling.LANCZOS))]
    pole_color = (still[:, width // 2 - 1:width // 2] + still[:, width // 2:width // 2 + 1]) / 2

    @contextmanager
    def composite_decode(*args, **kwargs):
        with decode(*args, **kwargs) as frames:
            def composite():
                for frame in frames:
                    color = still * (1 - weight) + qa.LINEAR[frame] * weight
                    color = color * (1 - pole) + pole_color * pole
                    # Keep float precision: do not add another lossy 8-bit encode.
                    yield 255 * np.where(color <= 0.0031308, 12.92 * color, 1.055 * color ** (1 / 2.4) - 0.055)
            yield composite()

    qa.decode = composite_decode
    video = ROOT / f"public/videos/sanctuary/cloud-drift-{variant}.mp4"
    metrics, _ = qa.analyze(qa.ffmpeg_path(None), video, 24)
    passed = metrics["spatial_wrap"]["screen_pass"] and all(
        r["position_screen_pass"] and r["velocity_screen_pass"] for r in metrics["regions"].values())
    report["outputs"][variant] = {"video_path": str(video.relative_to(ROOT)),
        "still_path": str(still_path.relative_to(ROOT)),
        "displayed_composite_screens_pass": passed, **metrics}
    print(f"{variant}: {'PASS' if passed else 'FAIL'}")

destination = ROOT / "docs/validation/sky-video-displayed.json"
destination.write_text(json.dumps(report, indent=2) + "\n")
raise SystemExit(0 if all(x["displayed_composite_screens_pass"] for x in report["outputs"].values()) else 1)
