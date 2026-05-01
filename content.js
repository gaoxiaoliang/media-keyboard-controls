(function() {
  'use strict';

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

  function getMediaElements() {
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

    return elements;
  }

  function togglePlayPause() {
    var elements = getMediaElements();
    if (elements.length === 0) return;

    var playing = null;
    for (var i = 0; i < elements.length; i++) {
      if (!elements[i].paused) { playing = elements[i]; break; }
    }

    if (playing) {
      playing.pause();
    } else {
      for (var j = 0; j < elements.length; j++) {
        if (elements[j].paused && (elements[j].src || elements[j].querySelector('source'))) {
          elements[j].play().catch(function() {});
          break;
        }
      }
    }
  }

  function skipMedia(seconds) {
    var elements = getMediaElements();
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
      'p': togglePlayPause,
      'P': togglePlayPause,
      '[': function() { skipMedia(-10); },
      ']': function() { skipMedia(10); }
    };

    var codeMap = {
      'KeyP': togglePlayPause,
      'BracketLeft': function() { skipMedia(-10); },
      'BracketRight': function() { skipMedia(10); }
    };

    var handler = keyMap[event.key] || codeMap[event.code];
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler();
    }
  }

  document.addEventListener('keydown', handleKeyDown, true);
})();
