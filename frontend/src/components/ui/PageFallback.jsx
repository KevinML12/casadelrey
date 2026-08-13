export default function PageFallback({ panel = false }) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${panel ? 'bg-paper' : 'bg-surf'}`}>
      <div className={`w-7 h-7 rounded-full border-2 border-t-pri animate-spin ${panel ? 'border-bg/12' : 'border-outline-var'}`} />
    </div>
  );
}
