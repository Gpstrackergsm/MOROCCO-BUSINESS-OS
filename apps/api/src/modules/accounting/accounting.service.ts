import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { isDoubleEntryBalanced, JournalEntryStatus } from '@morocco-os/shared';
import { Decimal } from '@prisma/client/runtime/library';

export interface JournalLineInputDto {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  partnerType?: string;
  partnerId?: string;
}

export interface PostJournalEntryDto {
  journalId: string;
  entryNumber: string;
  accountingDate: Date;
  description: string;
  lines: JournalLineInputDto[];
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  postedBy: string;
}

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Non-Negotiable Rule #5: Balanced Double-Entry Accounting
   * No entry may be posted unless Sum(Debit) == Sum(Credit).
   */
  async postJournalEntry(tenantId: string, dto: PostJournalEntryDto) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A journal entry must contain at least two transaction lines.');
    }

    // Verify double-entry balance
    const balanceCheck = isDoubleEntryBalanced(dto.lines);
    if (!balanceCheck.isBalanced) {
      throw new BadRequestException(
        `Non-negotiable rule violation: Journal entry is unbalanced. Total Debit: ${balanceCheck.totalDebit} MAD, Total Credit: ${balanceCheck.totalCredit} MAD. Difference: ${balanceCheck.difference} MAD.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create header
      const entry = await tx.journalEntry.create({
        data: {
          tenantId,
          journalId: dto.journalId,
          entryNumber: dto.entryNumber,
          accountingDate: dto.accountingDate,
          description: dto.description,
          sourceDocumentType: dto.sourceDocumentType,
          sourceDocumentId: dto.sourceDocumentId,
          status: JournalEntryStatus.POSTED,
          postedAt: new Date(),
          postedBy: dto.postedBy,
        },
      });

      // 2. Insert lines
      for (const line of dto.lines) {
        await tx.journalEntryLine.create({
          data: {
            tenantId,
            journalEntryId: entry.id,
            accountId: line.accountId,
            debit: new Decimal(line.debit),
            credit: new Decimal(line.credit),
            description: line.description || dto.description,
            partnerType: line.partnerType,
            partnerId: line.partnerId,
          },
        });
      }

      return entry;
    });
  }

  /**
   * Non-Negotiable Rule #3: No deleting posted entries.
   * Corrections must be made via a reverse journal entry (Extourne).
   */
  async reverseJournalEntry(tenantId: string, entryId: string, reversedBy: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.journalEntry.findFirst({
        where: { id: entryId, tenantId },
        include: { lines: true },
      });

      if (!original) {
        throw new NotFoundException(`Journal entry with ID ${entryId} not found.`);
      }

      if (original.status === JournalEntryStatus.REVERSED) {
        throw new BadRequestException('This journal entry has already been reversed.');
      }

      // Mark original entry as REVERSED
      await tx.journalEntry.update({
        where: { id: original.id },
        data: { status: JournalEntryStatus.REVERSED },
      });

      // Create inverse counter-entry (Swapping debits and credits)
      const reversalNumber = `REV-${original.entryNumber}`;
      const reversalEntry = await tx.journalEntry.create({
        data: {
          tenantId,
          journalId: original.journalId,
          entryNumber: reversalNumber,
          accountingDate: new Date(),
          description: `Extourne / Reversal of ${original.entryNumber}. Reason: ${reason}`,
          sourceDocumentType: 'REVERSAL',
          sourceDocumentId: original.id,
          status: JournalEntryStatus.POSTED,
          postedAt: new Date(),
          postedBy: reversedBy,
          reversedEntryId: original.id,
        },
      });

      // Invert debits and credits
      for (const line of original.lines) {
        await tx.journalEntryLine.create({
          data: {
            tenantId,
            journalEntryId: reversalEntry.id,
            accountId: line.accountId,
            // Swap debit with credit to reverse impact on general ledger
            debit: line.credit,
            credit: line.debit,
            description: `Extourne: ${line.description || original.description}`,
            partnerType: line.partnerType,
            partnerId: line.partnerId,
          },
        });
      }

      return reversalEntry;
    });
  }
}
