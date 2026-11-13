import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AccountingService } from './modules/accounting/accounting.service';
import { OnboardingService } from './modules/auth/onboarding.service';
import { InventoryService } from './modules/inventory/inventory.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    PrismaService,
    AccountingService,
    OnboardingService,
    InventoryService,
  ],
})
export class AppModule {}
