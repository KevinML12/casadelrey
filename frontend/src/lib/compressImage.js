// Compresion del lado del cliente antes de subir -- sin esto, una foto real
// de camara/celular (3-8MB tipico) se sube tal cual, y en una conexion lenta
// eso se siente "trabado" (el boton solo dice "Subiendo..." sin progreso,
// facil de confundir con que no funciona). Reescala al lado mayor a
// MAX_DIMENSION y reencodea como JPEG -- reduce el peso dramaticamente con
// perdida de calidad minima para fotos que se muestran en la web.
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;
const SKIP_BELOW_BYTES = 300 * 1024; // ya es chica, no vale la pena procesarla

// GIFs animados pierden sus frames si se re-encodean via canvas (solo
// captura el frame actual) -- se dejan pasar sin tocar.
function shouldCompress(file) {
  if (!file.type.startsWith('image/')) return false;
  if (file.type === 'image/gif') return false;
  if (file.size <= SKIP_BELOW_BYTES) return false;
  return true;
}

/**
 * Comprime un File de imagen si vale la pena; si no, devuelve el original
 * intacto (PDFs, GIFs, o archivos ya chicos). Nunca lanza -- si algo falla
 * (imagen corrupta, navegador sin soporte de canvas), cae al original para
 * no bloquear la subida real por un problema de optimizacion.
 */
export async function compressImageIfNeeded(file) {
  if (!shouldCompress(file)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file; // no gano nada, usar el original

    const newName = file.name.replace(/\.\w+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
