// Content script for Chrome extension
console.log('Extendo Dumbo content script loaded');

// Function to extract text from DOM
function extractDOMText(): string {
  console.log('Starting DOM text extraction...');
  
  // Check if document.body exists
  if (!document.body) {
    console.log('Document body not found, returning empty string');
    return '';
  }
  
  console.log('Document body found, creating tree walker...');
  
  // Get all text content from the page, excluding script and style elements
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        const parent = node.parentElement;
        if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
          return NodeFilter.FILTER_REJECT;
        }
        // Skip empty text nodes
        if (!node.textContent || node.textContent.trim() === '') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes: string[] = [];
  let node;
  let nodeCount = 0;
  
  console.log('Walking through text nodes...');
  
  while ((node = walker.nextNode()) !== null) {
    nodeCount++;
    const text = node.textContent?.trim();
    if (text) {
      textNodes.push(text);
    }
  }
  
  console.log(`Found ${nodeCount} text nodes, ${textNodes.length} non-empty`);

  // Join all text and limit to a reasonable length
  const fullText = textNodes.join(' ');
  console.log('Extracted DOM text length:', fullText.length);
  console.log('First 200 characters:', fullText.substring(0, 200));
  
  // Return first 1000 characters for display purposes
  return fullText.substring(0, 1000);
}

// Listen for keyboard shortcuts that might trigger side panel
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+K (or Cmd+K on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    console.log('Command+K pressed, opening side panel');
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' });
  }
  
  // Check for Ctrl+J (or Cmd+J on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'j') {
    event.preventDefault();
    console.log('Command+J pressed, extracting DOM text...');
    
    // Extract DOM text
    const domText = extractDOMText();
    console.log('Command+J pressed, extracted DOM text length:', domText.length);
    
    // Send message to background script to show popup
    chrome.runtime.sendMessage({ 
      type: 'SHOW_POPUP',
      domText: domText
    }, (response) => {
      console.log('SHOW_POPUP response:', response);
    });
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message);
  
  if (message.type === 'GET_PAGE_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    });
  }
  
  if (message.type === 'GET_DOM_TEXT') {
    console.log('GET_DOM_TEXT requested, extracting DOM text...');
    const domText = extractDOMText();
    console.log('GET_DOM_TEXT sending response with length:', domText.length);
    sendResponse({
      domText: domText
    });
  }
}); 