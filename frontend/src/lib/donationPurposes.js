import { useApi } from './feed';

// Los 5 destinos reales ya usados en donaciones existentes (donation_purpose
// guardado en cada registro). Única fuente de verdad: antes vivía
// duplicado como PURPOSES en DonationCard.jsx (selector real, sin
// descripción) y como IMPACT en DonatePage.jsx (vitrina con descripción,
// pero con 2 valores distintos -- "Educación"/"Familias" -- que nunca
// fueron destinos seleccionables de verdad). Podían desincronizarse.
//
// Este array YA NO es la fuente de verdad del contenido -- eso vive en
// DonationPurpose (DB, editable desde /admin/donation-purposes). Ahora es
// SOLO el fallback si la API falla/está vacía. Usar useDonationPurposes()
// de abajo, no este array directo.
export const DONATION_PURPOSES = [
  { value: 'general',   icon: 'church',          title: 'Fondo General',   description: 'Sostiene las operaciones generales de la iglesia' },
  { value: 'celulas',   icon: 'users',           title: 'Células',        description: 'Equipando líderes de casa en cada barrio' },
  { value: 'misionero', icon: 'public',          title: 'Misiones',       description: 'Llevando el evangelio a otras regiones' },
  { value: 'jovenes',   icon: 'star',            title: 'Ministerio Joven', description: 'Formación e impulso para la próxima generación' },
  { value: 'edificio',  icon: 'account_balance',  title: 'Edificio',       description: 'Mantenimiento y mejoras del templo' },
];

// Hook: destinos reales desde /donation-purposes (admin-editable), con
// DONATION_PURPOSES como fallback si la API aún no responde o está vacía
// -- el selector y la vitrina nunca quedan en blanco.
export function useDonationPurposes() {
  const data = useApi('/donation-purposes');
  if (Array.isArray(data) && data.length > 0) {
    return data.map(p => ({
      value: p.value,
      icon: p.icon || 'church',
      title: p.title,
      description: p.description,
    }));
  }
  return DONATION_PURPOSES;
}
