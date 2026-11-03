import re, os, sys, html, urllib.request, concurrent.futures as cf, time
ROOT = '1q1Ahh9kJjthGXOJt8z_rDSog28da5VHD'
UA = {'User-Agent': 'Mozilla/5.0'}
def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1: raise
            time.sleep(2 * (i + 1))
def listing(fid):
    h = get(f'https://drive.google.com/embeddedfolderview?id={fid}#list').decode('utf-8', 'ignore')
    out = []
    for m in re.finditer(r'<div class="flip-entry" id="entry-([\w-]+)".*?<div class="flip-entry-title">(.*?)</div>', h, re.S):
        eid, title = m.group(1), html.unescape(m.group(2)).strip()
        block = m.group(0)
        isdir = '/folders/' in block or 'folder' in block.split('flip-entry-title')[0].lower() and 'drive/folders' in block
        out.append((eid, title, '/drive/folders/' in block))
    return out
files = []
def walk(fid, path, depth=0):
    for eid, title, isdir in listing(fid):
        if isdir: walk(eid, os.path.join(path, title), depth + 1)
        else: files.append((eid, os.path.join(path, title)))
walk(ROOT, 'drive')
print('files listed', len(files), flush=True)
def dl(item):
    eid, p = item
    if p.endswith('.html'): return 'skip'
    os.makedirs(os.path.dirname(p), exist_ok=True)
    data = get(f'https://drive.usercontent.google.com/download?id={eid}&export=download&confirm=t')
    if data[:15].lower().startswith(b'<!doctype html') or data[:5] == b'<html':
        return 'html:' + p
    open(p, 'wb').write(data); return 'ok'
res = {}
with cf.ThreadPoolExecutor(8) as ex:
    for r in ex.map(dl, files):
        k = r.split(':')[0]; res[k] = res.get(k, 0) + 1
        if k == 'html': print(r, flush=True)
print(res, flush=True)
