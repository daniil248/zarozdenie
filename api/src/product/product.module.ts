import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { LangService } from 'lib/lang';
import { FileService } from 'lib/file';
import { ProductRepository } from './product.repository';
import { PrismaService } from 'lib/prisma';
import { BotService } from 'lib/bot';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    NestjsFormDataModule.configAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        storage: MemoryStoredFile,
        limits: {
          files: 10,
        },
      }),
      inject: [ConfigService],
    }),
    HttpModule,
  ],
  controllers: [ProductController],
  providers: [
    ProductService,
    LangService,
    FileService,
    ProductRepository,
    PrismaService,
    BotService,
  ],
})
export class ProductModule {}
