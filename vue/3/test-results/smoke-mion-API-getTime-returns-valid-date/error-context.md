# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.test.ts >> mion API getTime returns valid date
- Location: e2e/smoke.test.ts:18:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import {test, expect} from '@playwright/test';
  2  | 
  3  | test('homepage loads', async ({page}) => {
  4  |     await page.goto('/');
  5  |     await expect(page.getByText('To get started')).toBeVisible();
  6  | });
  7  | 
  8  | test('mion API responds through dev server proxy', async ({request}) => {
  9  |     const res = await request.post('/api/mion/hello', {
  10 |         headers: {'Content-Type': 'application/json'},
  11 |         data: {hello: ['Playwright']},
  12 |     });
  13 |     expect(res.ok()).toBe(true);
  14 |     const json = await res.json();
  15 |     expect(json.hello).toBe('Hello Playwright!');
  16 | });
  17 | 
  18 | test('mion API getTime returns valid date', async ({request}) => {
  19 |     const res = await request.post('/api/mion/getTime', {
  20 |         headers: {'Content-Type': 'application/json'},
  21 |         data: {getTime: []},
  22 |     });
> 23 |     expect(res.ok()).toBe(true);
     |                      ^ Error: expect(received).toBe(expected) // Object.is equality
  24 |     const json = await res.json();
  25 |     expect(new Date(json.getTime).getTime()).not.toBeNaN();
  26 | });
  27 | 
  28 | test('orders showcase page loads and displays orders', async ({page}) => {
  29 |     const errors: string[] = [];
  30 |     const requests: string[] = [];
  31 |     page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  32 |     page.on('pageerror', (err) => errors.push(err.message));
  33 |     page.on('response', (res) => { if (res.status() >= 400) requests.push(`${res.status()} ${res.url()}`); });
  34 |     await page.goto('/mion-orders');
  35 |     // Wait for orders to load (loading state disappears)
  36 |     await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
  37 |     // Log any errors for debugging
  38 |     if (errors.length > 0) console.log('Browser errors:', errors);
  39 |     if (requests.length > 0) console.log('Failed requests:', requests);
  40 |     // Verify orders are rendered
  41 |     await expect(page.getByText('Alice Johnson')).toBeVisible();
  42 |     await expect(page.getByText('Bob Smith')).toBeVisible();
  43 |     await expect(page.getByText('Carol Davis')).toBeVisible();
  44 | });
  45 | 
  46 | test('orders showcase displays event timeline', async ({page}) => {
  47 |     await page.goto('/mion-orders');
  48 |     await expect(page.getByText('Loading orders...')).toBeHidden({timeout: 15_000});
  49 |     // Verify event timeline is rendered for at least one order
  50 |     await expect(page.getByText('Event Timeline').first()).toBeVisible();
  51 | });
  52 | 
```