/* global process, console */
const fs = await import('node:fs/promises');
const path = await import('node:path');

const targetDir = process.argv[2] ?? './dist';
const runtimeConfigPath = path.resolve(process.cwd(), targetDir, 'runtime-config.js');
const apiUrl = process.env.APP_API_URL ?? process.env.VITE_API_URL ?? process.env.API_URL ?? '';

let runtimeConfig = await fs.readFile(runtimeConfigPath, 'utf8');
runtimeConfig = runtimeConfig.replaceAll('__APP_API_URL__', apiUrl);
await fs.writeFile(runtimeConfigPath, runtimeConfig, 'utf8');

console.log(`Injected runtime API URL into ${runtimeConfigPath}`);
