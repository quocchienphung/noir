# python texts.py <page-key> [width]  -> ordered unique texts with typography + image ids
import sys,re
key=sys.argv[1]; w=sys.argv[2] if len(sys.argv)>2 else '1440'
lines=open(f'C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/{key}/compact-{w}.txt',encoding='utf8').read().split('\n')
seen=set(); out=[]
stop=False
for l in lines:
    if 'div "Footer"' in l: break
    m=re.match(r'\s*T \[(\d+),(\d+) (\d+)x(\d+)\] (.*?) framer-[a-z0-9]+ :: (.*)',l) or re.match(r'\s*T \[(\d+),(\d+) (\d+)x(\d+)\] (.*?)  :: (.*)',l)
    if m:
        t=m.group(6)
        if t in seen: continue
        seen.add(t); out.append(f'T y{m.group(2)} x{m.group(1)} w{m.group(3)} | {m.group(5)} | {t}')
        continue
    m=re.match(r'\s*IMG \[(\d+),(-?\d+) (\d+)x(\d+)\] ([A-Za-z0-9_-]+)\.(\w+)(\S*) nat(\S+) fit:(\S+) pos:(\S+ \S+) alt="([^"]*)"',l)
    if m:
        k=('I',m.group(5))
        if k in seen: continue
        seen.add(k); out.append(f'IMG y{m.group(2)} x{m.group(1)} {m.group(3)}x{m.group(4)} {m.group(5)} pos:{m.group(10)} alt="{m.group(11)}"')
    m=re.match(r'\s*a .*?\[(\d+),(\d+) (\d+)x(\d+)\].*href=(\S+)',l)
    if m and m.group(5) not in seen:
        seen.add(m.group(5)); out.append(f'A y{m.group(2)} href={m.group(5)}')
print('\n'.join(out))
