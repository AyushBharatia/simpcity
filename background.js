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

});