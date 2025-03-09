'use strict';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Forum Media Link Collector extension installed');
  
  // Initialize storage with default values
  chrome.storage.local.get(
    ['saintLinks', 'fileLinks', 'redgifsLinks', 'delay', 'autoNavigationActive'], 
    (result) => {
      // Only set defaults if they don't exist
      const defaults = {};
      
      if (!result.saintLinks) defaults.saintLinks = [];
      if (!result.fileLinks) defaults.fileLinks = [];
      if (!result.redgifsLinks) defaults.redgifsLinks = [];
      if (!result.delay) defaults.delay = 3000;
      if (result.autoNavigationActive === undefined) defaults.autoNavigationActive = false;
      
      if (Object.keys(defaults).length > 0) {
        chrome.storage.local.set(defaults);
      }
    }
  );
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({ tab: tabs[0] });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
  }


// Handle Saint Gallery Navigation

if (request.action === 'saintGalleryNext'){
  // handeled by saintgallerymodule 
  return true;
}

if (request.action === 'openSaintGallery'){
  // Create a new tab with your extension's HTML page
  chrome.tabs.create({ url: chrome.runtime.getURL('gallery.html') });
  sendResponse({ success: true });
  return true;
}

if (request.action === 'downloadVideoFromIframe') {
  const iframeSrc = request.iframeSrc;
  
  // Create a new tab to load the iframe source directly
  chrome.tabs.create({ url: iframeSrc, active: false }, (tab) => {
    // Wait for the tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === tab.id && changeInfo.status === 'complete') {
        // Remove the listener
        chrome.tabs.onUpdated.removeListener(listener);
        
        // Execute our script to find the video source
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Look for video elements with source tags
            const videoSources = document.querySelectorAll('video source[type="video/mp4"]');
            if (videoSources.length > 0) {
              return videoSources[0].src;
            }
            
            // If no source tags, look for video elements with src attribute
            const videos = document.querySelectorAll('video[src]');
            if (videos.length > 0) {
              return videos[0].src;
            }
            
            // Look for other possible video sources
            const videoPlayers = document.querySelectorAll('video');
            if (videoPlayers.length > 0 && videoPlayers[0].currentSrc) {
              return videoPlayers[0].currentSrc;
            }
            
            return null;
          }
        }, (results) => {
          const videoSrc = results && results[0] && results[0].result;
          
          if (videoSrc) {
            // Download the video
            chrome.downloads.download({
              url: videoSrc,
              filename: videoSrc.split('/').pop() || 'video.mp4',
              saveAs: false
            }, () => {
              // Close the temporary tab
              chrome.tabs.remove(tab.id);
              sendResponse({ success: true });
            });
          } else {
            // Close the temporary tab
            chrome.tabs.remove(tab.id);
            sendResponse({ success: false, error: 'Could not find video source' });
          }
        });
      }
    });
  });
  
  return true; // Keep the message channel open for async response
}

// Add these new handlers to your background.js file

// Handle direct video download with custom headers
if (request.action === 'downloadVideo') {
  console.log('Download video request received for:', request.url);
  
  // For Bunkr videos, we need to set specific headers
  if (request.url.includes('bunkr.') || request.url.includes('bunkrr.') || request.url.includes('bunker.')) {
    // Create headers for the fetch request
    const headers = new Headers({
      'Referer': request.referer || 'https://bunkr.cr/',
      'Range': 'bytes=0-',
      'User-Agent': navigator.userAgent
    });
    
    // First, fetch the URL to ensure it's accessible
    fetch(request.url, {
      method: 'GET',
      headers: headers,
      credentials: 'omit', // Don't send cookies for cross-origin requests
      mode: 'cors'  // Attempt a CORS request
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Now start the download with Chrome's API
      chrome.downloads.download({
        url: request.url,
        filename: request.filename || 'bunkr-video.mp4',
        headers: [
          { name: 'Referer', value: request.referer || 'https://bunkr.cr/' },
          { name: 'Range', value: 'bytes=0-' }
        ],
        saveAs: false
      }, downloadId => {
        if (chrome.runtime.lastError) {
          console.error('Download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Download started with ID:', downloadId);
          sendResponse({ success: true, downloadId });
        }
      });
    })
    .catch(error => {
      console.error('Fetch error:', error);
      
      // Try alternative download method without pre-fetch
      chrome.downloads.download({
        url: request.url,
        filename: request.filename || 'bunkr-video.mp4',
        headers: [
          { name: 'Referer', value: request.referer || 'https://bunkr.cr/' },
          { name: 'Range', value: 'bytes=0-' }
        ],
        saveAs: false
      }, downloadId => {
        if (chrome.runtime.lastError) {
          console.error('Alternative download error:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Alternative download started with ID:', downloadId);
          sendResponse({ success: true, downloadId });
        }
      });
    });
  } else {
    // For non-Bunkr videos, just use the standard download
    chrome.downloads.download({
      url: request.url,
      filename: request.filename || 'video.mp4',
      saveAs: false
    }, downloadId => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Download started with ID:', downloadId);
        sendResponse({ success: true, downloadId });
      }
    });
  }
  
  return true; // Keep the message channel open for async response
}

