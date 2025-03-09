'use strict';

// Function to send a message to the active tab
function sendMessageToActiveTab(message, callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error('No active tab found');
        return;
      }
      
      const activeTab = tabs[0];
      
      // Check if we can inject content scripts in this tab
      const url = activeTab.url || '';
      if (!url.startsWith('http')) {
        console.error('Cannot inject content script into this page');
        document.getElementById('status').textContent = 'Cannot run on this page type';
        return;
      }
      
      try {
        // First check if scripts need to be injected
        chrome.tabs.sendMessage(activeTab.id, { action: 'ping' }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('Content script not yet loaded, injecting...');
            
            // Inject all necessary scripts in the correct order
            chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['progress-indicator-module.js']
            }, () => {
              chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['sidebar-module.js']
              }, () => {
                chrome.scripting.executeScript({
                  target: { tabId: activeTab.id },
                  files: ['content.js']
                }, () => {
                  // Now wait a bit longer for full initialization
                  setTimeout(() => {
                    chrome.tabs.sendMessage(activeTab.id, message, (response) => {
                      if (chrome.runtime.lastError) {
                        console.error('Still could not connect after loading scripts:', chrome.runtime.lastError);
                        document.getElementById('status').textContent = 'Error connecting to page';
                      } else if (callback) {
                        callback(response);
                      }
                    });
                  }, 1500);
                });
              });
            });
          } else {
            // Content script is already loaded
            chrome.tabs.sendMessage(activeTab.id, message, callback);
          }
        });
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').textContent = 'Error communicating with page';
      }
    });
}
  
  

// Initialize the Saint Gallery module
function initializeSaintGallery() {
    // Add event listener for the gallery button
    document.getElementById('open-gallery-btn').addEventListener('click', () => {
      // Check if there are any Saint links first
      chrome.storage.local.get(['saintLinks'], (result) => {
        if (!result.saintLinks || result.saintLinks.length === 0) {
          setStatus('No Saint links available to view');
          return;
        }
        
        // Send a message to open the gallery
        chrome.runtime.sendMessage({ 
          action: 'openSaintGallery' 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error opening gallery:', chrome.runtime.lastError);
            
            // Fallback: Create a new tab and initialize gallery there
            chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
          } else if (response && response.success) {
            setStatus('Opening Saint Gallery');
          } else {
            setStatus('Failed to open gallery');
          }
        });
      });
    });
}

// Update the UI
function updateStats() {
    sendMessageToActiveTab({ action: 'getStats' }, (response) => {
      if (!response) return;
      
      document.getElementById('saint-count').textContent = response.saintLinks || 0;
      document.getElementById('file-count').textContent = response.fileLinks || 0;
      document.getElementById('redgifs-count').textContent = response.redgifsLinks || 0;
      document.getElementById('total-count').textContent = response.totalLinks || 0;
      
      // Update the gallery buttons state
      const galleryBtn = document.getElementById('open-gallery-btn');
      if (response.saintLinks > 0) {
        galleryBtn.disabled = false;
      } else {
        galleryBtn.disabled = true;
      }
      
      // Also update Bunkr gallery button
      updateBunkrGalleryButton();
    });
  }

// Set status message
function setStatus(message) {
  document.getElementById('status').textContent = message;
}

