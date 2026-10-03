#!/usr/bin/env python3
"""Build and measure one periodic cloud panorama without loading a clip into RAM.

Requires Python, NumPy, Pillow, and FFmpeg (or the imageio-ffmpeg package).
Example: python3 scripts/prepare-sky-video.py source.mp4 /tmp/sky-loop
The JSON report distinguishes numerical checks from required visual review.
"""

from __future__ import annotations

import argparse
from collections import deque
from contextlib import contextmanager
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageDraw


QA_SIZE = (512, 256)
REGIONS = {
    "whole": (slice(None), slice(None)),
    "top_left": (slice(0, 128), slice(0, 256)),
    "top_right": (slice(0, 128), slice(256, 512)),
    "bottom_left": (slice(128, 256), slice(0, 256)),
    "bottom_right": (slice(128, 256), slice(256, 512)),
    "horizon": (slice(96, 160), slice(None)),
}
SRGB = np.arange(256, dtype=np.float32) / 255
LINEAR = np.where(SRGB <= 0.04045, SRGB / 12.92, ((SRGB + 0.055) / 1.055) ** 2.4)
LINEAR_GRID = np.arange(65536, dtype=np.float32) / 65535
ENCODE = np.rint(255 * np.where(LINEAR_GRID <= 0.0031308, LINEAR_GRID * 12.92,
                              1.055 * LINEAR_GRID ** (1 / 2.4) - 0.055)).astype(np.uint8)


def ffmpeg_path(explicit):
    candidate = explicit or os.environ.get("IMAGEIO_FFMPEG_EXE") or shutil.which("ffmpeg")
    if candidate:
        return candidate
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as exc:
        raise RuntimeError("Pass --ffmpeg or install imageio-ffmpeg in this Python environment.") from exc


def probe(ffmpeg, source):
    result = subprocess.run([ffmpeg, "-hide_banner", "-i", str(source)], capture_output=True,
                            text=True, timeout=30)
    stream = next((line for line in result.stderr.splitlines() if "Video:" in line), "")
    dimensions = re.search(r"(?<![\w.])(\d{2,5})x(\d{2,5})(?![\w.])", stream)
    duration = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr)
    if not dimensions or not duration:
        raise RuntimeError(f"Cannot read a finite video stream: {result.stderr[-3000:]}")
    hours, minutes, seconds = map(float, duration.groups())
    width, height = map(int, dimensions.groups())
    fps = re.search(r"([\d.]+) fps", stream)
    return {"width": width, "height": height, "duration_seconds": hours * 3600 + minutes * 60 + seconds,
            "source_fps": float(fps.group(1)) if fps else None, "stream_description": stream.strip()}


def read_exact(stream, size):
    parts, remaining = [], size
    while remaining:
        part = stream.read(remaining)
        if not part:
            break
        parts.append(part)
        remaining -= len(part)
    if remaining and parts:
        raise RuntimeError("Decoder returned a partial RGB frame.")
    return b"".join(parts)


@contextmanager
def decode(ffmpeg, source, size, fps, start=0, end=None):
    width, height = size
    trim = f",trim=start_frame={start}"
    if end is not None:
        trim += f":end_frame={end}"
    filters = f"fps={fps},scale={width}:{height}:flags=lanczos,setsar=1{trim},setpts=PTS-STARTPTS"
    with tempfile.TemporaryFile() as errors:
        process = subprocess.Popen([ffmpeg, "-v", "error", "-i", str(source), "-an", "-sn",
                                    "-vf", filters, "-r", str(fps),
                                    "-f", "rawvideo", "-pix_fmt", "rgb24", "pipe:1"],
                                   stdout=subprocess.PIPE, stderr=errors)

        def frames():
            while True:
                data = read_exact(process.stdout, width * height * 3)
                if not data:
                    break
                yield np.frombuffer(data, np.uint8).reshape(height, width, 3)
            if process.wait() != 0:
                errors.seek(0)
                raise RuntimeError(errors.read().decode(errors="replace")[-3000:])

        try:
            yield frames()
        finally:
            process.stdout.close()
            if process.poll() is None:
                process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


