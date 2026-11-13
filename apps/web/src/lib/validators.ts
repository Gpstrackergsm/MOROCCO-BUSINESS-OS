/**
 * Business & Compliance Validators for Morocco Business OS (Web)
 */

export function isValidMoroccanICE(ice: string): boolean {
  if (!ice) return false;
  const clean = ice.trim();
  return /^\d{15}$/.test(clean);
}

export function isValidMoroccanIF(identifiantFiscal: string): boolean {
  if (!identifiantFiscal) return false;
  const clean = identifiantFiscal.trim();
  return /^\d{7,10}$/.test(clean);
}

export function isValidMoroccanTP(tp: string): boolean {
  if (!tp) return false;
  const clean = tp.trim();
  return /^\d{6,10}$/.test(clean);
}

export function isValidMoroccanPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\.]/g, '');
  return /^(?:\+212|00212|0)[5-7]\d{8}$/.test(clean);
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
