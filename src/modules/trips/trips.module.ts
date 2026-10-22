import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from '../../entities/trips.entity.js';
import { TripController } from './trips.controller.js';
import { TripService } from './trips.service.js';
import { TripRepository } from './trips.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([TripEntity])],
  controllers: [TripController],
  providers: [TripService, TripRepository],
  exports: [TripService],
})
export class TripModule {}
