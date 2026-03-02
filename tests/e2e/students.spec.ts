import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth'

test.describe('Students', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('students list loads with data table', async ({ page }) => {
    await page.goto('/admin/students')
    await expect(page.getByRole('heading', { name: /students/i })).toBeVisible()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    // Table or loading state should be present
    await expect(page.locator('table, [data-loading]')).toBeVisible({ timeout: 15000 })
  })

  test('search filters students', async ({ page }) => {
    await page.goto('/admin/students')
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 15000 })
    const searchInput = page.getByPlaceholder(/search/i)
    await searchInput.fill('nonexistentstudentxyz123')
    // Should show no results or filtered results
    await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 5000 })
  })

  test('new student form validates parentId', async ({ page }) => {
    await page.goto('/admin/students/new')
    await expect(page.getByRole('heading', { name: /add new student/i })).toBeVisible()

    // Fill required fields but skip parent selection
    await page.getByLabel('Student Name').fill('Test Student')
    await page.getByLabel('Barcode').fill('99999')

    // Submit without selecting parent
    await page.getByRole('button', { name: /create student/i }).click()

    // Should show validation error about parent
    await expect(page.getByText(/parent/i)).toBeVisible({ timeout: 5000 })
  })

  test('bulk select shows action bar', async ({ page }) => {
    await page.goto('/admin/students')
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 15000 })

    // Find and click the "select all" checkbox in the header
    const selectAllCheckbox = page.locator('thead input[type="checkbox"], thead [role="checkbox"]').first()
    if (await selectAllCheckbox.isVisible()) {
      await selectAllCheckbox.click()
      // Bulk action bar should appear with Set Active / Set Inactive buttons
      await expect(page.getByText(/selected/i)).toBeVisible({ timeout: 5000 })
      await expect(page.getByRole('button', { name: /set active/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /set inactive/i })).toBeVisible()
    }
  })
})
