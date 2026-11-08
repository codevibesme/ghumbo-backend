import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../../lib/cache/cache.service.js';

const CHECK_TIMEOUT_MS = 2_000;

type CheckStatus = 'ok' | 'error';

export interface HealthResult {
  status: CheckStatus;
  checks: { database: CheckStatus; redis: CheckStatus };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  async check(): Promise<HealthResult> {
    const [database, redis] = await Promise.all([
      this.run('database', () => this.dataSource.query('SELECT 1')),
      this.run('redis', () => this.cache.ping()),
    ]);

    return {
      status: database === 'ok' && redis === 'ok' ? 'ok' : 'error',
      checks: { database, redis },
    };
  }

  private async run(
    name: string,
    fn: () => Promise<unknown>,
  ): Promise<CheckStatus> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`timed out after ${CHECK_TIMEOUT_MS}ms`)),
        CHECK_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([fn(), timeout]);
      return 'ok';
    } catch (err) {
      this.logger.error(
        `${name} check failed: ${err instanceof Error ? err.message : err}`,
      );
      return 'error';
    } finally {
      clearTimeout(timer);
    }
  }
}
