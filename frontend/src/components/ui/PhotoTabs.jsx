const TABS = [{ value: 'gallery', label: 'Galería' }, { value: 'photos', label: 'Fotos' }, { value: 'info', label: 'Información' }];

// The tab buttons stay mounted when the panel changes, preserving focus.
export default function PhotoTabs({ value, onChange, id, galleryLabel = 'Galería' }) {
  return <div role="tablist" aria-label="Apartados" className="flex gap-1 border-b border-bg/15 mb-6 text-bg">
    {TABS.map((tab, index) => <button key={tab.value} type="button" role="tab" id={`${id}-tab-${tab.value}`} aria-controls={`${id}-panel`} aria-selected={value === tab.value} tabIndex={value === tab.value ? 0 : -1} onClick={() => onChange(tab.value)} onKeyDown={event => {
      const target = event.key === 'ArrowRight' ? (index + 1) % TABS.length : event.key === 'ArrowLeft' ? (index - 1 + TABS.length) % TABS.length : event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : undefined;
      if (target === undefined) return;
      event.preventDefault(); event.stopPropagation();
      onChange(TABS[target].value);
      document.getElementById(`${id}-tab-${TABS[target].value}`)?.focus();
    }} className={`min-h-11 px-3 rounded-t-[8px] text-13 font-semibold focus-ring border-b-2 ${value === tab.value ? 'border-bg text-bg' : 'border-transparent text-bg/60 hover:text-bg'}`}>
      {tab.value === 'gallery' ? galleryLabel : tab.label}
    </button>)}
  </div>;
}
