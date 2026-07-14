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

export default function BankDetails() {
  const { hasAccount, rows, whatsapp } = useBankInfo();

  if (!hasAccount) {
    const href = whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : '/conectate';
    return (
      <a
        href={href}
        {...(whatsapp ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block rounded-[14px] bg-white/5 border border-white/10 px-4 py-4 text-center hover:bg-white/10 transition-colors focus-ring"
      >
        <p className="text-[14px] font-bold text-white">Escríbenos para coordinar tu depósito</p>
        <p className="text-[12.5px] text-white/55 mt-1">Te compartimos los datos bancarios al momento</p>
      </a>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between rounded-[12px] bg-white/5 px-4 py-3 border border-white/10">
          <span className="text-[12.5px] font-semibold text-white/60">{label}</span>
          <span className="text-[14.5px] font-bold text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}
