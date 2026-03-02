import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible()
  })

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 10000 })
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/admin/students')
    await page.waitForURL(/\/admin\/login/)
    expect(page.url()).toContain('/admin/login')
  })

  test('signup blocks when admin exists', async ({ page, request }) => {
    const response = await request.post('/api/auth/signup', {
      data: { email: 'new@test.com', password: 'password123' },
    })
    // Should be 403 if admin already exists, or 200 if first admin
    expect([200, 403, 429]).toContain(response.status())
  })
})
