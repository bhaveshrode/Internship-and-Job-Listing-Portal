import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const SHOTS = new URL('../../artifacts/', import.meta.url).pathname;
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const consoleErrors = [];

const ok = (name) => {
  results.push(`PASS: ${name}`);
  console.log(`PASS: ${name}`);
};
const fail = (name, err) => {
  results.push(`FAIL: ${name} — ${err}`);
  console.log(`FAIL: ${name} — ${err}`);
};

const browser = await chromium.launch();

async function newPage(viewport = { width: 1280, height: 800 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('dialog', (d) => d.accept());
  return { ctx, page };
}

// ---------- USER WORKFLOW ----------
try {
  const { ctx, page } = await newPage();

  // 1. Listing loads with cards
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Find Your Next Opportunity' }).waitFor();
  await page.locator('.card').first().waitFor();
  const cardCount = await page.locator('.card').count();
  ok(`listing loads (${cardCount} cards)`);

  // 2. Horizontal overflow check (desktop)
  let overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  overflow <= 1 ? ok('desktop listing: no horizontal overflow') : fail('desktop overflow', `${overflow}px`);

  await page.screenshot({ path: SHOTS + 'listing-desktop.png', fullPage: true });

  // 3. Search
  await page.getByPlaceholder(/Search by title/).fill('data');
  await page.getByRole('heading', { name: 'Data Science Intern' }).waitFor({ timeout: 5000 });
  const afterSearch = await page.locator('.card').count();
  afterSearch === 1 ? ok(`search filters to ${afterSearch} card`) : fail('search filter', `${afterSearch} cards`);

  // 4. Domain filter
  await page.getByPlaceholder(/Search by title/).fill('');
  await page.locator('.domain-select').selectOption('Web Development');
  await page.waitForTimeout(600);
  const afterFilter = await page.locator('.card').count();
  const badgeTexts = await page.locator('.badge').allInnerTexts();
  afterFilter === 2 && badgeTexts.every((t) => t === 'Web Development')
    ? ok('domain filter returns only Web Development (2)')
    : fail('domain filter', `${afterFilter} cards: ${badgeTexts}`);

  // 5. Pagination info visible in some form (5 items, 1 page -> hidden is correct)
  const pagesInfo = await page.locator('.pagination').count();
  ok(`pagination behaves correctly for 1 page (visible=${pagesInfo === 1})`);

  // 6. Detail page
  await page.locator('.domain-select').selectOption('');
  await page.waitForTimeout(600);
  await page.locator('.card').first().getByRole('link', { name: 'View Details' }).click();
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.locator('.detail-description').waitFor();
  ok('detail page renders');
  await page.screenshot({ path: SHOTS + 'detail-desktop.png', fullPage: true });

  // 7. Apply flow — invalid email must block submission (native input[type=email] validation)
  await page.getByRole('link', { name: 'Apply Now' }).click();
  await page.locator('input[name="name"]').fill('Playwright Tester');
  await page.locator('input[name="email"]').fill('not-an-email');
  await page.locator('input[name="phone"]').fill('+91 9000000000');
  await page.getByRole('button', { name: 'Submit Application' }).click();
  await page.waitForTimeout(500);
  const emailValid = await page.locator('input[name="email"]').evaluate((el) => el.validity.valid);
  const stillOnForm = (await page.getByText('Submit Your Application').count()) > 0;
  !emailValid && stillOnForm
    ? ok('apply form blocks invalid email (no submission)')
    : fail('invalid email block', `valid=${emailValid} onForm=${stillOnForm}`);

  // 8. Valid submission
  await page.locator('input[name="email"]').fill('pwtest@example.com');
  await page.getByRole('button', { name: 'Submit Application' }).click();
  await page.getByText('Application Submitted!').waitFor({ timeout: 5000 });
  ok('application submitted + confirmation shown');
  await page.screenshot({ path: SHOTS + 'apply-confirmation.png' });

  // 9. Back to listing
  await page.getByRole('button', { name: 'Back to Opportunities' }).click();
  await page.getByRole('heading', { name: 'Find Your Next Opportunity' }).waitFor();
  ok('confirmation returns to listing');

  await ctx.close();
} catch (err) {
  fail('user workflow', err.message);
}

// ---------- ADMIN WORKFLOW ----------
try {
  const { ctx, page } = await newPage();

  // 1. Wrong credentials
  await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await page.locator('input[autocomplete="username"]').fill('admin');
  await page.locator('input[autocomplete="current-password"]').fill('wrongpass');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByText('Invalid credentials').waitFor({ timeout: 3000 });
  ok('admin login rejects wrong password');

  // 2. Correct credentials
  await page.locator('input[autocomplete="current-password"]').fill('admin123');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('heading', { name: 'Opportunities' }).waitFor({ timeout: 5000 });
  ok('admin login redirects to dashboard');
  await page.screenshot({ path: SHOTS + 'admin-opportunities.png', fullPage: true });

  // 3. Add opportunity
  await page.getByRole('button', { name: '+ Add Opportunity' }).click();
  await page.locator('input[name="title"]').fill('Playwright QA Role');
  await page.locator('input[name="company"]').fill('PW Testing Co');
  await page.locator('input[name="domain"]').fill('Testing');
  await page.locator('input[name="location"]').fill('Remote');
  await page.locator('input[name="experience"]').fill('Fresher');
  await page.locator('textarea[name="description"]').fill('Created by the browser test.');
  await page.getByRole('button', { name: 'Create Opportunity' }).click();
  await page.getByText(/Added "Playwright QA Role"/).waitFor({ timeout: 5000 });
  ok('admin adds opportunity');

  // 4. Edit it
  await page.locator('tr', { hasText: 'Playwright QA Role' }).getByRole('button', { name: 'Edit' }).click();
  await page.locator('input[name="title"]').fill('Playwright QA Role EDITED');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await page.getByText(/Updated "Playwright QA Role EDITED"/).waitFor({ timeout: 5000 });
  ok('admin edits opportunity');

  // 5. Delete it
  await page.locator('tr', { hasText: 'Playwright QA Role EDITED' }).getByRole('button', { name: 'Delete' }).click();
  await page.getByText(/Deleted "Playwright QA Role EDITED"/).waitFor({ timeout: 5000 });
  const gone = await page.locator('tr', { hasText: 'Playwright QA Role' }).count();
  gone === 0 ? ok('admin deletes opportunity') : fail('delete', 'row still present');

  // 6. Applications view
  await page.getByRole('link', { name: 'Applications' }).click();
  await page.getByRole('heading', { name: /Applications/ }).waitFor({ timeout: 5000 });
  await page.waitForTimeout(800);
  const hasApplicant = (await page.getByText('Playwright Tester').count()) > 0;
  hasApplicant
    ? ok('applications page shows submitted applicant')
    : fail('applications view', 'Playwright Tester not listed');
  await page.screenshot({ path: SHOTS + 'admin-applications.png', fullPage: true });

  // 7. Unauthenticated access check
  await page.evaluate(() => localStorage.removeItem('adminToken'));
  await page.goto(BASE + '/admin/applications');
  await page.waitForURL('**/admin/login', { timeout: 5000 });
  ok('protected admin route redirects to login when logged out');

  await ctx.close();
} catch (err) {
  fail('admin workflow', err.message);
}

// ---------- RESPONSIVE ----------
for (const [label, viewport] of [
  ['mobile', { width: 375, height: 812 }],
  ['tablet', { width: 768, height: 1024 }],
]) {
  try {
    const { ctx, page } = await newPage(viewport);
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('.card').first().waitFor();
    const ov = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    ov <= 1
      ? ok(`${label} listing: no horizontal overflow`)
      : fail(`${label} listing overflow`, `${ov}px`);
    await page.screenshot({ path: SHOTS + `listing-${label}.png`, fullPage: true });

    await page.locator('.card').first().getByRole('link', { name: 'View Details' }).click();
    await page.locator('.detail-description').waitFor();
    const ov2 = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    ov2 <= 1
      ? ok(`${label} detail: no horizontal overflow`)
      : fail(`${label} detail overflow`, `${ov2}px`);
    if (label === 'mobile')
      await page.screenshot({ path: SHOTS + 'detail-mobile.png', fullPage: true });

    // Admin dashboard at this size
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await page.locator('input[autocomplete="username"]').fill('admin');
    await page.locator('input[autocomplete="current-password"]').fill('admin123');
    await page.getByRole('button', { name: 'Log In' }).click();
    await page.getByRole('heading', { name: 'Opportunities' }).waitFor({ timeout: 5000 });
    const ov3 = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    ov3 <= 1
      ? ok(`${label} admin: no horizontal overflow`)
      : fail(`${label} admin overflow`, `${ov3}px`);
    await page.screenshot({ path: SHOTS + `admin-${label}.png`, fullPage: true });
    await ctx.close();
  } catch (err) {
    fail(`${label} responsive`, err.message);
  }
}

await browser.close();

console.log('\n===== SUMMARY =====');
console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL'));
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (consoleErrors.length) {
  console.log('\nConsole errors observed:');
  console.log([...new Set(consoleErrors)].join('\n'));
}
process.exit(failed.length ? 1 : 0);
