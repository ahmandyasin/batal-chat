(function () {
  const connectionStatus = document.getElementById('connectionStatus');
  const statusPanel = document.getElementById('statusPanel');
  const statusSpinner = document.getElementById('statusSpinner');
  const statusText = document.getElementById('statusText');
  const findAgainBtn = document.getElementById('findAgainBtn');
  const chatMain = document.getElementById('chatMain');
  const chatInputBar = document.getElementById('chatInputBar');
  const messagesEl = document.getElementById('messages');
  const chatForm = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const leaveBtn = document.getElementById('leaveBtn');

  let socket = null;
  let isMatched = false;
  let uiState = 'connecting';
  let disconnectKey = 'partnerLeft';

  function t(key) {
    return window.BatalLang ? window.BatalLang.t(key) : key;
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

  function setSearchingMessage() {
    if (!statusText) return;
    statusText.className = 'status-card__text status-card__text--searching';
    statusText.innerHTML =
      '<span class="searching-message">' +
      escapeHtml(t('searchingForPartner')) +
      '</span>';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showWaitingUI() {
    isMatched = false;
    uiState = 'waiting';
    statusPanel.hidden = false;
    chatMain.hidden = true;
    chatInputBar.hidden = true;
    statusSpinner.classList.remove('is-hidden');
    setSearchingMessage();
    findAgainBtn.hidden = true;
    setHeaderStatus('', '');
  }

  function showDisconnectedUI(messageKey) {
    disconnectKey = messageKey;
    isMatched = false;
    uiState = 'disconnected';
    statusPanel.hidden = false;
    chatMain.hidden = true;
    chatInputBar.hidden = true;
    statusSpinner.classList.add('is-hidden');
    statusText.className = 'status-card__text';
    statusText.textContent = t(messageKey);
    findAgainBtn.hidden = false;
    setHeaderStatus('disconnected', 'is-error');
  }

  function showChatUI() {
    isMatched = true;
    uiState = 'matched';
    statusPanel.hidden = true;
    chatMain.hidden = false;
    chatInputBar.hidden = false;
    messagesEl.innerHTML = '';
    addSystemMessage(t('chatConnected'));
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

  function addMessage(text, type) {
    const el = document.createElement('div');
    el.className = 'message message--' + type;
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function connectSocket() {
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      showWaitingUI();
      socket.emit('find-partner');
    });

    socket.on('disconnect', () => {
      if (isMatched) {
        showDisconnectedUI('connectionLost');
        return;
      }
      uiState = 'offline';
      statusText.className = 'status-card__text';
      setHeaderStatus('offline', 'is-error');
      statusText.textContent = t('unableConnect');
      statusSpinner.classList.add('is-hidden');
    });

    socket.on('connect_error', () => {
      uiState = 'offline';
      statusText.className = 'status-card__text';
      setHeaderStatus('offline', 'is-error');
      statusText.textContent = t('serverUnreachable');
      statusSpinner.classList.add('is-hidden');
    });

    socket.on('waiting', () => {
      showWaitingUI();
    });

    socket.on('matched', () => {
      showChatUI();
    });

    socket.on('message', (payload) => {
      if (!payload || !payload.text) return;
      addMessage(payload.text, 'received');
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
    showWaitingUI();
    socket.emit('find-partner');
  }

  function refreshLang() {
    if (uiState === 'waiting') {
      showWaitingUI();
    } else if (uiState === 'disconnected') {
      showDisconnectedUI(disconnectKey);
    } else if (uiState === 'offline') {
      setHeaderStatus('offline', 'is-error');
      statusText.className = 'status-card__text';
      statusText.textContent = t('unableConnect');
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
})();
