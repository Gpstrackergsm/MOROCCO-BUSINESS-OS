import { describe, it, expect } from 'vitest';
import {
  isValidMoroccanICE,
  isValidMoroccanIF,
  isValidMoroccanPhone,
  isDoubleEntryBalanced,
  calculateWAC,
} from '../src/validators.js';

describe('Moroccan Business OS - Shared Validators', () => {
  describe('Moroccan Legal ID Validations', () => {
    it('validates 15-digit Moroccan ICE correctly', () => {
      expect(isValidMoroccanICE('001523489000045')).toBe(true);
      expect(isValidMoroccanICE('123456789012345')).toBe(true);
      // Fails on less than 15 digits, letters, or empty
      expect(isValidMoroccanICE('00152348900004')).toBe(false);
      expect(isValidMoroccanICE('00152348900004A')).toBe(false);
      expect(isValidMoroccanICE('')).toBe(false);
    });

    it('validates Moroccan Identifiant Fiscal (IF)', () => {
      expect(isValidMoroccanIF('12345678')).toBe(true);
      expect(isValidMoroccanIF('3344556')).toBe(true);
      expect(isValidMoroccanIF('abc1234')).toBe(false);
      expect(isValidMoroccanIF('')).toBe(false);
    });

    it('validates Moroccan phone numbers', () => {
      expect(isValidMoroccanPhone('0661122334')).toBe(true);
      expect(isValidMoroccanPhone('+212661122334')).toBe(true);
      expect(isValidMoroccanPhone('0522112233')).toBe(true);
      expect(isValidMoroccanPhone('+212522112233')).toBe(true);
      expect(isValidMoroccanPhone('0123456789')).toBe(false); // Invalid Moroccan prefix
    });
  });

  describe('Financial Invariant: Double-Entry Balancing Check', () => {
    it('approves perfectly balanced journal entry lines', () => {
      const result = isDoubleEntryBalanced([
        { debit: 12000, credit: 0 },
        { debit: 0, credit: 10000 },
        { debit: 0, credit: 2000 },
      ]);
      expect(result.isBalanced).toBe(true);
      expect(result.totalDebit).toBe(12000);
      expect(result.totalCredit).toBe(12000);
      expect(result.difference).toBe(0);
    });

    it('rejects unbalanced journal entry lines', () => {
      const result = isDoubleEntryBalanced([
        { debit: 12000, credit: 0 },
        { debit: 0, credit: 11500 },
      ]);
      expect(result.isBalanced).toBe(false);
      expect(result.difference).toBe(500);
    });

    it('rejects entries with negative amounts', () => {
      const result = isDoubleEntryBalanced([
        { debit: -500, credit: 0 },
        { debit: 0, credit: -500 },
      ]);
      expect(result.isBalanced).toBe(false);
    });
  });

  describe('Inventory Valuation: WAC (PUMP) Recalculation', () => {
    it('correctly calculates new Weighted Average Cost upon receipt', () => {
      // 100 units at 50 MAD existing = 5,000 MAD
      // 50 units received at 80 MAD = 4,000 MAD
      // Total 150 units with 9,000 MAD valuation => 9,000 / 150 = 60.00 MAD
      const newWac = calculateWAC(100, 50, 50, 80);
      expect(newWac).toBe(60);
    });

    it('handles initial receipt when current stock is zero', () => {
      const newWac = calculateWAC(0, 0, 100, 75.5);
      expect(newWac).toBe(75.5);
    });
  });
});