def distribution(values):
    data = np.asarray(values, dtype=float)
    return {"mean": float(np.mean(data)), "median": float(np.median(data)),
            "p95": float(np.percentile(data, 95)), "max": float(np.max(data))} if data.size else None


def mae_region(array, region):
    return float(np.mean(np.abs(array[REGIONS[region]])))


def analyze(ffmpeg, source, fps, end=None):
    steps = {name: [] for name in REGIONS}
    accelerations = {name: [] for name in REGIONS}
    edge, neighbors, brightness, count = [], [], [], 0
    first, last = [], deque(maxlen=3)
    previous, previous_delta = None, None
    with decode(ffmpeg, source, QA_SIZE, fps, end=end) as frames:
        for frame in frames:
            rgb = frame.astype(np.float32)
            brightness.append(float(np.mean(rgb)))
            if count < 3:
                first.append(frame.copy())
            last.append(frame.copy())
            edge.append(float(np.mean(np.abs(rgb[:, 0] - rgb[:, -1]))))
            neighbors.append(float((np.mean(np.abs(rgb[:, 1:9] - rgb[:, :8])) +
                                    np.mean(np.abs(rgb[:, -8:] - rgb[:, -9:-1]))) / 2))
            if previous is not None:
                delta = rgb - previous
                for name in REGIONS:
                    steps[name].append(mae_region(delta, name))
                    if previous_delta is not None:
                        accelerations[name].append(mae_region(delta - previous_delta, name))
                previous_delta = delta
            previous = rgb
            count += 1
    if count < 4:
        raise RuntimeError("At least four video frames are required for continuity measurement.")
    first_float, last_float = first[0].astype(np.float32), last[-1].astype(np.float32)
    boundary = first_float - last_float
    before = last_float - last[-2].astype(np.float32)
    after = first[1].astype(np.float32) - first_float
    regions = {}
    for name in REGIONS:
        ordinary = distribution(steps[name])
        acceleration = distribution(accelerations[name])
        value = mae_region(boundary, name)
        change_before = mae_region(boundary - before, name)
        change_after = mae_region(after - boundary, name)
        # Heuristic screening limits, not universal perceptual pass criteria.
        position_limit = max(1.0, ordinary["p95"] * 2, ordinary["median"] * 3)
        velocity_limit = max(1.0, acceleration["p95"] * 2)
        regions[name] = {
            "ordinary_frame_rgb_mae": ordinary, "wrap_frame_rgb_mae": value,
            "ordinary_velocity_change_rgb_mae": acceleration,
            "wrap_velocity_change_before_rgb_mae": change_before,
            "wrap_velocity_change_after_rgb_mae": change_after,
            "position_screening_limit": position_limit, "velocity_screening_limit": velocity_limit,
            "position_screen_pass": value <= position_limit,
            "velocity_screen_pass": max(change_before, change_after) <= velocity_limit,
        }
    changes = np.asarray(steps["whole"])
    median = float(np.median(changes))
    mad = float(np.median(np.abs(changes - median)))
    cut_limit = max(12.0, median * 8, median + mad * 10)
    cuts = [{"frame": int(i + 1), "time_seconds": (i + 1) / fps, "rgb_mae": float(value)}
            for i, value in enumerate(changes) if value > cut_limit]
    mean_edge, mean_neighbor = float(np.mean(edge)), float(np.mean(neighbors))
    return {
        "frame_count": count, "duration_seconds": count / fps, "qa_size": list(QA_SIZE),
        "units": "mean absolute RGB channel differences, 0–255; decoded and resized for screening",
        "regions": regions,
        "spatial_wrap": {"boundary_rgb_mae": distribution(edge), "nearby_column_rgb_mae": distribution(neighbors),
                         "mean_boundary_to_neighbor_ratio": mean_edge / mean_neighbor if mean_neighbor else None,
                         "screen_pass": max(edge) <= max(1.5, float(np.percentile(neighbors, 95)) * 2)},
        "possible_camera_cuts": cuts, "camera_cut_screening_limit": cut_limit,
        "all_loop_brightness": {"mean_rgb": distribution(brightness),
                                "min_mean_rgb": min(brightness),
                                "max_adjacent_mean_rgb_change": float(np.max(np.abs(np.diff(brightness)))),
                                "wrap_mean_rgb_change": abs(brightness[0] - brightness[-1])},
    }, (first, list(last))


