(function() {
  'use strict';

  var TAG = window === window.top ? '[MKB:TOP]' : '[MKB:FRAME]';

  var runtimeValid = true;

  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(TAG);
    console.log.apply(console, args);
  }

  function safeSendMessage(msg) {
    if (!runtimeValid) return;
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage(msg).catch(function() {});
      } else {
        runtimeValid = false;
        log('runtime context invalidated, disabling sendMessage');
      }
    } catch (e) {
      runtimeValid = false;
      log('runtime sendMessage error, disabling sendMessage:', e.message);
    }
  }

  function isEditableFocused() {
    var el = document.activeElement;
    if (!el) return false;

    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    if (el.getAttribute('contenteditable') === 'true') return true;
    if (el.getAttribute('role') === 'textbox' || el.getAttribute('role') === 'searchbox') return true;

    if (el.closest('.ql-editor, .CodeMirror, .monaco-editor, .ace_editor, .ProseMirror, [data-slate-editor]')) return true;

    return false;
  }

  function getMediaElements(skipIframes) {
    var elements = [].slice.call(document.querySelectorAll('audio, video'));

    // Search open shadow roots
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) {
        var shadowMedia = all[i].shadowRoot.querySelectorAll('audio, video');
        for (var j = 0; j < shadowMedia.length; j++) {
          elements.push(shadowMedia[j]);
        }
      }
    }

    // Try same-origin iframes (only from top frame)
    if (!skipIframes) {
      try {
        if (window === window.top) {
          var iframes = document.querySelectorAll('iframe');
          for (var k = 0; k < iframes.length; k++) {
            try {
              var doc = iframes[k].contentDocument || iframes[k].contentWindow.document;
              if (doc) {
                var iframeMedia = doc.querySelectorAll('audio, video');
                for (var m = 0; m < iframeMedia.length; m++) {
                  elements.push(iframeMedia[m]);
                }
              }
            } catch (e) { /* cross-origin */ }
          }
        }
      } catch (e) { /* not top frame */ }
    }

    return elements;
  }

  function togglePlayPause() {
    var elements = getMediaElements();
    log('togglePlayPause, found', elements.length, 'media elements');
    if (elements.length === 0) return;

    var playing = null;
    for (var i = 0; i < elements.length; i++) {
      if (!elements[i].paused) { playing = elements[i]; break; }
    }

    if (playing) {
      log('pausing element');
      playing.pause();
    } else {
      for (var j = 0; j < elements.length; j++) {
        if (elements[j].paused && (elements[j].src || elements[j].querySelector('source'))) {
          log('playing element');
          elements[j].play().catch(function() {});
          break;
        }
      }
    }
  }

  function skipMedia(seconds) {
    var elements = getMediaElements();
    log('skipMedia', seconds, 's, found', elements.length, 'media elements');
    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      if (el.duration && isFinite(el.duration) && el.duration > 0) {
        el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + seconds));
      }
    }
  }

  function handleKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (isEditableFocused()) return;

    var keyMap = {
      'p': 'togglePlayPause',
      'P': 'togglePlayPause',
      '[': 'skipBack',
      ']': 'skipForward'
    };

    var codeMap = {
      'KeyP': 'togglePlayPause',
      'BracketLeft': 'skipBack',
      'BracketRight': 'skipForward'
    };

    var action = keyMap[event.key] || codeMap[event.code];
    if (action) {
      event.preventDefault();
      event.stopPropagation();

      var elements = getMediaElements();
      if (elements.length > 0) {
        log('local action:', action);
        if (action === 'togglePlayPause') togglePlayPause();
        else if (action === 'skipBack') skipMedia(-10);
        else if (action === 'skipForward') skipMedia(10);
      } else {
        log('no local media, requesting remote control for', action);
        safeSendMessage({ command: 'requestMediaControl', action: action });
      }
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);

  // --- Cross-tab playback tracking (every frame reports its own media) ---

  var playCount = 0;

  // Initial scan: count already-playing media in THIS frame only
  (function() {
    var elements = getMediaElements(true);
    for (var i = 0; i < elements.length; i++) {
      if (!elements[i].paused) playCount++;
    }
    log('initial scan: playCount =', playCount, 'elements found:', elements.length);
    if (playCount > 0) {
      safeSendMessage({ command: 'mediaPlaying' });
    }
  })();

  document.addEventListener('play', function(e) {
    if (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO') {
      playCount++;
      log('play event, playCount =', playCount);
      if (playCount === 1) {
        safeSendMessage({ command: 'mediaPlaying' });
      }
    }
  }, true);

  document.addEventListener('pause', function(e) {
    if (e.target.tagName === 'AUDIO' || e.target.tagName === 'VIDEO') {
      playCount = Math.max(0, playCount - 1);
      log('pause event, playCount =', playCount);
      if (playCount === 0) {
        safeSendMessage({ command: 'mediaPaused' });
      }
    }
  }, true);

  // --- Receive remote commands (top frame handles all same-origin media) ---

  if (window === window.top) {
    chrome.runtime.onMessage.addListener(function(message) {
      log('received remote command:', message.command);
      if (message.command === 'togglePlayPause') {
        togglePlayPause();
      } else if (message.command === 'skipBack') {
        skipMedia(-10);
      } else if (message.command === 'skipForward') {
        skipMedia(10);
      }
    });
  }
})();
