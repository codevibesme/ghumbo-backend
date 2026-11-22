import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelerEntity } from '../../entities/travelers.entity.js';
import { TravelerService } from './travelers.service.js';
import { TravelerRepository } from './travelers.repository.js';
import { TravelerController } from './travelers.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([TravelerEntity])],
  controllers: [TravelerController],
  providers: [TravelerService, TravelerRepository],
  exports: [TravelerService],
})
export class TravelerModule {}
