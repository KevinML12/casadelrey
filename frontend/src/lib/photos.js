import sources from './photoSources.json';

export function photoSource(src) {
  return sources[src]?.at(-1)?.src || src;
}

export function photoVariants(src) {
  return sources[src];
}
