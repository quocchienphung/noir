import sys, os
from PIL import Image
src, outdir, prefix = sys.argv[1], sys.argv[2], sys.argv[3]
chunk = int(sys.argv[4]) if len(sys.argv) > 4 else 1800
scale = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
os.makedirs(outdir, exist_ok=True)
im = Image.open(src).convert('RGB'); w, h = im.size
i = 0
for y in range(0, h, chunk):
    c = im.crop((0, y, w, min(y+chunk, h)))
    c = c.resize((int(c.width*scale), int(c.height*scale)))
    c.save(os.path.join(outdir, f'{prefix}-{i:02d}.jpg'), quality=80); i += 1
print(i)
