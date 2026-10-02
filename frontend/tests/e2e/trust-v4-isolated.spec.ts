import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { trustV5ResponseSchema } from '../../src/lib/api/schemas/trust';

const DIR = process.env.TRUST_V4_ARTIFACTS!;
const CASE = 'e7338472-6392-4ca0-9d63-63028558713a';
const USER = 'f7338472-6392-4ca0-9d63-63028558713a';
const CLAIM = 'c7338472-6392-4ca0-9d63-63028558713a';
const DRAFT = 'Điều kiện nhận hỗ trợ học tập có áp dụng cho tất cả sinh viên không?';
const BASE_URL = process.env.TRUST_V4_BASE_URL || 'http://127.0.0.1:3112';
const manifest: object[] = [];

function response(requestId: string, outcome = 'SUPPORTED', ocrText?: string) {
  const stages = Object.fromEntries(['l1', 'l2', 'l3', 'l4'].map((stageId) => [stageId, {
    schemaVersion: 'trust.v5', requestId, stageId, architecturalLayer: stageId, stageName: stageId,
    role: 'Contract test', checking: 'Synthetic policy input', operationStatus: 'COMPLETED', finding: null,
    severity: 'NONE', startedAt: null, completedAt: null, latencyMs: null, providerStatus: 'SUCCESS',
    providerId: null, modelId: null, modelVersion: null, confidence: null, confidenceKind: 'UNSPECIFIED',
    summary: 'Contract test response', reasons: [], signals: [], evidenceRefs: [], meaning: 'Test only', notProve: 'No live assurance',
    limitations: ['Synthetic browser response'], nextStage: null, safeToContinue: true, userAction: 'Read evidence',
    audit: { attempt: 1, attemptCount: 1, errorCode: null, transition: 'COMPLETED' },
  }]));
  return trustV5ResponseSchema.parse({ success: true, contractVersion: 'trust.v5', version: 'v5', demo: false, requestId,
    caseId: CASE, caseRevision: 3, runId: 'isolated-run', persistence: { persisted: true, idempotent: false },
    data: { schemaVersion: 'trust.v5', pipelineVersion: 'contract-test', pipelineModel: 'FOUR_LAYER', publicLayerCount: 4,
      requestId, pipelineStatus: outcome === 'PARTIAL' ? 'PARTIAL' : 'COMPLETED', currentStage: null, stages,
      finalDecision: null, finalPredict: outcome === 'UNPUBLISHED' ? null : { truthVerdict: outcome === 'PARTIAL' ? 'INSUFFICIENT' : outcome,
        keyReasons: ['Quy định được đối chiếu có nêu điều kiện về đối tượng và thời hạn đăng ký.'],
        remainingUncertainty: ['Chưa có thông báo áp dụng cho học kỳ kế tiếp. Cần xác nhận với đơn vị phụ trách.'],
        recommendedAction: 'Đọc văn bản gốc và xác nhận điều kiện của bạn trước khi đăng ký.',
      }, assurance: null, startedAt: null, completedAt: '2026-09-28T08:00:00.000Z',
      audit: { requestId, stageSequence: ['l1','l2','l3','l4'], stageAttempts: [], hardNegativePropagation: [], policyVersion: 'test', assuranceVersion: null },
      layerResults: { layer1: ocrText ? { metadata: { text: ocrText } } : null, layer2: { domainCode: 'PUBLIC_POLICY', claims: [{ claimId: CLAIM, text: DRAFT }, { claimId: 'claim-second', text: 'Thời hạn đăng ký được giữ nguyên ở học kỳ kế tiếp.' }] },
        layer3: { sources: [{ sourceId: 'source-a', url: 'https://example.org/policy', title: 'Quy định về hỗ trợ học tập · tài liệu thử nghiệm', publisher: 'Đơn vị học vụ minh họa', sourceType: 'PUBLIC_DOCUMENT', retrievalOrigin: 'RETRIEVED', validationStatus: 'AVAILABLE', publishedAt: '2026-09-01T00:00:00Z', retrievedAt: '2026-09-28T08:00:00Z' },
          { sourceId: 'source-b', url: 'https://example.org/notice', title: 'Thông báo bổ sung · tài liệu thử nghiệm', retrievalOrigin: 'USER_SUPPLIED', validationStatus: 'AVAILABLE' }],
        evidence: outcome === 'INSUFFICIENT' ? [] : [{ evidenceId: 'ev-a', claimId: CLAIM, sourceId: 'source-a', relation: 'SUPPORTS', excerpt: 'Sinh viên thuộc nhóm đủ điều kiện cần hoàn tất hồ sơ trong thời hạn công bố.', revision: 3 }, { evidenceId: 'ev-b', claimId: CLAIM, sourceId: 'source-b', relation: 'CONTRADICTS', excerpt: 'Thông báo khác nêu phạm vi đối tượng hẹp hơn; cần đối chiếu hiệu lực văn bản.', revision: 3 }] },
        layer4: { aiVerificationStatus: 'VERIFIED', aiVerification: {
          provider: 'google', status: 'VERIFIED', supportingSourceIds: ['source-a'], contradictingSourceIds: ['source-b'],
          citationsUsed: [{ id: 'source-a', url: 'https://example.org/policy', retrievalOrigin: 'TAVILY_INITIAL', validationStatus: 'LAYER3_VALIDATED', httpStatus: 200 }],
          citationValidation: { checkedCount: 1, acceptedCount: 1, rejectedCount: 0, allLinksValidated: true },
        }, userExplanation: { why: 'Giải thích AI fixture gắn với Trust revision 3.', recommendedActionNote: 'Đọc văn bản được trích dẫn.' } },
      },
    } });
}

