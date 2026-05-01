(function() {
  'use strict';

  var STORAGE_KEY = 'mkb_playing_tabs';

  async function getPlayingTabs() {
    var result = await chrome.storage.session.get(STORAGE_KEY);
    return result[STORAGE_KEY] || { tabs: {}, last: null };
  }

  async function setPlayingTabs(data) {
    var obj = {};
    obj[STORAGE_KEY] = data;
    await chrome.storage.session.set(obj);
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    var tabId = sender.tab && sender.tab.id;
    if (!tabId) {
      console.log('[MKB:BG] message received without tab id, ignoring', message);
      return;
    }

    (async function() {
      switch (message.command) {
        case 'mediaPlaying': {
          console.log('[MKB:BG] mediaPlaying from tab', tabId);
          var data = await getPlayingTabs();
          data.tabs[tabId] = (data.tabs[tabId] || 0) + 1;
          data.last = tabId;
          await setPlayingTabs(data);
          console.log('[MKB:BG] state updated:', JSON.stringify(data));
          break;
        }

        case 'mediaPaused': {
          console.log('[MKB:BG] mediaPaused from tab', tabId);
          var data = await getPlayingTabs();
          var count = data.tabs[tabId] || 0;
          if (count > 0) {
            data.tabs[tabId] = count - 1;
          }
          // Keep entry even when count is 0 — so togglePlayPause can re-target this tab
          if (data.last === tabId && (data.tabs[tabId] || 0) === 0) {
            // If any other tab is actively playing, switch last to it
            for (var key in data.tabs) {
              if (data.tabs[key] > 0) {
                data.last = Number(key);
                break;
              }
            }
          }
          await setPlayingTabs(data);
          console.log('[MKB:BG] state updated:', JSON.stringify(data));
          break;
        }

        case 'requestMediaControl': {
          console.log('[MKB:BG] requestMediaControl from tab', tabId, 'action:', message.action);
          var data = await getPlayingTabs();
          console.log('[MKB:BG] current state:', JSON.stringify(data));
          var targetTabId = data.last;
          if (targetTabId && targetTabId !== tabId && targetTabId in data.tabs) {
            var cmd = null;
            switch (message.action) {
              case 'togglePlayPause': cmd = 'togglePlayPause'; break;
              case 'skipBack':       cmd = 'skipBack';       break;
              case 'skipForward':    cmd = 'skipForward';    break;
            }
            if (cmd) {
              console.log('[MKB:BG] forwarding', cmd, 'to tab', targetTabId);
              try {
                await chrome.tabs.sendMessage(targetTabId, { command: cmd });
                console.log('[MKB:BG] command forwarded successfully to tab', targetTabId);
              } catch (e) {
                console.log('[MKB:BG] failed to forward to tab', targetTabId, ':', e.message);
                delete data.tabs[targetTabId];
                if (data.last === targetTabId) {
                  var keys = Object.keys(data.tabs);
                  data.last = keys.length > 0 ? Number(keys[keys.length - 1]) : null;
                }
                await setPlayingTabs(data);
              }
            }
          } else {
            console.log('[MKB:BG] no valid target tab (targetTabId:', targetTabId, 'isDifferent:', targetTabId && targetTabId !== tabId, 'hasEntry:', targetTabId && targetTabId in data.tabs, ')');
          }
          break;
        }
      }
    })();
  });

  chrome.tabs.onRemoved.addListener(async function(tabId) {
    console.log('[MKB:BG] tab removed:', tabId);
    var data = await getPlayingTabs();
    if (tabId in data.tabs) {
      delete data.tabs[tabId];
      if (data.last === tabId) {
        var keys = Object.keys(data.tabs);
        data.last = keys.length > 0 ? Number(keys[keys.length - 1]) : null;
      }
      await setPlayingTabs(data);
      console.log('[MKB:BG] state cleaned after tab removal:', JSON.stringify(data));
    }
  });

  console.log('[MKB:BG] background service worker started');
})();
