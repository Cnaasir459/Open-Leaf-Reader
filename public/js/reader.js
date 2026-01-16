// Reader Module with PDF.js and Page Flipping
document.addEventListener('DOMContentLoaded', () => {
  // Configure PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/lib/pdf.worker.min.js';
  
  // DOM Elements
  const bookTitle = document.getElementById('book-title');
  const bookAuthor = document.getElementById('book-author');
  const backBtn = document.getElementById('back-btn');
  const bookContainer = document.getElementById('book-container');
  const book = document.getElementById('book');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const pageInput = document.getElementById('page-input');
  const pageSlider = document.getElementById('page-slider');
  const totalPagesSpan = document.getElementById('total-pages');
  const loadingOverlay = document.getElementById('loading-overlay');
  const favoriteBtn = document.getElementById('favorite-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const readerHeader = document.getElementById('reader-header');
  const toast = document.getElementById('toast');
  
  // State
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let bookId = null;
  let isFlipping = false;
  let hideHeaderTimeout = null;
  
  // Get book ID from URL
  const pathParts = window.location.pathname.split('/');
  bookId = pathParts[pathParts.length - 1];
  
  // Toast notification
  function showToast(message, type = '') {
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  
  // Show/hide loading
  function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
  }
  
  // Header auto-hide
  function resetHeaderTimeout() {
    clearTimeout(hideHeaderTimeout);
    readerHeader.classList.remove('hidden');
    hideHeaderTimeout = setTimeout(() => {
      readerHeader.classList.add('hidden');
    }, 3000);
  }
  
  bookContainer.addEventListener('mousemove', resetHeaderTimeout);
  document.addEventListener('keydown', resetHeaderTimeout);
  
  // Load book
  async function loadBook() {
    showLoading(true);
    
    try {
      // Get book info
      const bookResponse = await fetch(`/api/books/${bookId}`);
      if (!bookResponse.ok) {
        throw new Error('Book not found');
      }
      const bookData = await bookResponse.json();
      
      bookTitle.textContent = bookData.book.title;
      bookAuthor.textContent = `by ${bookData.book.title}`;
      
      // Update favorite button
      if (bookData.book.is_favorite) {
        favoriteBtn.classList.add('active');
      }
      
      // Load reading progress
      const progressResponse = await fetch(`/api/progress/${bookId}`);
      const progressData = await progressResponse.json();
      currentPage = progressData.progress.current_page || 1;
      
      // Load PDF
      const pdfPath = bookData.book.file_path;
      const loadingTask = pdfjsLib.getDocument(pdfPath);
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;
      
      // Update UI
      totalPagesSpan.textContent = totalPages;
      pageInput.max = totalPages;
      pageSlider.max = totalPages;
      pageInput.value = currentPage;
      pageSlider.value = currentPage;
      
      // Render pages
      await renderPages();
      
      // Show first page
      await goToPage(currentPage);
      
      showLoading(false);
      
      // Save initial load to progress
      saveProgress();
      
    } catch (error) {
      console.error('Error loading book:', error);
      showToast('Failed to load book', 'error');
      showLoading(false);
    }
  }
  
  // Render page as canvas
  async function renderPage(pageNum) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Get viewport with scale
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      return canvas;
    } catch (error) {
      console.error('Error rendering page:', error);
      return null;
    }
  }
  
  // Create page element
  function createPageElement(canvas, pageNum) {
    const page = document.createElement('div');
    page.className = 'page';
    page.dataset.page = pageNum;
    
    const content = document.createElement('div');
    content.className = 'page-content';
    content.appendChild(canvas);
    
    page.appendChild(content);
    
    return page;
  }
  
  // Render both pages (left and right)
  async function renderPages() {
    book.innerHTML = '';
    
    // Render current page
    const leftCanvas = await renderPage(currentPage);
    if (leftCanvas) {
      const leftPage = createPageElement(leftCanvas, currentPage);
      leftPage.style.zIndex = 1;
      leftPage.style.left = '0';
      book.appendChild(leftPage);
      
      // Add navigation zones
      const prevZone = document.createElement('div');
      prevZone.className = 'page-nav-zone prev';
      prevZone.addEventListener('click', () => flipPrev());
      leftPage.appendChild(prevZone);
    }
    
    // Render next page if exists
    if (currentPage < totalPages) {
      const rightCanvas = await renderPage(currentPage + 1);
      if (rightCanvas) {
        const rightPage = createPageElement(rightCanvas, currentPage + 1);
        rightPage.style.zIndex = 0;
        rightPage.style.left = '400px';
        book.appendChild(rightPage);
        
        const nextZone = document.createElement('div');
        nextZone.className = 'page-nav-zone next';
        nextZone.addEventListener('click', () => flipNext());
        rightPage.appendChild(nextZone);
      }
    }
    
    updateNavigation();
  }
  
  // Flip to next page with animation
  async function flipNext() {
    if (isFlipping || currentPage >= totalPages) return;
    isFlipping = true;
    
    const leftPage = book.querySelector('.page[data-page="' + currentPage + '"]');
    const rightPage = book.querySelector('.page[data-page="' + (currentPage + 1) + '"]');
    
    if (leftPage && rightPage) {
      // Animate the flip
      rightPage.style.transform = 'rotateY(0deg)';
      rightPage.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      rightPage.style.transformOrigin = 'left center';
      
      // Force reflow
      rightPage.offsetHeight;
      
      // Start flip
      rightPage.style.transform = 'rotateY(-180deg)';
      
      setTimeout(async () => {
        currentPage += 2;
        if (currentPage > totalPages) currentPage = totalPages;
        
        await renderPages();
        await goToPage(currentPage);
        isFlipping = false;
      }, 600);
    } else {
      isFlipping = false;
    }
  }
  
  // Flip to previous page with animation
  async function flipPrev() {
    if (isFlipping || currentPage <= 1) return;
    isFlipping = true;
    
    const currentLeftPage = book.querySelector('.page[data-page="' + currentPage + '"]');
    const currentRightPage = book.querySelector('.page[data-page="' + (currentPage + 1) + '"]');
    
    if (currentLeftPage) {
      // Prepare new pages for previous
      const newLeftPageNum = currentPage - 2;
      const newRightPageNum = currentPage - 1;
      
      // Create new pages
      if (newLeftPageNum >= 1) {
        const leftCanvas = await renderPage(newLeftPageNum);
        if (leftCanvas) {
          const newLeftPage = createPageElement(leftCanvas, newLeftPageNum);
          newLeftPage.style.zIndex = 0;
          newLeftPage.style.left = '0';
          newLeftPage.style.transform = 'rotateY(-180deg)';
          newLeftPage.style.transition = 'none';
          book.insertBefore(newLeftPage, currentLeftPage);
          
          // Add navigation zone
          const prevZone = document.createElement('div');
          prevZone.className = 'page-nav-zone prev';
          prevZone.addEventListener('click', () => flipPrev());
          newLeftPage.appendChild(prevZone);
        }
      }
      
      if (newRightPageNum >= 1) {
        const rightCanvas = await renderPage(newRightPageNum);
        if (rightCanvas) {
          const newRightPage = createPageElement(rightCanvas, newRightPageNum);
          newRightPage.style.zIndex = 1;
          newRightPage.style.left = '400px';
          newRightPage.style.transform = 'rotateY(0deg)';
          book.insertBefore(newRightPage, currentLeftPage);
          
          // Add navigation zone
          const nextZone = document.createElement('div');
          nextZone.className = 'page-nav-zone next';
          nextZone.addEventListener('click', () => flipNext());
          newRightPage.appendChild(nextZone);
        }
      }
      
      // Force reflow
      book.offsetHeight;
      
      // Animate
      const newPages = book.querySelectorAll('.page');
      newPages.forEach(page => {
        page.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
      });
      
      setTimeout(() => {
        const leftPage = book.querySelector('.page[data-page="' + newLeftPageNum + '"]');
        const rightPage = book.querySelector('.page[data-page="' + newRightPageNum + '"]');
        
        if (leftPage) leftPage.style.transform = 'rotateY(0deg)';
        if (rightPage) rightPage.style.transform = 'rotateY(-180deg)';
        
        setTimeout(async () => {
          currentPage = Math.max(1, currentPage - 2);
          await renderPages();
          await goToPage(currentPage);
          isFlipping = false;
        }, 600);
      }, 50);
    } else {
      isFlipping = false;
    }
  }
  
  // Go to specific page (no animation)
  async function goToPage(pageNum) {
    pageNum = Math.max(1, Math.min(pageNum, totalPages));
    currentPage = pageNum;
    
    pageInput.value = currentPage;
    pageSlider.value = currentPage;
    
    await renderPages();
    updateNavigation();
    saveProgress();
  }
  
  // Update navigation buttons
  function updateNavigation() {
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }
  
  // Save reading progress
  async function saveProgress() {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          currentPage,
          totalPages
        })
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  
  // Event Listeners
  prevBtn.addEventListener('click', flipPrev);
  nextBtn.addEventListener('click', flipNext);
  
  pageInput.addEventListener('change', () => {
    const page = parseInt(pageInput.value);
    if (page >= 1 && page <= totalPages) {
      goToPage(page);
    } else {
      pageInput.value = currentPage;
    }
  });
  
  pageSlider.addEventListener('input', () => {
    const page = parseInt(pageSlider.value);
    if (page !== currentPage) {
      // For slider, just go to page without animation
      currentPage = page;
      pageInput.value = currentPage;
      renderPages();
      updateNavigation();
      saveProgress();
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      flipPrev();
    } else if (e.key === 'ArrowRight') {
      flipNext();
    } else if (e.key === 'Escape') {
      window.location.href = '/dashboard';
    }
  });
  
  // Back button
  backBtn.addEventListener('click', () => {
    window.location.href = '/dashboard';
  });
  
  // Favorite button
  favoriteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`/api/favorites/${bookId}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.favorited) {
        favoriteBtn.classList.add('active');
        showToast('Added to favorites', 'success');
      } else {
        favoriteBtn.classList.remove('active');
        showToast('Removed from favorites', '');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  });
  
  // Fullscreen button
  fullscreenBtn.addEventListener('click', () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  });
  
  // Settings button
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.toggle('active');
  });
  
  // Close settings when clicking outside
  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
      settingsPanel.classList.remove('active');
    }
  });
  
  // Font size controls
  let fontSize = 16;
  document.getElementById('font-increase').addEventListener('click', () => {
    if (fontSize < 24) {
      fontSize += 2;
      document.getElementById('font-size-value').textContent = fontSize + 'px';
      bookContainer.style.filter = `brightness(${50 + fontSize}%)`;
    }
  });
  
  document.getElementById('font-decrease').addEventListener('click', () => {
    if (fontSize > 12) {
      fontSize -= 2;
      document.getElementById('font-size-value').textContent = fontSize + 'px';
      bookContainer.style.filter = `brightness(${50 + fontSize}%)`;
    }
  });
  
  // Initialize
  loadBook();
});
