export const BANK_FIELDS = [
  ['bank_name', 'Banco'],
  ['bank_account', 'Número de cuenta'],
  ['bank_account_type', 'Tipo de cuenta'],
  ['bank_holder', 'Titular'],
];

// Publish only a complete administrator-supplied destination. A bank name,
// account type or holder cannot be inferred from an account number.
export function bankInfo(settings = {}) {
  const value = key => typeof settings[key] === 'string' ? settings[key].trim() : '';
  const missing = BANK_FIELDS.filter(([key]) => !value(key)).map(([, label]) => label);
  const phone = value('contact_whatsapp').replace(/\D/g, '');
  return {
    hasAccount: missing.length === 0,
    missing,
    whatsapp: /^\d{8,15}$/.test(phone) ? phone : '',
    bankName: value('bank_name'),
    holder: value('bank_holder'),
    rows: BANK_FIELDS.map(([key, label]) => ({
      label: key === 'bank_account' ? 'Cuenta' : key === 'bank_holder' ? 'A nombre de' : key === 'bank_account_type' ? 'Tipo' : label,
      value: value(key),
    })),
  };
}
