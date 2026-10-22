import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity } from '../../entities/countries.entity.js';
import { CountryController } from './countries.controller.js';
import { CountryService } from './countries.service.js';
import { CountryRepository } from './countries.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([CountryEntity])],
  controllers: [CountryController],
  providers: [CountryService, CountryRepository],
  exports: [CountryService],
})
export class CountryModule {}
