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

/**
 * Hook: foto de un slot fijo administrable (AdminSitePhotos), con
 * fallback local garantizado si el admin no ha subido nada aún o si
 * la API falla — el slot SIEMPRE se ve, nunca un hueco en blanco.
 */
export function useSitePhoto(key, fallback) {
  const photos = useApi('/site-photos');
  return (photos && photos[key]) || fallback;
}
