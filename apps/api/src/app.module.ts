import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AccountingService } from './modules/accounting/accounting.service';
import { OnboardingService } from './modules/auth/onboarding.service';
import { InventoryService } from './modules/inventory/inventory.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    PrismaService,
    AccountingService,
    OnboardingService,
    InventoryService,
  ],
})
export class AppModule {}
