import { useState, useRef, useCallback } from 'react';
import apiClient from '../lib/apiClient';

/**
 * useTTS — Texto a voz vía backend (Google Translate o Google Cloud).
 */
export default function useTTS(text) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState(null); // 'elevenlabs' | 'google-cloud' | 'google-translate'
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimer = () => clearInterval(intervalRef.current);

  const play = useCallback(async () => {
    if (!text) return;

    if (audioRef.current && status === 'paused') {
      audioRef.current.play();
      setStatus('playing');
      return;
    }

    setStatus('loading');
    setProgress(0);
    clearTimer();

    try {
      const res = await apiClient.post('/tts', { text });
      const b64 = res.data.audio;
      setEngine(res.data.engine || null);

      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => {
        setStatus('playing');
        clearTimer();
        intervalRef.current = setInterval(() => {
          if (audio.duration) {
            setProgress(Math.round((audio.currentTime / audio.duration) * 100));
          }
        }, 300);
      };

      audio.onpause = () => {
        clearTimer();
        if (!audio.ended) setStatus('paused');
      };

      audio.onended = () => {
        clearTimer();
        setStatus('done');
        setProgress(100);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        clearTimer();
        setStatus('error');
      };

      audio.play();
    } catch (err) {
      console.error('[TTS]', err);
      setStatus('error');
    }
  }, [text, status]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus('paused');
    clearTimer();
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setStatus('playing');
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setStatus('idle');
    setProgress(0);
  }, []);

  return { status, progress, play, pause, resume, stop, engine, supported: true };
}
