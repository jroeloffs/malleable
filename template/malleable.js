/**
 * Malleable Micro Magazine
 * Navigation and interaction controller
 * Version 1.0
 */

(function() {
  'use strict';

  // State
  let currentPage = 0;
  let totalPages = 0;
  let hasInteracted = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let lastTouchEnd = 0; // Tracks last touch to prevent double-firing

  // Elements
  let magazine;
  let pages;
  let pagesContainer;
  let progressBar;
  let navHint;

  // Configuration
  const SWIPE_THRESHOLD = 50;
  const SWIPE_TIME_LIMIT = 300;
  const TAP_ZONE_WIDTH = 0.35; // 35% of container width for tap zones
  const TOUCH_CLICK_DELAY = 300; // Delay to prevent touch+click double-firing

  /**
   * Initialise the magazine
   */
  function init() {
    magazine = document.querySelector('.magazine');
    if (!magazine) return;

    pages = Array.from(document.querySelectorAll('.page'));
    pagesContainer = document.querySelector('.pages');
    progressBar = document.querySelector('.progress-bar');
    navHint = document.querySelector('.nav-hint');
    totalPages = pages.length;

    if (totalPages === 0) return;

    // Set frame colour from data attribute
    const frameColour = magazine.dataset.frameColour;
    if (frameColour) {
      document.documentElement.style.setProperty('--frame-colour', frameColour);
    }

    // Bind events
    bindEvents();

    // Show first page
    goToPage(0);

    // Auto-play videos on cover
    playVideosOnPage(0);
  }

  /**
   * Bind all event listeners
   */
  function bindEvents() {
    // Touch events
    magazine.addEventListener('touchstart', handleTouchStart, { passive: true });
    magazine.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Click events (for desktop)
    magazine.addEventListener('click', handleClick);

    // Keyboard navigation
    document.addEventListener('keydown', handleKeydown);

    // Prevent context menu on long press
    magazine.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle touch start
   */
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }

  /**
   * Handle touch end
   */
  function handleTouchEnd(e) {
    lastTouchEnd = Date.now();

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const deltaTime = touchEndTime - touchStartTime;

    // Check if it's a swipe
    if (Math.abs(deltaX) > SWIPE_THRESHOLD &&
        Math.abs(deltaX) > Math.abs(deltaY) &&
        deltaTime < SWIPE_TIME_LIMIT) {
      // Swipe detected
      if (deltaX < 0) {
        nextPage();
      } else {
        prevPage();
      }
      return;
    }

    // Otherwise treat as tap - calculate relative to magazine container
    const rect = pagesContainer ? pagesContainer.getBoundingClientRect() : magazine.getBoundingClientRect();
    const relativeX = touchEndX - rect.left;
    const containerWidth = rect.width;

    if (relativeX < containerWidth * TAP_ZONE_WIDTH) {
      prevPage();
    } else if (relativeX > containerWidth * (1 - TAP_ZONE_WIDTH)) {
      nextPage();
    }
    // Middle tap does nothing (allows interaction with content)
  }

  /**
   * Handle click (desktop)
   */
  function handleClick(e) {
    // Ignore if clicking a link or button
    if (e.target.closest('a, button')) return;

    // Prevent double-firing after touch events on hybrid devices
    if (Date.now() - lastTouchEnd < TOUCH_CLICK_DELAY) return;

    // Calculate relative to magazine container, not window
    const rect = pagesContainer ? pagesContainer.getBoundingClientRect() : magazine.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const containerWidth = rect.width;

    if (relativeX < containerWidth * TAP_ZONE_WIDTH) {
      prevPage();
    } else if (relativeX > containerWidth * (1 - TAP_ZONE_WIDTH)) {
      nextPage();
    }
  }

  /**
   * Handle keyboard navigation
   */
  function handleKeydown(e) {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextPage();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevPage();
        break;
      case 'Home':
        e.preventDefault();
        goToPage(0);
        break;
      case 'End':
        e.preventDefault();
        goToPage(totalPages - 1);
        break;
    }
  }

  /**
   * Go to next page
   */
  function nextPage() {
    if (currentPage < totalPages - 1) {
      goToPage(currentPage + 1);
    }
    hideHints();
  }

  /**
   * Go to previous page
   */
  function prevPage() {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
    hideHints();
  }

  /**
   * Go to specific page
   */
  function goToPage(index) {
    if (index < 0 || index >= totalPages) return;

    // Pause videos on current page
    pauseVideosOnPage(currentPage);

    // Update classes
    pages.forEach((page, i) => {
      page.classList.toggle('active', i === index);
    });

    currentPage = index;

    // Update progress bar
    updateProgress();

    // Play videos on new page
    playVideosOnPage(index);
  }

  /**
   * Update progress bar
   */
  function updateProgress() {
    if (!progressBar) return;
    const progress = ((currentPage + 1) / totalPages) * 100;
    progressBar.style.width = progress + '%';
  }

  /**
   * Hide navigation hints after first interaction
   */
  function hideHints() {
    if (!hasInteracted && navHint) {
      hasInteracted = true;
      navHint.classList.add('hidden');
    }
  }

  /**
   * Play videos on a specific page
   */
  function playVideosOnPage(index) {
    const page = pages[index];
    if (!page) return;

    const videos = page.querySelectorAll('video');
    videos.forEach(video => {
      video.play().catch(() => {
        // Autoplay blocked, that's fine
      });
    });
  }

  /**
   * Pause videos on a specific page
   */
  function pauseVideosOnPage(index) {
    const page = pages[index];
    if (!page) return;

    const videos = page.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
    });
  }

  // Initialise when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
