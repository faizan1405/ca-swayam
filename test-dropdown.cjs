const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to local dev server
  await page.goto('http://localhost:8080/consultation', { waitUntil: 'networkidle' });
  
  console.log("Page loaded. Looking for the dropdown trigger...");
  
  // Wait for the Select a consultation type trigger
  const trigger = await page.getByRole('combobox', { name: /Consultation Type/i }).first();
  if (!trigger) {
     const altTrigger = await page.locator('button:has-text("Select a consultation type")');
     console.log("Combobox not found by role, trying locator.");
  }
  
  const actualTrigger = await page.locator('button[role="combobox"]').nth(0);
  console.log("Trigger HTML:", await actualTrigger.evaluate(el => el.outerHTML));
  
  // Click the trigger
  console.log("Clicking trigger...");
  await actualTrigger.click({ force: true });
  
  // Wait a moment for animation
  await page.waitForTimeout(1000);
  
  // Look for SelectContent items
  const options = await page.locator('[role="option"]').all();
  console.log(`Found ${options.length} options open in the dropdown.`);
  
  for (const opt of options) {
    const text = await opt.textContent();
    console.log("Option:", text);
  }
  
  // If it didn't open, see if there's any state on the trigger
  const state = await actualTrigger.getAttribute('data-state');
  console.log("Trigger data-state:", state);
  
  await browser.close();
})();
