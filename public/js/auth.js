// Authentication Module
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.querySelector('[data-tab="login"]');
  const registerTab = document.querySelector('[data-tab="register"]');
  const switchLinks = document.querySelectorAll('.switch-tab');
  const toast = document.getElementById('toast');
  
  // Tab switching
  function switchTab(tab) {
    loginTab.classList.toggle('active', tab === 'login');
    registerTab.classList.toggle('active', tab === 'register');
    loginForm.classList.toggle('active', tab === 'login');
    registerForm.classList.toggle('active', tab === 'register');
  }
  
  loginTab.addEventListener('click', () => switchTab('login'));
  registerTab.addEventListener('click', () => switchTab('register'));
  
  switchLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });
  
  // Toast notification
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  
  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Welcome back! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Connection error. Please try again.', 'error');
    }
  });
  
  // Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showToast('Account created successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Connection error. Please try again.', 'error');
    }
  });
  
  // Check if already logged in
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      // Not logged in, stay on page
    }
  }
  
  checkAuth();
});
