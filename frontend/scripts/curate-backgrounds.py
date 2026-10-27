"""Export real, wide background photos; keep original photographs untouched."""
from pathlib import Path
import json
from PIL import Image, ImageOps

frontend = Path(__file__).resolve().parents[1]
repository = frontend.parent
choices = {
    'congregacion': 'fotos/DOMINGOS 2026/MIEMBROS/DSC09599.JPG',
    'comunidad-templo': 'fotos/WILD YOUTH FOTOGRAFRÍAS /REAL NIGHT/UN AMOR DE PELÍCULA/7A871FBF-B494-476A-88D0-C7CB76C267CB_1_201_a.jpeg',
}
manifest_path = frontend / 'src/lib/photoSources.json'
manifest = json.loads(manifest_path.read_text())
output = frontend / 'public/images/backgrounds'
output.mkdir(parents=True, exist_ok=True)
for name, source in choices.items():
    variants = []
    with Image.open(repository / source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        for size, suffix in [(640, '-640'), (1600, '')]:
            variant = image.copy()
            variant.thumbnail((size, size), Image.Resampling.LANCZOS)
            filename = f'{name}{suffix}.webp'
            variant.save(output / filename, 'WEBP', quality=82, method=6)
            variants.append({'src': f'/images/backgrounds/{filename}', 'width': variant.width, 'height': variant.height})
    manifest[f'/images/backgrounds/{name}.webp'] = variants
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
