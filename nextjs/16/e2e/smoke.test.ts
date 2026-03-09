import {test, expect} from '@playwright/test';

test('homepage loads', async ({page}) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/mion|Next/i);
});

test('mion API responds through Next.js rewrite', async ({request}) => {
    const res = await request.post('/api/mion/hello', {
        headers: {'Content-Type': 'application/json'},
        data: {hello: ['Playwright']},
    });
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(json.hello).toBe('Hello Playwright!');
});

test('mion API getTime returns valid date', async ({request}) => {
    const res = await request.post('/api/mion/getTime', {
        headers: {'Content-Type': 'application/json'},
        data: {getTime: []},
    });
    expect(res.ok()).toBe(true);
    const json = await res.json();
    expect(new Date(json.getTime).getTime()).not.toBeNaN();
});

test('orders showcase page loads and displays orders', async ({page}) => {
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('response', (res) => { if (res.status() >= 400) requests.push(`${res.status()} ${res.url()}`); });
    await page.goto('/mion-orders');
    // Wait for orders to load (loading state disappears)
    await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
    // Log any errors for debugging
    if (errors.length > 0) console.log('Browser errors:', errors);
    if (requests.length > 0) console.log('Failed requests:', requests);
    // Verify orders are rendered
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Carol Davis')).toBeVisible();
});

test('orders showcase displays event timeline', async ({page}) => {
    await page.goto('/mion-orders');
    await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
    // Verify event timeline is rendered for at least one order
    await expect(page.getByText('Event Timeline').first()).toBeVisible();
});
