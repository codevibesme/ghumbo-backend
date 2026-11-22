import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel.js';

const DEFAULT_ISOLATION_LEVEL: IsolationLevel = 'READ COMMITTED';

export class TransactionRunner {
  constructor(private readonly queryRunner: QueryRunner) {}

  async start(): Promise<void> {
    if (this.queryRunner.isReleased) {
      throw new Error('QueryRunner has already been released');
    }

    if (this.queryRunner.isTransactionActive) {
      throw new Error('Transaction already started');
    }

    return await this.queryRunner.startTransaction(DEFAULT_ISOLATION_LEVEL);
  }

  async commit(): Promise<void> {
    if (!this.queryRunner.isTransactionActive) {
      throw new Error('No active transaction to commit');
    }

    await this.queryRunner.commitTransaction();
  }

  async rollback(): Promise<void> {
    if (this.queryRunner.isReleased) return;
    if (!this.queryRunner.isTransactionActive) return;

    await this.queryRunner.rollbackTransaction();
  }

  async release(): Promise<void> {
    if (this.queryRunner.isReleased) return;

    await this.queryRunner.release();
  }

  get transactionManager(): EntityManager {
    return this.queryRunner.manager;
  }

  get isTransactionActive(): boolean {
    return this.queryRunner.isTransactionActive;
  }
}

@Injectable()
export class TxnHelperService {
  constructor(private readonly dataSource: DataSource) {}

  private async createTransaction(): Promise<TransactionRunner> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      return new TransactionRunner(queryRunner);
    } catch (error) {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }

      throw error;
    }
  }

  async run<T>(fn: (txn: EntityManager) => Promise<T>): Promise<T> {
    const runner = await this.createTransaction();
    try {
      await runner.start();
      const result = await fn(runner.transactionManager);
      await runner.commit();
      return result;
    } catch (e) {
      await runner.rollback();
      throw e;
    } finally {
      await runner.release();
    }
  }
}
