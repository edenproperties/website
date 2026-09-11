"""Download only the media required by this static page; record source provenance."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import re
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://elyse-residence-dev.webflow.io/'
PREFIX = 'https://cdn.prod.website-files.com/69372e47ab695bf5546b46ec/'
ASSETS = {
    'about.avif': PREFIX + '693881a350b370d1b613ff09_about-img--d.avif',
    'duplex.avif': PREFIX + '693881b0a57115d8cd3a12c2_livings-img-1--d.avif',
    'garden.avif': PREFIX + '693881b0422731c7d2c5fcac_livings-img-2--d.avif',
    'penthouse.avif': PREFIX + '693881b00e2082f46e0752ce_livings-img-3--d.avif',
    'living.avif': PREFIX + '693881c0bd19ffb64b94f142_beliefs-img--d.avif',
    'interior.avif': PREFIX + '693881c0f19790d102a7679d_beliefs-img-2--d.avif',
    'retreat.avif': PREFIX + '693881ec1f8b80b2102e2e7b_amenities-img-2--big.avif',
    'house.avif': PREFIX + '693881d5049ac7d72bb5f18f_cta-img--d.avif',
    'house-mobile.avif': PREFIX + '693881c82316816e1085777d_cta-img--mob.avif',
    'hero.mp4': 'https://cdn.prod.website-files.com/69372e47ab695bf5546b46ec%2F69610a0c261bf5a0d9012dd6_hero%203%20%281%29_mp4.mp4',
    'hero-poster.jpg': 'https://cdn.prod.website-files.com/69372e47ab695bf5546b46ec%2F69610a0c261bf5a0d9012dd6_hero%203%20%281%29_poster.0000000.jpg',
    'cormorant-regular.ttf': 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf',
    'cormorant-italic.ttf': 'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3smX5slCNuHLi8bLeY9MK7whWMhyjYrGFEsdtdc62E6zd58jDOjw.ttf',
    'OFL-Cormorant.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/OFL.txt',
}

def download(item):
    name, url = item
    destination = ROOT / 'assets' / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    with urlopen(url, timeout=60) as response:
        data = response.read()
    destination.write_bytes(data)
    return {'file': 'assets/' + name, 'source': url, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=5) as pool:
        files = sorted(pool.map(download, ASSETS.items()), key=lambda f: f['file'])
    manifest = {'reference': SOURCE, 'note': 'Reference imagery reused at owner request. Confirm commercial usage rights. Fonts: SIL Open Font License. Original site code and proprietary fonts are not bundled.', 'files': files}
    (ROOT / 'assets' / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Downloaded {len(files)} assets, {sum(f["bytes"] for f in files):,} bytes')
    for item in files:
        print(item['file'], item['bytes'])
