// Background script for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extendo Dumbo extension installed');
});

// Handle command shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-side-panel') {
    await toggleSidePanel();
  } else if (command === 'save-page') {
    await saveCurrentPage();
  }
});

// Handle action button click
chrome.action.onClicked.addListener(async () => {
  await toggleSidePanel();
});

async function toggleSidePanel() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (error) {
    console.error('Failed to toggle side panel:', error);
  }
}

async function saveCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && tab?.title) {
      // Store page info for later processing
      await chrome.storage.local.set({
        pendingPage: {
          url: tab.url,
          title: tab.title,
          timestamp: Date.now()
        }
      });
      
      // Open side panel to process the saved page
      if (tab.id) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    }
  } catch (error) {
    console.error('Failed to save current page:', error);
  }
}

// Listen for messages from content scripts or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_TAB') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse(tabs[0]);
    });
    return true; // Keep message channel open for async response
  }
});