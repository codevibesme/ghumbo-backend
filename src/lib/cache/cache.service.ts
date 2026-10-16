import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '0'),
      password: process.env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl: number): Promise<'OK'> {
    return await this.client.set(key, value, 'EX', ttl);
  }

  async setIfNotExists(
    key: string,
    value: string,
    ttl: number,
  ): Promise<'OK' | null> {
    return await this.client.set(key, value, 'EX', ttl, 'NX');
  }

  async expiresAt(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async incr(key: string, ttl: number) {
    const n = await this.client.incr(key);
    if (n === 1) {
      await this.client.expire(key, ttl);
    }

    return n;
  }
}
