import useTTS from '../../hooks/useTTS';

export default function TTSPlayer({ content }) {
  const plainText = content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const { status, progress, play, pause, resume, stop } = useTTS(plainText);
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isLoading = status === 'loading';
  const isActive = isPlaying || isPaused || isLoading;
  const isDone = status === 'done';
  const action = 'ui-action inline-flex min-h-11 items-center justify-center rounded-[12px] px-4 py-2 text-14 font-semibold focus-ring';

  return (
    <div role="group" aria-label="Lectura en voz alta" className="rounded-[12px] border-y border-bg/15 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="text-14 font-semibold text-bg">
          {isLoading ? 'Preparando audio…' : isPlaying ? 'Leyendo el mensaje' : isPaused ? 'Lectura en pausa' : isDone ? 'Lectura completada' : status === 'error' ? 'No se pudo reproducir el audio.' : 'Escuchar el mensaje'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {!isActive && <button type="button" disabled={!plainText} onClick={play} className={`${action} bg-bg text-white disabled:opacity-50`}>{status === 'error' ? 'Reintentar audio' : isDone ? 'Repetir' : 'Escuchar'}</button>}
          {isPlaying && <button type="button" onClick={pause} className={`${action} bg-bg/10 text-bg`}>Pausar</button>}
          {isPaused && <button type="button" onClick={resume} className={`${action} bg-bg text-white`}>Continuar</button>}
          {isActive && <button type="button" onClick={stop} className={`${action} bg-bg/10 text-bg`}>Detener</button>}
        </div>
      </div>
      {isActive && <div role="progressbar" aria-label="Progreso de lectura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-4 h-1 overflow-hidden rounded-full bg-bg/10"><div className="h-full bg-bg transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>}
    </div>
  );
}