def encode_linear(linear):
    return ENCODE[np.rint(np.clip(linear, 0, 1) * 65535).astype(np.uint16)]


def blend_frames(tail, head, weight):
    return encode_linear(LINEAR[tail] * (1 - weight) + LINEAR[head] * weight)


def close_longitude(frame, band_fraction):
    """Make the edge columns identical; taper a symmetric mix inside each edge."""
    result = frame.copy()
    band = max(2, int(frame.shape[1] * band_fraction))
    distance = np.linspace(0, 1, band, dtype=np.float32)
    smooth = distance * distance * (3 - 2 * distance)
    weight = (0.5 * (1 - smooth))[None, :, None]
    left = LINEAR[frame[:, :band]]
    right = LINEAR[frame[:, -band:][:, ::-1]]
    result[:, :band] = encode_linear(left * (1 - weight) + right * weight)
    result[:, -band:] = encode_linear(right * (1 - weight) + left * weight)[:, ::-1]
    # Both endpoint calculations are the same average; assert the intended invariant.
    if not np.array_equal(result[:, 0], result[:, -1]):
        raise RuntimeError("Longitude edge correction failed its equality invariant.")
    return result


def write_loop(ffmpeg, source, destination, compact_destination, size, compact_size, fps, total, overlap,
               seam_fraction, crf, compact_crf):
    width, height = size
    def output_options(target, quality, dimensions=None):
        options = ["-map", "0:v", "-an"]
        if dimensions:
            options += ["-vf", f"scale={dimensions[0]}:{dimensions[1]}:flags=lanczos"]
        return options + ["-c:v", "libx264", "-preset", "medium", "-crf", str(quality), "-pix_fmt", "yuv420p",
                          "-g", str(fps * 2), "-color_primaries", "bt709", "-color_trc", "bt709",
                          "-colorspace", "bt709", "-movflags", "+faststart", str(target)]

    # Both sizes come directly from the repaired RGB frames. Re-encoding the
    # compact file from a lossy desktop copy amplifies its initial-keyframe jump.
    command = [ffmpeg, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s",
               f"{width}x{height}", "-framerate", str(fps), "-i", "pipe:0"]
    command += output_options(destination, crf)
    command += output_options(compact_destination, compact_crf, compact_size)
    with tempfile.TemporaryFile() as errors:
        encoder = subprocess.Popen(command, stdin=subprocess.PIPE, stderr=errors)
        written = 0
        try:
            with decode(ffmpeg, source, size, fps, overlap, total) as tail_frames, \
                    decode(ffmpeg, source, size, fps, 0, overlap) as head_frames:
                for source_index, frame in enumerate(tail_frames, start=overlap):
                    if source_index >= total - overlap:
                        fraction = (source_index - (total - overlap)) / overlap
                        weight = fraction * fraction * (3 - 2 * fraction)
                        frame = blend_frames(frame, next(head_frames), weight)
                    encoder.stdin.write(close_longitude(frame, seam_fraction).tobytes())
                    written += 1
            encoder.stdin.close()
            if encoder.wait() != 0:
                errors.seek(0)
                raise RuntimeError(errors.read().decode(errors="replace")[-3000:])
        finally:
            if not encoder.stdin.closed:
                encoder.stdin.close()
            if encoder.poll() is None:
                encoder.terminate()
                encoder.wait(timeout=10)
        if written != total - overlap:
            raise RuntimeError(f"Expected {total - overlap} frames but encoded {written}.")


