"""Regenerate local responsive photos: python3 scripts/optimize-photos.py.

Requires Pillow. Originals stay intact for existing CMS links; the application
uses these checked-in WebP variants without requiring Pillow on the host.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json

root = Path(__file__).resolve().parents[1]
photos = root / 'public' / 'images'
manifest = {}
original_bytes = generated_bytes = 0
for source in sorted(photos.rglob('*')):
    if source.suffix.lower() not in ('.jpg', '.jpeg', '.png'):
        continue
    relative = source.relative_to(photos)
    variants = []
    original_bytes += source.stat().st_size
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        if image.mode not in ('RGB', 'RGBA'):
            image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
        for limit in (640, 1600):
            resized = image.copy()
            resized.thumbnail((limit, limit), Image.Resampling.LANCZOS)
            width, height = resized.size
            if variants and variants[-1]['width'] == width:
                continue
            target = photos / 'optimized' / relative.parent / f'{relative.stem}-{limit}.webp'
            target.parent.mkdir(parents=True, exist_ok=True)
            resized.save(target, 'WEBP', quality=82, method=6)
            generated_bytes += target.stat().st_size
            variants.append({'src': '/images/' + target.relative_to(photos).as_posix(), 'width': width, 'height': height})
    manifest['/images/' + relative.as_posix()] = variants

out = root / 'src' / 'lib' / 'photoSources.json'
# Keep the separately curated backgrounds whose checked-in source is WebP.
if out.exists():
    for key, variants in json.loads(out.read_text()).items():
        if key.endswith('.webp') and all((root / 'public' / item['src'].lstrip('/')).is_file() for item in variants):
            manifest[key] = variants
out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'photos': len(manifest), 'original_bytes': original_bytes, 'variant_bytes': generated_bytes, 'max_dimension': 1600}))
