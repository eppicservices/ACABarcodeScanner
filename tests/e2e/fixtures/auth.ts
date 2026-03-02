import { Page } from '@playwright/test'

export async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
  const password = process.env.TEST_ADMIN_PASSWORD || 'testpassword123'

  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/admin/)
}