function initializeBunkrGallery() {
    // Add a new button to your popup.html
    const gallerySection = document.querySelector('.button-group');
    
    // Create a new button for Bunkr Gallery if it doesn't exist
    if (!document.getElementById('open-bunkr-gallery-btn')) {
      const bunkrGalleryBtn = document.createElement('button');
      bunkrGalleryBtn.id = 'open-bunkr-gallery-btn';
      bunkrGalleryBtn.className = 'feature';
      bunkrGalleryBtn.innerHTML = '<i class="fas fa-film"></i>Open Bunkr Gallery';
      
      // Insert after the Saint Gallery button
      const saintGalleryBtn = document.getElementById('open-gallery-btn');
      if (saintGalleryBtn && saintGalleryBtn.parentNode) {
        saintGalleryBtn.parentNode.insertBefore(bunkrGalleryBtn, saintGalleryBtn.nextSibling);
      } else {
        gallerySection.appendChild(bunkrGalleryBtn);
      }
      
      // Add event listener
      bunkrGalleryBtn.addEventListener('click', () => {
        // Check if there are any Bunkr links first
        chrome.storage.local.get(['fileLinks'], (result) => {
          const fileLinks = result.fileLinks || [];
          
          // Filter for bunkr links
          const bunkrLinks = fileLinks.filter(link => 
            link.includes('bunkr.') || 
            link.includes('bunkrr.') || 
            link.includes('bunker.')
          );
          
          if (bunkrLinks.length === 0) {
            setStatus('No Bunkr links available to view');
            return;
          }
          
          // Send a message to open the gallery
          chrome.runtime.sendMessage({ 
            action: 'openBunkrGallery' 
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error opening Bunkr gallery:', chrome.runtime.lastError);
              
              // Fallback: Create a new tab
              chrome.tabs.create({ url: chrome.runtime.getURL('bunkr-gallery.html') });
            } else if (response && response.success) {
              setStatus('Opening Bunkr Gallery');
            } else {
              setStatus('Failed to open gallery');
            }
          });
        });
      });
    }
    
    // Update button state based on available links
    updateBunkrGalleryButton();
  }
  

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Load delay setting
  chrome.storage.local.get('delay', (data) => {
    if (data.delay) {
      document.getElementById('delay-input').value = data.delay / 1000;
    }
  });
  
  // Update stats
  updateStats();
  
  // Initialize buttons
  document.getElementById('collect-btn').addEventListener('click', () => {
    setStatus('Collecting links...');
    sendMessageToActiveTab({ action: 'collectLinks' }, (response) => {
      if (response && response.message) {
        setStatus(response.message);
        updateStats();
      }
    });
  });
  
  document.getElementById('start-nav-btn').addEventListener('click', () => {
    setStatus('Starting auto-navigation...');
    sendMessageToActiveTab({ action: 'startNavigation' }, (response) => {
      if (response && response.message) {
        setStatus(response.message);
      }
    });
  });
  
  document.getElementById('stop-nav-btn').addEventListener('click', () => {
    setStatus('Stopping auto-navigation...');
    sendMessageToActiveTab({ action: 'stopNavigation' }, (response) => {
      if (response && response.message) {
        setStatus(response.message);
      }
    });
  });
  
  document.getElementById('toggle-sidebar-btn').addEventListener('click', () => {
    sendMessageToActiveTab({ action: 'toggleSidebar' }, () => {
      setStatus('Sidebar toggled');
    });
  });
  
  document.getElementById('download-btn').addEventListener('click', () => {
    chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (data) => {
      // Create text content
      const content = `
        # Forum Media Links Export
        Generated: ${new Date().toLocaleString()}

        ## Saint Links (${data.saintLinks?.length || 0})
        ${(data.saintLinks || []).join('\n')}

        ## File Host Links (${data.fileLinks?.length || 0})
        ${(data.fileLinks || []).join('\n')}

        ## RedGifs Links (${data.redgifsLinks?.length || 0})
        ${(data.redgifsLinks || []).join('\n')}
      `;
        
      // Create download
      const blob = new Blob([content], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'forum-media-links.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
        
      setStatus('Links downloaded');
    });
  });
  
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all collected links?')) {
      sendMessageToActiveTab({ action: 'clearLinks' }, (response) => {
        if (response && response.message) {
          setStatus(response.message);
          updateStats();
        }
      });
    }
  });
  
  // Update delay when changed
  document.getElementById('delay-input').addEventListener('change', function() {
    const seconds = parseInt(this.value);
    if (isNaN(seconds) || seconds < 1) {
      this.value = 3;
      return;
    }
    
    const delay = seconds * 1000;
    chrome.storage.local.set({ delay: delay });
    setStatus(`Delay set to ${seconds} seconds`);
  });
  
  // Initialize Saint Gallery module
  initializeSaintGallery();
  initializeBunkrGallery();
});

function updateBunkrGalleryButton() {
    const bunkrGalleryBtn = document.getElementById('open-bunkr-gallery-btn');
    if (!bunkrGalleryBtn) return;
    
    chrome.storage.local.get(['fileLinks'], (result) => {
      const fileLinks = result.fileLinks || [];
      
      // Filter for bunkr links
      const bunkrLinks = fileLinks.filter(link => 
        link.includes('bunkr.') || 
        link.includes('bunkrr.') || 
        link.includes('bunker.')
      );
      
      // Enable/disable based on presence of links
      bunkrGalleryBtn.disabled = bunkrLinks.length === 0;
    });
  }


// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStats') {
    document.getElementById('saint-count').textContent = request.stats.saintLinks || 0;
    document.getElementById('file-count').textContent = request.stats.fileLinks || 0;
    document.getElementById('redgifs-count').textContent = request.stats.redgifsLinks || 0;
    
    const totalCount = 
      (request.stats.saintLinks || 0) + 
      (request.stats.fileLinks || 0) + 
      (request.stats.redgifsLinks || 0);
    
    document.getElementById('total-count').textContent = totalCount;
    
    // Update the gallery button state
    const galleryBtn = document.getElementById('open-gallery-btn');
    if (request.stats.saintLinks > 0) {
      galleryBtn.disabled = false;
    } else {
      galleryBtn.disabled = true;
    }
  }
  return true;
});