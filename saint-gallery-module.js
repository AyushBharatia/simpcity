// saint-gallery-module.js - Enhanced version
'use strict';

const SaintGalleryModule = (() => {
  // Track current index in the saint links array
  let currentIndex = 0;
  let saintLinks = [];
  let galleryTabId = null;
  let isTransitioning = false;
  
  // Initialize the gallery in a new tab
  function initGallery() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['saintLinks'], (result) => {
        if (!result.saintLinks || result.saintLinks.length === 0) {
          console.error('No Saint links available to view');
          
          // Show empty state
          document.getElementById('gallery-container').style.display = 'none';
          document.getElementById('no-content').style.display = 'flex';
          
          resolve(false);
          return;
        }
        
        saintLinks = result.saintLinks;
        currentIndex = 0;
        galleryTabId = chrome.tabs.getCurrent(function(tab) {
          return tab ? tab.id : null;
        });
        
        // Create a video element to display the content
        const container = document.getElementById('gallery-container');
        if (container) {
          container.innerHTML = `
            <iframe src="${saintLinks[0]}" width="100%" height="90%" frameborder="0" allowfullscreen></iframe>
          `;
          
          // Add fade-in effect
          const iframe = container.querySelector('iframe');
          if (iframe) {
            iframe.style.opacity = '0';
            setTimeout(() => {
              iframe.style.opacity = '1';
            }, 100);
          }
        }
        
        // Add the controls to the page
        injectGalleryControls(document, currentIndex, saintLinks.length);
        
        // Add keyboard navigation
        setupKeyboardNavigation();
        
        resolve(true);
      });
    });
  }
  
  // Create and inject gallery controls
  function injectGalleryControls(doc, index, totalLinks) {
    // Avoid re-creating controls if they already exist
    if (doc.getElementById('saint-gallery-controls')) {
      return;
    }
    
    // Create the control panel
    const controlPanel = doc.createElement('div');
    controlPanel.id = 'saint-gallery-controls';
    
    // Create counter display
    const counter = doc.createElement('div');
    counter.id = 'gallery-counter';
    counter.textContent = `${index + 1} / ${totalLinks}`;
    
    // Create navigation buttons with icons
    const prevBtn = doc.createElement('button');
    prevBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Previous
    `;
    prevBtn.addEventListener('click', navigateToPrev);
    
    // Create download button
    const downloadBtn = doc.createElement('button');
    downloadBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Download
    `;
    downloadBtn.addEventListener('click', downloadCurrentVideo);
    
    // Create next button
    const nextBtn = doc.createElement('button');
    nextBtn.innerHTML = `
      Next
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    nextBtn.addEventListener('click', navigateToNext);
    
    // Add all elements to the control panel
    controlPanel.appendChild(counter);
    controlPanel.appendChild(prevBtn);
    controlPanel.appendChild(downloadBtn);
    controlPanel.appendChild(nextBtn);
    
    // Add the control panel to the page
    doc.body.appendChild(controlPanel);
    
    // Add fade-in animation
    controlPanel.style.opacity = '0';
    setTimeout(() => {
      controlPanel.style.opacity = '1';
    }, 300);
  }
  
  // Setup keyboard navigation
  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      if (isTransitioning) return;
      
      switch(event.key) {
        case 'ArrowLeft':
          navigateToPrev();
          break;
        case 'ArrowRight':
          navigateToNext();
          break;
        case 'd':
        case 'D':
          downloadCurrentVideo();
          break;
      }
    });
  }
  
  // Navigate to the next saint link
  function navigateToNext() {
    if (isTransitioning) return;
    
    currentIndex++;
    
    // Loop back to the beginning if we reach the end
    if (currentIndex >= saintLinks.length) {
      currentIndex = 0;
    }
    
    navigateToIndex(currentIndex);
  }
  
  // Navigate to the previous saint link
  function navigateToPrev() {
    if (isTransitioning) return;
    
    currentIndex--;
    
    // Loop to the end if we go below 0
    if (currentIndex < 0) {
      currentIndex = saintLinks.length - 1;
    }
    
    navigateToIndex(currentIndex);
  }

  // Function to download the current video
  function downloadCurrentVideo() {
    // Get the current iframe
    const iframe = document.querySelector('iframe');
    if (!iframe) {
      showNotification('Cannot find iframe element', 'error');
      return;
    }
    
    const iframeSrc = iframe.src;
    
    // Provide immediate feedback
    const downloadBtn = document.querySelector('#saint-gallery-controls button:nth-child(3)');
    if (downloadBtn) {
      const originalHtml = downloadBtn.innerHTML;
      downloadBtn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60 15"/>
        </svg>
        Getting source...
      `;
      downloadBtn.disabled = true;
    }
    
    // Since we can't directly access iframe content due to cross-origin restrictions,
    // we'll use chrome.tabs messaging to communicate with background.js
    chrome.runtime.sendMessage({
      action: 'downloadVideoFromIframe',
      iframeSrc: iframeSrc
    }, response => {
      if (response && response.success) {
        if (downloadBtn) {
          downloadBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Downloaded!
          `;
          setTimeout(() => {
            downloadBtn.innerHTML = originalHtml;
            downloadBtn.disabled = false;
          }, 2000);
        }
        
        showNotification('Download successful!', 'success');
      } else {
        if (downloadBtn) {
          downloadBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Failed
          `;
          setTimeout(() => {
            downloadBtn.innerHTML = originalHtml;
            downloadBtn.disabled = false;
          }, 2000);
        }
        
        showNotification(response.error || 'Download failed', 'error');
        
        // Fallback: Try to open the iframe URL in a new tab
        if (confirm('Could not extract video. Open in new tab instead?')) {
          window.open(iframeSrc, '_blank');
        }
      }
    });
  }
  
  // Navigate to a specific index with transition
  function navigateToIndex(index) {
    isTransitioning = true;
    
    const iframe = document.querySelector('iframe');
    if (iframe) {
      // Fade out
      iframe.style.opacity = '0';
      
      setTimeout(() => {
        // Change source
        iframe.src = saintLinks[index];
        
        // Update counter
        const counter = document.getElementById('gallery-counter');
        if (counter) {
          counter.textContent = `${index + 1} / ${saintLinks.length}`;
        }
        
        // Fade in
        setTimeout(() => {
          iframe.style.opacity = '1';
          isTransitioning = false;
        }, 300);
      }, 300);
    } else {
      isTransitioning = false;
    }
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    // Check if notification container exists, create if not
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
      `;
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      background-color: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : '#4285f4'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      font-size: 14px;
      transform: translateX(120%);
      transition: transform 0.3s ease;
    `;
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
      icon = '<svg width="16" height="16" style="margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else if (type === 'error') {
      icon = '<svg width="16" height="16" style="margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
      icon = '<svg width="16" height="16" style="margin-right: 8px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    
    notification.innerHTML = `${icon}${message}`;
    
    // Add notification to container
    notificationContainer.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove notification after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(120%)';
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Set up message listeners
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saintGalleryNext') {
      navigateToNext();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'saintGalleryPrev') {
      navigateToPrev();
      sendResponse({ success: true });
      return true;
    }
    
    if (request.action === 'openSaintGallery') {
      initGallery().then(success => {
        sendResponse({ success });
      });
      return true; // Keep the message channel open for async response
    }
  });
  
  // Public API
  return {
    initialize: () => {
      return {
        openGallery: initGallery
      };
    }
  };
})();

// Make the module accessible globally
window.SaintGalleryModule = SaintGalleryModule;