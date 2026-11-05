import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import base from '../../../../playwright.config';

// Shared host also runs the other worktrees. Give cold Vite/model startup room;
// keep the same routes, software renderer, viewport, and gameplay assertions.
const root=fileURLToPath(new URL('../../../../',import.meta.url));
export default defineConfig(base,{
  testDir:fileURLToPath(new URL('../../../../tests',import.meta.url)),
  outputDir:fileURLToPath(new URL('../../../../test-results/astra',import.meta.url)),
  timeout:180000,
  expect:{timeout:30000},
  webServer:{...base.webServer,cwd:root,timeout:180000},
});
