import collections
import glob
import os
import re

samples = collections.defaultdict(collections.Counter)
for f in glob.glob("docs/research/norda-framer-website-3f1ea7cb/raw/*/dom-1440.html"):
    key = os.path.basename(os.path.dirname(f))
    s = open(f, encoding="utf8").read()
    for m in re.finditer(r'<(\w+)([^>]*data-framer-cursor="([^"]+)"[^>]*)>', s):
        tag, attrs, cid = m.group(1), m.group(2), m.group(3)
        name = re.search(r'data-framer-name="([^"]*)"', attrs)
        href = re.search(r'href="([^"]*)"', attrs)
        desc = f"{tag}:{name.group(1) if name else '-'}" + (f" href={href.group(1)[:30]}" if href else "")
        samples[cid][desc + " @" + key.split("-")[0]] += 1
for cid, c in sorted(samples.items(), key=lambda x: -sum(x[1].values())):
    print("==", cid, sum(c.values()))
    for d, n in c.most_common(10):
        print("   ", n, d)