async function harness(page: Page, options: { outcome?: string; theme?: string; stream?: boolean; status?: number; anonymous?: boolean; ocrText?: string } = {}) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(({ theme }) => { if (!localStorage.getItem('studenthub-theme-mode')) localStorage.setItem('studenthub-theme-mode', theme); Object.assign(window, { __trustV4Harness: true }); }, { theme: options.theme || 'light' });
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== BASE_URL) return route.abort();
    if (!url.pathname.startsWith('/api/')) return route.continue();
    let body: unknown = { success: true, data: [] };
    if (url.pathname === '/api/auth/session') body = options.anonymous ? { authenticated: false, user: null } : { authenticated: true, user: { id: USER, email: 'student@example.invalid', roles: ['STUDENT'] } };
    if (url.pathname === '/api/users/me') body = { success: true, profile: { fullName: 'Sinh viên kiểm tra giao diện', avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==' } };
    if (url.pathname === '/api/intelligence/community/posts') body = { success: true, preview: { state: 'PREVIEW_READY', previewDigest: 'fixture-digest', redactedStatement: 'Bản công khai sau khi quét riêng tư.', scan: { findings: [] } } };
    if (url.pathname === '/api/v1/trust/cases') body = { success: true, cases: [{ id: CASE, case_revision: 3, input_type: 'Văn bản', created_at: '2026-09-28T08:00:00Z' }] };
    if (url.pathname === `/api/v1/trust/cases/${CASE}`) body = { success: true, case: { id: CASE, claims: [{ id: CLAIM, statement: DRAFT }], evidence: [] } };
    if (url.pathname === '/api/expert/assessments') body = { success: true, data: [{ id: 'assessment-a', case_revision: 2, domain_code: 'PUBLIC_POLICY', public_title: 'Chuyên viên học vụ · dữ liệu minh họa', reasoning: 'Cần xác định đúng văn bản và thời điểm áp dụng.', uncertainty: 'Chưa có thông báo mới.', created_at: '2026-09-27T00:00:00Z' }] };
    if (url.pathname === '/api/expert/review-requests' && route.request().method() === 'POST') body = { success: true, data: { id: 'review-request-fixture', status: 'REQUESTED', caseId: CASE, caseRevision: 3, claimId: CLAIM, domainCode: 'PUBLIC_POLICY' }, matching: { status: 'REQUESTED' } };
    if (url.pathname === '/api/v1/trust') {
      if (options.status) return route.fulfill({ status: options.status, json: { success: false, error: { code: 'SERVICE_UNAVAILABLE' } } });
      body = response(route.request().headers()['x-request-id'], options.outcome, options.ocrText);
    }
    if (url.pathname.includes('realtime')) return route.fulfill({ status: 503, json: { success: false } });
    return route.fulfill({ json: body });
  });
  if (options.stream) {
    const template = response('placeholder');
    await page.addInitScript(({ template }) => {
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        if (String(input) !== '/api/v1/trust') return original(input, init);
        const requestId = new Headers(init?.headers).get('X-Request-ID')!;
        const complete = structuredClone(template);
        complete.requestId = requestId; complete.data.requestId = requestId; complete.data.audit.requestId = requestId;
        for (const stage of Object.values(complete.data.stages)) stage.requestId = requestId;
        const running = structuredClone(complete); running.data.pipelineStatus = 'RUNNING'; running.data.currentStage = 'l3'; running.data.finalPredict = null;
        running.data.stages.l3.operationStatus = 'RUNNING'; running.data.stages.l4.operationStatus = 'NOT_STARTED';
        return new Response(new ReadableStream({ start(controller) {
          const send = (value: typeof complete, type: string) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ ...value, type })}\n\n`));
          send(running, 'progress');
          setTimeout(() => { send(complete, 'complete'); controller.close(); }, 1800);
        } }), { headers: { 'Content-Type': 'text/event-stream' } });
      };
    }, { template });
  }
  await page.goto('/trust');
  const workspace = page.locator('#main-content').getByTestId('trust-v4');
  await expect(workspace.first()).toBeVisible();
  await expect(page.getByRole('button', { name: options.anonymous ? 'Hồ sơ đã lưu' : 'Hồ sơ đã lưu', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', options.theme === 'midnight' ? 'midnight' : 'light');
  await expect(page.getByRole('heading', { name: 'Bạn muốn kiểm chứng điều gì?' })).toBeVisible();
  await expect(page.getByTestId('trust-final-predict')).toHaveCount(0);
  await expect(page.getByTestId('rail-layer1')).toHaveCount(0);
  // Let the canonical session remount finish before editing a private draft.
  await expect(page.getByText('Đang xác minh phiên…')).toHaveCount(0);
  await expect(workspace).toHaveCount(1);
  return errors;
}
async function submit(page: Page) { await page.getByLabel('Nội dung cần kiểm chứng', { exact: true }).fill(DRAFT); await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click(); }
async function selectMode(page: Page, label: string) {
  const tab = page.getByRole('tab', { name: label, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}
async function shot(page: Page, name: string) {
  await mkdir(DIR, { recursive: true });
  if (!name.includes('sheet')) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.evaluate(async () => {
    const animations = [...document.querySelectorAll('.master-ultra-journey-stage')]
      .flatMap((element) => element.getAnimations())
      .filter((animation) => animation.playState === 'running' && animation.effect?.getTiming().iterations === 1);
    await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
  });
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: !name.includes('sheet') });
  manifest.push({ file: `${name}.png`, classification: 'ISOLATED CONTRACT FIXTURE — NOT LIVE', viewport: page.viewportSize(), timestamp: new Date().toISOString() });
  await writeFile(path.join(DIR, 'screenshots.json'), JSON.stringify(manifest, null, 2));
}

async function auditResultAccessibility(page: Page, label: string) {
  const initialTheme = await page.locator('html').getAttribute('data-theme');
  const initialViewport = page.viewportSize();
  try {
    for (const theme of ['light', 'midnight']) for (const width of [390, 1440]) {
      // Change only CSS tokens so this audit keeps the same case/run identity.
      await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), theme);
      await page.setViewportSize({ width, height: 960 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const findings = await new AxeBuilder({ page }).include('#trust-main').analyze();
      await writeFile(path.join(DIR, `a11y-${label}-${theme}-${width}.json`), JSON.stringify(findings.violations, null, 2));
      expect(findings.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact || ''))).toEqual([]);
    }
  } finally {
    if (initialTheme) await page.evaluate((theme) => document.documentElement.setAttribute('data-theme', theme), initialTheme);
    if (initialViewport) await page.setViewportSize(initialViewport);
  }
}

test('seven groups: entry, processing, result, evidence, integration and mobile sheet', async ({ page }) => {
  const errors = await harness(page, { stream: true });
  await shot(page, '01-entry-light');
  await submit(page);
  await expect(page.locator('[data-testid="trust-active-layer"][data-layer-id="l3"]')).toBeVisible();
  await shot(page, '02-claims-processing');
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  await expect(page.locator('.master-ultra-trust')).toHaveAttribute('data-master-ultra-state', 'COMPLETE_OVERVIEW');
  for (const index of [1, 2, 3, 4]) await expect(page.getByTestId(`rail-layer${index}`)).toHaveAttribute('data-status', 'COMPLETE');
  await expect(page.getByTestId('trust-ai-provenance')).toContainText('phiên bản 3');
  await expect(page.getByTestId('trust-ai-provenance')).toContainText('1 URL đã được kiểm tra');
  await expect(page.locator('#trust-ai-provenance').getByRole('link', { name: /Quy định về hỗ trợ học tập/ })).toHaveAttribute('href', 'https://example.org/policy');
  await shot(page, '03-standard-result');
  await expect(page.getByRole('button', { name: 'Gửi yêu cầu thẩm định', exact: true })).toHaveCount(0);
  await auditResultAccessibility(page, 'published-result');
  await page.locator('#trust-evidence').evaluate((element) => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await shot(page, '04-evidence-sources-comparison');
  await page.getByRole('button', { name: 'Xem đánh giá chuyên gia', exact: true }).click();
  await page.getByRole('button', { name: 'Đọc đánh giá được phép xem' }).click();
  await expect(page.getByText('Đánh giá này thuộc phiên bản khác.')).toBeVisible();
  await page.getByRole('button', { name: 'Sửa đầu vào' }).click();
  await page.getByLabel('Nội dung cần kiểm chứng', { exact: true }).fill('Nội dung mới chưa được kiểm chứng');
  await expect(page.getByText(/Bạn đã thay đổi đầu vào/)).toBeVisible();
  await shot(page, '06-revision-assessment');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Thảo luận trong Cộng đồng', exact: true }).click();
  const community = page.getByRole('dialog');
  await expect(community).toBeVisible();
  await expect(community.locator('select').first()).toHaveValue(CASE);
  await community.getByLabel('Statement công khai').fill('Tôi muốn hỏi về điều kiện nộp hồ sơ và thời hạn của thông báo công khai.');
  await community.getByRole('button', { name: /Tạo bản xem trước/ }).click();
  await expect(community.getByRole('heading', { name: 'Xem trước phạm vi công khai' })).toBeVisible();
  await shot(page, '06-community-preview');
  await community.getByRole('button', { name: 'Đóng composer' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Yêu cầu chuyên gia', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await shot(page, '07-mobile390-expert-sheet');
  const a11y = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  await writeFile(path.join(DIR, 'a11y-sheet.json'), JSON.stringify(a11y.violations, null, 2));
  expect(a11y.violations.filter((v) => ['critical','serious'].includes(v.impact || ''))).toEqual([]);
  const expertRequestBodies: unknown[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/expert/review-requests') && request.method() === 'POST') expertRequestBodies.push(request.postDataJSON());
  });
  await expect(page.getByText('Trust revision 3', { exact: true })).toBeVisible();
  await page.getByLabel('Domain hoặc lĩnh vực cần xem xét').fill('PUBLIC_POLICY');
  await page.getByLabel(/Câu hỏi cho người đánh giá/).fill('Hãy kiểm tra thời hạn áp dụng của điều kiện này trong văn bản hiện hành.');
  await page.getByRole('button', { name: 'Gửi yêu cầu', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('REQUESTED');
  expect(expertRequestBodies).toHaveLength(1);
  expect(expertRequestBodies[0]).toMatchObject({ caseId: CASE, caseRevision: 3, claimId: CLAIM, domainCode: 'PUBLIC_POLICY' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const outcome of ['INSUFFICIENT', 'CONTRADICTED', 'PARTIAL']) test(`difficult ${outcome}`, async ({ page }) => {
  await harness(page, { outcome }); await submit(page);
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  await shot(page, `05-${outcome.toLowerCase()}`);
  if (outcome === 'INSUFFICIENT') await expect(page.locator('#trust-evidence')).toContainText('Không có evidence item được công bố');
});

test('responsive themes, keyboard, contrast and zero horizontal overflow', async ({ page }) => {
  await harness(page);
  const workspace = page.locator('#main-content').getByTestId('trust-v4');
  await expect(page.locator('.profile-chip img')).toBeVisible();
  await expect.poll(() => page.locator('.profile-chip img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 1)).toBe(true);
  const findings: object[] = [];
  for (const theme of ['light', 'midnight', 'system']) for (const width of [360,390,768,1024,1280,1440,1920]) {
    await page.setViewportSize({ width, height: 960 });
    await page.evaluate((theme) => localStorage.setItem('studenthub-theme-mode', theme), theme);
    await page.reload();
    await expect(page.getByText('Đang xác minh phiên…')).toHaveCount(0);
    await expect(workspace.first()).toBeVisible();
    await expect(workspace).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme === 'midnight' ? 'midnight' : 'light');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow, `${theme}/${width}`).toBe(false);
    await shot(page, `responsive-${theme}-${width}`);
    if (width === 390 || width === 1440) {
      const result = await new AxeBuilder({ page }).include('#trust-main').analyze();
      findings.push({ width, theme, violations: result.violations });
    }
  }
  await writeFile(path.join(DIR, 'a11y-responsive.json'), JSON.stringify(findings, null, 2));
  expect(findings.flatMap((f: { violations?: { impact?: string }[] }) => f.violations || []).filter((v) => ['serious','critical'].includes(v.impact || ''))).toEqual([]);
});

test('anonymous shell has no horizontal overflow at 360px Midnight', async ({ page }) => {
  await harness(page, { anonymous: true, theme: 'midnight' });
  await page.setViewportSize({ width: 360, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow, 'anonymous/midnight/360').toBe(false);
  await shot(page, 'responsive-anonymous-midnight-360');
});

test('validation, retained draft on error, anonymous actions and private history', async ({ page }) => {
  await harness(page, { status: 503, anonymous: true });
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.locator('#trust-main [role=alert]')).toContainText('Nhập nội dung');
  await selectMode(page, 'Đường dẫn');
  await page.getByLabel('Đường dẫn cần đối chiếu', { exact: true }).fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.locator('#trust-main [role=alert]')).toContainText('HTTP');
  await selectMode(page, 'Văn bản'); await submit(page);
  await expect(page.locator('#trust-main [role=alert]')).toContainText('không khả dụng');
  await expect(page.getByLabel('Nội dung cần kiểm chứng', { exact: true })).toHaveValue(DRAFT);
});

test('image and QR upload previews use the selected supported mode', async ({ page }) => {
  const errors = await harness(page);
  const fixturePng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  const input = page.locator('#trust-file');
  await selectMode(page, 'Hình ảnh');
  await input.setInputFiles({ name: 'local-check.png', mimeType: 'image/png', buffer: fixturePng });
  await expect(page.getByRole('img', { name: 'Ảnh bạn đã chọn để kiểm chứng' })).toBeVisible();
  await expect(page.getByText('local-check.png', { exact: true })).toBeVisible();
  await shot(page, '01-entry-image-upload');
  await page.getByRole('button', { name: 'Bỏ ảnh đã chọn' }).click();
  await input.setInputFiles({ name: 'local-check.png', mimeType: 'image/png', buffer: fixturePng });
  await expect(page.getByText('local-check.png', { exact: true })).toBeVisible();
  await selectMode(page, 'Mã QR');
  await expect(page.getByText('local-check.png', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kiểm chứng', exact: true })).toBeDisabled();
  await input.setInputFiles({ name: 'qr-check.png', mimeType: 'image/png', buffer: fixturePng });
  await expect(page.getByText('qr-check.png', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Bỏ ảnh đã chọn' }).click();
  await expect(page.getByRole('button', { name: 'Kiểm chứng', exact: true })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('all four modalities preserve the submitted input contract without leaking a hidden text draft into media', async ({ page }) => {
  await harness(page);
  const requests: Record<string, unknown>[] = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname === '/api/v1/trust') requests.push(request.postDataJSON()); });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  for (const [mode, label] of [['text', 'Văn bản'], ['url', 'Đường dẫn'], ['image', 'Hình ảnh'], ['qr', 'Mã QR']]) {
    await selectMode(page, label);
    if (mode === 'text') await page.getByLabel('Nội dung cần kiểm chứng', { exact: true }).fill(DRAFT);
    else if (mode === 'url') await page.getByLabel('Đường dẫn cần đối chiếu', { exact: true }).fill('https://example.org/policy');
    else await page.locator('#trust-file').setInputFiles({ name: `${mode}.png`, mimeType: 'image/png', buffer: image });
    await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
    await expect(page.getByTestId('trust-conclusion')).toBeVisible();
    await expect(page.getByText('Bạn đã thay đổi đầu vào.', { exact: false })).toHaveCount(0);
    const request = requests.at(-1);
    expect(request).toMatchObject({ type: mode, metadata: { inputKind: mode.toUpperCase() } });
    if (mode === 'image' || mode === 'qr') expect(request).toMatchObject({ content: '', metadata: { fileName: `${mode}.png`, mimeType: 'image/png', fileSize: image.length, bytes: `data:image/png;base64,${image.toString('base64')}` } });
    else expect(request?.content).toBe(mode === 'text' ? DRAFT : 'https://example.org/policy');
    await page.getByRole('button', { name: 'Phân tích mới', exact: true }).click();
    await expect(page.getByTestId('trust-final-predict')).toHaveCount(0);
  }
  expect(requests).toHaveLength(4);
});

test('TEXT and URL drafts stay isolated and switching to or from media drops the other modality payload', async ({ page }) => {
  await harness(page);
  const requests: Record<string, unknown>[] = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname === '/api/v1/trust') requests.push(request.postDataJSON()); });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');

  await selectMode(page, 'Văn bản');
  await page.getByLabel('Nội dung cần kiểm chứng', { exact: true }).fill(DRAFT);
  await selectMode(page, 'Đường dẫn');
  await expect(page.getByLabel('Đường dẫn cần đối chiếu', { exact: true })).toHaveValue('');
  const urlDraft = 'https://example.org/policy';
  await page.getByLabel('Đường dẫn cần đối chiếu', { exact: true }).fill(urlDraft);
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  expect(requests.at(-1)?.content).toBe(urlDraft);
  await page.getByRole('button', { name: 'Phân tích mới', exact: true }).click();

  await selectMode(page, 'Văn bản');
  await expect(page.getByLabel('Nội dung cần kiểm chứng', { exact: true })).toHaveValue(DRAFT);
  await selectMode(page, 'Hình ảnh');
  await page.locator('#trust-file').setInputFiles({ name: 'transition.png', mimeType: 'image/png', buffer: image });
  await selectMode(page, 'Văn bản');
  await expect(page.getByLabel('Nội dung cần kiểm chứng', { exact: true })).toHaveValue(DRAFT);
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ type: 'text', content: DRAFT, metadata: { inputKind: 'TEXT' } });
  expect(requests.at(-1)?.metadata).not.toHaveProperty('bytes');
  await page.getByRole('button', { name: 'Phân tích mới', exact: true }).click();

  await selectMode(page, 'Mã QR');
  await page.locator('#trust-file').setInputFiles({ name: 'transition-qr.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ type: 'qr', content: '', metadata: { inputKind: 'QR', fileName: 'transition-qr.png' } });
  await page.getByRole('button', { name: 'Phân tích mới', exact: true }).click();
  await selectMode(page, 'Hình ảnh');
  await expect(page.getByText('transition-qr.png', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Kiểm chứng', exact: true })).toBeDisabled();
  await page.locator('#trust-file').setInputFiles({ name: 'transition-image-after-qr.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  expect(requests.at(-1)).toMatchObject({ type: 'image', content: '', metadata: { inputKind: 'IMAGE', fileName: 'transition-image-after-qr.png' } });
  expect(requests).toHaveLength(4);
});

test('completed layer wrappers keep an unpublished Final Predict locked; inspection never starts another run', async ({ page }) => {
  await harness(page, { outcome: 'UNPUBLISHED' });
  const calls: string[] = [];
  page.on('request', (request) => { if (new URL(request.url()).pathname === '/api/v1/trust') calls.push(request.method()); });
  await submit(page);
  await expect(page.getByTestId('trust-final-predict')).toHaveAttribute('data-status', 'LOCKED');
  await expect(page.getByTestId('trust-conclusion')).toHaveCount(0);
  for (const index of [1, 2, 3, 4]) {
    await expect(page.getByTestId(`rail-layer${index}`)).toHaveAttribute('data-status', 'COMPLETE');
  }
  await page.getByTestId('rail-layer2').click();
  await expect(page.getByTestId('rail-layer2')).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Mở chi tiết', exact: true }).click();
  await expect(page.locator('.master-ultra-trust')).toHaveAttribute('data-master-ultra-state', 'INSPECT_LAYER');
  await page.keyboard.press('Escape');
  await expect(page.locator('.master-ultra-trust')).toHaveAttribute('data-master-ultra-state', 'COMPLETE_OVERVIEW');
  expect(calls).toEqual(['POST']);
  await auditResultAccessibility(page, 'unpublished-result');
});

test('reanalyzing an edited case shows the new input and current stream instead of the previous completed run', async ({ page }) => {
  await harness(page, { stream: true });
  await submit(page);
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  await page.getByRole('button', { name: 'Sửa đầu vào', exact: true }).click();
  const newDraft = 'Thông báo mới cần được kiểm tra độc lập với phiên trước.';
  await page.getByLabel('Nội dung cần kiểm chứng', { exact: true }).fill(newDraft);
  await page.getByRole('button', { name: 'Kiểm chứng nội dung mới', exact: true }).click();
  await expect(page.getByTestId('trust-observed-input')).toContainText(newDraft);
  await expect(page.getByTestId('rail-layer3')).toHaveAttribute('data-status', 'RUNNING');
  await expect(page.getByTestId('trust-final-predict')).toHaveAttribute('data-status', 'LOCKED');
  await expect(page.getByTestId('trust-conclusion')).toHaveCount(0);
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
});

test('changing an image draft does not attach the previous run OCR to the new image', async ({ page }) => {
  const oldOcr = 'Văn bản trích xuất từ ảnh của lần chạy trước.';
  await harness(page, { ocrText: oldOcr });
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==', 'base64');
  await selectMode(page, 'Hình ảnh');
  await page.locator('#trust-file').setInputFiles({ name: 'previous.png', mimeType: 'image/png', buffer: image });
  await page.getByRole('button', { name: 'Kiểm chứng', exact: true }).click();
  await expect(page.getByTestId('trust-conclusion')).toBeVisible();
  await page.getByRole('button', { name: 'Sửa đầu vào', exact: true }).click();
  const composer = page.locator('.master-ultra-composer');
  await expect(composer).toContainText(oldOcr);
  await page.locator('#trust-file').setInputFiles({ name: 'new-draft.png', mimeType: 'image/png', buffer: Buffer.concat([image, Buffer.from([0])]) });
  await expect(composer).toContainText('new-draft.png');
  await expect(composer).not.toContainText(oldOcr);
  await expect(page.getByText(/Bạn đã thay đổi đầu vào/)).toBeVisible();
});

test('five isolated UI interaction performance samples', async ({ browser }) => {
  const samples: object[] = [];
  for (let i = 0; i < 5; i++) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await harness(page); await submit(page); await expect(page.getByTestId('trust-conclusion')).toBeVisible();
    const sample = await page.evaluate(() => {
      const resource = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return { inputCommitMs: performance.getEntriesByName('trust-v4:input-commit')[0]?.startTime, resultReadyMs: performance.getEntriesByName('trust-v4:result-ready')[0]?.startTime,
        encodedScriptBytes: resource.filter((r) => r.name.includes('.js')).reduce((n, r) => n + r.encodedBodySize, 0), classification: 'ISOLATED FIXTURE UI measurement; not production, CPU hydration or field INP' };
    });
    const start = performance.now();
    await page.getByRole('button', { name: 'Mở chi tiết', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Deterministic Screen' })).toBeVisible();
    samples.push({ ...sample, savedLayerInspectionAutomationMs: performance.now() - start });
    await page.close();
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, 'performance-samples.json'), JSON.stringify(samples, null, 2));
});
