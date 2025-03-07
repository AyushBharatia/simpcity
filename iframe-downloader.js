// This script gets injected into the iframe to find and extract the video source URL
(function() {
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
  })();