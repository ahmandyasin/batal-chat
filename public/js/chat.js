(function () {
  const connectionStatus = document.getElementById('connectionStatus');
  const statusPanel = document.getElementById('statusPanel');
  const statusSpinner = document.getElementById('statusSpinner');
  const statusText = document.getElementById('statusText');
  const findAgainBtn = document.getElementById('findAgainBtn');
  const chatMain = document.getElementById('chatMain');
  const chatInputBar = document.getElementById('chatInputBar');
  const chatIdentity = document.getElementById('chatIdentity');
  const yourNameEl = document.getElementById('yourNameEl');
  const partnerNameEl = document.getElementById('partnerNameEl');
  const messagesEl = document.getElementById('messages');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const leaveBtn = document.getElementById('leaveBtn');

  let socket = null;
  let isMatched = false;
  let uiState = 'connecting';
  let disconnectKey = 'partnerLeft';
  let yourNumber = null;
  let partnerNumber = null;

  function t(key) {
    return window.BatalLang ? window.BatalLang.t(key) : key;
  }

  function parseMatchNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  function anonymousName(number) {
    if (number === null || number === undefined) return '—';
    return t('anonymousName').replace('{n}', String(number));
  }

  function setHeaderStatus(key, className) {
    if (!connectionStatus) return;
    if (key) {
      connectionStatus.hidden = false;
      connectionStatus.textContent = t(key);
    } else {
      connectionStatus.hidden = true;
      connectionStatus.textContent = '';
    }
    connectionStatus.className = 'chat-header__status';
    if (className) {
      connectionStatus.classList.add(className);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function setSearchingMessage() {
    if (!statusText) return;
    statusText.className = 'status-card__text status-card__text--searching';
    statusText.innerHTML =
      '<span class="searching-message">' +
      escapeHtml(t('searchingForPartner')) +
      '</span>';
  }

  function hideWaitingUI() {
    document.body.classList.remove('is-waiting');
    document.body.classList.add('is-matched');

    if (statusPanel) {
      statusPanel.hidden = true;
      statusPanel.classList.add('is-hidden');
      statusPanel.setAttribute('aria-hidden', 'true');
    }
    if (statusSpinner) {
      statusSpinner.classList.add('is-hidden');
      statusSpinner.style.animation = 'none';
    }
    if (statusText) {
      statusText.className = 'status-card__text';
      statusText.innerHTML = '';
      statusText.textContent = '';
    }
  }

  function showWaitingUI() {
    if (isMatched) return;

    isMatched = false;
    yourNumber = null;
    partnerNumber = null;
    uiState = 'waiting';

    document.body.classList.add('is-waiting');
    document.body.classList.remove('is-matched');

    if (chatIdentity) chatIdentity.hidden = true;
    if (chatMain) chatMain.hidden = true;
    if (chatInputBar) chatInputBar.hidden = true;

    if (statusPanel) {
      statusPanel.hidden = false;
      statusPanel.classList.remove('is-hidden');
      statusPanel.removeAttribute('aria-hidden');
    }
    if (statusSpinner) {
      statusSpinner.classList.remove('is-hidden');
      statusSpinner.style.animation = '';
    }

    setSearchingMessage();
    if (findAgainBtn) findAgainBtn.hidden = true;
    setHeaderStatus('', '');
  }

  function showDisconnectedUI(messageKey) {
    disconnectKey = messageKey;
    isMatched = false;
    yourNumber = null;
    partnerNumber = null;
    uiState = 'disconnected';

    document.body.classList.remove('is-waiting', 'is-matched');

    if (chatIdentity) chatIdentity.hidden = true;
    if (chatMain) chatMain.hidden = true;
    if (chatInputBar) chatInputBar.hidden = true;

    if (statusPanel) {
      statusPanel.hidden = false;
      statusPanel.classList.remove('is-hidden');
      statusPanel.removeAttribute('aria-hidden');
    }
    if (statusSpinner) statusSpinner.classList.add('is-hidden');
    if (statusText) {
      statusText.className = 'status-card__text';
      statusText.innerHTML = '';
      statusText.textContent = t(messageKey);
    }
    if (findAgainBtn) findAgainBtn.hidden = false;
    setHeaderStatus('disconnected', 'is-error');
  }

  function updateIdentityDisplay() {
    if (yourNameEl) yourNameEl.textContent = anonymousName(yourNumber);
    if (partnerNameEl) partnerNameEl.textContent = anonymousName(partnerNumber);
    if (chatIdentity) chatIdentity.hidden = false;
  }

  function showChatUI(matchData) {
    const parsedYou = parseMatchNumber(matchData && matchData.yourNumber);
    const parsedPartner = parseMatchNumber(matchData && matchData.partnerNumber);

    if (parsedYou !== null) yourNumber = parsedYou;
    if (parsedPartner !== null) partnerNumber = parsedPartner;

    isMatched = true;
    uiState = 'matched';

    hideWaitingUI();

    if (chatMain) chatMain.hidden = false;
    if (chatInputBar) chatInputBar.hidden = false;

    updateIdentityDisplay();

    messagesEl.innerHTML = '';
    addSystemMessage(
      t('chatConnectedWith').replace('{partner}', anonymousName(partnerNumber))
    );
    setHeaderStatus('connected', 'is-connected');
    messageInput.focus();
  }

  function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'message message--system';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function addMessage(text, type, authorNumber) {
    const wrap = document.createElement('div');
    wrap.className = 'message message--' + type;

    if (type === 'received' && authorNumber !== null && authorNumber !== undefined) {
      const author = document.createElement('span');
      author.className = 'message__author';
      author.textContent = anonymousName(authorNumber);
      wrap.appendChild(author);
    }

    if (type === 'sent' && yourNumber !== null) {
      const author = document.createElement('span');
      author.className = 'message__author message__author--you';
      author.textContent = anonymousName(yourNumber);
      wrap.appendChild(author);
    }

    const body = document.createElement('span');
    body.className = 'message__body';
    body.textContent = text;
    wrap.appendChild(body);

    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function connectSocket() {
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      if (!isMatched) {
        showWaitingUI();
      }
      socket.emit('find-partner');
    });

    socket.on('disconnect', () => {
      if (isMatched) {
        showDisconnectedUI('connectionLost');
        return;
      }
      uiState = 'offline';
      document.body.classList.remove('is-waiting', 'is-matched');
      if (statusPanel) {
        statusPanel.hidden = false;
        statusPanel.classList.remove('is-hidden');
      }
      if (statusSpinner) statusSpinner.classList.add('is-hidden');
      if (statusText) {
        statusText.className = 'status-card__text';
        statusText.innerHTML = '';
        statusText.textContent = t('unableConnect');
      }
      setHeaderStatus('offline', 'is-error');
    });

    socket.on('connect_error', () => {
      uiState = 'offline';
      document.body.classList.remove('is-waiting', 'is-matched');
      if (statusPanel) {
        statusPanel.hidden = false;
        statusPanel.classList.remove('is-hidden');
      }
      if (statusSpinner) statusSpinner.classList.add('is-hidden');
      if (statusText) {
        statusText.className = 'status-card__text';
        statusText.innerHTML = '';
        statusText.textContent = t('serverUnreachable');
      }
      setHeaderStatus('offline', 'is-error');
    });

    socket.on('waiting', () => {
      if (isMatched) return;
      showWaitingUI();
    });

    socket.on('matched', (data) => {
      showChatUI(data);
    });

    socket.on('message', (payload) => {
      if (!payload || !payload.text) return;
      const fromNum = parseMatchNumber(payload.fromNumber);
      addMessage(payload.text, 'received', fromNum !== null ? fromNum : partnerNumber);
    });

    socket.on('partner-disconnected', () => {
      showDisconnectedUI('partnerLeft');
    });
  }

  function findPartner() {
    if (!socket || !socket.connected) {
      connectSocket();
      return;
    }
    isMatched = false;
    showWaitingUI();
    socket.emit('find-partner');
  }

  function refreshLang() {
    if (yourNameEl && yourNumber !== null) {
      yourNameEl.textContent = anonymousName(yourNumber);
    }
    if (partnerNameEl && partnerNumber !== null) {
      partnerNameEl.textContent = anonymousName(partnerNumber);
    }

    if (uiState === 'waiting') {
      showWaitingUI();
    } else if (uiState === 'disconnected') {
      showDisconnectedUI(disconnectKey);
    } else if (uiState === 'offline') {
      setHeaderStatus('offline', 'is-error');
      if (statusText) {
        statusText.className = 'status-card__text';
        statusText.textContent = t('unableConnect');
      }
    } else if (uiState === 'matched') {
      setHeaderStatus('connected', 'is-connected');
    } else if (uiState === 'connecting') {
      setHeaderStatus('connecting', '');
    }
  }

  window.BatalChat = { refreshLang };

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!socket || !isMatched) return;

    const text = messageInput.value.trim();
    if (!text) return;

    socket.emit('message', text);
    addMessage(text, 'sent');
    messageInput.value = '';
  });

  findAgainBtn.addEventListener('click', findPartner);

  leaveBtn.addEventListener('click', () => {
    if (socket) {
      socket.emit('leave-chat');
      socket.disconnect();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (socket) {
      socket.emit('leave-chat');
    }
  });

  connectSocket();
  console.log('chat.js loaded');
  // --- NEXT BUTTON CONFIRMATION SYSTEM ---
let isConfirmingNext = false;
const nextBtn = document.getElementById('nextBtn')  document.querySelector('.chat-form__next')  document.getElementById('leaveBtn');

if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isConfirmingNext) {
            isConfirmingNext = true;
            nextBtn.textContent = "Sure?";
            nextBtn.style.backgroundColor = "#e74c3c";
            nextBtn.style.color = "white";
        } else {
            socket.emit('leave-chat');
            window.location.reload();
        }
    });
}
})();
