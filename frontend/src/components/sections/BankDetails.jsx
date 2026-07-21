// ============================================================
//  BankDetails — datos bancarios ADMINISTRABLES (GET /settings, que
//  el admin edita en /admin/settings). Antes estaban hardcodeados con
//  el número del mockup de Figma en 3 lugares. Si el admin aún no puso
//  la cuenta real, NO se muestra un número falso: se invita a coordinar
//  el depósito por contacto. Compartido por Donar, Comprobante y el
//  banner de pago de Eventos.
// ============================================================
import { useApi } from '../../lib/feed';

export function useBankInfo() {
  const s = useApi('/settings') || {};
  const account = (s.bank_account || '').trim();
  return {
    hasAccount: account !== '',
    whatsapp: (s.contact_whatsapp || '').trim(),
    bankName: s.bank_name || 'Banrural',
    holder: s.bank_holder || 'Iglesia Casa del Rey',
    rows: [
      { label: 'Banco', value: s.bank_name || 'Banrural' },
      { label: 'Cuenta', value: account },
      { label: 'Tipo', value: s.bank_account_type || 'Monetaria' },
      { label: 'A nombre de', value: s.bank_holder || 'Iglesia Casa del Rey' },
    ].filter(r => r.value),
  };
}

// `on="light"` cuando el contenedor que lo envuelve es glass-light
// (blanco) -- por defecto asume el liquid-glass oscuro de siempre, que
// es como lo usan hoy el banner de pago de Eventos y DonationCard.
export default function BankDetails({ on = 'dark' }) {
  const { hasAccount, rows, whatsapp } = useBankInfo();
  const light = on === 'light';
  const dim   = light ? 'bg-bg/5 border-bg/10' : 'bg-white/5 border-white/10';
  const ink   = light ? 'text-bg'   : 'text-white';
  const inkMuted = light ? 'text-bg/60' : 'text-white/60';

  if (!hasAccount) {
    const href = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '/conectate';
    return (
      <a
        href={href}
        {...(whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`block rounded-[14px] ${dim} px-4 py-4 text-center transition-colors focus-ring ${light ? 'hover:bg-bg/10' : 'hover:bg-white/10'}`}
      >
        <p className={`text-14 font-bold ${ink}`}>Escríbenos para coordinar tu depósito</p>
        <p className={`text-13 mt-1 ${light ? 'text-bg/55' : 'text-white/55'}`}>Te compartimos los datos bancarios al momento</p>
      </a>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className={`flex items-center justify-between rounded-[12px] ${dim} px-4 py-3`}>
          <span className={`text-13 font-semibold ${inkMuted}`}>{label}</span>
          <span className={`text-15 font-bold ${ink}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
