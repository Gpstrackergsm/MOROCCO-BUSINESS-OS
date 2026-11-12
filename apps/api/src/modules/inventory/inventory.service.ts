import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { calculateWAC, StockMovementType, StockMovementStatus } from '@morocco-os/shared';
import { Decimal } from '@prisma/client/runtime/library';

export interface RecordMovementLineDto {
  productId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
}

export interface RecordMovementDto {
  movementNumber: string;
  movementType: StockMovementType;
  warehouseId: string;
  lines: RecordMovementLineDto[];
  referenceDocumentType?: string;
  referenceDocumentId?: string;
  notes?: string;
  createdBy: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Non-Negotiable Rule #4: No direct stock balance modifications.
   * All inventory changes must be initiated via an Append-Only movement ledger.
   */
  async recordMovement(tenantId: string, dto: RecordMovementDto) {
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException('Stock movement must contain at least one line item.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create the immutable master movement record
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
          movementNumber: dto.movementNumber,
          movementType: dto.movementType,
          sourceWarehouseId: dto.warehouseId,
          referenceDocumentType: dto.referenceDocumentType,
          referenceDocumentId: dto.referenceDocumentId,
          status: StockMovementStatus.COMPLETED,
          notes: dto.notes,
          createdBy: dto.createdBy,
        },
      });

      // 2. Process each line item and adjust running balance + WAC
      for (const line of dto.lines) {
        const totalCost = Number((line.quantity * line.unitCost).toFixed(4));

        await tx.stockMovementLine.create({
          data: {
            tenantId,
            movementId: movement.id,
            productId: line.productId,
            quantity: new Decimal(line.quantity),
            unitCost: new Decimal(line.unitCost),
            totalCost: new Decimal(totalCost),
            batchNumber: line.batchNumber,
            serialNumber: line.serialNumber,
            expirationDate: line.expirationDate,
          },
        });

        // 3. Atomically update or create the materialized stock balance
        const balance = await tx.stockBalance.findUnique({
          where: {
            tenantId_warehouseId_productId: {
              tenantId,
              warehouseId: dto.warehouseId,
              productId: line.productId,
            },
          },
        });

        const currentQty = balance ? Number(balance.quantityOnHand) : 0;
        const currentWac = balance ? Number(balance.currentWac) : 0;

        let newQty = currentQty;
        let newWac = currentWac;

        const isIncoming = [
          StockMovementType.PURCHASE_RECEIPT,
          StockMovementType.SALES_RETURN,
          StockMovementType.OPENING_BALANCE,
        ].includes(dto.movementType);

        if (isIncoming) {
          newQty = currentQty + line.quantity;
          newWac = calculateWAC(currentQty, currentWac, line.quantity, line.unitCost);
        } else {
          // Outgoing movements (Sales, scrap, etc.)
          if (currentQty < line.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${line.productId}. Current on-hand: ${currentQty}, Requested: ${line.quantity}. Negative stock prohibited.`
            );
          }
          newQty = currentQty - line.quantity;
          // Outgoing issues consume at current WAC; WAC unit rate remains unchanged
        }

        await tx.stockBalance.upsert({
          where: {
            tenantId_warehouseId_productId: {
              tenantId,
              warehouseId: dto.warehouseId,
              productId: line.productId,
            },
          },
          create: {
            tenantId,
            warehouseId: dto.warehouseId,
            productId: line.productId,
            quantityOnHand: new Decimal(newQty),
            quantityReserved: new Decimal(0),
            currentWac: new Decimal(newWac),
          },
          update: {
            quantityOnHand: new Decimal(newQty),
            currentWac: new Decimal(newWac),
          },
        });
      }

      return movement;
    });
  }

  /**
   * Non-Negotiable Rule #3: Never delete approved records.
   * Corrections must be executed via an inverse counter-movement.
   */
  async reverseMovement(tenantId: string, movementId: string, reversedBy: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.stockMovement.findFirst({
        where: { id: movementId, tenantId },
        include: { lines: true },
      });

      if (!original) {
        throw new NotFoundException(`Stock movement with ID ${movementId} not found.`);
      }

      if (original.status === StockMovementStatus.REVERSED) {
        throw new BadRequestException('This movement has already been reversed.');
      }

      // Mark original as REVERSED
      await tx.stockMovement.update({
        where: { id: original.id },
        data: { status: StockMovementStatus.REVERSED },
      });

      // Create inverse counter-movement
      const counterMovementNumber = `REV-${original.movementNumber}`;
      const counterMovement = await tx.stockMovement.create({
        data: {
          tenantId,
          movementNumber: counterMovementNumber,
          movementType: StockMovementType.INVENTORY_ADJUSTMENT,
          sourceWarehouseId: original.sourceWarehouseId,
          referenceDocumentType: 'REVERSAL',
          referenceDocumentId: original.id,
          status: StockMovementStatus.COMPLETED,
          reversedMovementId: original.id,
          notes: `Reversal of ${original.movementNumber}. Reason: ${reason}`,
          createdBy: reversedBy,
        },
      });

      // Restore balances
      for (const line of original.lines) {
        const qty = Number(line.quantity);
        const unitCost = Number(line.unitCost);

        await tx.stockMovementLine.create({
          data: {
            tenantId,
            movementId: counterMovement.id,
            productId: line.productId,
            quantity: new Decimal(-qty),
            unitCost: new Decimal(unitCost),
            totalCost: new Decimal(-(qty * unitCost)),
          },
        });

        // Inverse stock balance update
        const balance = await tx.stockBalance.findUnique({
          where: {
            tenantId_warehouseId_productId: {
              tenantId,
              warehouseId: original.sourceWarehouseId!,
              productId: line.productId,
            },
          },
        });

        if (balance) {
          const restoredQty = Number(balance.quantityOnHand) - qty;
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { quantityOnHand: new Decimal(restoredQty) },
          });
        }
      }

      return counterMovement;
    });
  }
}
