// ============================================================
//  gen-landmask.mjs — rasteriza continentes (GeoJSON) a un
//  bitmask equirectangular embebido en src/components/three/.
//  Uso:  node scripts/gen-landmask.mjs <countries.geo.json>
//  Se corre UNA vez; el output va commiteado, no es build step.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const W = 512, H = 256;
const src = process.argv[2];
if (!src) { console.error('falta el path al geojson'); process.exit(1); }

const geo = JSON.parse(readFileSync(src, 'utf8'));
const mask = new Uint8Array((W * H) / 8);

const setBit = (x, y) => {
  const i = y * W + x;
  mask[i >> 3] |= 1 << (i & 7);
};

// Scanline fill even-odd: los agujeros (lagos) quedan fuera solos
function fillPolygon(rings) {
  for (let y = 0; y < H; y++) {
    const lat = 90 - ((y + 0.5) * 180) / H;
    const xs = [];
    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        if ((lat1 > lat) === (lat2 > lat)) continue;
        xs.push(lon1 + ((lat - lat1) / (lat2 - lat1)) * (lon2 - lon1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const x0 = Math.max(0, Math.ceil(((xs[k] + 180) / 360) * W - 0.5));
      const x1 = Math.min(W - 1, Math.floor(((xs[k + 1] + 180) / 360) * W - 0.5));
      for (let x = x0; x <= x1; x++) setBit(x, y);
    }
  }
}

for (const f of geo.features) {
  const g = f.geometry;
  if (!g) continue;
  if (g.type === 'Polygon') fillPolygon(g.coordinates);
  else if (g.type === 'MultiPolygon') g.coordinates.forEach(fillPolygon);
}

const b64 = Buffer.from(mask).toString('base64');
const land = mask.reduce((n, b) => n + ((b * 0x08040201) >> 3 & 0x11111111) % 15, 0);
console.log(`celdas de tierra: ~${Math.round((land / (W * H)) * 100)}%`);

const out = `// Generado por scripts/gen-landmask.mjs — NO editar a mano.
// Bitmask equirectangular ${W}x${H} de continentes (1 = tierra).
const W = ${W}, H = ${H};
const BITS = Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0));

/** true si (lat, lon) en grados cae sobre tierra firme */
export function isLand(lat, lon) {
  const x = Math.min(W - 1, Math.max(0, Math.floor(((lon + 180) / 360) * W)));
  const y = Math.min(H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * H)));
  const i = y * W + x;
  return (BITS[i >> 3] & (1 << (i & 7))) !== 0;
}
`;

const dest = resolve(dirname(fileURLToPath(import.meta.url)), '../src/components/three/landmask.js');
writeFileSync(dest, out);
console.log('escrito:', dest, `(${Math.round(out.length / 1024)} KB)`);
