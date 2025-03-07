'use strict';

// Sidebar Module for Forum Media Link Collector
const SidebarModule = (() => {
  // Private variables
  let isVisible = false;
  let sidebarElement = null;
  const sidebarWidth = 320;
  
  // Create sidebar element
  function createSidebar() {
    if (sidebarElement) return sidebarElement;
    
    // Create sidebar container
    sidebarElement = document.createElement('div');
    sidebarElement.id = 'media-links-sidebar';
    sidebarElement.style.cssText = `
      position: fixed;
      top: 0;
      right: -${sidebarWidth}px;
      width: ${sidebarWidth}px;
      height: 100%;
      background-color: white;
      box-shadow: -2px 0 5px rgba(0,0,0,0.2);
      z-index: 9999;
      overflow-y: auto;
      transition: right 0.3s ease;
      padding: 15px;
      box-sizing: border-box;
      font-family: Arial, sans-serif;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 15px;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Collected Media Links';
    title.style.margin = '0';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
    `;
    closeBtn.addEventListener('click', () => toggle(false));
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebarElement.appendChild(header);
    
    // Create tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = `
      display: flex;
      border-bottom: 1px solid #eee;
      margin-bottom: 15px;
    `;
    
    const tabs = ['Saint', 'File Hosts', 'RedGifs'];
    const tabElements = {};
    
    tabs.forEach((tabName, index) => {
      const tab = document.createElement('div');
      tab.textContent = tabName;
      tab.dataset.tab = tabName.toLowerCase().replace(' ', '-');
      tab.style.cssText = `
        padding: 8px 15px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      `;
      
      if (index === 0) {
        tab.style.borderBottomColor = '#4285f4';
        tab.style.fontWeight = 'bold';
      }
      
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      tabsContainer.appendChild(tab);
      tabElements[tab.dataset.tab] = tab;
    });
    
    sidebarElement.appendChild(tabsContainer);
    
    // Create content containers
    const contentContainer = document.createElement('div');
    
    // Create content for each tab
    const tabContents = {};
    tabs.forEach(tabName => {
      const id = tabName.toLowerCase().replace(' ', '-');
      const content = document.createElement('div');
      content.id = `links-${id}`;
      content.style.display = id === 'saint' ? 'block' : 'none';
      
      tabContents[id] = content;
      contentContainer.appendChild(content);
    });
    
    sidebarElement.appendChild(contentContainer);
    
    // Append to document
    document.body.appendChild(sidebarElement);
    
    // Switch tab function
    function switchTab(tabId) {
      // Update tab styling
      Object.values(tabElements).forEach(tab => {
        tab.style.borderBottomColor = 'transparent';
        tab.style.fontWeight = 'normal';
      });
      
      tabElements[tabId].style.borderBottomColor = '#4285f4';
      tabElements[tabId].style.fontWeight = 'bold';
      
      // Show selected content
      Object.values(tabContents).forEach(content => {
        content.style.display = 'none';
      });
      tabContents[tabId].style.display = 'block';
    }
    
    return sidebarElement;
  }
  
  // Update sidebar content
  function updateContent() {
    if (!sidebarElement) createSidebar();
    
    chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (data) => {
      updateLinkList('links-saint', data.saintLinks || [], 'embed');
      updateLinkList('links-file-hosts', data.fileLinks || [], 'link');
      updateLinkList('links-redgifs', data.redgifsLinks || [], 'link');
    });
  }
  
  // Update a specific link list
  function updateLinkList(containerId, links, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (links.length === 0) {
      const message = document.createElement('p');
      message.textContent = 'No links collected yet.';
      message.style.color = '#888';
      message.style.textAlign = 'center';
      message.style.padding = '20px 0';
      container.appendChild(message);
      return;
    }
    
    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    links.forEach((link, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 10px;
        position: relative;
      `;
      
      const linkDisplay = document.createElement('div');
      
      if (type === 'embed' && link.includes('iframe')) {
        // Display iframe thumbnail
        linkDisplay.innerHTML = `<div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 5px;">${link}</div>`;
      } else {
        // Display link
        linkDisplay.innerHTML = `<a href="${link}" target="_blank" style="word-break: break-all; font-size: 13px;">${link}</a>`;
      }
      
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copy';
      copyBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        padding: 2px 5px;
        font-size: 11px;
        background: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 3px;
        cursor: pointer;
      `;
      
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(link)
          .then(() => {
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
            }, 1500);
          });
      });
      
      item.appendChild(linkDisplay);
      item.appendChild(copyBtn);
      list.appendChild(item);
    });
    
    container.appendChild(list);
  }
  
  // Toggle sidebar visibility
  function toggle(show = null) {
    if (!sidebarElement) createSidebar();
    
    // If show is null, toggle current state
    isVisible = show !== null ? show : !isVisible;
    
    if (isVisible) {
      sidebarElement.style.right = '0';
      updateContent();
    } else {
      sidebarElement.style.right = `-${sidebarWidth}px`;
    }
    
    return isVisible;
  }
  
  // Public API
  return {
    initialize: () => {
      createSidebar();
      return {
        toggle,
        updateContent
      };
    }
  };
})();

// Export the module
if (typeof module !== 'undefined') {
  module.exports = SidebarModule;
}
