// Los 10 departamentos reales donde sirven los ~90 voluntarios
// (CONTEXTO_IGLESIA jul-2026). Única fuente de verdad: antes vivía
// duplicado como array de strings en AboutPage.jsx y como objetos
// {icon,title,desc} en VolunteeringPage.jsx — podían desincronizarse.
//
// photoFallback: foto REAL ya existente en el sitio (ninguna generada/
// stock nueva), emparejada por afinidad temática -- alabanza/danza/niños
// tienen match exacto en /images/albums; el resto usa la foto real más
// cercana en tema (servidores, líderes, prédicas, comunidad). Cada una
// vive también en /admin/site-photos bajo la key `voluntariado_<value>`
// por si el admin quiere subir una foto real de ESE departamento en vez
// del fallback -- el fallback nunca deja un hueco en blanco.
//
// why: por qué serviría bien alguien ahí -- se muestra al abrir el
// departamento (WindowStack), responde a "por qué es bueno que vaya
// a ese departamento" en vez de repetir la descripción funcional.
export const VOLUNTEER_AREAS = [
  {
    value: 'alabanza', icon: 'mic', title: 'Alabanza',
    desc: 'Lidera la adoración y la música en los servicios y células.',
    photoFallback: '/images/albums/alabanza.jpg',
    why: 'Si te apasiona la música y quieres guiar a otros al encuentro con Dios, este es tu lugar.',
  },
  {
    value: 'danza', icon: 'spark', title: 'Danza',
    desc: 'Expresa la adoración a través del movimiento en los servicios.',
    photoFallback: '/images/albums/danza.jpg',
    why: 'Si te mueve adorar con el cuerpo y quieres inspirar a otros con tu expresión, únete aquí.',
  },
  {
    value: 'servidores', icon: 'heart', title: 'Servidores',
    desc: 'Recibe a cada persona; cuida la recepción y la limpieza de la iglesia.',
    photoFallback: '/images/nosotros/servidores.jpg',
    why: 'Si te gusta recibir a las personas con calidez y hacer que se sientan en casa, esto es para ti.',
  },
  {
    value: 'protocolo', icon: 'crown', title: 'Protocolo',
    desc: 'Atención VIP a políticos, pastores invitados y personas de alto nivel.',
    photoFallback: '/images/nosotros/lideres.jpg',
    why: 'Si tienes don de gente y atención al detalle, aquí darás la bienvenida a quienes más lo necesitan.',
  },
  {
    value: 'pancartas', icon: 'flag', title: 'Pancartas',
    desc: 'Porta y coordina las pancartas durante los días de culto.',
    photoFallback: '/images/nosotros/comunidad.jpg',
    why: 'Si quieres servir con entusiasmo visible y ser parte activa del ambiente de cada culto, únete.',
  },
  {
    value: 'maestros_ninos', icon: 'book', title: 'Maestros de Niños',
    desc: 'Enseña e inspira a los más pequeños con creatividad y amor.',
    photoFallback: '/images/albums/ninos.jpg',
    why: 'Si tienes paciencia y amor por enseñar, aquí formarás la fe de la próxima generación.',
  },
  {
    value: 'tecnicos_audiovisuales', icon: 'headphones', title: 'Técnicos Audiovisuales',
    desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.',
    photoFallback: '/images/predicas/predica-1.jpg',
    why: 'Si te gusta la tecnología y el detalle técnico, aquí aseguras que el mensaje llegue claro.',
  },
  {
    value: 'multimedia', icon: 'camera', title: 'Multimedia',
    desc: 'Diseño gráfico, video y redes sociales para la comunicación de la iglesia.',
    photoFallback: '/images/predicas/predica-2.jpg',
    why: 'Si tienes ojo creativo para el diseño o el video, aquí contarás la historia de la iglesia.',
  },
  {
    value: 'oracion', icon: 'pray', title: 'Oración',
    desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.',
    photoFallback: '/images/predicas/predica-3.jpg',
    why: 'Si sientes el llamado a interceder, aquí sostienes en oración a toda la congregación.',
  },
  {
    value: 'logistica', icon: 'box', title: 'Logística',
    desc: 'Coordina recursos, transporte y organización de eventos y servicios.',
    photoFallback: '/images/albums/miembros.jpg',
    why: 'Si eres organizado y te gusta que todo funcione bien detrás de cámaras, aquí eres clave.',
  },
];
