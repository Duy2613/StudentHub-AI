import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', testMatch:'ai-omni-v4-isolated.spec.ts', workers:1, timeout:240000,
  reporter:'list', expect:{ timeout:10000 },
  use:{ baseURL:'http://127.0.0.1:3114', browserName:'chromium', viewport:{width:1440,height:1000}, locale:'vi-VN', timezoneId:'Asia/Ho_Chi_Minh', serviceWorkers:'block', trace:'retain-on-failure' },
});
