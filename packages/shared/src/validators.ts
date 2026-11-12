/**
 * Business & Compliance Validators for Morocco Business OS
 */

/**
 * Validates Moroccan ICE (Identifiant Commun de l’Entreprise).
 * The ICE is a unique 15-digit numeric identifier issued to all Moroccan registered companies.
 */
export function isValidMoroccanICE(ice: string): boolean {
  if (!ice) return false;
  const clean = ice.trim();
  return /^\d{15}$/.test(clean);
}

/**
 * Validates Moroccan IF (Identifiant Fiscal).
 * Typically a 7 to 8-digit numeric identifier assigned by the Direction Générale des Impôts (DGI).
 */
export function isValidMoroccanIF(identifiantFiscal: string): boolean {
  if (!identifiantFiscal) return false;
  const clean = identifiantFiscal.trim();
  return /^\d{7,10}$/.test(clean);
}

/**
 * Validates Moroccan Taxe Professionnelle (TP).
 * An 8-digit numeric reference code.
 */
export function isValidMoroccanTP(tp: string): boolean {
  if (!tp) return false;
  const clean = tp.trim();
  return /^\d{6,10}$/.test(clean);
}

/**
 * Validates Moroccan Phone Numbers.
 * Supports Moroccan national formatting (05xx, 06xx, 07xx) and international (+212 / 00212).
 */
export function isValidMoroccanPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\.]/g, '');
  // Matches +212[5-7]xxxxxxxx or 0[5-7]xxxxxxxx
  return /^(?:\+212|00212|0)[5-7]\d{8}$/.test(clean);
}

export interface AccountingEntryLineInput {
  debit: number | string;
  credit: number | string;
}

/**
 * Non-Negotiable Rule #5: Double-Entry Balancing Check
 * Ensures total debits strictly equal total credits within micro-cent rounding margin (0.0001 MAD).
 */
export function isDoubleEntryBalanced(
  lines: AccountingEntryLineInput[],
  tolerance = 0.0001
): { isBalanced: boolean; totalDebit: number; totalCredit: number; difference: number } {
  if (!lines || lines.length < 2) {
    return { isBalanced: false, totalDebit: 0, totalCredit: 0, difference: 0 };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    const debit = typeof line.debit === 'string' ? parseFloat(line.debit) || 0 : line.debit;
    const credit = typeof line.credit === 'string' ? parseFloat(line.credit) || 0 : line.credit;

    if (debit < 0 || credit < 0) {
      return { isBalanced: false, totalDebit: 0, totalCredit: 0, difference: 0 };
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference <= tolerance;

  return {
    isBalanced,
    totalDebit: Number(totalDebit.toFixed(4)),
    totalCredit: Number(totalCredit.toFixed(4)),
    difference: Number(difference.toFixed(4)),
  };
}

/**
 * Weighted Average Cost (WAC / PUMP - Prix Unitaire Moyen Pondéré) Recalculation
 * Formula: ((CurrentQty * CurrentWAC) + (IncomingQty * IncomingUnitCost)) / (CurrentQty + IncomingQty)
 */
export function calculateWAC(
  currentQty: number,
  currentWAC: number,
  incomingQty: number,
  incomingCost: number
): number {
  if (incomingQty <= 0) return currentWAC;

  const totalQty = currentQty + incomingQty;
  if (totalQty <= 0) return currentWAC;

  const existingValuation = Math.max(0, currentQty) * Math.max(0, currentWAC);
  const incomingValuation = incomingQty * incomingCost;

  const newWAC = (existingValuation + incomingValuation) / totalQty;
  return Number(newWAC.toFixed(4));
}
