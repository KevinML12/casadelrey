// ============================================================
//  feed.js — el Home es un feed curado por los admins: todo lo
//  visible sale del backend (lo que publican en el panel) y las
//  fotos de fondo vienen de la galería. Fetch cacheado a nivel
//  módulo: cada endpoint se pide UNA vez por sesión aunque varias
//  secciones lo consuman.
// ============================================================
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

const cache = new Map();

/** GET cacheado — comparte la promesa entre secciones */
export function fetchOnce(path) {
  if (!cache.has(path)) {
    cache.set(path, apiClient.get(path).then(r => r.data).catch(() => null));
  }
  return cache.get(path);
}

/** Hook: data del endpoint (null mientras carga o si la API falla) */
export function useApi(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let on = true;
    fetchOnce(path).then(d => { if (on) setData(d); });
    return () => { on = false; };
  }, [path]);
  return data;
}

/** Agrupa fotos de galería por álbum (convención "Álbum - Foto") */
export function groupAlbums(photos) {
  const grouped = {};
  (photos || []).forEach(p => {
    const name = p.title?.includes(' - ') ? p.title.split(' - ')[0].trim() : 'Otros';
    (grouped[name] ||= []).push(p);
  });
  return grouped;
}

// Cada sección busca un álbum afín por nombre; si no hay, rota entre
// los álbumes disponibles para que los fondos no se repitan.
const SECTION_KEYWORDS = {
  agenda:    /evento|j[oó]venes|noche|retiro/i,
  celulas:   /comunidad|miembro|c[eé]lula|familia/i,
  mensajes:  /alabanza|pr[eé]dica|domingo|pastor/i,
  ubicacion: /iglesia|templo|danza|ni[nñ]os/i,
};

const LOCAL_FALLBACKS = {
  agenda:    '/images/bg-eventos.jpg',
  celulas:   '/images/bg-ministerios.jpg',
  mensajes:  '/images/bg-ensenanzas.jpg',
  ubicacion: '/images/bg-ubicacion.jpg',
};

/**
 * Hook: foto de un slot fijo administrable (AdminSitePhotos), con
 * fallback local garantizado si el admin no ha subido nada aún o si
 * la API falla — el slot SIEMPRE se ve, nunca un hueco en blanco.
 */
export function useSitePhoto(key, fallback) {
  const photos = useApi('/site-photos');
  return (photos && photos[key]) || fallback;
}

/**
 * Hook: fondos de sección curados desde la galería del admin.
 * Devuelve { agenda, celulas, mensajes, ubicacion } — URLs de foto.
 * Sin API (o galería vacía) quedan los fondos locales de siempre.
 */
export function useBackdrops() {
  const gallery = useApi('/gallery/?limit=200');
  const [backdrops, setBackdrops] = useState(LOCAL_FALLBACKS);

  useEffect(() => {
    const photos = gallery?.data || gallery;
    if (!Array.isArray(photos) || photos.length === 0) return;
    const albums = groupAlbums(photos);
    const names = Object.keys(albums);
    const used = new Set();
    const next = { ...LOCAL_FALLBACKS };

    for (const [section, rx] of Object.entries(SECTION_KEYWORDS)) {
      const hit = names.find(n => rx.test(n) && !used.has(n));
      if (hit) { used.add(hit); next[section] = albums[hit][0].url; }
    }
    // secciones sin álbum afín: rotar por los álbumes que sobren
    const rest = names.filter(n => !used.has(n));
    let i = 0;
    for (const section of Object.keys(SECTION_KEYWORDS)) {
      if (next[section] === LOCAL_FALLBACKS[section] && rest[i]) {
        next[section] = albums[rest[i++]][0].url;
      }
    }
    setBackdrops(next);
  }, [gallery]);

  return backdrops;
}
