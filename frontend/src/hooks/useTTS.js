import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTTS — Text-To-Speech en español.
 *
 * Estrategia de motores (en orden de preferencia):
 *  1. ResponsiveVoice (Google TTS, cargado desde CDN en index.html) — mejor calidad
 *  2. Web Speech API nativa — fallback para navegadores sin ResponsiveVoice
 */
export default function useTTS(text) {
  const [status,   setStatus]   = useState('idle'); // idle | loading | playing | paused | done | error
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const startTime   = useRef(null);
  const estimatedMs = useRef(0);

  const hasRV = () => typeof window !== 'undefined' && typeof window.responsiveVoice !== 'undefined';
  const hasWS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (hasRV()) window.responsiveVoice.cancel();
      else if (hasWS()) window.speechSynthesis.cancel();
    };
  }, []);

  // Simula progreso por tiempo (ResponsiveVoice no tiene onboundary)
  const startProgressTimer = useCallback((durationMs) => {
    estimatedMs.current = durationMs;
    startTime.current   = Date.now();
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min(Math.round((elapsed / durationMs) * 100), 99);
      setProgress(pct);
    }, 400);
  }, []);

  const stopProgressTimer = useCallback(() => {
    clearInterval(intervalRef.current);
  }, []);

  // ── ResponsiveVoice ────────────────────────────────────────────────────────
  const playWithRV = useCallback(() => {
    setStatus('loading');
    // ~150 palabras por minuto en español
    const words = text.split(/\s+/).length;
    const msEst = (words / 130) * 60_000;

    window.responsiveVoice.speak(text, 'Spanish Latin American Female', {
      rate:    0.9,
      pitch:   1,
      volume:  1,
      onstart: () => {
        setStatus('playing');
        setProgress(0);
        startProgressTimer(msEst);
      },
      onend: () => {
        stopProgressTimer();
        setStatus('done');
        setProgress(100);
      },
      onerror: () => {
        stopProgressTimer();
        setStatus('error');
      },
    });
  }, [text, startProgressTimer, stopProgressTimer]);

  // ── Web Speech API (fallback) ──────────────────────────────────────────────
  const playWithWS = useCallback(() => {
    setStatus('loading');
    window.speechSynthesis.cancel();

    const speak = (voices) => {
      const utt = new SpeechSynthesisUtterance(text);

      const esVoice =
        voices.find(v => v.lang === 'es-US') ||
        voices.find(v => v.lang === 'es-MX') ||
        voices.find(v => v.lang === 'es-ES') ||
        voices.find(v => v.lang.startsWith('es'));

      if (esVoice) { utt.voice = esVoice; utt.lang = esVoice.lang; }
      else           { utt.lang = 'es-ES'; }

      utt.rate  = 0.88;
      utt.pitch = 1.0;

      utt.onstart  = () => { setStatus('playing'); setProgress(0); };
      utt.onend    = () => { setStatus('done');    setProgress(100); };
      utt.onerror  = () => setStatus('error');
      utt.onpause  = () => setStatus('paused');
      utt.onresume = () => setStatus('playing');

      let words = 0;
      const total = text.split(/\s+/).length;
      utt.onboundary = (e) => {
        if (e.name === 'word') setProgress(Math.round((++words / total) * 100));
      };

      window.speechSynthesis.speak(utt);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speak(voices);
    } else {
      window.speechSynthesis.addEventListener(
        'voiceschanged',
        () => speak(window.speechSynthesis.getVoices()),
        { once: true }
      );
    }
  }, [text]);

  // ── API pública ────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!text) return;
    if (hasRV()) playWithRV();
    else if (hasWS()) playWithWS();
  }, [text, playWithRV, playWithWS]);

  const pause = useCallback(() => {
    if (hasRV()) {
      window.responsiveVoice.pause();
      stopProgressTimer();
      setStatus('paused');
    } else if (hasWS()) {
      window.speechSynthesis.pause();
      setStatus('paused');
    }
  }, [stopProgressTimer]);

  const resume = useCallback(() => {
    if (hasRV()) {
      window.responsiveVoice.resume();
      const remaining = estimatedMs.current - (Date.now() - startTime.current);
      startProgressTimer(Math.max(remaining, 1000));
      setStatus('playing');
    } else if (hasWS()) {
      window.speechSynthesis.resume();
      setStatus('playing');
    }
  }, [startProgressTimer]);

  const stop = useCallback(() => {
    stopProgressTimer();
    if (hasRV()) window.responsiveVoice.cancel();
    else if (hasWS()) window.speechSynthesis.cancel();
    setStatus('idle');
    setProgress(0);
  }, [stopProgressTimer]);

  const supported = hasRV() || hasWS();

  return { status, progress, play, pause, resume, stop, supported };
}
