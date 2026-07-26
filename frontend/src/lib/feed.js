// ============================================================
//  feed.js — el Home es un feed curado por los admins: todo lo
//  visible sale del backend (lo que publican en el panel) y las
//  fotos de fondo vienen de la galería. Fetch cacheado a nivel
//  módulo: varias secciones que piden el mismo endpoint al montar
//  comparten UNA sola llamada de red (no N simultáneas).
// ============================================================
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

// BUG REAL reportado por el usuario: bank_account se veía desactualizado
// en /donate justo después de guardarlo en Admin > Configuración, aunque
// la API ya devolvía el valor nuevo (confirmado con curl). Causa: el Map
// nunca expiraba -- "una vez por sesión" significaba literalmente una vez
// por pestaña, para SIEMPRE, hasta un refresh completo. Cualquier edición
// de admin (settings, hero, blog, galería, líderes, redes, anuncios,
// células, voluntariado -- todo lo que pasa por useApi/fetchOnce) quedaba
// invisible en esa misma pestaña sin recargar. TTL corto (coincide con el
// Cache-Control: max-age=20 que ya manda el backend) para que expire solo,
// sin perder el dedupe de llamadas simultáneas al montar varias secciones.
const CACHE_TTL_MS = 20000;
const cache = new Map(); // path -> { promise, timestamp }

/** GET cacheado ~20s — comparte la promesa entre secciones que montan a la vez */
export function fetchOnce(path) {
  const now = Date.now();
  const entry = cache.get(path);
  if (!entry || now - entry.timestamp > CACHE_TTL_MS) {
    cache.set(path, { promise: apiClient.get(path).then(r => r.data).catch(() => null), timestamp: now });
  }
  return cache.get(path).promise;
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

/**
 * Hook: foto de un slot fijo administrable (AdminSitePhotos), con
 * fallback local garantizado si el admin no ha subido nada aún o si
 * la API falla — el slot SIEMPRE se ve, nunca un hueco en blanco.
 */
export function useSitePhoto(key, fallback) {
  const photos = useApi('/site-photos');
  return (photos && photos[key]) || fallback;
}
