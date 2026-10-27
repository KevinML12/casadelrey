import PhotoImage from './PhotoImage';

// Retains the shared photo interface; the scene is static and has no parallax.
export default function ParallaxImg({ src, fallbackSrc, alt = '', className = '', overlay = false, priority = false }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <PhotoImage
        src={src} fallbackSrc={fallbackSrc} alt={alt} sizes="100vw"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ filter: 'saturate(1.12)' }}
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
      />
      {overlay && <div className="absolute inset-0 bg-bg/60 pointer-events-none" />}
    </div>
  );
}
