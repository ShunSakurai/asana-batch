chrome.runtime.onMessage.addListener(
  function(message, sender, sendResponse) {

    if (message.ABMessage == 'getWorkspaceGid') {
      const meta = document.querySelector('meta[name=shard_id]');
      if (meta) sendResponse({ 'data': meta.content });

    } else if (message.ABMessage == 'getTaskGid') {
      const url = window.location.href;
      const taskGidRegexPatterns = [
        /https:\/\/app\.asana\.com\/0\/\d+\/(\d+)/,
        /https:\/\/app\.asana\.com\/0\/inbox\/\d+\/(\d+)\/\d+/,
        /https:\/\/app\.asana\.com\/0\/search\/\d+\/(\d+)/
      ];
      for (let i = 0; i < taskGidRegexPatterns.length; i++) {
        const pattern = taskGidRegexPatterns[i];
        if (pattern.exec(url)) sendResponse({ 'data': pattern.exec(url)[1] });
      }
    }

  }
);