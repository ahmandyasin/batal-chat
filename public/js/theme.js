(function () {
  const STORAGE_KEY = 'batal-theme';
  const root = document.documentElement;

  function getTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function themeAriaLabel(theme) {
    if (window.BatalLang) {
      return theme === 'light'
        ? window.BatalLang.t('themeDark')
        : window.BatalLang.t('themeLight');
    }
    return theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  }

  function updateToggleButtons(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const isLight = theme === 'light';
      btn.setAttribute('aria-label', themeAriaLabel(theme));
      btn.setAttribute('aria-pressed', String(isLight));
      btn.classList.toggle('theme-toggle--light', isLight);
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleButtons(theme);
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  window.BatalTheme = {
    applyTheme,
    getTheme,
    toggleTheme,
    updateLabels: () => updateToggleButtons(getTheme()),
  };

  document.addEventListener('DOMContentLoaded', () => {
    updateToggleButtons(getTheme());
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  });
})();
