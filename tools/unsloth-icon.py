#!/usr/bin/env python3
"""Rebuild src/assets/unsloth.png from Unsloth's own sticker.

The only mark Unsloth publish is a round green sticker with a peeled corner
(src/assets/unsloth-sticker.png, from unsloth.ai). A peel reads as a sticker
at any size and puts an asymmetric silver notch into a row of square chips,
so this turns it into the flat app-icon treatment the deck gives MLX: the
sloth, centred, on the sticker gradient's flat midpoint, full-bleed square.

FULL-BLEED SQUARE, NOT A PRE-ROUNDED TILE. Corner radius in this deck is a
single dial (--r-scale); baking a radius into the PNG would opt this one chip
out of it. `.chip.fill` has `overflow: hidden`, so the CSS does the rounding.

Needs Pillow — unlike build.py, which is stdlib-only. That is deliberate:
this runs once when the upstream sticker changes, not on every build, and its
output (src/assets/unsloth.png) is committed.

    python3 tools/unsloth-icon.py
"""
from PIL import Image, ImageFilter, ImageChops
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src', 'assets', 'unsloth-sticker.png')
OUT = os.path.join(ROOT, 'src', 'assets', 'unsloth.png')

FLAT = (36, 188, 145)   # midpoint of the sticker's own green gradient
SIZE = 256              # output square, in px
MARK = 0.74             # fraction of the tile the sloth occupies
COLORS = 64             # palette size; the art is flat, so this is lossless
                        # to the eye and takes the file from 37KB to 4KB


def is_green(p):
    """The sticker's background, as opposed to the sloth's ink or the peel."""
    r, g, b, a = p
    return a > 180 and g > r + 22 and g > b + 4


def main():
    if not os.path.exists(SRC):
        sys.exit('missing %s' % SRC)
    src = Image.open(SRC).convert('RGBA')
    W, H = src.size
    px = src.load()

    # The sloth is pure black ink; the peel is a silver gradient. Neither is
    # green, so separate them by tone rather than by position — the peel has
    # moved between sticker revisions before, its colour has not.
    dark = Image.new('L', (W, H), 0)
    mid = Image.new('L', (W, H), 0)
    dp, mp = dark.load(), mid.load()
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            if p[3] <= 120:
                continue
            if max(p[:3]) < 90:
                dp[x, y] = 255
            elif not is_green(p) and 95 < min(p[:3]) and max(p[:3]) < 248:
                mp[x, y] = 255

    # Grow the ink a little and treat that as untouchable, so the mark's own
    # antialiased edges (which are mid-grey, like the peel) survive.
    safe = dark.filter(ImageFilter.MaxFilter(5))
    sl = safe.load()
    peel = ImageChops.subtract(mid, safe).filter(ImageFilter.MaxFilter(17))
    peel = ImageChops.subtract(peel, safe)

    # Everything that is not the mark becomes flat green: the peel, the disc's
    # background, and every under-opaque pixel outside the disc.
    rep = peel.copy()
    rp = rep.load()
    for y in range(H):
        for x in range(W):
            p = px[x, y]
            if (p[3] < 250 or is_green(p)) and not sl[x, y]:
                rp[x, y] = 255
    box = ImageChops.invert(rep).getbbox()
    rep = rep.filter(ImageFilter.GaussianBlur(1.0))

    flat = Image.new('RGBA', (W, H), FLAT + (255,))
    mark = Image.composite(flat, src, rep).crop(box)

    cw, ch = mark.size
    scale = (SIZE * MARK) / max(cw, ch)
    mark = mark.resize((max(1, round(cw * scale)), max(1, round(ch * scale))),
                       Image.LANCZOS)
    icon = Image.new('RGBA', (SIZE, SIZE), FLAT + (255,))
    icon.paste(mark, ((SIZE - mark.size[0]) // 2, (SIZE - mark.size[1]) // 2), mark)
    icon.quantize(colors=COLORS, method=Image.FASTOCTREE).save(OUT, optimize=True)
    print('icon   -> %s  %dx%d  %.1f KB'
          % (os.path.relpath(OUT, ROOT), SIZE, SIZE, os.path.getsize(OUT) / 1024))


if __name__ == '__main__':
    main()
