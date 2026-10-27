import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import PhotoImage from './PhotoImage';
import { photoVariants } from '../../lib/photos';
import { DUR, EASE_OUT } from '../../lib/motion';

// Keep the last loaded scene opaque until the next photograph is ready.
// Only opacity changes; the camera and glass surfaces stay in place.
export default function CrossfadePhoto({ src, fallbackSrc, className = '', style, onReady, sceneKey }) {
  const [frame, setFrame] = useState({ current: src, previous: null });
  const reducedMotion = useReducedMotion();
  const onReadyRef = useRef(onReady);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    const load = candidate => {
      const variants = photoVariants(candidate);
      image.onload = () => {
        if (!cancelled) {
          setFrame(old => old.current === candidate ? old : { current: candidate, previous: old.current });
          onReadyRef.current?.(candidate);
        }
      };
      image.onerror = () => {
        if (!cancelled && fallbackSrc && candidate !== fallbackSrc) load(fallbackSrc);
      };
      image.sizes = '100vw';
      image.srcset = variants?.map(variant => `${variant.src} ${variant.width}w`).join(', ') || '';
      image.src = variants?.at(-1)?.src || candidate;
    };
    load(src);
    return () => { cancelled = true; image.onload = null; image.onerror = null; };
  }, [src, fallbackSrc, sceneKey]);

  return (
    <div className={`absolute inset-0 ${className}`} style={style} aria-hidden="true" data-scene-photo={frame.current}>
      {frame.previous && <PhotoImage src={frame.previous} loading="eager" sizes="100vw" className="absolute inset-0 w-full h-full object-cover" />}
      <motion.div
        key={frame.current}
        className="absolute inset-0"
        initial={{ opacity: frame.previous && !reducedMotion ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : DUR.slow, ease: EASE_OUT }}
        onAnimationComplete={() => setFrame(old => old.current === frame.current && old.previous ? { ...old, previous: null } : old)}
      >
        <PhotoImage src={frame.current} loading="eager" sizes="100vw" className="absolute inset-0 w-full h-full object-cover" />
      </motion.div>
    </div>
  );
}
