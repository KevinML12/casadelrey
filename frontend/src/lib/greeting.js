// Saludo según la hora del día -- compartido entre el Dashboard admin
// ("Buenos días, Pastor") y el subtítulo del hero público (cuando el
// admin no puso un texto propio), para que ambos se sientan parte del
// mismo lenguaje "personal, no genérico" del sitio.
export function saludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
