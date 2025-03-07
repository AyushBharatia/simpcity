'use strict';

// Enhanced Sidebar Module for Forum Media Link Collector
const SidebarModule = (() => {
  // Private variables
  let isVisible = false;
  let sidebarElement = null;
  const sidebarWidth = 350; // Slightly wider for better content display
  
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
      background-color: #ffffff;
      box-shadow: -3px 0 15px rgba(0,0,0,0.15);
      z-index: 9999;
      overflow-y: auto;
      transition: right 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      padding: 0;
      box-sizing: border-box;
      font-family: 'Segoe UI', Arial, sans-serif;
      display: flex;
      flex-direction: column;
      border-left: 1px solid #e0e0e0;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e0e0e0;
      padding: 16px 20px;
      background-color: #f8f9fa;
      position: sticky;
      top: 0;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Collected Media Links';
    title.style.cssText = `
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0 5px;
      color: #666;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    `;
    closeBtn.addEventListener('click', () => toggle(false));
    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.backgroundColor = '#f1f1f1';
    });
    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebarElement.appendChild(header);
    
    // Create tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.style.cssText = `
      display: flex;
      background-color: #f8f9fa;
      position: sticky;
      top: 57px;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    
    const tabs = ['Saint', 'File Hosts', 'RedGifs'];
    const tabElements = {};
    
    tabs.forEach((tabName, index) => {
      const tab = document.createElement('div');
      tab.textContent = tabName;
      tab.dataset.tab = tabName.toLowerCase().replace(' ', '-');
      tab.style.cssText = `
        padding: 12px 0;
        cursor: pointer;
        text-align: center;
        flex: 1;
        font-size: 14px;
        transition: all 0.2s;
        border-bottom: 3px solid transparent;
        color: #666;
      `;
      
      if (index === 0) {
        tab.style.borderBottomColor = '#4285f4';
        tab.style.fontWeight = '600';
        tab.style.color = '#4285f4';
      }
      
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
      tab.addEventListener('mouseover', () => {
        if (tab.style.borderBottomColor === 'transparent') {
          tab.style.backgroundColor = '#f0f0f0';
        }
      });
      tab.addEventListener('mouseout', () => {
        if (tab.style.borderBottomColor === 'transparent') {
          tab.style.backgroundColor = 'transparent';
        }
      });
      
      tabsContainer.appendChild(tab);
      tabElements[tab.dataset.tab] = tab;
    });
    
    sidebarElement.appendChild(tabsContainer);
    
    // Create content containers
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `;
    
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
    
    // Add counter badges to tabs
    const updateTabCounters = () => {
      chrome.storage.local.get(['saintLinks', 'fileLinks', 'redgifsLinks'], (data) => {
        updateTabCounter(tabElements['saint'], data.saintLinks?.length || 0);
        updateTabCounter(tabElements['file-hosts'], data.fileLinks?.length || 0);
        updateTabCounter(tabElements['redgifs'], data.redgifsLinks?.length || 0);
      });
    };
    
    // Counter update function
    function updateTabCounter(tabElement, count) {
      let badge = tabElement.querySelector('.counter-badge');
      
      if (!badge && count > 0) {
        badge = document.createElement('span');
        badge.className = 'counter-badge';
        badge.style.cssText = `
          display: inline-block;
          background-color: #4285f4;
          color: white;
          border-radius: 12px;
          padding: 1px 6px;
          font-size: 11px;
          margin-left: 5px;
          font-weight: bold;
        `;
        tabElement.appendChild(badge);
      }
      
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }
    }
    
    // Call counter update initially
    updateTabCounters();
    
    // Append to document
    document.body.appendChild(sidebarElement);
    
    // Switch tab function
    function switchTab(tabId) {
      // Update tab styling
      Object.values(tabElements).forEach(tab => {
        tab.style.borderBottomColor = 'transparent';
        tab.style.fontWeight = 'normal';
        tab.style.color = '#666';
        tab.style.backgroundColor = 'transparent';
      });
      
      tabElements[tabId].style.borderBottomColor = '#4285f4';
      tabElements[tabId].style.fontWeight = '600';
      tabElements[tabId].style.color = '#4285f4';
      
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
      
      // Update tab counters
      const tabs = sidebarElement.querySelectorAll('[data-tab]');
      tabs.forEach(tab => {
        const tabId = tab.dataset.tab;
        let count = 0;
        
        if (tabId === 'saint') count = data.saintLinks?.length || 0;
        else if (tabId === 'file-hosts') count = data.fileLinks?.length || 0;
        else if (tabId === 'redgifs') count = data.redgifsLinks?.length || 0;
        
        let badge = tab.querySelector('.counter-badge');
        
        if (!badge && count > 0) {
          badge = document.createElement('span');
          badge.className = 'counter-badge';
          badge.style.cssText = `
            display: inline-block;
            background-color: #4285f4;
            color: white;
            border-radius: 12px;
            padding: 1px 6px;
            font-size: 11px;
            margin-left: 5px;
            font-weight: bold;
          `;
          tab.appendChild(badge);
        }
        
        if (badge) {
          if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
      });
    });
  }
  
  // Update a specific link list
  function updateLinkList(containerId, links, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (links.length === 0) {
      const message = document.createElement('div');
      message.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        color: #888;
        text-align: center;
      `;
      
      const icon = document.createElement('div');
      icon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      `;
      icon.style.marginBottom = '12px';
      icon.style.color = '#bbb';
      
      const text = document.createElement('p');
      text.textContent = 'No links collected yet.';
      text.style.margin = '0';
      text.style.fontSize = '14px';
      
      const subtext = document.createElement('p');
      subtext.textContent = 'Use the collector to find media links.';
      subtext.style.margin = '4px 0 0 0';
      subtext.style.fontSize = '12px';
      subtext.style.opacity = '0.7';
      
      message.appendChild(icon);
      message.appendChild(text);
      message.appendChild(subtext);
      container.appendChild(message);
      return;
    }
    
    // Add counter and controls
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    `;
    
    const counter = document.createElement('div');
    counter.textContent = `${links.length} ${links.length === 1 ? 'Link' : 'Links'}`;
    counter.style.cssText = `
      font-size: 13px;
      color: #666;
      font-weight: 500;
    `;
    
    const copyAllBtn = document.createElement('button');
    copyAllBtn.textContent = 'Copy All';
    copyAllBtn.style.cssText = `
      background-color: #f1f1f1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    copyAllBtn.addEventListener('mouseover', () => {
      copyAllBtn.style.backgroundColor = '#e8e8e8';
    });
    
    copyAllBtn.addEventListener('mouseout', () => {
      copyAllBtn.style.backgroundColor = '#f1f1f1';
    });
    
    copyAllBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(links.join('\n'))
        .then(() => {
          copyAllBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyAllBtn.textContent = 'Copy All';
          }, 1500);
        });
    });
    
    header.appendChild(counter);
    header.appendChild(copyAllBtn);
    container.appendChild(header);
    
    // Create the links list
    const list = document.createElement('div');
    list.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    
    links.forEach((link, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 12px;
        position: relative;
        transition: all 0.2s;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      `;
      
      item.addEventListener('mouseover', () => {
        item.style.boxShadow = '0 3px 8px rgba(0,0,0,0.1)';
        item.style.borderColor = '#ccc';
      });
      
      item.addEventListener('mouseout', () => {
        item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        item.style.borderColor = '#e0e0e0';
      });
      
      const linkDisplay = document.createElement('div');
      
      if (type === 'embed' && link.includes('iframe')) {
        // Display iframe thumbnail with improved style
        linkDisplay.style.cssText = `
          margin-bottom: 8px;
          padding-right: 40px;
        `;
        linkDisplay.innerHTML = `
          <div style="
            font-size: 12px; 
            overflow: hidden; 
            text-overflow: ellipsis; 
            white-space: nowrap; 
            padding: 6px 8px;
            background-color: #f8f8f8;
            border-radius: 4px;
            border: 1px solid #eee;
            color: #666;
            font-family: monospace;
          ">${link}</div>
        `;
      } else {
        // Display link with better styling
        linkDisplay.style.cssText = `
          padding-right: 40px;
          overflow-wrap: break-word;
          word-break: break-all;
        `;
        linkDisplay.innerHTML = `
          <a href="${link}" 
             target="_blank" 
             style="
               color: #4285f4;
               text-decoration: none;
               font-size: 13px;
               display: block;
               line-height: 1.4;
             "
             onmouseover="this.style.textDecoration='underline'"
             onmouseout="this.style.textDecoration='none'"
          >${link}</a>
        `;
      }
      
      const copyBtn = document.createElement('button');
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      
      copyBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        color: #666;
      `;
      
      copyBtn.addEventListener('mouseover', () => {
        copyBtn.style.backgroundColor = '#f1f1f1';
        copyBtn.style.borderColor = '#ccc';
      });
      
      copyBtn.addEventListener('mouseout', () => {
        copyBtn.style.backgroundColor = '#f8f9fa';
        copyBtn.style.borderColor = '#ddd';
      });
      
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(link)
          .then(() => {
            copyBtn.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34a853" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `;
            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              `;
            }, 1500);
          });
      });
      
      // Add index label
      const indexLabel = document.createElement('div');
      indexLabel.textContent = `#${index + 1}`;
      indexLabel.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 11px;
        color: #999;
        font-weight: 500;
      `;
      
      item.appendChild(linkDisplay);
      item.appendChild(copyBtn);
      item.appendChild(indexLabel);
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
      
      // Add overlay
      let overlay = document.getElementById('sidebar-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.3);
          z-index: 9998;
          opacity: 0;
          transition: opacity 0.3s ease;
        `;
        overlay.addEventListener('click', () => toggle(false));
        document.body.appendChild(overlay);
        
        // Force reflow before setting opacity
        overlay.offsetHeight;
        overlay.style.opacity = '1';
      }
    } else {
      sidebarElement.style.right = `-${sidebarWidth}px`;
      
      // Remove overlay
      const overlay = document.getElementById('sidebar-overlay');
      if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.parentNode.removeChild(overlay);
        }, 300);
      }
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