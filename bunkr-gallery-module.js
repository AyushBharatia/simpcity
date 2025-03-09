/**
 * BunkrGalleryModule - Handles displaying and navigating through Bunkr videos
 */
const BunkrGalleryModule = (function() {
  // Private variables
  let bunkrLinks = [];
  let currentIndex = 0;
  let isLoading = false;
  let currentVideoUrl = null;
  
  // DOM elements
  let galleryContainer;
  let noContentElement;
  let prevButton;
  let nextButton;
  let downloadButton;
  let albumButton;
  let counterElement;
  
  // Initialize the module
  function initialize() {
    // Get DOM elements
    galleryContainer = document.getElementById('gallery-container');
    noContentElement = document.getElementById('no-content');
    prevButton = document.getElementById('prev-btn');
    nextButton = document.getElementById('next-btn');
    downloadButton = document.getElementById('download-btn');
    counterElement = document.getElementById('counter');
    
    // Create album button and add to gallery controls
    createAlbumButton();
    
    // Add event listeners
    prevButton.addEventListener('click', showPreviousVideo);
    nextButton.addEventListener('click', showNextVideo);
    downloadButton.addEventListener('click', downloadCurrentVideo);
    
    // Set up message listener for network captures
    setupMessageListener();
    
    // Load links from storage
    loadLinksFromStorage();
    
    return {
      showVideo: showVideoByIndex,
      getLinks: () => bunkrLinks,
      getCurrentIndex: () => currentIndex,
      processAlbumLink: processAlbumLink
    };
  }
  
  // Create album button and add to gallery controls
  function createAlbumButton() {
    const galleryControls = document.querySelector('.gallery-controls');
    
    albumButton = document.createElement('button');
    albumButton.id = 'album-btn';
    albumButton.className = 'action-button';
    albumButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0-2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"></path>
      </svg>
      Bunkr Album
    `;
    
    albumButton.addEventListener('click', () => {
      // Prompt user to enter Bunkr album URL
      const albumUrl = prompt('Enter Bunkr album URL:');
      if (albumUrl && (albumUrl.includes('bunkr.') || albumUrl.includes('bunkrr.') || albumUrl.includes('bunker.'))) {
        processAlbumLink(albumUrl);
      }
    });
    
    // Insert before download button
    galleryControls.insertBefore(albumButton, downloadButton);
  }
  
  // Set up message listener for network captures
  function setupMessageListener() {
    // Listen for messages from content scripts or background
    window.addEventListener('message', (event) => {
      if (event.data && event.data.action === 'videoUrlDetected') {
        const videoUrl = event.data.url;
        if (videoUrl && isValidVideoUrl(videoUrl)) {
          console.log('Video URL detected:', videoUrl);
          currentVideoUrl = videoUrl;
          
          // Enable download button
          downloadButton.innerText = 'Download Video';
          downloadButton.disabled = false;
        }
      }
    });
    
    // Listen for messages from Chrome runtime
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'videoUrlDetected') {
        const videoUrl = message.url;
        if (videoUrl && isValidVideoUrl(videoUrl)) {
          console.log('Video URL detected from background:', videoUrl);
          currentVideoUrl = videoUrl;
          
          // Enable download button
          downloadButton.innerText = 'Download Video';
          downloadButton.disabled = false;
        }
      }
      return true;
    });
  }
  
  // Load Bunkr links from storage
  function loadLinksFromStorage() {
    chrome.storage.local.get(['fileLinks'], (result) => {
      const allFileLinks = result.fileLinks || [];
      
      // Filter for bunkr links only
      bunkrLinks = allFileLinks.filter(link => 
        link.includes('bunkr.') || 
        link.includes('bunkrr.') || 
        link.includes('bunker.') 
      );
      
      if (bunkrLinks.length > 0) {
        showVideoByIndex(0);
        updateControls();
      } else {
        showNoContentMessage();
      }
    });
  }
  
  // Process a Bunkr album link
  function processAlbumLink(albumUrl) {
    // Instead of trying to fetch and parse the album page,
    // we'll open the album in a new tab and instruct the user
    // to manually add links from there
    
    // Add the album URL to the bunkrLinks array as a placeholder
    const albumIndex = bunkrLinks.length;
    bunkrLinks.push(albumUrl);
    
    // Update storage
    chrome.storage.local.set({ fileLinks: bunkrLinks }, () => {
      // Open the album URL in a new tab
      chrome.tabs.create({ url: albumUrl }, (tab) => {
        // Listen for when the user closes the tab
        chrome.tabs.onRemoved.addListener(function tabListener(tabId) {
          if (tabId === tab.id) {
            // Re-load links from storage in case user added new ones
            loadLinksFromStorage();
            // Remove the event listener
            chrome.tabs.onRemoved.removeListener(tabListener);
          }
        });
      });
      
      // Show instructions to the user
      galleryContainer.innerHTML = `
        <div class="info-message">
          <h3>Bunkr Album Opened</h3>
          <p>The album has been opened in a new tab.</p>
          <p>To add videos from this album:</p>
          <ol>
            <li>Click on each video in the album</li>
            <li>Wait for the video to load</li>
            <li>The video link will be automatically added to your collection</li>
          </ol>
          <p>Close the album tab when you're done.</p>
        </div>
      `;
    });
  }
  
  // Update navigation controls
  function updateControls() {
    if (bunkrLinks.length === 0) {
      prevButton.disabled = true;
      nextButton.disabled = true;
      downloadButton.disabled = true;
      counterElement.textContent = '0 / 0';
      return;
    }
    
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === bunkrLinks.length - 1;
    downloadButton.disabled = !currentVideoUrl;
    counterElement.textContent = `${currentIndex + 1} / ${bunkrLinks.length}`;
  }
  
  // Show previous video
  function showPreviousVideo() {
    if (currentIndex > 0) {
      showVideoByIndex(currentIndex - 1);
    }
  }
  
  // Show next video
  function showNextVideo() {
    if (currentIndex < bunkrLinks.length - 1) {
      showVideoByIndex(currentIndex + 1);
    }
  }
  
  // Validate video URL
  function isValidVideoUrl(url) {
    return (
      typeof url === 'string' && 
      (url.includes('bunkr.') || url.includes('bunkrr.') || url.includes('bunker.')) &&
      (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'))
    );
  }
  
  // Show video by index
  function showVideoByIndex(index) {
    if (index < 0 || index >= bunkrLinks.length) {
      console.error('Invalid index:', index);
      return;
    }
    
    isLoading = true;
    currentIndex = index;
    currentVideoUrl = null; // Reset video URL
    updateControls();
    
    // Clear current content and show loading
    galleryContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading video...</p>
      </div>
    `;
    
    // Get the Bunkr URL
    const bunkrUrl = bunkrLinks[index];
    
    // Create a custom content viewer with network monitoring capabilities
    createVideoViewer(bunkrUrl);
  }
  
  // Create a video viewer with network monitoring
  function createVideoViewer(bunkrUrl) {
    // Create a container for the video viewer
    const viewerContainer = document.createElement('div');
    viewerContainer.className = 'video-viewer-container';
    
    // Create an iframe to load the Bunkr page
    const iframe = document.createElement('iframe');
    iframe.src = bunkrUrl;
    iframe.className = 'bunkr-iframe';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframe.allow = 'autoplay; fullscreen';
    
    // Add controls for network detection
    const controlsBar = document.createElement('div');
    controlsBar.className = 'network-controls';
    controlsBar.innerHTML = `
      <button id="detect-video-btn" class="action-button">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 9h7V2l-2.35 2.35z"></path>
        </svg>
        Detect Video URL
      </button>
    `;
    
    // Add the iframe and controls to the container
    viewerContainer.appendChild(iframe);
    viewerContainer.appendChild(controlsBar);
    
    // Clear the gallery container and add the viewer
    galleryContainer.innerHTML = '';
    galleryContainer.appendChild(viewerContainer);
    
    // Add event listener for the detect button
    setTimeout(() => {
      const detectButton = document.getElementById('detect-video-btn');
      if (detectButton) {
        detectButton.addEventListener('click', () => {
          // Create a tab to open the Bunkr URL and detect the video
          chrome.tabs.create({ url: bunkrUrl, active: false }, (tab) => {
            // Update button to show we're detecting
            detectButton.innerHTML = `
              <div class="spinner-small"></div>
              Detecting...
            `;
            detectButton.disabled = true;
            
            // Send message to background script to inject network monitor
            chrome.runtime.sendMessage({
              action: 'injectNetworkMonitor',
              tabId: tab.id
            });
            
            // Set a timeout to wait for video detection
            setTimeout(() => {
              // If we still don't have a video URL, try to get one directly
              if (!currentVideoUrl) {
                chrome.tabs.executeScript(tab.id, {
                  code: `
                    // Look for video elements
                    const videos = document.querySelectorAll('video');
                    let videoSrc = null;
                    
                    // Check each video for sources
                    for (const video of videos) {
                      // Try currentSrc first
                      if (video.currentSrc && video.currentSrc.endsWith('.mp4')) {
                        videoSrc = video.currentSrc;
                        break;
                      }
                      
                      // Then try src attribute
                      if (video.src && video.src.endsWith('.mp4')) {
                        videoSrc = video.src;
                        break;
                      }
                      
                      // Check source elements
                      const sources = video.querySelectorAll('source');
                      for (const source of sources) {
                        if (source.src && source.src.endsWith('.mp4')) {
                          videoSrc = source.src;
                          break;
                        }
                      }
                      
                      if (videoSrc) break;
                    }
                    
                    videoSrc;
                  `
                }, (results) => {
                  const videoSrc = results && results[0];
                  if (videoSrc && isValidVideoUrl(videoSrc)) {
                    currentVideoUrl = videoSrc;
                    // Enable download button
                    downloadButton.innerText = 'Download Video';
                    downloadButton.disabled = false;
                    // Update detect button
                    detectButton.innerHTML = `
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                      </svg>
                      Video URL Found!
                    `;
                    detectButton.disabled = false;
                    // Close the tab
                    chrome.tabs.remove(tab.id);
                  } else {
                    // Reset the detect button
                    detectButton.innerHTML = `
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 9h7V2l-2.35 2.35z"></path>
                      </svg>
                      Try Again
                    `;
                    detectButton.disabled = false;
                    // Close the tab
                    chrome.tabs.remove(tab.id);
                  }
                });
              } else {
                // We already have a video URL, update the button
                detectButton.innerHTML = `
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                  Video URL Found!
                `;
                detectButton.disabled = false;
                // Close the tab
                chrome.tabs.remove(tab.id);
              }
            }, 5000); // Wait 5 seconds for detection
          });
        });
      }
    }, 100);
    
    isLoading = false;
  }
  
  // Show "no content" message
  function showNoContentMessage() {
    galleryContainer.style.display = 'none';
    noContentElement.style.display = 'flex';
  }
  
  // Download current video
  function downloadCurrentVideo() {
    if (!currentVideoUrl) {
      showDownloadMessage('No video URL detected. Please click "Detect Video URL" first.', 'error');
      return;
    }
    
    // Extract filename from URL
    const filename = currentVideoUrl.split('/').pop() || 'bunkr-video.mp4';
    
    // Send download request to background script
    chrome.runtime.sendMessage({
      action: 'downloadVideo',
      url: currentVideoUrl,
      filename: filename,
      referer: 'https://bunkr.cr/'
    }, (response) => {
      if (response && response.success) {
        // Show success message
        showDownloadMessage('Download started successfully!', 'success');
      } else {
        console.error('Download error:', response ? response.error : 'Unknown error');
        showDownloadMessage('Download failed. Try alternative method.', 'error');
        
        // Offer alternative method - using fetch with proper headers
        const alternativeButton = document.createElement('button');
        alternativeButton.className = 'action-button';
        alternativeButton.textContent = 'Try Alternative Download';
        alternativeButton.style.marginTop = '10px';
        
        alternativeButton.addEventListener('click', () => {
          // Create a temporary link element
          const a = document.createElement('a');
          a.href = currentVideoUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
        
        // Add button below the iframe
        const controlsBar = document.querySelector('.network-controls');
        if (controlsBar) {
          controlsBar.appendChild(alternativeButton);
        }
      }
    });
  }
  
  // Show download message
  function showDownloadMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `download-message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageDiv.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 500);
    }, 3000);
  }
  
  // Return public API
  return {
    initialize
  };
})();