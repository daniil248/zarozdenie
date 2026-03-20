import { Module } from '@nestjs/common';
import { LangService } from './lang.service';

@Module({
  providers: [LangService],
  exports: [LangService],
})
export class LangModule {}
