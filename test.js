const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  const consoleErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(`Page error: ${error.message}`);
  });

  try {
    // Test 1: Load auth page
    console.log('Testing auth page...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if login form is visible
    const loginForm = await page.$('#login-form');
    console.log('Login form visible:', !!loginForm);
    
    // Test 2: Test registration
    console.log('Testing registration...');
    await page.click('[data-tab="register"]');
    await page.fill('#register-username', 'testuser');
    await page.fill('#register-email', 'test@example.com');
    await page.fill('#register-password', 'password123');
    await page.click('#register-form button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Registration successful, redirected to dashboard');
    
    // Test 3: Check dashboard loaded
    await page.waitForLoadState('networkidle');
    const dashboardHeader = await page.$('.dashboard-header');
    console.log('Dashboard header visible:', !!dashboardHeader);
    
    // Test 4: Check stats loaded
    const totalBooks = await page.$eval('#stat-total', el => el.textContent);
    console.log('Total books:', totalBooks);
    
    // Test 5: Check empty state
    const emptyState = await page.$('#empty-state.visible');
    console.log('Empty state visible:', !!emptyState);
    
    // Test 6: Test upload modal
    console.log('Testing upload modal...');
    await page.click('#upload-btn');
    await page.waitForSelector('.modal.active');
    console.log('Upload modal opened:', await page.$('.modal.active'));
    
    // Close modal
    await page.click('#modal-close');
    
    // Test 7: Check user dropdown
    await page.click('#user-avatar');
    await page.waitForSelector('.user-dropdown.active');
    console.log('User dropdown working:', await page.$('.user-dropdown.active'));
    
    // Test 8: Test logout
    await page.click('[data-action="logout"]');
    await page.waitForURL('http://localhost:3000/');
    console.log('Logout successful');
    
    // Test 9: Test login
    console.log('Testing login...');
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'password123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Login successful');
    
    // Print results
    console.log('\n=== Test Results ===');
    console.log('Console messages:', consoleMessages.length);
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    } else {
      console.log('\nNo console errors detected!');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log('ERROR:', err));
    }
  } finally {
    await browser.close();
  }
})();
