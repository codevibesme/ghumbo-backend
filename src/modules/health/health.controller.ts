import { Controller, Get, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service.js';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly service: HealthService) {}

  /**
   * Liveness: the process is up. Touches nothing, so frequent polling (the container
   * healthcheck) doesn't keep Neon's compute awake.
   */
  @Get('/')
  @ApiOkResponse({ description: 'The process is up' })
  live() {
    return { status: 'ok' };
  }

  /** Readiness: Postgres and Redis are reachable. Called once per deploy. */
  @Get('/ready')
  @ApiOkResponse({ description: 'Postgres and Redis are reachable' })
  @ApiServiceUnavailableResponse({ description: 'A dependency is down' })
  async ready(@Res() res: Response) {
    const result = await this.service.check();

    return res.status(result.status === 'ok' ? 200 : 503).send(result);
  }
}
