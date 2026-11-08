import { Module } from '@nestjs/common';
import { CacheModule } from '../../lib/cache/cache.module.js';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';

@Module({
  imports: [CacheModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
