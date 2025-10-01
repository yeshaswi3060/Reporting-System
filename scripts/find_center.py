#!/usr/bin/env python3

"""
Find the geometric center of an image.

Usage:
  python scripts/find_center.py --image path/to/image.jpg

Options:
  --show-overlay           Save a copy of the image with a red dot at the center
  --overlay-output OUTPUT  Output path for the overlay image (required with --show-overlay)
  --json                   Print result as JSON {"width":...,"height":...,"center":{"x":...,"y":...}}

Notes:
  - Requires Pillow: pip install pillow
  - Center is computed as (width/2, height/2), rounded to nearest integer pixel.
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except Exception as exc:
    print("This script requires Pillow. Install with: pip install pillow", file=sys.stderr)
    raise


def compute_center(image_path: Path):
    with Image.open(image_path) as img:
        width, height = img.size
        # Use round to get the true midpoint for odd/even dims
        cx = int(round(width / 2.0))
        cy = int(round(height / 2.0))
        return width, height, cx, cy


def save_overlay(image_path: Path, output_path: Path, cx: int, cy: int):
    with Image.open(image_path).convert("RGBA") as img:
        draw = ImageDraw.Draw(img)
        r = 6  # radius of the red dot
        # Draw a red dot with white border for visibility if user chooses to see it
        draw.ellipse((cx - r - 2, cy - r - 2, cx + r + 2, cy + r + 2), outline=(255, 255, 255, 255), width=2)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 0, 0, 255))
        img.save(output_path)


def main():
    parser = argparse.ArgumentParser(description="Find the geometric center of an image")
    parser.add_argument("--image", required=True, type=Path, help="Path to input image")
    parser.add_argument("--show-overlay", action="store_true", help="Also save an overlay image with a red dot")
    parser.add_argument("--overlay-output", type=Path, help="Output path for overlay image (used with --show-overlay)")
    parser.add_argument("--json", action="store_true", help="Print result as JSON")
    args = parser.parse_args()

    if not args.image.exists():
        print(f"Image not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    width, height, cx, cy = compute_center(args.image)

    if args.show_overlay:
        if not args.overlay_output:
            print("--overlay-output is required when using --show-overlay", file=sys.stderr)
            sys.exit(2)
        save_overlay(args.image, args.overlay_output, cx, cy)

    if args.json:
        print(json.dumps({
            "width": width,
            "height": height,
            "center": {"x": cx, "y": cy}
        }))
    else:
        print(f"width={width} height={height} center=({cx},{cy})")


if __name__ == "__main__":
    main()


