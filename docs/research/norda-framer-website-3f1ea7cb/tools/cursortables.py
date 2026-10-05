import glob
import os
import re

JS = os.path.join(os.path.dirname(__file__), "js")
RAW = "C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw"
names = {"BCxHuAS71": "Award 1", "JscTffg3R": "Award 2", "VDxFi2gbG": "Award 3", "Mux7gNCYC": "Award 4", "USDBxIbdz": "Award 5",
         "pn19inCrq": "Award 6", "PgyJ9ltcw": "Award 7", "IxXKjqG4e": "Award 8", "pjH_dmkuo": "Read Article", "E7P7Uu1ts": "View Project",
         "sdT6_4Hrt": "Black", "oUfFk8u5r": "None", "bPbgCn4vC": "White"}

tables = {}
for f in glob.glob(os.path.join(JS, "*.mjs")):
    s = open(f, encoding="utf8").read()
    for m in re.finditer(r'\(\{((?:"?[a-z0-9]+"?:[A-Za-z$_]+,?)+)\}\)', s):
        body = m.group(1)
        if "okwo4e" not in body:
            continue
        pairs = re.findall(r'"?([a-z0-9]+)"?:([A-Za-z$_]+)', body)
        table = {}
        for cid, var in pairs:
            d = re.search(re.escape(var) + r'=\{alignment:`(\w+)`,component:\w+,offset:\{x:(-?\d+),y:(-?\d+)\},placement:`(\w+)`,transition:\w+,variant:`([\w-]+)`\}', s)
            table[cid] = (names.get(d.group(5), d.group(5)) + (f" (offset y{d.group(3)})" if d.group(3) != "0" else "")) if d else "?"
        tables[os.path.basename(f)] = table

# which page uses which module: the route's DOM references its page module
for key in sorted(os.listdir(RAW)):
    dom = os.path.join(RAW, key, "dom-1440.html")
    if not os.path.exists(dom):
        continue
    s = open(dom, encoding="utf8").read()
    ids = set(re.findall(r'data-framer-cursor="([^"]+)"', s))
    mods = [m for m in tables if m.split(".")[0] in s]
    # choose the module whose table covers the ids used on this page
    best = None
    for m in mods:
        if ids <= set(tables[m]):
            best = m
            break
    print(key, "->", best, {k: v for k, v in (tables.get(best) or {}).items() if k in ids or k == "okwo4e"})
