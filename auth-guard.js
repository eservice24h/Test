(function () {
  const LOGIN_FLAG_KEYS = ['gs_logged_in', 'isLoggedIn'];
  const USER_SESSION_KEYS = ['loggedInUser', 'currentUser'];

  function readUserSession() {
    for (const key of USER_SESSION_KEYS) {
      const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (raw && raw.trim() !== '') {
        try {
          return JSON.parse(raw);
        } catch {
          return { user: raw };
        }
      }
    }
    return null;
  }

  function isUserLoggedIn() {
    const hasFlag = LOGIN_FLAG_KEYS.some(
      (key) => localStorage.getItem(key) === 'true' || sessionStorage.getItem(key) === 'true'
    );
    const session = readUserSession();
    return Boolean(hasFlag || session);
  }

  function setUserLoggedIn(userInfo) {
    const payload =
      typeof userInfo === 'object' && userInfo !== null
        ? userInfo
        : { user: userInfo || 'User', loggedInAt: new Date().toISOString() };

    localStorage.setItem('gs_logged_in', 'true');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('loggedInUser', JSON.stringify(payload));
    sessionStorage.setItem('loggedInUser', JSON.stringify(payload));
    syncAuthUI();
  }

  function logoutUser(redirectTo) {
    LOGIN_FLAG_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    USER_SESSION_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    syncAuthUI();

    if (redirectTo) {
      window.location.href = redirectTo;
    }
  }

  function promptAndRedirectLogin(targetUrl) {
    const safeTarget = targetUrl || window.location.pathname.split('/').pop() || 'index.html';
    alert('এই সেকশনে প্রবেশ করতে আগে লগইন করুন।');
    window.location.href = `auth.html?redirect=${encodeURIComponent(safeTarget)}`;
  }

  function syncAuthUI() {
    const loggedIn = isUserLoggedIn();

    const profileLink = document.getElementById('profileMenuLink');
    const authLink = document.getElementById('authMenuLink');
    const contactLink = document.getElementById('contactMenuLink');
    const adminLink = document.getElementById('adminMenuLink');
    const logoutBtn = document.getElementById('logoutMenuBtn');

    if (loggedIn) {
      // লগইন অবস্থায় শুধুমাত্র: প্রোফাইল, যোগাযোগ ও লগআউট
      if (profileLink) profileLink.style.display = 'block';
      if (contactLink) contactLink.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (authLink) authLink.style.display = 'none';
      if (adminLink) adminLink.style.display = 'none';
    } else {
      // লগইন না থাকলে: লগইন/সাইনআপ, যোগাযোগ ও অ্যাডমিন লগইন
      if (profileLink) profileLink.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (authLink) authLink.style.display = 'block';
      if (contactLink) contactLink.style.display = 'block';
      if (adminLink) adminLink.style.display = 'block';
    }

    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const protectedPages = ['design-printing.html', 'digital-eservice.html', 'profile.html'];
    if (protectedPages.includes(currentPage) && !loggedIn) {
      promptAndRedirectLogin(currentPage);
    }
  }

  function bindAuthEvents() {
    const logoutBtn = document.getElementById('logoutMenuBtn');
    if (logoutBtn && !logoutBtn.dataset.guardBound) {
      logoutBtn.dataset.guardBound = 'true';
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = document.getElementById('threeDotDropdown');
        const dotBtn = document.getElementById('threeDotBtn');
        if (dropdown) dropdown.classList.remove('show');
        if (dotBtn) dotBtn.setAttribute('aria-expanded', 'false');
        logoutUser();
      });
    }

    const profileLink = document.getElementById('profileMenuLink');
    if (profileLink && !profileLink.dataset.guardBound) {
      profileLink.dataset.guardBound = 'true';
      profileLink.addEventListener('click', (e) => {
        if (!isUserLoggedIn()) {
          e.preventDefault();
          promptAndRedirectLogin('profile.html');
        }
      });
    }

    // ডিজাইন অ্যান্ড প্রিন্টিং ও ডিজিটাল ই-সার্ভিস নেভিগেশন লিংক সুরক্ষা
    const protectedNavIds = ['navDesignPrinting', 'navDigitalEservice'];
    protectedNavIds.forEach((id) => {
      const linkEl = document.getElementById(id);
      if (linkEl && !linkEl.dataset.guardBound) {
        linkEl.dataset.guardBound = 'true';
        linkEl.addEventListener('click', (e) => {
          if (!isUserLoggedIn()) {
            e.preventDefault();
            promptAndRedirectLogin(linkEl.getAttribute('href'));
          }
        });
      }
    });

    // data-requires-login="true" যুক্ত কার্ড বা এলিমেন্টে ক্লিক করলে লগইন চেক
    document.querySelectorAll('[data-requires-login="true"]').forEach((el) => {
      if (el.dataset.guardBound) return;
      el.dataset.guardBound = 'true';
      el.addEventListener('click', (e) => {
        const target = el.getAttribute('data-target') || el.getAttribute('href') || 'index.html';
        if (!isUserLoggedIn()) {
          e.preventDefault();
          promptAndRedirectLogin(target);
        } else if (el.tagName !== 'A' && el.getAttribute('data-target')) {
          window.location.href = el.getAttribute('data-target');
        }
      });
    });
  }

  window.AuthGuard = {
    isLoggedIn: isUserLoggedIn,
    getUser: readUserSession,
    login: setUserLoggedIn,
    logout: logoutUser,
    requireLogin: promptAndRedirectLogin,
    sync: syncAuthUI
  };

  document.addEventListener('DOMContentLoaded', () => {
    syncAuthUI();
    bindAuthEvents();
  });

  syncAuthUI();
  bindAuthEvents();
})();
