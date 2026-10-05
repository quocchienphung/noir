# python sbs.py <compare-dir> <outPrefix> [scale]
import sys, glob, os
from PIL import Image, ImageChops
d, prefix = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 0.4
refs = sorted(glob.glob(os.path.join(d, 'ref-*.png')))
rows = []
for r in refs:
    l = r.replace('ref-', 'local-')
    if not os.path.exists(l): continue
    a, b = Image.open(r).convert('RGB'), Image.open(l).convert('RGB')
    diff = ImageChops.difference(a, b).convert('L')
    score = sum(diff.getdata()) / (a.width * a.height * 255)
    W, H = int(a.width * scale), int(a.height * scale)
    row = Image.new('RGB', (W * 2 + 10, H), 'red')
    row.paste(a.resize((W, H)), (0, 0)); row.paste(b.resize((W, H)), (W + 10, 0))
    rows.append((row, os.path.basename(r), score))
for k in range(0, len(rows), 3):
    grp = rows[k:k + 3]
    sheet = Image.new('RGB', (grp[0][0].width, sum(g[0].height + 6 for g in grp)), 'white')
    y = 0
    for g in grp:
        sheet.paste(g[0], (0, y)); y += g[0].height + 6
    sheet.save(f'{prefix}-{k // 3:02d}.jpg', quality=78)
print(' '.join(f'{n}:{s:.3f}' for _, n, s in rows))
