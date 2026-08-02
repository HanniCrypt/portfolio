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

  C=108; R=131; P=8
  ffmpeg -i app/headshot.jpg \
    -vf "crop=720:874:265:30,format=gray,\
curves=all='0/0.10 0.36/0.32 0.82/1 1/1',scale=$C:$R:flags=area" \
    -f rawvideo -pix_fmt gray - \
   | python3 scripts/halftone.py $C $R $P 1.0 0.72 \
   | ffmpeg -f rawvideo -pix_fmt gray -s $((C*P))x$((R*P)) -i - -frames:v 1 \
       app/headshot-halftone.png -y

108x131 cells, not the reference's 170 across: the box here is 182x221, not
288 wide, and what has to match is dots per CSS pixel (1.69), not dot count.

The curve does two things. Pulling 0.82 up to white clips the lit side of the
face so the dots only describe shadows, as the reference does. Lifting 0 to
0.10 keeps the black suit from collapsing into one solid mass — the reference
gets that texture for free from a mid-grey jacket, this photo does not.

The suit is meant to read as a solid black mass; two attempts at pulling
texture out of it were tried and rejected. Recorded so they are not retried
blind: the tie is not separable from the jacket below the knot, where centre
minus lapel luminance measures -1.1 and +0.6 out of 255 against +18.7 across
the upper chest, so lifting the shadows there greys the whole jacket without
revealing a tie. And the curve is the weaker lever for lightening anyway — at
RMAX 0.72 a dot only has to reach radius 0.5*PITCH to touch its neighbours,
which the suit clears at almost any lift, so it merges regardless; dropping
RMAX to 0.66 is what actually opens the dark end.
"""
import sys

COLS = int(sys.argv[1])  # dots across
ROWS = int(sys.argv[2])  # dots down
PITCH = int(sys.argv[3])  # output pixels per dot
GAMMA = float(sys.argv[4])  # <1 darkens midtones, >1 lightens
RMAX = float(sys.argv[5])  # max radius as a fraction of PITCH

src = sys.stdin.buffer.read()
assert len(src) >= COLS * ROWS, f"expected {COLS*ROWS} bytes, got {len(src)}"

W = COLS * PITCH
H = ROWS * PITCH
out = bytearray(b"\xff" * (W * H))  # start white

for cy in range(ROWS):
    for cx in range(COLS):
        lum = src[cy * COLS + cx] / 255.0
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
        hi_y = min(H, int(oy + r + 2))

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
