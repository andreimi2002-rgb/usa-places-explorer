// Loads the TypeScript data through Vite (no extra dependencies) and runs the checks.
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { validate } = await server.ssrLoadModule('/scripts/validate-data.ts');
  const errors = validate();
  if (errors.length) {
    console.error(`Data validation failed with ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exitCode = 1;
  } else {
    console.log('Data validation passed.');
  }
} finally {
  await server.close();
}