// Inject network monitor content script into a tab
if (request.action === 'injectNetworkMonitor') {
  if (request.tabId) {
    console.log('Injecting network monitor into tab:', request.tabId);
    
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      func: () => {
        console.log('Network monitor script executing');
        
        // Function to detect and report video URLs
        function reportVideoUrl(url) {
          if (typeof url === 'string' && 
              (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm')) &&
              (url.includes('bunkr.') || url.includes('bunkrr.') || url.includes('bunker.'))) {
            console.log('Video URL detected:', url);
            
            // Send to extension via postMessage
            window.postMessage({ action: 'videoUrlDetected', url: url }, '*');
            
            // Also send via Chrome runtime
            try {
              chrome.runtime.sendMessage({ action: 'videoUrlDetected', url: url });
            } catch (e) {
              console.log('Could not send runtime message:', e);
            }
          }
        }
        
        // Create a proxy for XMLHttpRequest to capture video URLs
        const origXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
          const xhr = new origXHR();
          const originalOpen = xhr.open;
          
          xhr.open = function() {
            const url = arguments[1];
            reportVideoUrl(url);
            return originalOpen.apply(this, arguments);
          };
          
          return xhr;
        };
        
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(input) {
          const url = typeof input === 'string' ? input : input.url;
          reportVideoUrl(url);
          return originalFetch.apply(this, arguments);
        };
        
        // Look for video elements
        const videoObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.addedNodes) {
              mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'VIDEO') {
                  // Check video src
                  if (node.src) reportVideoUrl(node.src);
                  
                  // Check source elements
                  if (node.querySelectorAll) {
                    const sources = node.querySelectorAll('source');
                    sources.forEach(source => {
                      if (source.src) reportVideoUrl(source.src);
                    });
                  }
                  
                  // Monitor for src changes
                  node.addEventListener('loadedmetadata', () => {
                    if (node.currentSrc) reportVideoUrl(node.currentSrc);
                    if (node.src) reportVideoUrl(node.src);
                  });
                }
              });
            }
          });
        });
        
        // Start observing
        videoObserver.observe(document, { childList: true, subtree: true });
        
        // Check existing videos
        document.querySelectorAll('video').forEach(video => {
          if (video.currentSrc) reportVideoUrl(video.currentSrc);
          if (video.src) reportVideoUrl(video.src);
          
          video.querySelectorAll('source').forEach(source => {
            if (source.src) reportVideoUrl(source.src);
          });
        });
        
        // Also monitor network requests using Performance API
        if (PerformanceObserver) {
          try {
            const observer = new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                  reportVideoUrl(entry.name);
                }
              });
            });
            
            observer.observe({ entryTypes: ['resource'] });
          } catch (e) {
            console.log('PerformanceObserver error:', e);
          }
        }
        
        console.log('Network monitor initialized');
      }
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('Script injection error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Network monitor script injected');
        sendResponse({ success: true });
        
        // Forward detected video URLs to the caller
        chrome.runtime.onMessage.addListener((innerMessage, innerSender) => {
          if (innerMessage.action === 'videoUrlDetected' && innerSender.tab && innerSender.tab.id === request.tabId) {
            // Forward to the original caller
            chrome.runtime.sendMessage(innerMessage);
          }
        });
      }
    });
  } else {
    sendResponse({ success: false, error: 'No tab ID provided' });
  }
  
  return true; // Keep the message channel open for async response
}

// Open Bunkr Gallery
if (request.action === 'openBunkrGallery'){
  // Create a new tab with your Bunkr gallery HTML page
  chrome.tabs.create({ url: chrome.runtime.getURL('bunkr-gallery.html') });
  sendResponse({ success: true });
  return true;
}

});