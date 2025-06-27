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
    // Save current page info and open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url && tab?.title) {
        // Store page info for later processing
        chrome.storage.local.set({
          pendingPage: {
            url: tab.url,
            title: tab.title,
            timestamp: Date.now()
          }
        });
        
        // Open side panel to process the saved page
        if (tab.id) {
          chrome.sidePanel.open({ tabId: tab.id });
        }
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
  
  if (message.type === 'OPEN_SIDE_PANEL') {
    // This can be called from the side panel itself or content scripts
    if (sender.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id });
    }
    sendResponse({ success: true });
    return true;
  }
});