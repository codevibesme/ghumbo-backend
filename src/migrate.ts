import dataSource from './configs/data-source.js';

async function main() {
  await dataSource.initialize();

  try {
    const applied = await dataSource.runMigrations({ transaction: 'each' });

    if (applied.length === 0) {
      console.log('No pending migrations.');
    } else {
      for (const migration of applied) {
        console.log(`Applied ${migration.name}`);
      }
    }
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
