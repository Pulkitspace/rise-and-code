// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getQuestions') {
      // Logic to fetch or prepare questions can be handled here
      sendResponse({ status: "success" });
  }
});
