import { useState, useRef, useCallback, useEffect } from 'react';
import apiClient from '../lib/apiClient';

export default function useTTS(text) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [engine, setEngine] = useState(null);
  const audioRef = useRef(null);
  const urlRef = useRef(null);
  const timerRef = useRef(null);
  const requestRef = useRef(null);
  const generationRef = useRef(0);

  const release = useCallback(() => {
    clearInterval(timerRef.current);
    if (audioRef.current) {
      const audio = audioRef.current;
      audio.onplay = audio.onpause = audio.onended = audio.onerror = null;
      audio.pause();
      audioRef.current = null;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);
  const cancel = useCallback(() => {
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    release();
  }, [release]);

  // A reader that has closed must never start playing a late response.
  useEffect(() => () => cancel(), [text, cancel]);

  const play = useCallback(async () => {
    if (!text) return;
    cancel();
    const generation = generationRef.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('loading');
    setProgress(0);
    try {
      const response = await apiClient.post('/tts', { text }, { signal: controller.signal });
      if (generation !== generationRef.current) return;
      const binary = atob(response.data.audio);
      const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      setEngine(response.data.engine || null);
      const current = () => generation === generationRef.current && audioRef.current === audio;
      audio.onplay = () => {
        if (!current()) return;
        setStatus('playing');
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          if (current() && Number.isFinite(audio.duration) && audio.duration > 0) {
            setProgress(Math.max(0, Math.min(100, Math.round(audio.currentTime / audio.duration * 100))));
          }
        }, 300);
      };
      audio.onpause = () => {
        if (!current()) return;
        clearInterval(timerRef.current);
        if (!audio.ended) setStatus('paused');
      };
      audio.onended = () => {
        if (!current()) return;
        release();
        setStatus('done');
        setProgress(100);
      };
      audio.onerror = () => {
        if (!current()) return;
        release();
        setStatus('error');
      };
      await audio.play();
    } catch {
      if (generation !== generationRef.current || controller.signal.aborted) return;
      release();
      setStatus('error');
    }
  }, [text, cancel, release]);

  const pause = useCallback(() => audioRef.current?.pause(), []);
  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try { await audio.play(); }
    catch {
      if (audioRef.current !== audio) return;
      release();
      setStatus('error');
    }
  }, [release]);
  const stop = useCallback(() => {
    cancel();
    setStatus('idle');
    setProgress(0);
  }, [cancel]);

  return { status, progress, play, pause, resume, stop, engine, supported: true };
}
