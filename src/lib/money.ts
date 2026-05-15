const RUPEE_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function parseRupeesToPaise(input: string | number): number {
  const raw = String(input).trim().replace(/,/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(raw)) {
    throw new Error('Enter a valid amount with at most 2 decimals');
  }

  const [rupees, paise = ''] = raw.split('.');
  const value = Number(rupees) * 100 + Number(paise.padEnd(2, '0'));
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  return value;
}

export function formatPaise(amount: number): string {
  return RUPEE_FORMATTER.format(amount / 100);
}

export function splitEqual(total: number, participantIds: string[]): Map<string, number> {
  if (participantIds.length === 0) {
    throw new Error('Choose at least one participant');
  }

  const base = Math.floor(total / participantIds.length);
  let remainder = total % participantIds.length;
  const result = new Map<string, number>();

  for (const userId of participantIds) {
    result.set(userId, base + (remainder > 0 ? 1 : 0));
    remainder -= 1;
  }

  return result;
}
