import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountingService, PostJournalEntryDto } from '../src/modules/accounting/accounting.service';
import { BadRequestException } from '@nestjs/common';

describe('AccountingService - Non-Negotiable Double-Entry Invariants', () => {
  let service: AccountingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb) => {
        const tx = {
          journalEntry: {
            create: vi.fn().mockResolvedValue({ id: 'entry-uuid-1', status: 'POSTED' }),
            update: vi.fn(),
            findFirst: vi.fn(),
          },
          journalEntryLine: {
            create: vi.fn().mockResolvedValue({ id: 'line-uuid-1' }),
          },
        };
        return cb(tx);
      }),
    };
    service = new AccountingService(mockPrisma);
  });

  it('rejects unbalanced journal entries (Debits != Credits)', async () => {
    const unbalancedDto: PostJournalEntryDto = {
      journalId: 'journal-uuid',
      entryNumber: 'VE-2026-0001',
      accountingDate: new Date(),
      description: 'Facture Client Vente',
      postedBy: 'user-uuid',
      lines: [
        { accountId: 'acc-3421', debit: 12000, credit: 0 },
        { accountId: 'acc-7111', debit: 0, credit: 10000 },
        // Missing TVA line of 2000 MAD!
      ],
    };

    await expect(service.postJournalEntry('tenant-1', unbalancedDto)).rejects.toThrow(
      BadRequestException
    );
  });

  it('approves and posts strictly balanced journal entries (PCGE compliant)', async () => {
    const balancedDto: PostJournalEntryDto = {
      journalId: 'journal-uuid',
      entryNumber: 'VE-2026-0002',
      accountingDate: new Date(),
      description: 'Facture Client Vente avec TVA',
      postedBy: 'user-uuid',
      lines: [
        { accountId: 'acc-3421', debit: 12000, credit: 0 },  // Clients (TTC)
        { accountId: 'acc-7111', debit: 0, credit: 10000 },  // Ventes (HT)
        { accountId: 'acc-4455', debit: 0, credit: 2000 },   // État TVA facturée
      ],
    };

    const result = await service.postJournalEntry('tenant-1', balancedDto);
    expect(result.id).toBe('entry-uuid-1');
    expect(result.status).toBe('POSTED');
  });
});
