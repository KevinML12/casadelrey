import { useApiResource } from './feed';
import { VOLUNTEER_BACKGROUNDS } from './volunteerBackgrounds';

// Published records are the only source of departments and their copy.
// Local files provide visual fallbacks, never replacement directory entries.
export function useVolunteerAreasResource() {
  const resource = useApiResource('/volunteer-areas');
  const areas = (Array.isArray(resource.data) ? resource.data : []).map(area => ({
    value: area.value,
    title: area.title,
    desc: area.description,
    why: area.why,
    testimonial: area.testimonial,
    testimonialAuthor: area.testimonial_author,
    photoFallback: VOLUNTEER_BACKGROUNDS[area.value] || '/images/backgrounds/congregacion.webp',
  }));
  return { ...resource, areas };
}

export function useVolunteerAreas() {
  return useVolunteerAreasResource().areas;
}
