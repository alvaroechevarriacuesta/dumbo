// Content script for Chrome extension
console.log('Extendo Dumbo content script loaded');

// Listen for keyboard shortcuts that might trigger side panel
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+K (or Cmd+K on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
  }
  
  // Check for Ctrl+J (or Cmd+J on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'j') {
    event.preventDefault();
    chrome.runtime.sendMessage({ type: 'SAVE_CURRENT_PAGE' });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });
  }
}); 