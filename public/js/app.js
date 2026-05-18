(function () {
  const onlineTextEl = document.querySelector('#onlineCount .landing__online-text');
  let lastCount = null;

  function updateDisplay(count) {
    if (!onlineTextEl) return;
    if (typeof count === 'number' && count >= 0) {
      lastCount = count;
      onlineTextEl.textContent = window.BatalLang
        ? window.BatalLang.formatOnline(count)
        : count + ' online';
    } else if (window.BatalLang) {
      onlineTextEl.textContent = window.BatalLang.t('onlineUnknown');
    }
  }

  window.BatalApp = {
    refreshOnline() {
      if (lastCount !== null) {
        updateDisplay(lastCount);
      } else if (onlineTextEl && window.BatalLang) {
        onlineTextEl.textContent = window.BatalLang.t('onlineUnknown');
      }
    },
  };

  const socket = io({ transports: ['websocket', 'polling'] });

  socket.on('online-count', (payload) => {
    if (payload && typeof payload.count === 'number') {
      updateDisplay(payload.count);
    }
  });

  socket.on('disconnect', () => {
    lastCount = null;
    updateDisplay(null);
  });
})();
