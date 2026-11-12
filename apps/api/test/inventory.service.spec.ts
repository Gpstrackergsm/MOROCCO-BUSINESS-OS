import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService, RecordMovementDto } from '../src/modules/inventory/inventory.service';
import { StockMovementType, StockMovementStatus } from '@morocco-os/shared';
import { BadRequestException } from '@nestjs/common';

describe('InventoryService - Append-Only Stock Ledger & Non-Negotiable Invariants', () => {
  let service: InventoryService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn(async (cb) => {
        const tx = {
          stockMovement: {
            create: vi.fn().mockResolvedValue({ id: 'mov-1', status: StockMovementStatus.COMPLETED }),
            update: vi.fn(),
            findFirst: vi.fn(),
          },
          stockMovementLine: {
            create: vi.fn().mockResolvedValue({ id: 'line-1' }),
          },
          stockBalance: {
            findUnique: vi.fn().mockResolvedValue({
              quantityOnHand: '10.0000',
              currentWac: '50.0000',
            }),
            upsert: vi.fn().mockResolvedValue({ id: 'bal-1' }),
            update: vi.fn(),
          },
        };
        return cb(tx);
      }),
    };
    service = new InventoryService(mockPrisma);
  });

  it('rejects outgoing movement when requested quantity exceeds available stock', async () => {
    const excessiveIssueDto: RecordMovementDto = {
      movementNumber: 'OUT-2026-0001',
      movementType: StockMovementType.SALES_ISSUE,
      warehouseId: 'wh-1',
      createdBy: 'user-1',
      lines: [
        { productId: 'prod-1', quantity: 25, unitCost: 50 }, // Only 10 available!
      ],
    };

    await expect(service.recordMovement('tenant-1', excessiveIssueDto)).rejects.toThrow(
      BadRequestException
    );
  });

  it('records incoming movement and updates running stock balance', async () => {
    const receiptDto: RecordMovementDto = {
      movementNumber: 'IN-2026-0001',
      movementType: StockMovementType.PURCHASE_RECEIPT,
      warehouseId: 'wh-1',
      createdBy: 'user-1',
      lines: [
        { productId: 'prod-1', quantity: 15, unitCost: 60 },
      ],
    };

    const result = await service.recordMovement('tenant-1', receiptDto);
    expect(result.id).toBe('mov-1');
    expect(result.status).toBe(StockMovementStatus.COMPLETED);
  });
});
