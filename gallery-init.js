document.addEventListener('DOMContentLoaded', () => {
    if (typeof SaintGalleryModule !== 'undefined') {
      const gallery = SaintGalleryModule.initialize();
      gallery.openGallery();
    }
  });