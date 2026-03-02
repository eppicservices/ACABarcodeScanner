import { test, expect } from '@playwright/test'

test.describe('Parent Portal', () => {
  test('request link page renders', async ({ page }) => {
    await page.goto('/parent')
    // Should show the request link form
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send|request|get/i })).toBeVisible()
  })

  test('rate limiting returns 429 on repeated requests', async ({ request }) => {
    const email = `ratelimit-test-${Date.now()}@example.com`

    // First request should succeed
    const first = await request.post('/api/parent-portal/request-link', {
      data: { email },
    })
    expect(first.status()).toBe(200)

    // Second request within 5 minutes should be rate limited
    const second = await request.post('/api/parent-portal/request-link', {
      data: { email },
    })
    expect(second.status()).toBe(429)

    const body = await second.json()
    expect(body.error).toContain('minute')
  })
})
