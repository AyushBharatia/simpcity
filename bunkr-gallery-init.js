/**
 * Initializes the Bunkr Gallery when the DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the Bunkr Gallery Module
    window.bunkrGallery = BunkrGalleryModule.initialize();
    
    // Add keyboard navigation support
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          document.getElementById('prev-btn').click();
          break;
        case 'ArrowRight':
          document.getElementById('next-btn').click();
          break;
        case 'd':
        case 'D':
          document.getElementById('download-btn').click();
          break;
      }
    });
  });