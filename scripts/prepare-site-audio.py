#!/usr/bin/env python3
"""Download native audio-only streams and package browser music without upsampling.

Usage: python3 scripts/prepare-site-audio.py --ffmpeg /path/to/ffmpeg
Add --source-dir /path/to/downloads to package previously downloaded streams.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

URL = "https://youtu.be/z2QKPDDApTE"
ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg"))
    parser.add_argument("--yt-dlp", default=shutil.which("yt-dlp"))
    parser.add_argument("--source-dir", type=Path)
    args = parser.parse_args()
    if not args.ffmpeg:
        parser.error("Provide --ffmpeg or put FFmpeg on PATH")
    with tempfile.TemporaryDirectory(prefix="site-music-") as temporary:
        source = args.source_dir or Path(temporary)
        if not args.source_dir:
            if not args.yt_dlp:
                parser.error("Provide --yt-dlp or put yt-dlp on PATH")
            subprocess.run([args.yt_dlp, "--no-playlist", "-f", "140,251,139", "-o",
                            str(source / "source-%(format_id)s.%(ext)s"), URL], check=True)
        destination = ROOT / "public/audio"
        # Native AAC-LC, native Opus, Ogg/Opus remux, universal MP3, native HE-AAC.
        variants = [
            ("source-140.m4a", "ambient-loop.m4a", "aac", "AAC-LC", 140, ["-c:a", "copy", "-movflags", "+faststart"]),
            ("source-251.webm", "ambient-loop.webm", "opus", "Opus", 251, ["-c:a", "copy"]),
            ("source-251.webm", "ambient-loop.opus", "opus", "Opus", 251, ["-c:a", "copy", "-f", "ogg"]),
            ("source-251.webm", "ambient-loop.mp3", "mp3", "MP3", 251, ["-c:a", "libmp3lame", "-q:a", "2", "-ar", "44100"]),
            ("source-139.m4a", "ambient-loop-low.m4a", "aac", "HE-AAC", 139, ["-c:a", "copy", "-movflags", "+faststart"]),
        ]
        report = {"source_url": URL, "video_id": "z2QKPDDApTE",
                  "title": "Cocteau Twins - Iceblink Luck (Instrumental) [Stem Filtered]",
                  "uploader": "Acoolrocket DaJams", "duration_seconds": 199,
                  "variants": []}
        for input_name, output_name, codec, profile, format_id, codec_args in variants:
            output = Path(temporary) / output_name
            subprocess.run([args.ffmpeg, "-v", "error", "-y", "-i", str(source / input_name),
                            "-map", "0:a:0", "-vn", "-sn", "-dn", "-map_metadata", "-1",
                            *codec_args, str(output)], check=True)
            # Decode the complete file, so truncated or invalid output never replaces an asset.
            subprocess.run([args.ffmpeg, "-v", "error", "-xerror", "-i", str(output),
                            "-map", "0:a:0", "-f", "null", "-"], check=True)
            shutil.copyfile(output, destination / output_name)
            report["variants"].append({"file": output_name, "codec": codec, "profile": profile,
                                       "youtube_format_id": format_id, "transcoded": codec == "mp3",
                                       "bytes": output.stat().st_size,
                                       "sha256": hashlib.sha256(output.read_bytes()).hexdigest()})
            print(f"Validated {output_name}: {output.stat().st_size:,} bytes")
        (destination / "source.json").write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