def contact_sheet(groups, destination):
    tile_width, tile_height, label_height = 320, 160, 30
    sheet = Image.new("RGB", (tile_width * 6, (tile_height + label_height) * len(groups)), "#141820")
    draw = ImageDraw.Draw(sheet)
    for row, (name, thumbnails) in enumerate(groups):
        first, last = thumbnails
        for column, (label, frame) in enumerate(list(zip(["end -3", "end -2", "end -1"], last)) +
                                               list(zip(["start", "start +1", "start +2"], first))):
            x, y = column * tile_width, row * (tile_height + label_height)
            sheet.paste(Image.fromarray(frame).resize((tile_width, tile_height), Image.Resampling.LANCZOS), (x, y))
            draw.text((x + 8, y + tile_height + 8), f"{name}: {label}", fill="white")
    sheet.save(destination)


def timeline_sheet(ffmpeg, source, fps, total, destination):
    indices = np.rint(np.linspace(0, total - 1, 12)).astype(int).tolist()
    sheet = Image.new("RGB", (1536, 1152), "#141820")
    draw = ImageDraw.Draw(sheet)
    with decode(ffmpeg, source, QA_SIZE, fps) as frames:
        for index, frame in enumerate(frames):
            if index not in indices:
                continue
            position = indices.index(index)
            x, y = (position % 3) * 512, (position // 3) * 288
            sheet.paste(Image.fromarray(frame), (x, y))
            draw.text((x + 8, y + 264), f"{index / fps:.3f} seconds | mean RGB {frame.mean():.2f}", fill="white")
    sheet.save(destination)


def save_report(report, directory):
    (directory / "sky-video-report.json").write_text(json.dumps(report, indent=2) + "\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--fps", type=int, default=24)
    parser.add_argument("--overlap", type=float, default=2.0)
    parser.add_argument("--source-duration", type=float,
                        help="Use only this many seconds from the start, rounded to a whole frame.")
    parser.add_argument("--seam-fraction", type=float, default=0.025)
    parser.add_argument("--crf", type=int, default=18)
    parser.add_argument("--compact-crf", type=int, default=18)
    parser.add_argument("--allow-aspect-remap", action="store_true",
                        help="Only after visual confirmation that the complete panorama was preserved.")
    parser.add_argument("--ffmpeg")
    args = parser.parse_args()
    if not 1 <= args.fps <= 60 or args.overlap <= 0 or not 0 < args.seam_fraction <= 0.1:
        parser.error("Require fps 1–60, positive overlap, and seam fraction in (0, 0.1].")
    if args.source_duration is not None and args.source_duration <= 0:
        parser.error("Source duration must be positive.")
    if not 0 <= args.crf <= 51 or not 0 <= args.compact_crf <= 51:
        parser.error("CRF values must be between 0 and 51.")
    args.output.mkdir(parents=True, exist_ok=True)
    ffmpeg = ffmpeg_path(args.ffmpeg)
    metadata = probe(ffmpeg, args.input)
    aspect_error = abs(metadata["width"] / metadata["height"] / 2 - 1)
    report = {"status": "processing", "source": str(args.input.resolve()), "source_metadata": metadata,
              "ffmpeg": ffmpeg, "fps": args.fps, "aspect_error_fraction": aspect_error,
              "requested_source_duration_seconds": args.source_duration,
              "explicit_aspect_remap": args.allow_aspect_remap,
              "visual_review_required": True,
              "limitations": ["Numerical screens cannot establish perceptual quality or exclude camera drift.",
                              "Source thumbnails use complete-frame 2:1 remapping for metric comparability; no crop is applied.",
                              "Pole treatment remains the OrbitSky shader's responsibility.",
                              "Temporal overlap can ghost clouds; inspect several complete loops at multiple azimuths."]}
    save_report(report, args.output)
    print("Inspecting source frames and recording raw continuity metrics…", flush=True)
    source_end = round(args.source_duration * args.fps) if args.source_duration is not None else None
    raw, raw_thumbnails = analyze(ffmpeg, args.input, args.fps, end=source_end)
    report["raw"] = raw
    contact_sheet([("Raw source", raw_thumbnails)], args.output / "source-endpoints.jpg")
    # Also preserve the actual aspect ratio for source/reference composition review.
    subprocess.run([ffmpeg, "-y", "-v", "error", "-i", str(args.input), "-frames:v", "1",
                    "-vf", "scale=1600:-2", str(args.output / "source-first-frame.jpg")], check=True)
    if aspect_error > 0.05 and not args.allow_aspect_remap:
        report["status"] = "rejected-aspect-needs-manual-review"
        save_report(report, args.output)
        print("Source is more than 5% away from 2:1; inspect source-first-frame.jpg before any explicit remap.")
        return 2
    if raw["possible_camera_cuts"]:
        report["status"] = "rejected-possible-camera-cut-needs-manual-review"
        save_report(report, args.output)
        print("Abrupt source changes detected. Inspect the reported frames before using this generation.")
        return 2
    total, overlap = raw["frame_count"], round(args.overlap * args.fps)
    if overlap < 2 or total <= overlap * 2:
        report["status"] = "rejected-insufficient-duration"
        save_report(report, args.output)
        print("Need at least two overlap frames and source duration longer than two overlap intervals.")
        return 2
    width = min(3072, metadata["width"]) // 4 * 4
    desktop_size = (width, width // 2)
    compact_width = min(1536, width)
    compact_size = (compact_width, compact_width // 2)
    desktop = args.output / "cloudscape-360-loop-desktop.mp4"
    compact = args.output / "cloudscape-360-loop-compact.mp4"
    report["processing"] = {"desktop_size": list(desktop_size), "compact_size": list(compact_size),
                            "overlap_frames": overlap, "overlap_seconds": overlap / args.fps,
                            "period_frames": total - overlap, "period_seconds": (total - overlap) / args.fps,
                            "temporal_blend": "smoothstep, linear-light sRGB, tail to head; output starts after overlap",
                            "spatial_blend": "symmetric linear-light edge blend with smoothstep taper",
                            "longitude_band_fraction_each_side": args.seam_fraction,
                            "preencode_edge_columns_identical": True,
                            "poles_modified": False, "audio_removed": True,
                            "desktop_crf": args.crf, "compact_crf": args.compact_crf,
                            "compact_encoded_directly_from_rgb": True}
    save_report(report, args.output)
    print(f"Encoding {desktop_size[0]}×{desktop_size[1]} loop, {(total-overlap)/args.fps:.3f}s…", flush=True)
    with tempfile.TemporaryDirectory(prefix="sky-video-") as temporary:
        pending = Path(temporary) / "desktop.mp4"
        pending_compact = Path(temporary) / "compact.mp4"
        write_loop(ffmpeg, args.input, pending, pending_compact, desktop_size, compact_size, args.fps, total,
                   overlap, args.seam_fraction, args.crf, args.compact_crf)
        shutil.copyfile(pending, desktop)
        shutil.copyfile(pending_compact, compact)
    print("Measuring both encoded outputs, including compression at their temporal and spatial joins…", flush=True)
    desktop_qa, desktop_thumbnails = analyze(ffmpeg, desktop, args.fps)
    compact_qa, compact_thumbnails = analyze(ffmpeg, compact, args.fps)
    report["processed"] = {"desktop": {"path": str(desktop.resolve()), "bytes": desktop.stat().st_size, **desktop_qa},
                           "compact": {"path": str(compact.resolve()), "bytes": compact.stat().st_size, **compact_qa}}
    checks = [qa["spatial_wrap"]["screen_pass"] and not qa["possible_camera_cuts"] and
              all(region["position_screen_pass"] and region["velocity_screen_pass"] for region in qa["regions"].values())
              for qa in (desktop_qa, compact_qa)]
    report["automated_screens_pass"] = all(checks)
    report["status"] = "encoded-awaiting-visual-review" if all(checks) else "encoded-numerical-flags-need-review"
    contact_sheet([("Raw source", raw_thumbnails), ("Desktop loop", desktop_thumbnails),
                   ("Compact loop", compact_thumbnails)], args.output / "loop-endpoints.jpg")
    timeline_sheet(ffmpeg, desktop, args.fps, total - overlap, args.output / "loop-overview.jpg")
    save_report(report, args.output)
    print(json.dumps({"status": report["status"], "report": str(args.output / "sky-video-report.json"),
                      "period_seconds": report["processing"]["period_seconds"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
