chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "main.html",
    enabled: true
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
