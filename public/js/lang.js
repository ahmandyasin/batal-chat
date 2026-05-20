(function () {
  const STORAGE_KEY = 'batal-lang';

  const strings = {
    en: {
      title: 'Batal',
      privacy: 'Your identity and messages are fully private and protected',
      startChat: 'Start Chat',
      online: '{n} online',
      onlineUnknown: '— online',
      pageTitle: 'Batal — Anonymous Chat',
      langToggleLabel: 'Kurdish',
      langToggleShort: 'KU',
      themeLight: 'Switch to light mode',
      themeDark: 'Switch to dark mode',
      chatPageTitle: 'Batal — Chat',
      connecting: 'Connecting…',
      searching: 'Searching…',
      connected: 'Connected',
      disconnected: 'Disconnected',
      offline: 'Offline',
      searchingForPartner: 'Searching for a partner...',
      lookingFor: 'Looking for someone to chat with…',
      findNewPartner: 'Find new partner',
      partnerLeft: 'Your partner has left the chat.',
      connectionLost: 'Connection lost. Check your network and try again.',
      unableConnect: 'Unable to connect. Please refresh the page.',
      serverUnreachable: 'Could not reach the server. Please try again later.',
      chatConnected: 'You are connected with a stranger. Say hello!',
      chatConnectedWith: 'Connected with {partner}. Say hello!',
      anonymousName: 'Anonymous {n}',
      youLabel: 'You',
      partnerLabel: 'Partner',
      messagePlaceholder: 'Type a message…',
      leaveChat: 'Leave chat',
      sendMessage: 'Send message',
      messageLabel: 'Message',
      nextChat: 'Next',
      areYouSure: 'Are you sure?',
    },
    ku: {
      title: 'Batal',
      privacy: 'ناسنامە و نامەیێن تە ب تەمامی د پاراستی نە و تایبەتن',
      startChat: 'دەست پێ کرنا چاتی',
      searchingForPartner: 'ل لێگەڕیانا کەسەکی بوو چاتی...',
      online: '{n} سەر هێل',
      onlineUnknown: '— سەر هێل',
      pageTitle: 'Batal — چاتێ نەناس',
      langToggleLabel: 'English',
      langToggleShort: 'EN',
      themeLight: 'گوهۆرین بۆ ڕووناکی',
      themeDark: 'گوهۆرین بۆ تاری',
      chatPageTitle: 'Batal — چات',
      connecting: 'پێکەپێکە…',
      searching: 'ل گەڕانە…',
      connected: 'پێکەپێکری',
      disconnected: 'پچڕای',
      offline: 'دەرهێل',
      lookingFor: 'ل گەڕانە کەسەکێ بۆ چاتێ…',
      findNewPartner: 'هەلگەریارەکا نوی',
      partnerLeft: 'هاوڕێیا تە چاتێ بەجێ هێشتی.',
      connectionLost: 'پێکەپێکە پچڕا. تۆڕا خۆ ب پشکنە.',
      unableConnect: 'نەشێرا پێکەپێک بیت. پەڕە نوو بکە.',
      serverUnreachable: 'نەشێرا گەهشتنە سێرڤەرێ. دووبارە هەول بدە.',
      chatConnected: 'تە گەل کەسەکێ نەناس پێکەپێکری. سڵاو بکە!',
      chatConnectedWith: 'پێکەپێکری گەل {partner}. سڵاو بکە!',
      anonymousName: 'Anonymous {n}',
      youLabel: 'تۆ',
      partnerLabel: 'هاوڕێ',
      messagePlaceholder: 'نامەیەک بنڤیسە…',
      leaveChat: 'جێهێلنا چاتێ',
      sendMessage: 'شاندنا نامەی',
      messageLabel: 'نامە',
      nextChat: 'داهاتو',
      areYouSure: 'تۆ بڕیار دا؟',
    },
  };

  function getLang() {
    return document.documentElement.getAttribute('lang') === 'ku' ? 'ku' : 'en';
  }

  function t(key) {
    const lang = getLang();
    return strings[lang][key] ?? strings.en[key] ?? key;
  }

  function formatOnline(count) {
    const n = typeof count === 'number' && count >= 0 ? count : 0;
    return t('online').replace('{n}', String(n));
  }

  function applyLang(lang) {
    const isKu = lang === 'ku';
    const root = document.documentElement;

    root.setAttribute('lang', isKu ? 'ku' : 'en');
    root.setAttribute('dir', isKu ? 'rtl' : 'ltr');
    localStorage.setItem(STORAGE_KEY, lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key && strings[lang][key] !== undefined) {
        el.textContent = strings[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key && strings[lang][key] !== undefined) {
        el.placeholder = strings[lang][key];
      }
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key && strings[lang][key] !== undefined) {
        el.setAttribute('aria-label', strings[lang][key]);
      }
    });

    const pageTitle = document.querySelector('meta[data-page-title]');
    if (pageTitle) {
      const titleKey = document.body.classList.contains('page-chat')
        ? 'chatPageTitle'
        : 'pageTitle';
      document.title = strings[lang][titleKey];
    } else if (document.body.classList.contains('page-landing')) {
      document.title = strings[lang].pageTitle;
    } else if (document.body.classList.contains('page-chat')) {
      document.title = strings[lang].chatPageTitle;
    }

    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      const showKu = !isKu;
      btn.setAttribute('aria-pressed', String(isKu));
      btn.removeAttribute('title');
      btn.removeAttribute('aria-label');
      const label = btn.querySelector('.lang-toggle__label');
      if (label) {
        label.textContent = showKu ? strings.en.langToggleShort : strings.ku.langToggleShort;
      }
      const sr = btn.querySelector('[data-lang-sr]');
      if (sr) {
        sr.textContent = showKu ? strings.en.langToggleLabel : strings.ku.langToggleLabel;
        if (sr.id) {
          btn.setAttribute('aria-labelledby', sr.id);
        }
      }
    });

    if (window.BatalTheme && window.BatalTheme.updateLabels) {
      window.BatalTheme.updateLabels();
    }

    if (window.BatalApp && window.BatalApp.refreshOnline) {
      window.BatalApp.refreshOnline();
    }

    if (window.BatalChat && window.BatalChat.refreshLang) {
      window.BatalChat.refreshLang();
    }
  }

  function toggleLang() {
    applyLang(getLang() === 'en' ? 'ku' : 'en');
  }

  window.BatalLang = { applyLang, getLang, t, formatOnline, toggleLang };

  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ku' || saved === 'en') {
      applyLang(saved);
    }

    document.querySelectorAll('[data-lang-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleLang);
    });
  });
})();
