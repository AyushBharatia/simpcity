'use strict';

// Progress Indicator Module for Forum Media Link Collector
const ProgressModule = (() => {
  // Private variables
  let progressElement = null;
  let currentPage = 1;
  let totalPages = null;
  let isVisible = false;
  
  // Create progress indicator element
  function createProgressIndicator() {
    if (progressElement) return progressElement;
    
    progressElement = document.createElement('div');
    progressElement.id = 'media-links-progress';
    progressElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: opacity 0.3s ease;
    `;
    
    const text = document.createElement('span');
    text.id = 'progress-text';
    text.textContent = 'Page 1';
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s linear infinite;
    `;
    
    // Add keyframes for spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    const stopBtn = document.createElement('button');
    stopBtn.textContent = '■';
    stopBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 12px;
      cursor: pointer;
      padding: 0;
      margin-left: 5px;
    `;
    stopBtn.addEventListener('click', () => {
      localStorage.removeItem('mediaCollectorActive');
      chrome.runtime.sendMessage({ action: 'stopNavigation' });
    });
    
    progressElement.appendChild(spinner);
    progressElement.appendChild(text);
    progressElement.appendChild(stopBtn);
    
    document.body.appendChild(progressElement);
    
    return progressElement;
  }
  
  // Estimate total pages if possible
  function estimateTotalPages() {
    let totalEstimate = null;
    
    // Try to find pagination elements
    const paginationElements = document.querySelectorAll('.pageNav-main');
    if (paginationElements.length > 0) {
      const pages = paginationElements[0].querySelectorAll('a, span');
      let maxPage = 0;
      
      pages.forEach(page => {
        const pageNum = parseInt(page.textContent);
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      });
      
      if (maxPage > 0) {
        totalEstimate = maxPage;
      }
    }
    
    return totalEstimate;
  }
  
  // Update progress information
  function updateProgress(page, total = null) {
    if (!progressElement) createProgressIndicator();
    
    currentPage = page || currentPage;
    totalPages = total || totalPages || estimateTotalPages();
    
    const text = document.getElementById('progress-text');
    if (text) {
      if (totalPages) {
        text.textContent = `Page ${currentPage} of ${totalPages}`;
      } else {
        text.textContent = `Page ${currentPage}`;
      }
    }
    
    // Save the current progress to localStorage
    const progressData = { currentPage, totalPages };
    localStorage.setItem('mediaCollectorProgress', JSON.stringify(progressData));
  }
  
  // Show progress indicator
  function show() {
    if (!progressElement) createProgressIndicator();
    isVisible = true;
    progressElement.style.opacity = '1';
    localStorage.setItem('mediaCollectorActive', 'true');
  }
  
  // Hide progress indicator
  function hide() {
    if (!progressElement) return;
    isVisible = false;
    progressElement.style.opacity = '0';
    localStorage.removeItem('mediaCollectorActive');
  }
  
  // Extract current page number from URL if possible
  function getCurrentPageFromUrl() {
    const url = window.location.href;
    const pageMatch = url.match(/page[=-](\d+)/i);
    if (pageMatch && pageMatch[1]) {
      return parseInt(pageMatch[1]);
    }
    return 1;
  }
  
  // Public API
  return {
    initialize: () => {
      const pageNumber = getCurrentPageFromUrl();
      createProgressIndicator();
      
      // Check if we should restore the progress indicator state
      const isActive = localStorage.getItem('mediaCollectorActive') === 'true';
      
      // Try to restore progress from localStorage
      try {
        const savedProgress = JSON.parse(localStorage.getItem('mediaCollectorProgress') || '{}');
        if (savedProgress.currentPage) {
          updateProgress(pageNumber, savedProgress.totalPages);
        } else {
          updateProgress(pageNumber);
        }
      } catch (e) {
        updateProgress(pageNumber);
      }
      
      // Show indicator if it was active
      if (isActive) {
        show();
      } else {
        hide();
      }
      
      return {
        show,
        hide,
        updateProgress,
        getCurrentPage: () => currentPage
      };
    }
  };
})();

// Export the module
if (typeof module !== 'undefined') {
  module.exports = ProgressModule;
}