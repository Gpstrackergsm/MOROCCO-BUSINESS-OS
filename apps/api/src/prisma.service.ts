import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ [PrismaService] DATABASE_URL is not set. Database features will be unavailable until DATABASE_URL is configured in Railway Variables.');
      return;
    }
    try {
      await this.$connect();
      console.log('✅ [PrismaService] Successfully connected to database.');
    } catch (err: any) {
      console.error('❌ [PrismaService] Database connection error:', err?.message || err);
      console.warn('⚠️ Server will remain running. Please verify your Railway MySQL connection string.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {}
  }
}
