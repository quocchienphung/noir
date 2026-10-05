import re,glob,os
known=open(r'C:/Users/quocc/Downloads/norda/src/components/sites/norda-framer-website-3f1ea7cb/shared/icons.tsx',encoding='utf8').read()
seen={}
for f in glob.glob('*/dom-1440.html')+glob.glob('*/dom-390.html'):
    s=open(f,encoding='utf8').read()
    page=os.path.normpath(f).split(os.sep)[0]
    for m in re.finditer(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*?)</svg>',s,flags=re.S):
        vb,body=m.group(1),m.group(2)
        for d in re.findall(r'<path[^>]*\sd="([^"]+)"',body):
            if d[:40] in known: continue
            seen.setdefault((vb,d),set()).add(page)
for (vb,d),pages in seen.items():
    print(vb, sorted(pages)[:3], len(pages), d[:400])
    print('---')
