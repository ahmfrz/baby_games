"""Generate a cute bunny app icon for the Baby Games PWA."""
from PIL import Image, ImageDraw
import math, os

def draw_icon(size, maskable=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = int(size * 0.12) if maskable else 0  # safe zone padding for maskable

    # --- Background gradient (sky to grass) ---
    for y in range(size):
        t = y / size
        # sky blue (#5ec9f0) -> grass green (#7dd654)
        r = int(0x5e + (0x7d - 0x5e) * t)
        g = int(0xc9 + (0xd6 - 0xc9) * t)
        b = int(0xf0 + (0x54 - 0xf0) * t)
        d.rectangle([(0, y), (size, y + 1)], fill=(r, g, b, 255))

    # Clip to circle for non-maskable
    if not maskable:
        mask = Image.new('L', (size, size), 0)
        md = ImageDraw.Draw(mask)
        md.ellipse([(0, 0), (size - 1, size - 1)], fill=255)
        img.putalpha(mask)
        # Recomposite bg on white circle
        bg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        bg.paste(img, mask=mask)
        img = bg
        d = ImageDraw.Draw(img)
        # Redraw gradient clipped to circle
        for y in range(size):
            t = y / size
            r = int(0x5e + (0x7d - 0x5e) * t)
            g = int(0xc9 + (0xd6 - 0xc9) * t)
            b = int(0xf0 + (0x54 - 0xf0) * t)
            d.rectangle([(0, y), (size, y + 1)], fill=(r, g, b, 255))
        img.putalpha(mask)
        d = ImageDraw.Draw(img)

    s = size  # shorthand

    # --- Grass strip at bottom ---
    grass_top = int(s * 0.74)
    # Dark green base
    d.rectangle([(0, grass_top), (s, s)], fill=(72, 155, 60, 255))
    # Light green top strip
    d.rectangle([(0, grass_top), (s, grass_top + int(s * 0.07))], fill=(131, 201, 92, 255))
    # Grass tufts
    tuft_w = int(s * 0.07)
    tuft_h = int(s * 0.09)
    for i in range(0, s, int(s * 0.14)):
        cx = i + int(s * 0.07)
        cy = grass_top + int(s * 0.03)
        d.ellipse([(cx - tuft_w, cy - tuft_h), (cx + tuft_w, cy + tuft_h // 2)], fill=(100, 190, 70, 255))

    # --- Rabbit body center ---
    cx = int(s * 0.44)
    cy = int(s * 0.56)

    # Ears (tall, slightly rounded)
    ear_w = int(s * 0.10)
    ear_h = int(s * 0.28)
    # Left ear
    left_ear_cx = cx - int(s * 0.14)
    d.ellipse([(left_ear_cx - ear_w, cy - ear_h - int(s * 0.14)),
               (left_ear_cx + ear_w, cy - int(s * 0.14))], fill=(245, 245, 230, 255))
    # Left ear inner pink
    d.ellipse([(left_ear_cx - int(ear_w * 0.55), cy - ear_h - int(s * 0.09)),
               (left_ear_cx + int(ear_w * 0.55), cy - int(s * 0.17))], fill=(255, 182, 193, 255))
    # Right ear
    right_ear_cx = cx + int(s * 0.09)
    d.ellipse([(right_ear_cx - ear_w, cy - ear_h - int(s * 0.18)),
               (right_ear_cx + ear_w, cy - int(s * 0.18))], fill=(245, 245, 230, 255))
    # Right ear inner pink
    d.ellipse([(right_ear_cx - int(ear_w * 0.55), cy - ear_h - int(s * 0.13)),
               (right_ear_cx + int(ear_w * 0.55), cy - int(s * 0.21))], fill=(255, 182, 193, 255))

    # Rabbit head (large circle)
    head_r = int(s * 0.24)
    d.ellipse([(cx - head_r, cy - head_r), (cx + head_r, cy + head_r)], fill=(245, 245, 230, 255))

    # Rabbit body (smaller ellipse below head)
    body_rx = int(s * 0.19)
    body_ry = int(s * 0.14)
    body_cy = cy + head_r + int(s * 0.03)
    d.ellipse([(cx - body_rx, body_cy - body_ry), (cx + body_rx, body_cy + body_ry)], fill=(245, 245, 230, 255))

    # Eyes
    eye_r = int(s * 0.030)
    d.ellipse([(cx - int(s * 0.09) - eye_r, cy - int(s * 0.07) - eye_r),
               (cx - int(s * 0.09) + eye_r, cy - int(s * 0.07) + eye_r)], fill=(40, 30, 30, 255))
    d.ellipse([(cx + int(s * 0.04) - eye_r, cy - int(s * 0.07) - eye_r),
               (cx + int(s * 0.04) + eye_r, cy - int(s * 0.07) + eye_r)], fill=(40, 30, 30, 255))
    # Eye shine
    shine_r = max(1, int(eye_r * 0.4))
    d.ellipse([(cx - int(s * 0.09) - shine_r + eye_r // 2, cy - int(s * 0.07) - shine_r - eye_r // 2),
               (cx - int(s * 0.09) + shine_r + eye_r // 2, cy - int(s * 0.07) + shine_r - eye_r // 2)], fill=(255, 255, 255, 255))

    # Nose (small pink ellipse)
    nose_rx, nose_ry = int(s * 0.028), int(s * 0.018)
    nose_cx = cx - int(s * 0.025)
    nose_cy = cy + int(s * 0.04)
    d.ellipse([(nose_cx - nose_rx, nose_cy - nose_ry), (nose_cx + nose_rx, nose_cy + nose_ry)], fill=(255, 160, 160, 255))

    # Cheek blush
    blush_rx, blush_ry = int(s * 0.065), int(s * 0.030)
    d.ellipse([(cx - int(s * 0.19) - blush_rx, cy + int(s * 0.01) - blush_ry),
               (cx - int(s * 0.19) + blush_rx, cy + int(s * 0.01) + blush_ry)], fill=(255, 160, 180, 90))
    d.ellipse([(cx + int(s * 0.09) - blush_rx, cy + int(s * 0.01) - blush_ry),
               (cx + int(s * 0.09) + blush_rx, cy + int(s * 0.01) + blush_ry)], fill=(255, 160, 180, 90))

    # --- Carrot (right side, small) ---
    carrot_cx = int(s * 0.78)
    carrot_top = int(s * 0.52)
    carrot_bot = int(s * 0.72)
    carrot_w = int(s * 0.07)
    # Carrot body (orange triangle-ish)
    d.polygon([
        (carrot_cx, carrot_bot),
        (carrot_cx - carrot_w, carrot_top + int(s * 0.04)),
        (carrot_cx + carrot_w, carrot_top + int(s * 0.04))
    ], fill=(255, 140, 20, 255))
    # Carrot top leaves (green)
    leaf_base_y = carrot_top + int(s * 0.04)
    for angle, length in [(-30, int(s * 0.09)), (0, int(s * 0.11)), (30, int(s * 0.09))]:
        rad = math.radians(angle - 90)
        ex = carrot_cx + int(math.cos(rad) * length)
        ey = leaf_base_y + int(math.sin(rad) * length)
        d.line([(carrot_cx, leaf_base_y), (ex, ey)], fill=(50, 170, 50, 255), width=max(2, int(s * 0.018)))

    return img

SIZES = [192, 512]
OUT_DIRS = [
    r'e:\Ahmed\Code\baby_games\icons',
    r'e:\Ahmed\Code\baby_games\public\icons',
]

for sz in SIZES:
    for maskable in [False, True]:
        img = draw_icon(sz, maskable)
        suffix = '-maskable' if maskable else ''
        fname = f'icon-{sz}{suffix}.png'
        for d in OUT_DIRS:
            os.makedirs(d, exist_ok=True)
            path = os.path.join(d, fname)
            img.save(path, 'PNG')
            print(f'Saved {path}')

print('Done!')
