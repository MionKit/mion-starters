import {test, expect} from '@playwright/test';

test('homepage loads', async ({page}) => {
    await page.goto('/');
    await expect(page.getByText('To get started')).toBeVisible();
});

test('mion API responds through dev server middleware', async ({request}) => {
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

test('orders showcase page loads orders and events in one batch request', async ({page}) => {
    const errors: string[] = [];
    const requests: string[] = [];
    const mionRequests: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('response', (res) => { if (res.status() >= 400) requests.push(`${res.status()} ${res.url()}`); });
    page.on('request', (req) => { if (new URL(req.url()).pathname.startsWith('/api/mion/')) mionRequests.push(req.url()); });
    await page.goto('/mion-orders');
    await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();
    await expect(page.getByText('Carol Davis')).toBeVisible();
    await expect(page.getByText('FedEx · FX-123456')).toBeVisible();
    expect(mionRequests).toHaveLength(1);
    expect(new URL(mionRequests[0]).pathname).toBe('/api/mion/mion-batch');
});

test('orders showcase displays event timeline', async ({page}) => {
    await page.goto('/mion-orders');
    await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
    await expect(page.getByText('Event Timeline').first()).toBeVisible();
});

for (const [colorScheme, logo, highlight] of [
    ['light', '/mion-logo.svg', 'rgb(9, 9, 11)'],
    ['dark', '/mion-logo-dark.svg', 'rgb(250, 250, 250)'],
] as const) {
    test(`orders showcase logo and highlight are readable in ${colorScheme} mode`, async ({page}) => {
        await page.emulateMedia({colorScheme});
        await page.goto('/mion-orders');
        const logoImg = page.getByAltText('Mion logo');
        await expect.poll(() => logoImg.evaluate((img: HTMLImageElement) => new URL(img.currentSrc).pathname)).toBe(logo);
        await expect(page.getByText('A fully typed lightweight alternative to GraphQL.')).toHaveCSS('color', highlight);
    });
}
