import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTTS — Text-To-Speech usando la Web Speech API del navegador.
 * Compatible con Chrome, Firefox, Safari, Edge (sin costo, sin API key).
 *
 * @param {string} text — Texto a leer (sin HTML)
 * @param {string} lang — Código de idioma (default: 'es-GT')
 */
export default function useTTS(text, lang = 'es-GT') {
  const [status,   setStatus]   = useState('idle'); // idle | loading | playing | paused | done | error
  const [progress, setProgress] = useState(0);       // 0–100
  const utterRef = useRef(null);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  const play = useCallback(() => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = lang;
    utt.rate  = 0.92;
    utt.pitch = 1.0;

    // Intentar voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanish = voices.find(v =>
      v.lang.startsWith('es') && (v.lang.includes('MX') || v.lang.includes('ES') || v.lang.includes('GT'))
    ) || voices.find(v => v.lang.startsWith('es'));
    if (spanish) utt.voice = spanish;

    utt.onstart  = () => { setStatus('playing'); setProgress(0); };
    utt.onend    = () => { setStatus('done');    setProgress(100); };
    utt.onerror  = () => setStatus('error');
    utt.onpause  = () => setStatus('paused');
    utt.onresume = () => setStatus('playing');

    // Progreso aproximado por palabras
    let wordCount   = 0;
    const totalWords = text.split(/\s+/).length;
    utt.onboundary = (e) => {
      if (e.name === 'word') {
        wordCount++;
        setProgress(Math.round((wordCount / totalWords) * 100));
      }
    };

    utterRef.current = utt;
    setStatus('loading');

    // Algunos navegadores necesitan un pequeño delay para cargar voces
    setTimeout(() => {
      window.speechSynthesis.speak(utt);
    }, 100);
  }, [text, lang, supported]);

  const pause = useCallback(() => {
    if (supported && status === 'playing') {
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [supported, status]);

  const resume = useCallback(() => {
    if (supported && status === 'paused') {
      window.speechSynthesis.resume();
      setStatus('playing');
    }
  }, [supported, status]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setStatus('idle');
      setProgress(0);
    }
  }, [supported]);

  return { status, progress, play, pause, resume, stop, supported };
}
