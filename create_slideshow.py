#!/usr/bin/env python3
"""
Wedding slideshow movie generator
Usage: python create_slideshow.py [photos_dir]
  photos_dir: path to folder containing images (default: ./photos)
Output: wedding_movie.mp4
"""

import os
import sys
import glob
import math
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

try:
    from moviepy.editor import (
        VideoClip, ImageClip, ColorClip,
        concatenate_videoclips, CompositeVideoClip,
    )
except ImportError:
    print("Error: moviepy is not installed.\nRun: pip install moviepy")
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────

W, H   = 1920, 1080
FPS    = 30
PHOTO_DURATION = 4.5   # seconds per photo
CROSSFADE      = 1.0   # crossfade between photos
ZOOM           = 0.12  # Ken Burns zoom amount (12%)
CARD_DURATION  = 3.5   # title card duration
FADE           = 1.0   # fade-in / fade-out duration for cards

# Colors
BG      = (8,  14,  30)    # deep navy
CREAM   = (245, 240, 228)  # warm cream
GOLD    = (200, 165,  70)  # gold accent
GOLD_DIM = (150, 120, 50)  # dimmed gold for lines

# ── Font detection ─────────────────────────────────────────────────────────────

def _find(*paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None

def get_english_font_path():
    return _find(
        "C:/Windows/Fonts/georgia.ttf",
        "C:/Windows/Fonts/Georgia.ttf",
        "/Library/Fonts/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
    )

def get_japanese_font_path():
    path = _find(
        # Windows — 游明朝 (elegant serif, ideal for weddings)
        "C:/Windows/Fonts/YuMincho.ttc",
        "C:/Windows/Fonts/yumin.ttf",
        "C:/Windows/Fonts/YuGothM.ttc",
        "C:/Windows/Fonts/meiryo.ttc",
        "C:/Windows/Fonts/msgothic.ttc",
        "C:/Windows/Fonts/msmincho.ttc",
        # macOS
        "/System/Library/Fonts/ヒラギノ明朝 ProN.ttc",
        "/System/Library/Fonts/Hiragino Mincho ProN.ttc",
        "/Library/Fonts/Osaka.ttf",
        # Linux (Noto)
        "/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    )
    if path is None:
        # Try fc-list on Linux/macOS
        try:
            import subprocess
            r = subprocess.run(
                ["fc-list", ":lang=ja", "--format=%{file}\n"],
                capture_output=True, text=True, timeout=5,
            )
            for line in r.stdout.strip().splitlines():
                line = line.strip()
                if line and os.path.exists(line):
                    return line
        except Exception:
            pass
    return path

EN_FONT_PATH = get_english_font_path()
JA_FONT_PATH = get_japanese_font_path()

def _load_font(path, size):
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

# ── Image helpers ──────────────────────────────────────────────────────────────

def fit_cover(img: Image.Image, w: int, h: int) -> Image.Image:
    """Resize image to exactly w×h, cropping to preserve aspect ratio."""
    if img.width / img.height > w / h:
        new_h, new_w = h, int(img.width * h / img.height)
    else:
        new_w, new_h = w, int(img.height * w / img.width)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    x, y = (new_w - w) // 2, (new_h - h) // 2
    return img.crop((x, y, x + w, y + h))


def add_vignette(arr: np.ndarray, strength: float = 0.45) -> np.ndarray:
    """Darken edges with a radial vignette."""
    h, w = arr.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w]
    mask = 1.0 - strength * (((xs - w/2) / (w/2))**2 + ((ys - h/2) / (h/2))**2) ** 0.8
    mask = np.clip(mask, 0, 1)[:, :, np.newaxis]
    return (arr * mask).astype(np.uint8)


def ease_in_out(t: float) -> float:
    """Smooth step easing function."""
    return t * t * (3 - 2 * t)

# ── Ken Burns clip ─────────────────────────────────────────────────────────────

def make_photo_clip(image_path: str, duration: float) -> VideoClip:
    """Return a Ken Burns zoom-in VideoClip from image_path."""
    try:
        pil = Image.open(image_path).convert("RGB")
    except Exception as e:
        print(f"  ⚠  Could not open {os.path.basename(image_path)}: {e}")
        return ColorClip(size=(W, H), color=BG, duration=duration).set_fps(FPS)

    # Pre-scale to the maximum size needed (zoom_max × output)
    zoom_max = 1.0 + ZOOM
    src_w = int(W * zoom_max)
    src_h = int(H * zoom_max)
    pil = fit_cover(pil, src_w, src_h)
    img_arr = np.array(pil)

    def make_frame(t: float) -> np.ndarray:
        p = ease_in_out(t / duration)
        zoom = 1.0 + ZOOM * p          # 1.0 → 1.12
        crop_w = int(W / zoom)
        crop_h = int(H / zoom)
        x = (src_w - crop_w) // 2
        y = (src_h - crop_h) // 2
        patch = img_arr[y:y + crop_h, x:x + crop_w]
        if crop_w == W and crop_h == H:
            return patch
        frame = np.array(
            Image.fromarray(patch).resize((W, H), Image.BILINEAR)
        )
        return frame

    return VideoClip(make_frame, duration=duration).set_fps(FPS)

# ── Title card rendering ───────────────────────────────────────────────────────

def _draw_horizontal_rule(draw: ImageDraw.ImageDraw, cx: int, y: int, width: int):
    """Draw a thin decorative gold rule."""
    x0, x1 = cx - width // 2, cx + width // 2
    draw.line([(x0, y), (x1, y)], fill=GOLD_DIM, width=1)
    # Small diamonds at ends
    d = 4
    for px in (x0, x1):
        draw.polygon([(px, y), (px + d, y + d), (px, y + 2*d), (px - d, y + d)], fill=GOLD_DIM)


def make_intro_array() -> np.ndarray:
    """'Shogo & Arisa' title card."""
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    cx = W // 2
    cy = H // 2

    # Top rule
    _draw_horizontal_rule(draw, cx, cy - 100, 480)

    # Main title
    font_title = _load_font(EN_FONT_PATH, 110)
    text = "Shogo & Arisa"
    bbox = draw.textbbox((0, 0), text, font=font_title)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2), text, font=font_title, fill=CREAM)

    # Bottom rule
    _draw_horizontal_rule(draw, cx, cy + 95, 480)

    # Subtitle
    font_sub = _load_font(EN_FONT_PATH, 28)
    sub = "Wedding Film"
    bbox2 = draw.textbbox((0, 0), sub, font=font_sub)
    sw = bbox2[2] - bbox2[0]
    draw.text((cx - sw // 2, cy + 120), sub, font=font_sub, fill=(*GOLD, 180))

    return add_vignette(np.array(img), strength=0.5)


def make_chapter_array(date_str: str, event_ja: str) -> np.ndarray:
    """Chapter divider card: date (Georgia) + Japanese event name."""
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2

    font_date = _load_font(EN_FONT_PATH, 72)
    font_ja   = _load_font(JA_FONT_PATH or EN_FONT_PATH, 52)
    font_line = _load_font(EN_FONT_PATH, 20)

    # date
    bbox = draw.textbbox((0, 0), date_str, font=font_date)
    tw = bbox[2] - bbox[0]
    date_y = cy - 70
    draw.text((cx - tw // 2, date_y), date_str, font=font_date, fill=CREAM)

    # thin divider
    _draw_horizontal_rule(draw, cx, date_y + 80, 300)

    # Japanese event name
    bbox2 = draw.textbbox((0, 0), event_ja, font=font_ja)
    tw2 = bbox2[2] - bbox2[0]
    draw.text((cx - tw2 // 2, date_y + 100), event_ja, font=font_ja, fill=(*GOLD,))

    return add_vignette(np.array(img), strength=0.5)


def make_ending_array() -> np.ndarray:
    """Ending card: 'これからもよろしく'."""
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    cx, cy = W // 2, H // 2

    font_ja = _load_font(JA_FONT_PATH or EN_FONT_PATH, 80)
    font_en = _load_font(EN_FONT_PATH, 30)

    text = "これからもよろしく"
    bbox = draw.textbbox((0, 0), text, font=font_ja)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    _draw_horizontal_rule(draw, cx, cy - 75, 560)
    draw.text((cx - tw // 2, cy - th // 2), text, font=font_ja, fill=CREAM)
    _draw_horizontal_rule(draw, cx, cy + 70, 560)

    sub = "Shogo & Arisa"
    bbox2 = draw.textbbox((0, 0), sub, font=font_en)
    sw = bbox2[2] - bbox2[0]
    draw.text((cx - sw // 2, cy + 95), sub, font=font_en, fill=(*GOLD, 180))

    return add_vignette(np.array(img), strength=0.5)


def make_card_clip(arr: np.ndarray, duration: float, fade_in: float, fade_out: float) -> ImageClip:
    """Wrap a numpy frame as an ImageClip with fade-in/fade-out."""
    return (
        ImageClip(arr, duration=duration)
        .set_fps(FPS)
        .fadein(fade_in)
        .fadeout(fade_out)
    )

# ── Photo sequence with crossfade ─────────────────────────────────────────────

def make_photo_sequence(paths: list, first: bool = False, last: bool = False) -> VideoClip:
    """
    Return a single VideoClip of all photos with Ken Burns + crossfade.
    first=True → fade in from black at start
    last=True  → fade out to black at end
    """
    clips = []
    for i, p in enumerate(paths):
        print(f"  Rendering photo {i + 1}/{len(paths)}: {os.path.basename(p)}")
        c = make_photo_clip(p, PHOTO_DURATION)
        clips.append(c)

    if len(clips) == 1:
        c = clips[0]
        if first: c = c.fadein(FADE)
        if last:  c = c.fadeout(FADE)
        return c

    # Apply crossfades
    processed = []
    for i, c in enumerate(clips):
        if i < len(clips) - 1:
            c = c.crossfadeout(CROSSFADE)
        if i > 0:
            c = c.crossfadein(CROSSFADE)
        processed.append(c)

    seq = concatenate_videoclips(processed, padding=-CROSSFADE, method="compose")

    if first: seq = seq.fadein(FADE)
    if last:  seq = seq.fadeout(FADE)
    return seq

# ── Main ──────────────────────────────────────────────────────────────────────

CHAPTERS = [
    ("2024.1.4",  "はじまりの日"),
    ("2025.10.4", "プロポーズ"),
    ("2026.7.11", "結婚式"),
]


def main(photos_dir: str):
    # Collect image files
    exts = ["jpg", "jpeg", "png", "JPG", "JPEG", "PNG", "webp", "WEBP"]
    paths = []
    for ext in exts:
        paths.extend(glob.glob(os.path.join(photos_dir, f"*.{ext}")))
    paths = sorted(set(paths))

    if not paths:
        print(f"No images found in: {photos_dir}")
        sys.exit(1)

    print(f"Found {len(paths)} photos in '{photos_dir}'")
    if EN_FONT_PATH:
        print(f"English font : {EN_FONT_PATH}")
    else:
        print("English font : (default fallback)")
    if JA_FONT_PATH:
        print(f"Japanese font: {JA_FONT_PATH}")
    else:
        print("Japanese font: (default fallback — Japanese may not render correctly)")
    print()

    # Split photos into 3 chapters
    n = len(paths)
    sizes = [n // 3 + (1 if i < n % 3 else 0) for i in range(3)]
    batches, idx = [], 0
    for s in sizes:
        batches.append(paths[idx:idx + s])
        idx += s

    segments = []

    # ── Intro ────────────────────────────────────────────────────────────────
    print("Rendering: Intro card")
    segments.append(make_card_clip(make_intro_array(), 5.0, fade_in=1.5, fade_out=1.0))

    # ── Chapters + photos ────────────────────────────────────────────────────
    for i, (date_str, event_ja) in enumerate(CHAPTERS):
        print(f"\nRendering: Chapter card — {date_str} {event_ja}")
        segments.append(make_card_clip(
            make_chapter_array(date_str, event_ja),
            CARD_DURATION, fade_in=FADE, fade_out=FADE,
        ))

        batch = batches[i]
        if batch:
            print(f"Rendering: {len(batch)} photo(s) for chapter {i + 1}")
            is_last_chapter = (i == len(CHAPTERS) - 1 and not batches[i + 1:] or
                               all(len(b) == 0 for b in batches[i + 1:]))
            segments.append(make_photo_sequence(batch, last=False))

    # ── Ending ───────────────────────────────────────────────────────────────
    print("\nRendering: Ending card")
    segments.append(make_card_clip(make_ending_array(), 5.5, fade_in=1.5, fade_out=2.0))

    # ── Assemble ─────────────────────────────────────────────────────────────
    print("\nAssembling final video...")
    final = concatenate_videoclips(segments)
    total = final.duration
    mins, secs = divmod(int(total), 60)
    print(f"Total duration: {mins}m {secs}s")

    output = "wedding_movie.mp4"
    print(f"Writing: {output}  (this may take several minutes...)\n")
    final.write_videofile(
        output,
        fps=FPS,
        codec="libx264",
        audio=False,
        preset="medium",
        ffmpeg_params=["-crf", "18"],  # high quality
        threads=4,
        logger="bar",
    )
    print(f"\n✓ Saved: {output}")


if __name__ == "__main__":
    photos_dir = sys.argv[1] if len(sys.argv) > 1 else "./photos"
    main(photos_dir)
