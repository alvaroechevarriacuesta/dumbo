// Background script for Chrome extension
console.log("Background script loaded");

chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed or updated");

  // Enable side panel on toolbar icon click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  // Set default side panel options
  try {
    await chrome.sidePanel.setOptions({
      path: "side-panel.html",
      enabled: true,
    });
    console.log("Side panel options set");
  } catch (error) {
    console.error("Failed to set side panel options:", error);
  }
});

// Function to extract DOM text from a tab
async function extractDOMTextFromTab(tabId: number): Promise<string> {
  return new Promise((resolve) => {
    console.log('Attempting to extract DOM text from tab:', tabId);
    
    // Try to send message to content script
    chrome.tabs.sendMessage(tabId, { type: 'GET_DOM_TEXT' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script not available, error:', chrome.runtime.lastError.message);
        // If content script is not available, try to inject it
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            // Simple DOM text extraction function
            function extractText() {
              if (!document.body) return '';
              
              // Get all text content, excluding script and style elements
              const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                  acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
                      return NodeFilter.FILTER_REJECT;
                    }
                    if (!node.textContent || node.textContent.trim() === '') {
                      return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                  }
                }
              );

              const textNodes: string[] = [];
              let node;
              while ((node = walker.nextNode()) !== null) {
                const text = node.textContent?.trim();
                if (text) {
                  textNodes.push(text);
                }
              }

              const fullText = textNodes.join(' ');
              return fullText;
            }
            
            return extractText();
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.log('Failed to execute script:', chrome.runtime.lastError.message);
            resolve('');
          } else {
            const domText = results?.[0]?.result || '';
            console.log('First 150 characters of DOM text:', domText.substring(0, 150));
            console.log('Extracted DOM text via script injection, length:', domText.length);
            resolve(domText);
          }
        });
      } else {
        console.log('Content script response:', response);
        const domText = response?.domText || '';
        console.log('Extracted DOM text via content script, length:', domText.length);
        resolve(domText);
      }
    });
  });
}

// Keyboard shortcut listener
chrome.commands.onCommand.addListener((command) => {
  console.log("Command received:", command);
  if (command === "toggle-side-panel") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        console.log("Opening side panel on tab:", tabId);
        chrome.sidePanel.open({ tabId });
      } else {
        console.warn("No active tab found");
      }
    });
  } else if (command === "save-page") {
    console.log('save-page command received, creating popup window...');
    // Create popup window for contexts
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      console.log('Active tab found:', tab);
      if (tab?.id) {
        try {
          // Extract DOM text
          const domText = await extractDOMTextFromTab(tab.id);
          console.log('Final extracted DOM text length:', domText.length);
          
          // Show the popup
          chrome.windows.getCurrent((currentWindow) => {
            console.log('Current window:', currentWindow);
            const width = 500;
            const height = 600;
            const left = Math.round(((currentWindow.width ?? 1024) - width) / 2);
            const top = Math.round(((currentWindow.height ?? 768) - height) / 2);
            
            console.log('Creating popup window with dimensions:', { width, height, left, top });
            
            chrome.windows.create({
              url: 'popup.html',
              type: 'popup',
              width,
              height,
              left,
              top,
              focused: true
            }, (popupWindow) => {
              console.log('Popup window created:', popupWindow);
              if (popupWindow?.id) {
                // Store the DOM text for the popup to retrieve
                chrome.storage.local.set({
                  popupData: {
                    domText: domText,
                    originalUrl: tab.url,
                    originalTitle: tab.title || 'Untitled',
                    timestamp: Date.now()
                  }
                }, () => {
                  console.log('Popup data stored in local storage');
                });
              }
            });
          });
        } catch (error) {
          console.error('Error extracting DOM text:', error);
          // Still create popup with empty text
          chrome.windows.getCurrent((currentWindow) => {
            const width = 500;
            const height = 600;
            const left = Math.round(((currentWindow.width ?? 1024) - width) / 2);
            const top = Math.round(((currentWindow.height ?? 768) - height) / 2);
            
            chrome.windows.create({
              url: 'popup.html',
              type: 'popup',
              width,
              height,
              left,
              top,
              focused: true
            }, (popupWindow) => {
              if (popupWindow?.id) {
                chrome.storage.local.set({
                  popupData: {
                    domText: '',
                    originalUrl: tab.url || '',
                    originalTitle: tab.title || 'Untitled',
                    timestamp: Date.now()
                  }
                });
              }
            });
          });
        }
      } else {
        console.log('No active tab found or tab has no ID');
      }
    });
  }
});

// Listen for messages from content scripts or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0]);
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'SHOW_POPUP') {
    console.log('SHOW_POPUP message received from content script:', message);
    // Create popup window for contexts with the provided DOM text
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab?.url) {
        console.error('No active tab URL found');
        return;
      }

      chrome.windows.getCurrent((currentWindow) => {
        console.log('Current window:', currentWindow);
        const width = 500;
        const height = 600;
        const left = Math.round(((currentWindow.width ?? 1024) - width) / 2);
        const top = Math.round(((currentWindow.height ?? 768) - height) / 2);
        
        console.log('Creating popup window with dimensions:', { width, height, left, top });
        
        chrome.windows.create({
          url: 'popup.html',
          type: 'popup',
          width,
          height,
          left,
          top,
          focused: true
        }, (popupWindow) => {
          console.log('Popup window created:', popupWindow);
          if (popupWindow?.id) {
            // Store the DOM text and original URL for the popup to retrieve
            chrome.storage.local.set({
              popupData: {
                domText: message.domText || '',
                originalUrl: currentTab.url,
                originalTitle: currentTab.title || 'Untitled',
                timestamp: Date.now()
              }
            }, () => {
              console.log('Popup data stored in local storage with URL:', currentTab.url);
              sendResponse({ success: true });
            });
          }
        });
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.type === 'OPEN_SIDE_PANEL') {
    // This can be called from the side panel itself or content scripts
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
    sendResponse({ success: true });
    return true;
  }
});