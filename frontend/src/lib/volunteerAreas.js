// Los 10 departamentos reales donde sirven los ~90 voluntarios
// (CONTEXTO_IGLESIA jul-2026). Única fuente de verdad: antes vivía
// duplicado como array de strings en AboutPage.jsx y como objetos
// {icon,title,desc} en VolunteeringPage.jsx — podían desincronizarse.
export const VOLUNTEER_AREAS = [
  { value: 'alabanza',               icon: 'mic',         title: 'Alabanza',                desc: 'Lidera la adoración y la música en los servicios y células.' },
  { value: 'danza',                  icon: 'spark',       title: 'Danza',                   desc: 'Expresa la adoración a través del movimiento en los servicios.' },
  { value: 'servidores',             icon: 'heart',       title: 'Servidores',              desc: 'Recibe a cada persona; cuida la recepción y la limpieza de la iglesia.' },
  { value: 'protocolo',              icon: 'crown',       title: 'Protocolo',               desc: 'Atención VIP a políticos, pastores invitados y personas de alto nivel.' },
  { value: 'pancartas',              icon: 'flag',        title: 'Pancartas',               desc: 'Porta y coordina las pancartas durante los días de culto.' },
  { value: 'maestros_ninos',         icon: 'book',        title: 'Maestros de Niños',       desc: 'Enseña e inspira a los más pequeños con creatividad y amor.' },
  { value: 'tecnicos_audiovisuales', icon: 'headphones',  title: 'Técnicos Audiovisuales',  desc: 'Sonido, proyección y streaming para que el servicio llegue más lejos.' },
  { value: 'multimedia',             icon: 'camera',      title: 'Multimedia',              desc: 'Diseño gráfico, video y redes sociales para la comunicación de la iglesia.' },
  { value: 'oracion',                icon: 'pray',        title: 'Oración',                 desc: 'Intercede por la iglesia, los miembros y las necesidades de la ciudad.' },
  { value: 'logistica',              icon: 'box',         title: 'Logística',               desc: 'Coordina recursos, transporte y organización de eventos y servicios.' },
];
