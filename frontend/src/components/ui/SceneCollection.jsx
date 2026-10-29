import { useState } from 'react';
import SceneCarousel from './SceneCarousel';
import WindowStack from './WindowStack';
import PhotoTabs from './PhotoTabs';

export default function SceneCollection({ items, label, empty, renderInfo, id }) {
  const [openKey, setOpenKey] = useState(null);
  const [tab, setTab] = useState('gallery');
  return <>
    <SceneCarousel items={items} label={label} empty={empty} onOpen={key => { setTab('gallery'); setOpenKey(key); }} />
    <WindowStack items={items} openKey={openKey} onChange={setOpenKey} height="min(76svh, 580px)" light photoBackdrop animated neighborTitles renderContent={item => <>
      <PhotoTabs value={tab} onChange={setTab} id={id} />
      <div key={tab} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} tabIndex={0} className="text-bg focus-ring rounded-[8px]">
        {tab === 'gallery' && <button type="button" onClick={() => { setTab('photos'); document.getElementById(`${id}-tab-photos`)?.focus(); }} className="block w-full py-5 text-left text-20 font-bold focus-ring rounded-[8px]">{item.title}<span className="block mt-3 text-14 font-normal text-bg/70">Ver fotos</span></button>}
        {tab === 'photos' && <button type="button" onClick={() => { setTab('info'); document.getElementById(`${id}-tab-info`)?.focus(); }} className="min-h-11 text-15 font-semibold underline focus-ring rounded-[8px]">Conocer más</button>}
        {tab === 'info' && renderInfo(item)}
      </div>
    </>} />
  </>;
}
