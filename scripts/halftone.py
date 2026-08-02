#!/usr/bin/env python3
"""
Amplitude-modulated halftone: an orthogonal square lattice of black circles on
white, sized so that dot *area* tracks local darkness.

Measured off bryllim.com, which bakes the same effect into a static PNG rather
than computing it in the browser: square lattice, 8px pitch in a 1354px image
(~170 dots across, or 1.69 dots per CSS pixel at its 288px display size), and
analytically antialiased circles.

Reads a raw gray frame of CELLS x CELLS on stdin (one sample per cell, area
averaged by ffmpeg) and writes a PITCH-scaled raw gray frame on stdout.

Regenerate app/headshot-halftone.png with:

  C=118; P=8; W=$((C*P))
  ffmpeg -i app/headshot.jpg \
    -vf "crop=720:720:265:45,format=gray,\
curves=all='0/0 0.36/0.28 0.82/1 1/1',scale=$C:$C:flags=area" \
    -f rawvideo -pix_fmt gray - \
   | python3 scripts/halftone.py $C $P 1.0 0.72 \
   | ffmpeg -f rawvideo -pix_fmt gray -s ${W}x${W} -i - -frames:v 1 \
       app/headshot-halftone.png -y

CELLS is 118 rather than the reference's 170 because the box here is 200px
wide, not 288 — matching dots-per-CSS-pixel is what makes the texture read at
the same size. The curve lifts the lit side of the face to pure white so the
dots describe the shadows, which is what the reference does.
"""
import sys

CELLS = int(sys.argv[1])  # dots across
PITCH = int(sys.argv[2])  # output pixels per dot
GAMMA = float(sys.argv[3])  # <1 darkens midtones, >1 lightens
RMAX = float(sys.argv[4])  # max radius as a fraction of PITCH

src = sys.stdin.buffer.read()
assert len(src) >= CELLS * CELLS, f"expected {CELLS*CELLS} bytes, got {len(src)}"

W = CELLS * PITCH
out = bytearray(b"\xff" * (W * W))  # start white

for cy in range(CELLS):
    for cx in range(CELLS):
        lum = src[cy * CELLS + cx] / 255.0
        darkness = (1.0 - lum) ** GAMMA
        if darkness <= 0.001:
            continue
        # Area, not radius, is proportional to darkness — that is what makes a
        # halftone reproduce tone linearly to the eye.
        r = RMAX * PITCH * (darkness ** 0.5)

        ox = cx * PITCH + PITCH / 2.0
        oy = cy * PITCH + PITCH / 2.0
        lo_x = max(0, int(ox - r - 1))
        hi_x = min(W, int(ox + r + 2))
        lo_y = max(0, int(oy - r - 1))
        hi_y = min(W, int(oy + r + 2))

        for y in range(lo_y, hi_y):
            dy = y + 0.5 - oy
            dy2 = dy * dy
            row = y * W
            for x in range(lo_x, hi_x):
                dx = x + 0.5 - ox
                dist = (dx * dx + dy2) ** 0.5
                # Analytic antialiasing: coverage falls off over one pixel at
                # the circle's edge, which is what gives the crisp-but-smooth
                # edges the reference shows (85% of it is pure black or white).
                cov = r - dist + 0.5
                if cov <= 0:
                    continue
                if cov > 1:
                    cov = 1.0
                v = int((1.0 - cov) * 255)
                i = row + x
                if v < out[i]:
                    out[i] = v

sys.stdout.buffer.write(bytes(out))
