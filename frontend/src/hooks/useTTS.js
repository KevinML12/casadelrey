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

  // Obtiene la mejor voz en español disponible, esperando si es necesario
  const getSpanishVoice = useCallback(() => {
    return new Promise((resolve) => {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        // Preferencia: GT > MX > ES > cualquier español > null (usa la del sistema)
        const found =
          voices.find(v => v.lang === 'es-GT') ||
          voices.find(v => v.lang === 'es-MX') ||
          voices.find(v => v.lang === 'es-ES') ||
          voices.find(v => v.lang.startsWith('es'));
        resolve(found || null);
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        pick();
      } else {
        // Chrome y Safari cargan voces de forma asíncrona
        window.speechSynthesis.addEventListener('voiceschanged', pick, { once: true });
        // Timeout de seguridad: si voiceschanged nunca llega, seguimos sin voz específica
        setTimeout(() => resolve(null), 2000);
      }
    });
  }, []);

  const play = useCallback(async () => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    setStatus('loading');

    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = lang;
    utt.rate  = 0.9;
    utt.pitch = 1.0;

    const voice = await getSpanishVoice();
    if (voice) utt.voice = voice;

    utt.onstart  = () => { setStatus('playing'); setProgress(0); };
    utt.onend    = () => { setStatus('done');    setProgress(100); };
    utt.onerror  = () => setStatus('error');
    utt.onpause  = () => setStatus('paused');
    utt.onresume = () => setStatus('playing');

    let wordCount    = 0;
    const totalWords = text.split(/\s+/).length;
    utt.onboundary   = (e) => {
      if (e.name === 'word') {
        wordCount++;
        setProgress(Math.round((wordCount / totalWords) * 100));
      }
    };

    utterRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [text, lang, supported, getSpanishVoice]);

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
