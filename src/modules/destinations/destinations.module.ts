import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationEntity } from '../../entities/destinations.entity.js';
import { DestinationController } from './destination.controller.js';
import { DestinationService } from './destinations.service.js';
import { DestinationRepository } from './destinations.repository.js';
import { CountryModule } from '../countries/countries.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([DestinationEntity]), CountryModule],
  controllers: [DestinationController],
  providers: [DestinationService, DestinationRepository],
  exports: [DestinationService],
})
export class DestinationModule {}
