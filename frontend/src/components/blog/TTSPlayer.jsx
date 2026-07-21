// ============================================================
//  TTSPlayer — reproductor del lector de blog con IA. El motor real
//  (ElevenLabs / Google Cloud Neural2 / Google Translate) lo decide
//  el backend en /tts según qué credenciales tenga configuradas — ver
//  backend/handlers/tts.handler.go. Sin ELEVENLABS_API_KEY ni
//  GOOGLE_TTS_KEY cae al motor gratuito de Google Translate, que suena
//  más robótico; para una voz naturalizada hace falta esa credencial.
// ============================================================
import { motion } from 'framer-motion';
import { Icon } from '../ui/Glass';
import useTTS from '../../hooks/useTTS';

const ENGINE_LABEL = {
  elevenlabs: 'ElevenLabs (IA)',
  'google-cloud': 'Google Cloud',
  'google-translate': 'Google Translate',
};

export default function TTSPlayer({ content }) {
  const plainText = content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '';
  const { status, progress, play, pause, resume, stop, engine } = useTTS(plainText);

  const isPlaying = status === 'playing';
  const isPaused  = status === 'paused';
  const isLoading = status === 'loading';
  const isActive  = isPlaying || isPaused || isLoading;
  const isDone    = status === 'done';

  const engineLabel = ENGINE_LABEL[engine] || 'Google Translate';

  return (
    <div className="glass-light-nested rounded-[20px] overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-12 h-12 rounded-full bg-bg/8 border border-bg/12 flex items-center justify-center shrink-0">
          <Icon name={isLoading ? 'spark' : 'music'} className={`w-5 h-5 text-bg ${isLoading ? 'animate-spin' : ''}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-bg">
            {isLoading ? 'Preparando…' : isPlaying ? 'Leyendo…' : isPaused ? 'Pausado' : isDone ? 'Completado' : 'Escuchar este post'}
          </p>
          <p className="text-[12.5px] text-bg/50 mt-0.5">
            {isActive ? `Voz en español · ${engineLabel}` : 'El post se leerá en voz alta'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(!isActive || isDone) && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={play}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg text-white text-[13px] font-bold">
              <Icon name="play" className="w-3.5 h-3.5" />
              {isDone ? 'Repetir' : 'Escuchar'}
            </motion.button>
          )}
          {isPlaying && (
            <button onClick={pause} className="px-4 py-2 rounded-full bg-bg/8 text-bg text-[13px] font-semibold">
              Pausar
            </button>
          )}
          {isPaused && (
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} onClick={resume}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg text-white text-[13px] font-bold">
              <Icon name="play" className="w-3.5 h-3.5" />
              Continuar
            </motion.button>
          )}
          {isActive && (
            <button onClick={stop} title="Detener" className="w-9 h-9 rounded-full bg-bg/8 flex items-center justify-center text-bg/70">
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="h-1 bg-bg/10">
          <div className="h-full bg-bg transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
