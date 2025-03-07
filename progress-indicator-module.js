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
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(33, 33, 33, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 30px;
      font-family: 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
      opacity: 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Create status icon/spinner
    const statusContainer = document.createElement('div');
    statusContainer.style.cssText = `
      position: relative;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      border-top-color: #4285f4;
      border-left-color: #4285f4;
      animation: spin 1s linear infinite;
    `;
    
    statusContainer.appendChild(spinner);
    
    // Create text container
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      display: flex;
      flex-direction: column;
    `;
    
    const text = document.createElement('span');
    text.id = 'progress-text';
    text.textContent = 'Page 1';
    text.style.fontWeight = '500';
    
    const subtext = document.createElement('span');
    subtext.id = 'progress-subtext';
    subtext.textContent = 'Collecting links...';
    subtext.style.cssText = `
      font-size: 11px;
      opacity: 0.8;
    `;
    
    textContainer.appendChild(text);
    textContainer.appendChild(subtext);
    
    // Create control buttons
    const controlsContainer = document.createElement('div');
    controlsContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 5px;
    `;
    
    const pauseBtn = document.createElement('button');
    pauseBtn.id = 'progress-pause';
    pauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    pauseBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 3px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;
    pauseBtn.addEventListener('mouseover', () => {
      pauseBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    pauseBtn.addEventListener('mouseout', () => {
      pauseBtn.style.backgroundColor = 'transparent';
    });
    pauseBtn.addEventListener('click', () => {
      // Implementation for pause functionality could be added here
      // For now, it will just stop
      localStorage.removeItem('mediaCollectorActive');
      chrome.runtime.sendMessage({ action: 'stopNavigation' });
    });
    
    const stopBtn = document.createElement('button');
    stopBtn.id = 'progress-stop';
    stopBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
    stopBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 3px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    `;
    stopBtn.addEventListener('mouseover', () => {
      stopBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    stopBtn.addEventListener('mouseout', () => {
      stopBtn.style.backgroundColor = 'transparent';
    });
    stopBtn.addEventListener('click', () => {
      localStorage.removeItem('mediaCollectorActive');
      chrome.runtime.sendMessage({ action: 'stopNavigation' });
    });
    
    controlsContainer.appendChild(pauseBtn);
    controlsContainer.appendChild(stopBtn);
    
    // Add keyframes for spinner
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px) translateX(-50%); }
        to { opacity: 1; transform: translateY(0) translateX(-50%); }
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    // Assemble the progress indicator
    progressElement.appendChild(statusContainer);
    progressElement.appendChild(textContainer);
    progressElement.appendChild(controlsContainer);
    
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
  
  // Update stats and link counts
  function updateLinkStats() {
    chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (result) => {
      const totalLinks = 
        (result.saintLinks?.length || 0) + 
        (result.fileLinks?.length || 0) + 
        (result.redgifsLinks?.length || 0);
      
      const subtext = document.getElementById('progress-subtext');
      if (subtext) {
        subtext.textContent = `Collected ${totalLinks} links so far`;
      }
    });
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
    
    // Update link stats
    updateLinkStats();
    
    // Save the current progress to localStorage
    const progressData = { currentPage, totalPages };
    localStorage.setItem('mediaCollectorProgress', JSON.stringify(progressData));
    
    // Add a pulse animation when updating
    progressElement.style.animation = 'pulse 0.3s ease-in-out';
    setTimeout(() => {
      progressElement.style.animation = '';
    }, 300);
  }
  
  // Show progress indicator
  function show() {
    if (!progressElement) createProgressIndicator();
    isVisible = true;
    progressElement.style.opacity = '1';
    progressElement.style.animation = 'fadeIn 0.3s forwards';
    localStorage.setItem('mediaCollectorActive', 'true');
  }
  
  // Hide progress indicator
  function hide() {
    if (!progressElement) return;
    isVisible = false;
    progressElement.style.opacity = '0';
    progressElement.style.transform = 'translateY(10px) translateX(-50%)';
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