// saint-gallery-module.js
'use strict';

const SaintGalleryModule = (() => {
  // Track current index in the saint links array
  let currentIndex = 0;
  let saintLinks = [];
  let galleryTabId = null;
  
  // Initialize the gallery in a new tab
  function initGallery() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['saintLinks'], (result) => {
        if (!result.saintLinks || result.saintLinks.length === 0) {
          console.error('No Saint links available to view');
          
          // Update gallery container with an error message
          const container = document.getElementById('gallery-container');
          if (container) {
            container.textContent = 'No Saint links available to view';
          }
          
          resolve(false);
          return;
        }
        
        saintLinks = result.saintLinks;
        currentIndex = 0;
        galleryTabId = chrome.tabs.getCurrent(function(tab) {
          return tab.id;
        });
        
        // Create a video element to display the content
        const container = document.getElementById('gallery-container');
        if (container) {
          container.innerHTML = `
            <iframe src="${saintLinks[0]}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>
          `;
        }
        
        // Add the controls to the page
        injectGalleryControls(document, currentIndex, saintLinks.length);
        resolve(true);
      });
    });
  }
  
 // Inject gallery controls into the Saint page
function injectGalleryControls(doc, index, totalLinks) {
    // Avoid re-creating controls if they already exist
    if (doc.getElementById('saint-gallery-controls')) {
      return;
    }
    
    // Create the control panel (same styling as before)
    const controlPanel = doc.createElement('div');
    controlPanel.id = 'saint-gallery-controls';
    controlPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 10px 20px;
      display: flex;
      gap: 15px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      align-items: center;
    `;
    
    // Create counter display
    const counter = doc.createElement('div');
    counter.id = 'gallery-counter';
    counter.textContent = `${index + 1} / ${totalLinks}`;
    counter.style.cssText = `
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    // Create navigation buttons
    const prevBtn = doc.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.style.cssText = `
      background-color: #ea4335;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    prevBtn.addEventListener('click', navigateToPrev);
    
    // Create download button
    const downloadBtn = doc.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.style.cssText = `
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    downloadBtn.addEventListener('click', downloadCurrentVideo);
    
    // Create next button
    const nextBtn = doc.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.style.cssText = `
      background-color: #34a853;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    nextBtn.addEventListener('click', navigateToNext);
    
    // Add all elements to the control panel
    controlPanel.appendChild(counter);
    controlPanel.appendChild(prevBtn);
    controlPanel.appendChild(downloadBtn);
    controlPanel.appendChild(nextBtn);
    
    // Add the control panel to the page
    doc.body.appendChild(controlPanel);
  }
  // Function to be injected into the Saint page
  function createGalleryControls(index, totalLinks) {
    // Avoid re-creating controls if they already exist
    if (document.getElementById('saint-gallery-controls')) {
      return;
    }
    
    // Create the control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'saint-gallery-controls';
    controlPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      padding: 10px 20px;
      display: flex;
      gap: 15px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      align-items: center;
    `;
    
    // Create counter display
    const counter = document.createElement('div');
    counter.id = 'gallery-counter';
    counter.textContent = `${index + 1} / ${totalLinks}`;
    counter.style.cssText = `
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
    `;
    
    // Create navigation buttons
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.style.cssText = `
      background-color: #ea4335;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    prevBtn.addEventListener('mouseover', () => {
      prevBtn.style.backgroundColor = '#d33426';
    });
    prevBtn.addEventListener('mouseout', () => {
      prevBtn.style.backgroundColor = '#ea4335';
    });
    prevBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'saintGalleryPrev' });
    });
    
    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.style.cssText = `
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    downloadBtn.addEventListener('mouseover', () => {
      downloadBtn.style.backgroundColor = '#3367d6';
    });
    downloadBtn.addEventListener('mouseout', () => {
      downloadBtn.style.backgroundColor = '#4285f4';
    });
    downloadBtn.addEventListener('click', downloadCurrentVideo);
    
    // Create next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.style.cssText = `
      background-color: #34a853;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 16px;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.2s;
    `;
    nextBtn.addEventListener('mouseover', () => {
      nextBtn.style.backgroundColor = '#2d9249';
    });
    nextBtn.addEventListener('mouseout', () => {
      nextBtn.style.backgroundColor = '#34a853';
    });
    nextBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'saintGalleryNext' });
    });
    
    // Add all elements to the control panel
    controlPanel.appendChild(counter);
    controlPanel.appendChild(prevBtn);
    controlPanel.appendChild(downloadBtn);
    controlPanel.appendChild(nextBtn);
    
    // Add the control panel to the page
    document.body.appendChild(controlPanel);
    
    // Function to download the video
    function downloadCurrentVideo() {
      // Find the source element with the mp4 link
      const sourceElement = document.querySelector('source[type="video/mp4"]');
      if (!sourceElement) {
        alert('Cannot find video source to download');
        return;
      }
      
      const videoUrl = sourceElement.getAttribute('src');
      if (!videoUrl) {
        alert('Cannot find video URL');
        return;
      }
      
      // Create a temporary anchor element for downloading
      const downloadLink = document.createElement('a');
      downloadLink.href = videoUrl;
      
      // Extract a filename from the URL
      const urlParts = videoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      downloadLink.download = filename;
      
      // Trigger the download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Provide visual feedback
      const originalText = downloadBtn.textContent;
      downloadBtn.textContent = 'Downloading...';
      downloadBtn.disabled = true;
      downloadBtn.style.backgroundColor = '#999';
      
      setTimeout(() => {
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        downloadBtn.style.backgroundColor = '#4285f4';
      }, 2000);
    }
  }
  
  // Navigate to the next saint link
  function navigateToNext() {
    currentIndex++;
    
    // Loop back to the beginning if we reach the end
    if (currentIndex >= saintLinks.length) {
      currentIndex = 0;
    }
    
    navigateToIndex(currentIndex);
  }
  
  // Navigate to the previous saint link
  function navigateToPrev() {
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
      alert('Cannot find iframe element');
      return;
    }
    
    const iframeSrc = iframe.src;
    
    // Provide immediate feedback
    const downloadBtn = document.querySelector('#saint-gallery-controls button:nth-child(3)');
    if (downloadBtn) {
      const originalText = downloadBtn.textContent;
      downloadBtn.textContent = 'Getting source...';
      downloadBtn.disabled = true;
      downloadBtn.style.backgroundColor = '#999';
    }
    
    // Since we can't directly access iframe content due to cross-origin restrictions,
    // we'll use chrome.tabs messaging to communicate with background.js
    chrome.runtime.sendMessage({
      action: 'downloadVideoFromIframe',
      iframeSrc: iframeSrc
    }, response => {
      if (response && response.success) {
        if (downloadBtn) {
          downloadBtn.textContent = 'Downloaded!';
          setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
            downloadBtn.style.backgroundColor = '#4285f4';
          }, 2000);
        }
      } else {
        if (downloadBtn) {
          downloadBtn.textContent = response.error || 'Download failed';
          setTimeout(() => {
            downloadBtn.textContent = originalText;
            downloadBtn.disabled = false;
            downloadBtn.style.backgroundColor = '#4285f4';
          }, 2000);
        }
        
        // Fallback: Try to open the iframe URL in a new tab
        alert('Could not extract video. Opening in new tab instead.');
        window.open(iframeSrc, '_blank');
      }
    });
  }
  
  // Navigate to a specific index
  function navigateToIndex(index) {
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.src = saintLinks[index];
      
      // Update counter
      const counter = document.getElementById('gallery-counter');
      if (counter) {
        counter.textContent = `${index + 1} / ${saintLinks.length}`;
      }
    }
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