// Synthetic API fixture, deliberately absent from runtime code.
export const volunteerAreas = ['Alabanza', 'Danza', 'Servidores', 'Protocolo', 'Pancartas', 'Maestros de Niños', 'Técnicos Audiovisuales', 'Multimedia', 'Oración', 'Logística'].map((title, index) => ({
  value: ['alabanza', 'danza', 'servidores', 'protocolo', 'pancartas', 'maestros_ninos', 'tecnicos_audiovisuales', 'multimedia', 'oracion', 'logistica'][index],
  interests: [['musica'],['musica'],['personas'],['personas'],['personas'],['ninos'],['tecnologia'],['tecnologia'],['oracion'],['organizacion']][index],
  visibility: [['frente'],['frente'],['apoyo'],['frente'],['frente'],['frente'],['apoyo'],['apoyo'],['apoyo'],['apoyo']][index],
  title, description: `Descripción publicada de ${title}`, why: `Motivo publicado de ${title}`,
}));
