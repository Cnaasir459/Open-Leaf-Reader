// Dashboard Module
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const booksGrid = document.getElementById('books-grid');
  const continueGrid = document.getElementById('continue-grid');
  const emptyState = document.getElementById('empty-state');
  const uploadBtn = document.getElementById('upload-btn');
  const uploadModal = document.getElementById('upload-modal');
  const modalClose = document.getElementById('modal-close');
  const cancelUpload = document.getElementById('cancel-upload');
  const uploadForm = document.getElementById('upload-form');
  const dropZone = document.getElementById('drop-zone');
  const bookFile = document.getElementById('book-file');
  const coverPreview = document.getElementById('cover-preview');
  const coverPlaceholder = document.getElementById('cover-placeholder');
  const coverImage = document.getElementById('cover-image');
  const coverFile = document.getElementById('cover-file');
  const removeCover = document.getElementById('remove-cover');
  const userMenu = document.getElementById('user-menu');
  const userAvatar = document.getElementById('user-avatar');
  const userDropdown = document.getElementById('user-dropdown');
  const viewBtns = document.querySelectorAll('.view-btn');
  const toast = document.getElementById('toast');
  
  let currentBooks = [];
  let currentView = 'grid';
  
  // Toast notification
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  
  // Load user info
  async function loadUserInfo() {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        window.location.href = '/';
        return;
      }
      const data = await response.json();
      userAvatar.textContent = data.user.username.charAt(0).toUpperCase();
      document.getElementById('dropdown-username').textContent = data.user.username;
      document.getElementById('dropdown-email').textContent = data.user.email;
    } catch (error) {
      console.error('Error loading user info:', error);
      window.location.href = '/';
    }
  }
  
  // Load stats
  async function loadStats() {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      document.getElementById('stat-total').textContent = data.stats.totalBooks;
      document.getElementById('stat-mine').textContent = data.stats.myBooks;
      document.getElementById('stat-favorites').textContent = data.stats.favoritesCount;
      document.getElementById('stat-read').textContent = data.stats.booksRead;
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }
  
  // Load books
  async function loadBooks(search = '') {
    try {
      const url = search 
        ? `/api/books?search=${encodeURIComponent(search)}`
        : '/api/books';
      const response = await fetch(url);
      const data = await response.json();
      currentBooks = data.books;
      renderBooks(data.books);
    } catch (error) {
      console.error('Error loading books:', error);
      showToast('Failed to load books', 'error');
    }
  }
  
  // Render books
  function renderBooks(books) {
    // Render continue reading
    const continueBooks = books.filter(b => b.current_page > 1 && b.total_pages > 0);
    if (continueBooks.length > 0) {
      document.getElementById('continue-section').style.display = 'block';
      continueGrid.innerHTML = continueBooks.slice(0, 3).map(book => createBookCard(book, true)).join('');
    } else {
      document.getElementById('continue-section').style.display = 'none';
    }
    
    // Render all books
    if (books.length === 0) {
      booksGrid.innerHTML = '';
      emptyState.classList.add('visible');
    } else {
      emptyState.classList.remove('visible');
      booksGrid.innerHTML = books.map(book => createBookCard(book)).join('');
    }
    
    // Add click handlers
    document.querySelectorAll('.book-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('.btn')) {
          window.location.href = `/read/${card.dataset.bookId}`;
        }
      });
    });
  }
  
  // Create book card HTML
  function createBookCard(book, showProgress = false) {
    const progress = showProgress && book.total_pages > 0 
      ? Math.round((book.current_page / book.total_pages) * 100)
      : 0;
    
    return `
      <div class="book-card ${progress > 0 ? 'has-progress' : ''}" data-book-id="${book.id}">
        <div class="book-cover">
          ${book.cover_path 
            ? `<img src="${book.cover_path}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\\'book-cover-placeholder\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><path d=\\'M4 19.5A2.5 2.5 0 0 1 6.5 17H20\\'/><path d=\\'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\\'/></svg></div>'">`
            : `<div class="book-cover-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>`
          }
        </div>
        <div class="book-info">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">by ${book.author}</p>
          ${progress > 0 ? `
            <div class="book-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="progress-text">
                <span>${book.current_page} of ${book.total_pages}</span>
                <span>${progress}%</span>
              </div>
            </div>
          ` : ''}
          <div class="book-actions">
            <button class="btn btn-primary btn-read" data-id="${book.id}">Read</button>
            <button class="btn btn-secondary btn-favorite ${book.is_favorite ? 'active' : ''}" data-id="${book.id}">
              <svg viewBox="0 0 24 24" fill="${book.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  // Search functionality
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = searchInput.value.trim();
      searchClear.classList.toggle('visible', query.length > 0);
      loadBooks(query);
    }, 300);
  });
  
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    loadBooks('');
  });
  
  // View toggle
  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      booksGrid.classList.toggle('list-view', currentView === 'list');
    });
  });
  
  // User dropdown
  userAvatar.addEventListener('click', () => {
    userDropdown.classList.toggle('active');
  });
  
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.classList.remove('active');
    }
  });
  
  // Dropdown actions
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', async () => {
      const action = item.dataset.action;
      userDropdown.classList.remove('active');
      
      if (action === 'logout') {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
      } else if (action === 'my-books') {
        // Filter to show only user's books
        const response = await fetch('/api/my-books');
        const data = await response.json();
        renderBooks(data.books);
        document.querySelector('.section-title').innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          My Books
        `;
      } else if (action === 'favorites') {
        const response = await fetch('/api/favorites');
        const data = await response.json();
        renderBooks(data.books);
        document.querySelector('.section-title').innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"/>
          </svg>
          Favorites
        `;
      }
    });
  });
  
  // Modal handling
  function openModal() {
    uploadModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  
  function closeModal() {
    uploadModal.classList.remove('active');
    document.body.style.overflow = '';
    uploadForm.reset();
    coverImage.src = '';
    coverImage.hidden = true;
    coverPlaceholder.hidden = false;
    removeCover.hidden = true;
  }
  
  uploadBtn.addEventListener('click', openModal);
  document.getElementById('empty-upload-btn').addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  cancelUpload.addEventListener('click', closeModal);
  
  uploadModal.querySelector('.modal-overlay').addEventListener('click', closeModal);
  
  // File upload handling
  dropZone.addEventListener('click', () => bookFile.click());
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      bookFile.files = files;
      updateFileName(files[0].name);
    } else {
      showToast('Please upload a PDF file', 'error');
    }
  });
  
  bookFile.addEventListener('change', () => {
    if (bookFile.files.length > 0) {
      updateFileName(bookFile.files[0].name);
    }
  });
  
  function updateFileName(name) {
    const p = dropZone.querySelector('p');
    p.textContent = name;
    p.style.color = '#10B981';
  }
  
  // Cover image handling
  coverPlaceholder.addEventListener('click', () => coverFile.click());
  
  coverFile.addEventListener('change', () => {
    if (coverFile.files.length > 0) {
      const file = coverFile.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        coverImage.src = e.target.result;
        coverImage.hidden = false;
        coverPlaceholder.hidden = true;
        removeCover.hidden = false;
      };
      reader.readAsDataURL(file);
    }
  });
  
  removeCover.addEventListener('click', (e) => {
    e.stopPropagation();
    coverFile.value = '';
    coverImage.src = '';
    coverImage.hidden = true;
    coverPlaceholder.hidden = false;
    removeCover.hidden = true;
  });
  
  // Submit upload
  const progressContainer = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const description = document.getElementById('book-description').value;
    
    if (!bookFile.files.length) {
      showToast('Please select a PDF file', 'error');
      return;
    }
    
    progressContainer.hidden = false;
    progressFill.style.width = '0%';
    progressText.textContent = 'Uploading...';
    
    const formData = new FormData();
    formData.append('book', bookFile.files[0]);
    if (coverFile.files.length) {
      formData.append('cover', coverFile.files[0]);
    }
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          progressFill.style.width = percent + '%';
          progressText.textContent = `Uploading... ${percent}%`;
        }
      });
      
      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          showToast('Book uploaded successfully!', 'success');
          closeModal();
          await loadBooks();
          await loadStats();
        } else {
          const data = JSON.parse(xhr.responseText);
          showToast(data.error || 'Upload failed', 'error');
        }
      });
      
      xhr.addEventListener('error', () => {
        showToast('Upload failed', 'error');
      });
      
      xhr.open('POST', '/api/books');
      xhr.send(formData);
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload failed', 'error');
    }
  });
  
  // Handle read and favorite buttons
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.btn-read')) {
      const btn = e.target.closest('.btn-read');
      window.location.href = `/read/${btn.dataset.id}`;
    }
    
    if (e.target.closest('.btn-favorite')) {
      const btn = e.target.closest('.btn-favorite');
      const bookId = btn.dataset.id;
      
      try {
        const response = await fetch(`/api/favorites/${bookId}`, {
          method: 'POST'
        });
        const data = await response.json();
        
        const svg = btn.querySelector('svg');
        if (data.favorited) {
          svg.setAttribute('fill', 'currentColor');
          btn.classList.add('active');
        } else {
          svg.setAttribute('fill', 'none');
          btn.classList.remove('active');
        }
        
        await loadStats();
      } catch (error) {
        console.error('Favorite error:', error);
      }
    }
  });
  
  // Initialize
  loadUserInfo();
  loadStats();
  loadBooks();
});
