import re,glob,html,collections
c=collections.defaultdict(set)
for f in glob.glob('docs/research/norda-framer-website-3f1ea7cb/raw/*/dom-1440.html'):
    s=open(f,encoding='utf8').read()
    for m in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>',s,re.S):
        h=html.unescape(m.group(1))
        if h.startswith(('./','../','#','/')): continue
        t=re.sub(r'<[^>]+>',' ',m.group(2)); t=re.sub(r'\s+',' ',html.unescape(t)).strip()
        t=' '.join(dict.fromkeys(t.split()))[:40]
        c[h].add(t)
for h,ts in sorted(c.items()):
    print(h,'|',' / '.join(sorted(ts))[:150])
