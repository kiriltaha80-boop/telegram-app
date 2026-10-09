/* ========================================================
   1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP
   ======================================================== */
const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) tg.requestFullscreen?.();
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes?.();
  } catch (e) {
    console.warn('Ошибка Telegram WebApp:', e);
  }
}

/* ========================================================
   2. ЗАСТАВКА (SPLASH SCREEN) & НАВИГАЦИЯ
   ======================================================== */
function hideSplash() {
  const splash = document.getElementById('splash-screen');
  if (splash && !splash.classList.contains('hidden')) {
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 700);
  }
}
setTimeout(hideSplash, 1600);

let navStack = ['tab-home'];

function openSubScreen(tabId) {
  if (navStack[navStack.length - 1] !== tabId) navStack.push(tabId);
  renderActiveTab(tabId);
}

function handleBackAction() {
  tg?.HapticFeedback?.impactOccurred?.('light');
  if (navStack.length > 1) {
    navStack.pop();
    renderActiveTab(navStack[navStack.length - 1]);
  } else {
    navStack = ['tab-home'];
    renderActiveTab('tab-home');
  }
}

function renderActiveTab(tabId) {
  document.querySelectorAll('.tab-content:not(#tab-home)').forEach(tab => tab.classList.remove('active'));

  const homeEl = document.getElementById('tab-home');
  const activeEl = document.getElementById(tabId);
  const capsuleBtn = document.getElementById('brand-capsule-btn');

  if (tabId === 'tab-home') {
    if (homeEl) homeEl.style.filter = 'none';
  } else {
    if (activeEl) {
      activeEl.classList.add('active');
      activeEl.scrollTop = 0;
    }
    if (homeEl) homeEl.style.filter = 'blur(6px) brightness(0.65)';
    if (capsuleBtn && isDesktopEditMode) {
      toggleDesktopEditMode();
    }
  }

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  if (tabId === 'tab-home') document.getElementById('nav-home')?.classList.add('active');
  else if (tabId === 'tab-profile') document.getElementById('nav-profile')?.classList.add('active');
  else if (tabId === 'tab-messenger' || tabId === 'tab-chat-1') document.getElementById('nav-chat')?.classList.add('active');
}

/* ========================================================
   3. РАБОЧИЙ СТОЛ, ВИДЖЕТЫ & DRAG-AND-DROP
   ======================================================== */
let isDesktopEditMode = false;
let desktopItems = JSON.parse(localStorage.getItem('pact_desktop_items')) || [
  { id: 'tile-male', type: 'tile', title: 'Верхний ♂', icon: '⚡', target: 'tab-male-session' },
  { id: 'tile-female', type: 'tile', title: 'Нижняя ♀', icon: '🌹', target: 'tab-female-session' },
  { id: 'tile-random', type: 'tile', title: 'Жребий', icon: '🎲', target: 'tab-randomizer' },
  { id: 'tile-boutique', type: 'tile', title: 'Бутик', icon: '🛍️', target: 'tab-shop' },
  { id: 'tile-sexshop', type: 'tile', title: 'Секс-шоп', icon: '🔮', target: 'tab-sexshop' },
  { id: 'tile-contract', type: 'tile', title: 'Контракт', icon: '📜', target: 'tab-contract' },
  { id: 'tile-gifts', type: 'tile', title: 'Желания', icon: '✨', target: 'tab-gifts' },
  { id: 'tile-cycle', type: 'tile', title: 'Календарь', icon: '🌸', target: 'tab-cycle' },
  { id: 'tile-chat', type: 'tile', title: 'Чат', icon: '💬', target: 'tab-messenger' },
  { id: 'w-balance', type: 'widget-balance', span: 2 },
  { id: 'w-contract', type: 'widget-contract', span: 4 }
];

// Принудительно вставляем плитку «Жребий», если в старой памяти её нет:
if (!desktopItems.some(item => item.id === 'tile-random')) {
  desktopItems.splice(2, 0, { id: 'tile-random', type: 'tile', title: 'Жребий', icon: '🎲', target: 'tab-randomizer' });
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
}
function saveDesktopItems() {
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
}

function toggleDesktopEditMode() {
  isDesktopEditMode = !isDesktopEditMode;
  const capsuleBtn = document.getElementById('brand-capsule-btn');
  const badge = document.getElementById('capsule-edit-badge');
  const wallpaperBtn = document.getElementById('dock-wallpaper-btn');
  const grid = document.getElementById('desktop-grid-container');

  if (isDesktopEditMode) {
    capsuleBtn?.classList.add('active');
    if (badge) badge.innerText = ' ⚙️';
    wallpaperBtn?.classList.add('active');
    grid?.classList.add('edit-mode');
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged?.();
  } else {
    capsuleBtn?.classList.remove('active');
    if (badge) badge.innerText = '';
    wallpaperBtn?.classList.remove('active');
    grid?.classList.remove('edit-mode');
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
  }
  renderDesktop();
}

let touchStartIndex = null;
function attachTouchEvents(wrapEl, index) {
  wrapEl.addEventListener('touchstart', (e) => {
    if (!isDesktopEditMode || e.target.closest('.item-delete-btn')) return;
    touchStartIndex = index;
    wrapEl.classList.add('is-dragging');
    tg?.HapticFeedback?.impactOccurred?.('light');
  }, { passive: true });

  wrapEl.addEventListener('touchmove', (e) => {
    if (touchStartIndex === null) return;
    const touch = e.touches[0];
    const underElement = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetWrap = underElement?.closest('.desktop-item-wrapper');

    document.querySelectorAll('.desktop-item-wrapper').forEach(w => w.classList.remove('drag-over'));
    if (targetWrap && targetWrap !== wrapEl) {
      targetWrap.classList.add('drag-over');
    }
  }, { passive: true });

  wrapEl.addEventListener('touchend', () => {
    if (touchStartIndex === null) return;
    wrapEl.classList.remove('is-dragging');
    const draggedTarget = document.querySelector('.desktop-item-wrapper.drag-over');
    document.querySelectorAll('.desktop-item-wrapper').forEach(w => w.classList.remove('drag-over'));

    if (draggedTarget) {
      const targetIndex = parseInt(draggedTarget.dataset.index);
      if (!isNaN(targetIndex) && targetIndex !== touchStartIndex) {
        const itemToMove = desktopItems.splice(touchStartIndex, 1)[0];
        desktopItems.splice(targetIndex, 0, itemToMove);
        saveDesktopItems();
        renderDesktop();
        tg?.HapticFeedback?.impactOccurred?.('medium');
      }
    }
    touchStartIndex = null;
  });
}

function renderDesktop() {
  const container = document.getElementById('desktop-grid-container');
  if (!container) return;
  container.innerHTML = '';

  // Если контракт НЕ подписан — показываем только одну большую плитку в центре
  if (!isContractSigned) {
    container.innerHTML = `
      <div class="desktop-locked-hero" onclick="openSubScreen('tab-contract')">
        <div class="hero-contract-icon">📜</div>
        <div class="hero-contract-label">Контракт D/S</div>
      </div>
    `;
    return;
  }

  // Если контракт подписан — отображаем весь рабочий стол
  desktopItems.forEach((item, index) => {
    const wrap = document.createElement('div');
    wrap.className = `desktop-item-wrapper ${item.span ? 'widget-span-' + item.span : ''}`;
    wrap.dataset.index = index;

    let inner = `<button class="item-delete-btn" onclick="deleteDesktopItem(${index})">✕</button>`;

    if (item.type === 'tile') {
      inner += `
        <div class="desktop-tile" onclick="if(!isDesktopEditMode) openSubScreen('${item.target}')">
          <div class="tile-icon">${item.icon}</div>
          <div class="tile-label">${item.title}</div>
        </div>`;
    } else if (item.type === 'widget-balance') {
      const balanceTitle = currentAvatarRole === 'male' ? 'Баланс Заботы' : 'Очки Трат';
      const balanceValue = currentAvatarRole === 'male' ? '3,450 PTS' : '1,250 PTS';
      inner += `
        <div class="desktop-widget" onclick="if(!isDesktopEditMode) openSubScreen('tab-profile')">
          <div class="widget-header"><span>${balanceTitle}</span><span>🔥</span></div>
          <div class="widget-title">${balanceValue}</div>
          <div class="widget-sub">Нажмите для статистики</div>
        </div>`;
    } else if (item.type === 'widget-contract') {
      inner += `
        <div class="desktop-widget" onclick="if(!isDesktopEditMode) openSubScreen('tab-contract')">
          <div class="widget-header"><span>Обет Дня</span><span>📜</span></div>
          <div class="widget-title">"Согласие и правила вечера"</div>
          <div class="widget-sub">Статус: Активно</div>
        </div>`;
    }

    wrap.innerHTML = inner;
    attachTouchEvents(wrap, index);
    container.appendChild(wrap);
  });
}

function deleteDesktopItem(index) {
  desktopItems.splice(index, 1);
  saveDesktopItems();
  renderDesktop();
  tg?.HapticFeedback?.notificationOccurred?.('warning');
}

function createWidgetOnDesktop(type, span) {
  desktopItems.push({ id: 'w-' + Date.now(), type, span });
  saveDesktopItems();
  closeAddWidgetModal();
  renderDesktop();
}

function createTileOnDesktop(title, icon, target) {
  desktopItems.push({ id: 't-' + Date.now(), type: 'tile', title, icon, target });
  saveDesktopItems();
  closeAddWidgetModal();
  renderDesktop();
}

function openAddWidgetModal() {
  document.getElementById('add-widget-modal')?.classList.add('active');
}
function closeAddWidgetModal() {
  document.getElementById('add-widget-modal')?.classList.remove('active');
}

/* ========================================================
   4. КОНТРАКТ D/S & ЦЕРЕМОНИИ (ПОДПИСЬ И РАЗРЫВ)
   ======================================================== */
let isContractSigned = localStorage.getItem('pact_contract_signed') === 'true';
let pendingContractAction = null;

function updateContractButtonUI() {
  const btn = document.getElementById('btn-contract-action');
  if (!btn) return;

  if (isContractSigned) {
    btn.className = 'btn-contract-terminate';
    btn.innerText = 'Расторгнуть';
  } else {
    btn.className = 'btn-contract-sign';
    btn.innerText = 'Подписать';
  }
}

function handleContractButtonClick() {
  const modal = document.getElementById('contract-confirm-modal');
  const textElem = document.getElementById('contract-confirm-text');
  if (!modal || !textElem) return;

  if (!isContractSigned) {
    pendingContractAction = 'sign';
    textElem.innerText = 'Вы точно готовы исполнять все требования прописанные в контракте?';
  } else {
    pendingContractAction = 'terminate';
    textElem.innerText = 'Вы точно хотите все прекратить и расторгнуть данный договор?';
  }

  modal.classList.add('active');
  modal.style.display = 'flex';
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
}

function closeContractConfirmModal() {
  const modal = document.getElementById('contract-confirm-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  pendingContractAction = null;
}

function confirmContractAction() {
  const confirmModal = document.getElementById('contract-confirm-modal');
  if (confirmModal) {
    confirmModal.classList.remove('active');
    confirmModal.style.display = 'none';
  }

  if (pendingContractAction === 'sign') {
    runSigningCeremony();
  } else if (pendingContractAction === 'terminate') {
    runTearingCeremony();
  }

  pendingContractAction = null;
}

// 1. Церемония подписания (роспись Anastasia + 2 сек пауза)
function runSigningCeremony() {
  const modal = document.getElementById('contract-ceremony-modal');
  const box = document.getElementById('ceremony-container');
  if (!modal || !box) return;

  box.classList.remove('anim-tearing', 'anim-rumble', 'anim-signing');

  // Сброс контуров подписи
  box.querySelectorAll('.sig-path-word').forEach(p => p.style.strokeDashoffset = '1200');
  box.querySelectorAll('.sig-path-slash').forEach(p => p.style.strokeDashoffset = '400');

  modal.classList.add('active');

  // Пауза 2 секунды перед подписью
  setTimeout(() => {
    box.classList.add('anim-signing');

    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
    setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'), 600);
    setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium'), 1200);
    setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light'), 1800);
    setTimeout(() => window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('heavy'), 2200);

    setTimeout(() => {
      isContractSigned = true;
      localStorage.setItem('pact_contract_signed', 'true');
      modal.classList.remove('active');
      box.classList.remove('anim-signing');

      updateContractButtonUI();
      renderDesktop();
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
      handleBackAction();
    }, 3200);
  }, 2000);
}

// 2. Церемония расторжения (дрожание свитка + огненный разрыв)
function runTearingCeremony() {
  const modal = document.getElementById('contract-ceremony-modal');
  const box = document.getElementById('ceremony-container');
  if (!modal || !box) return;

  box.classList.remove('anim-signing');
  box.querySelectorAll('.sig-path-word').forEach(p => p.style.strokeDashoffset = '0');
  box.querySelectorAll('.sig-path-slash').forEach(p => p.style.strokeDashoffset = '0');

  modal.classList.add('active');

  setTimeout(() => {
    box.classList.add('anim-rumble');
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');

    setTimeout(() => {
      box.classList.remove('anim-rumble');
      box.classList.add('anim-tearing');
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('heavy');

      setTimeout(() => {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('warning');
      }, 400);

      setTimeout(() => {
        isContractSigned = false;
        localStorage.setItem('pact_contract_signed', 'false');
        modal.classList.remove('active');
        box.classList.remove('anim-tearing');

        updateContractButtonUI();
        renderDesktop();
        handleBackAction();
      }, 1700);
    }, 750);
  }, 600);
}

/* ========================================================
   5. ОБОИ РАБОЧЕГО СТОЛА & ДИНАМИЧЕСКИЕ ЧАСТИЦЫ
   ======================================================== */
const WALLPAPER_PRESETS = {
  ruby_opal: 'radial-gradient(at 15% 15%, #5E0D20 0%, transparent 55%), radial-gradient(at 85% 25%, #7D1C3E 0%, transparent 50%), radial-gradient(at 50% 85%, #26050C 0%, transparent 65%), #0C0A10',
  neon_velvet: 'radial-gradient(at 20% 20%, #6E0F48 0%, transparent 50%), radial-gradient(at 80% 25%, #351059 0%, transparent 55%), radial-gradient(at 50% 75%, #1F072C 0%, transparent 60%), #0C0A10',
  wine_sunset: 'radial-gradient(at 80% 15%, #6B172B 0%, transparent 50%), radial-gradient(at 20% 45%, #420F1C 0%, transparent 55%), radial-gradient(at 65% 85%, #26060F 0%, transparent 60%), #0C0A10',
  amethyst_haze: 'radial-gradient(at 25% 15%, #42145C 0%, transparent 55%), radial-gradient(at 85% 35%, #220B38 0%, transparent 50%), radial-gradient(at 40% 80%, #140521 0%, transparent 60%), #0C0A10',
  emerald_silk: 'radial-gradient(at 20% 20%, #0F3D2A 0%, transparent 50%), radial-gradient(at 80% 30%, #082621 0%, transparent 55%), radial-gradient(at 50% 85%, #051410 0%, transparent 60%), #0C0A10',
  prismatic_art: "linear-gradient(180deg, rgba(74, 13, 30, 0.62) 0%, rgba(12, 10, 16, 0.88) 55%, #0C0A10 100%), url('https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/IMG_0407.png') center top / cover no-repeat",
  flirt: 'radial-gradient(circle at 50% 25%, #4a0d4a 0%, #220326 55%, #0b010d 100%)',
  gender: 'radial-gradient(circle at 50% 25%, #181145 0%, #0d0829 55%, #04020f 100%)',
  ruby: 'radial-gradient(circle at 50% 25%, #520617 0%, #260209 55%, #0a0103 100%)',
  cyber: 'radial-gradient(circle at 50% 25%, #2a0845 0%, #12032b 55%, #050112 100%)',
  gold: 'radial-gradient(circle at 50% 25%, #382407 0%, #1c1102 55%, #080500 100%)',
  lavender: 'radial-gradient(circle at 50% 25%, #351a54 0%, #190c2b 55%, #07020d 100%)'
};

const PARTICLE_THEMES = {
  flirt: {
    type: 'hearts_xoxo',
    glow: 'rgba(230, 57, 86, 0.45)',
    palettes: [
      { top: '#ff6b95', mid: '#e62458', base: '#6b0821', highlight: '#ffffff' },
      { top: '#d946ef', mid: '#a21caf', base: '#4a044e', highlight: '#ffffff' },
      { top: '#be123c', mid: '#881337', base: '#3b0313', highlight: '#ffccd5' }
    ]
  },
  gender: {
    type: 'gender_svg',
    glowMale: '#00d2ff',
    glowFemale: '#ff2a85'
  },
  ruby: {
    type: 'hearts_puffy',
    glow: 'rgba(255, 26, 68, 0.5)',
    palettes: [
      { top: '#ff3366', mid: '#cc0033', base: '#5c0017', highlight: '#ffffff' },
      { top: '#e60049', mid: '#99002e', base: '#400013', highlight: '#ffb3c6' }
    ]
  },
  cyber: {
    type: 'hearts_puffy',
    glow: 'rgba(0, 240, 255, 0.4)',
    palettes: [
      { top: '#00f0ff', mid: '#0072ff', base: '#001b5e', highlight: '#ffffff' },
      { top: '#ff007f', mid: '#b0005d', base: '#4d0028', highlight: '#ffffff' }
    ]
  },
  gold: {
    type: 'hearts_puffy',
    glow: 'rgba(255, 193, 7, 0.45)',
    palettes: [
      { top: '#ffe082', mid: '#ffb300', base: '#6d4c00', highlight: '#ffffff' },
      { top: '#ffca28', mid: '#f57c00', base: '#5d2b00', highlight: '#fff8e1' }
    ]
  },
  lavender: {
    type: 'hearts_puffy',
    glow: 'rgba(179, 136, 255, 0.4)',
    palettes: [
      { top: '#d1c4e9', mid: '#9575cd', base: '#311b92', highlight: '#ffffff' },
      { top: '#b39ddb', mid: '#7e57c2', base: '#260e69', highlight: '#ede7f6' }
    ]
  }
};

function setWallpaper(key) {
  const bg = WALLPAPER_PRESETS[key] || WALLPAPER_PRESETS.ruby_opal;
  document.body.style.background = bg;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center top';
  document.body.style.backgroundAttachment = 'fixed';

  const tabHome = document.getElementById('tab-home');
  if (tabHome) tabHome.style.background = 'transparent';

  document.querySelectorAll('.wallpaper-thumb').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-wp="${key}"]`)?.classList.add('selected');

  localStorage.setItem('pact_wallpaper_key', key);
  tg?.HapticFeedback?.selectionChanged?.();

  manageWallpaperParticles(key);
}

function manageWallpaperParticles(key) {
  let container = document.getElementById('wallpaper-particles');

  if (!container) {
    container = document.createElement('div');
    container.id = 'wallpaper-particles';
    document.body.prepend(container);
  }

  if (!PARTICLE_THEMES[key]) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';
  const theme = PARTICLE_THEMES[key];
  const count = 15;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'floating-wp-item';

    const leftPos = Math.random() * 92 + 4;
    const duration = Math.random() * 8 + 10;
    const delay = Math.random() * 12;
    const driftX = (Math.random() - 0.5) * 70;
    const targetRot = (Math.random() - 0.5) * 36;
    const tiltAngle = (Math.random() - 0.5) * 24;
    const targetOpacity = (Math.random() * 0.35 + 0.45).toFixed(2);
    const size = Math.floor(Math.random() * 26 + 32);

    el.style.left = `${leftPos}%`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `-${delay}s`;
    el.style.setProperty('--drift-x', `${driftX}px`);
    el.style.setProperty('--target-rot', `${targetRot}deg`);
    el.style.setProperty('--tilt-angle', `${tiltAngle}deg`);
    el.style.setProperty('--target-opacity', targetOpacity);
    el.style.setProperty('--size', `${size}px`);

    if (theme.type === 'gender_svg') {
      const isMale = Math.random() > 0.5;
      const glow = isMale ? theme.glowMale : theme.glowFemale;
      el.style.setProperty('--symbol-glow', glow);

      if (isMale) {
        el.innerHTML = `
          <svg class="wp-gender-svg" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="maleG-${i}" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#0055ff"/>
                <stop offset="60%" stop-color="#00d2ff"/>
                <stop offset="100%" stop-color="#ffffff"/>
              </linearGradient>
            </defs>
            <circle cx="16" cy="24" r="9" fill="none" stroke="url(#maleG-${i})" stroke-width="3.5"/>
            <line x1="23" y1="17" x2="34" y2="6" stroke="url(#maleG-${i})" stroke-width="3.5" stroke-linecap="round"/>
            <polyline points="26,6 34,6 34,14" fill="none" stroke="url(#maleG-${i})" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else {
        el.innerHTML = `
          <svg class="wp-gender-svg" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="femG-${i}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffffff"/>
                <stop offset="40%" stop-color="#ff2a85"/>
                <stop offset="100%" stop-color="#99003d"/>
              </linearGradient>
            </defs>
            <circle cx="20" cy="15" r="9" fill="none" stroke="url(#femG-${i})" stroke-width="3.5"/>
            <line x1="20" y1="24" x2="20" y2="36" stroke="url(#femG-${i})" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="14" y1="30" x2="26" y2="30" stroke="url(#femG-${i})" stroke-width="3.5" stroke-linecap="round"/>
          </svg>
        `;
      }
    } else {
      const pal = theme.palettes[Math.floor(Math.random() * theme.palettes.length)];
      el.style.setProperty('--glow-color', theme.glow);
      const hasXoxo = (theme.type === 'hearts_xoxo') && (size > 38) && (Math.random() > 0.45);

      el.innerHTML = `
        <svg class="wp-puffy-heart" viewBox="0 0 48 48">
          <defs>
            <radialGradient id="bodyG-${i}" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="${pal.top}"/>
              <stop offset="45%" stop-color="${pal.mid}"/>
              <stop offset="100%" stop-color="${pal.base}"/>
            </radialGradient>
            <radialGradient id="highG-${i}" cx="35%" cy="25%" r="45%">
              <stop offset="0%" stop-color="${pal.highlight}" stop-opacity="0.8"/>
              <stop offset="60%" stop-color="${pal.highlight}" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="${pal.highlight}" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <path fill="url(#bodyG-${i})" d="M24 43S3 30 3 15C3 8 8.5 3 15 3c4.5 0 7.8 2.6 9 5.5C25.2 5.6 28.5 3 33 3c6.5 0 12 5 12 12 0 15-21 28-21 28z"/>
          <path fill="url(#highG-${i})" d="M24 43S3 30 3 15C3 8 8.5 3 15 3c4.5 0 7.8 2.6 9 5.5C25.2 5.6 28.5 3 33 3c6.5 0 12 5 12 12 0 15-21 28-21 28z"/>
          ${hasXoxo ? `
            <text x="24" y="27" text-anchor="middle" font-family="'Brush Script MT', 'Dancing Script', cursive, sans-serif" font-weight="900" font-size="10.5" fill="rgba(255,255,255,0.78)" letter-spacing="1.5" transform="rotate(-12 24 25)">xoxo</text>
          ` : ''}
        </svg>
      `;
    }

    container.appendChild(el);
  }
}

function loadSavedWallpaper() {
  const savedKey = localStorage.getItem('pact_wallpaper_key') || 'ruby_opal';
  setWallpaper(savedKey);
}

function openWallpaperModal() {
  document.getElementById('wallpaper-modal')?.classList.add('active');
  tg?.HapticFeedback?.impactOccurred?.('light');
}
function closeWallpaperModal() {
  document.getElementById('wallpaper-modal')?.classList.remove('active');
}

/* ========================================================
   6. ПРОФИЛЬ, ИМЯ & АВАТАРКИ
   ======================================================== */
let currentAvatarRole = localStorage.getItem('pact_current_role') || 'female';

function updateRoleUI() {
  const statLbl = document.getElementById('profile-pts-val');
  const isMale = (currentAvatarRole === 'male');
  if (statLbl) {
    statLbl.innerText = isMale ? '3,450 PTS' : '1,250 PTS';
  }
}

const MALE_CARTOON_AVATARS = [
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_1.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_2.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_3.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_4.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_5.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_6.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_7.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_8.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_9.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/male_10.png'
];

const FEMALE_CARTOON_AVATARS = [
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_1.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_2.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_3.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_4.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_5.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_6.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_7.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_8.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_9.png',
  'https://raw.githubusercontent.com/kiriltaha80-boop/telegram-app/main/avatars/fem_10.png'
];

function toggleRoleByEmoji() {
  currentAvatarRole = (currentAvatarRole === 'male') ? 'female' : 'male';
  localStorage.setItem('pact_current_role', currentAvatarRole);

  updateRoleEmojiUI();
  updateRoleUI();

  const savedAvatar = localStorage.getItem('pact_avatar_' + currentAvatarRole);
  if (savedAvatar) {
    applyAvatarToUI(currentAvatarRole, savedAvatar);
  } else {
    const defaultList = (currentAvatarRole === 'male') ? MALE_CARTOON_AVATARS : FEMALE_CARTOON_AVATARS;
    applyAvatarToUI(currentAvatarRole, defaultList[0]);
  }

  renderDesktop();
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('medium');
}

function updateRoleEmojiUI() {
  const emojiElem = document.getElementById('role-toggle-emoji');
  if (emojiElem) {
    emojiElem.innerText = (currentAvatarRole === 'male') ? '😈' : '😇';
  }
}

function loadSavedRole() {
  currentAvatarRole = localStorage.getItem('pact_current_role') || 'female';
  updateRoleEmojiUI();
  updateRoleUI();
}

function openAvatarModal(role) {
  currentAvatarRole = role || 'female';
  const modal = document.getElementById('avatar-modal');
  if (!modal) return;

  const title = document.getElementById('avatar-modal-title');
  if (title) {
    title.innerText = (currentAvatarRole === 'male') ? 'Аватарка: Верхний' : 'Аватарка: Нижняя';
  }

  renderAvatarGrid();

  modal.style.display = 'flex';
  modal.classList.add('active');
  tg?.HapticFeedback?.impactOccurred?.('light');
}

function closeAvatarModal() {
  const modal = document.getElementById('avatar-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

function renderAvatarGrid() {
  const grid = document.getElementById('avatar-presets-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = (currentAvatarRole === 'male') ? MALE_CARTOON_AVATARS : FEMALE_CARTOON_AVATARS;
  const storageKey = 'pact_avatar_' + currentAvatarRole;
  const currentSaved = localStorage.getItem(storageKey) || list[0];

  const uploadCard = document.createElement('div');
  uploadCard.className = 'avatar-thumb-card upload-card';
  uploadCard.onclick = () => document.getElementById('custom-avatar-file-input').click();
  uploadCard.innerHTML = `
    <span class="avatar-upload-icon">+</span>
    <span class="avatar-upload-label">Своё фото</span>
  `;
  grid.appendChild(uploadCard);

  list.forEach((url, idx) => {
    const card = document.createElement('div');
    card.className = 'avatar-thumb-card' + (currentSaved === url ? ' selected' : '');
    card.onclick = () => selectAvatar(url);
    card.innerHTML = `<img src="${url}" alt="Avatar ${idx + 1}" loading="lazy">`;
    grid.appendChild(card);
  });
}

function selectAvatar(url) {
  const storageKey = 'pact_avatar_' + currentAvatarRole;
  localStorage.setItem(storageKey, url);
  tg?.HapticFeedback?.selectionChanged?.();

  applyAvatarToUI(currentAvatarRole, url);
  renderAvatarGrid();
}

function handleCustomAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    const storageKey = 'pact_avatar_' + currentAvatarRole;
    localStorage.setItem(storageKey, base64Url);
    tg?.HapticFeedback?.notificationOccurred?.('success');

    applyAvatarToUI(currentAvatarRole, base64Url);
    renderAvatarGrid();
  };
  reader.readAsDataURL(file);
}

function applyAvatarToUI(role, src) {
  const targetImg = document.getElementById('avatar-img-' + role)
                 || document.getElementById('avatar-img-female')
                 || document.getElementById('avatar-img-male')
                 || document.querySelector('.profile-avatar-img');
  if (targetImg) {
    targetImg.src = src;
  }

  const navAvatar = document.getElementById('nav-bar-avatar');
  if (navAvatar) {
    navAvatar.src = src;
  }
}

function loadSavedAvatars() {
  const maleSaved = localStorage.getItem('pact_avatar_male') || MALE_CARTOON_AVATARS[0];
  const femaleSaved = localStorage.getItem('pact_avatar_female') || FEMALE_CARTOON_AVATARS[0];

  applyAvatarToUI(currentAvatarRole, (currentAvatarRole === 'male' ? maleSaved : femaleSaved));
}

function openNameModal() {
  const modal = document.getElementById('name-modal');
  if (!modal) return;

  const input = document.getElementById('input-profile-name');
  if (input) {
    input.value = localStorage.getItem('pact_user_name') || '';
  }

  modal.classList.add('active');
  modal.style.display = 'flex';
  tg?.HapticFeedback?.impactOccurred?.('light');
}

function closeNameModal() {
  const modal = document.getElementById('name-modal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function saveProfileName() {
  const input = document.getElementById('input-profile-name');
  const newName = (input?.value || '').trim();

  if (!newName) {
    alert('Пожалуйста, введите имя.');
    return;
  }

  localStorage.setItem('pact_user_name', newName);

  const nameDisplay = document.getElementById('profile-user-name');
  if (nameDisplay) {
    nameDisplay.innerText = newName;
  }

  closeNameModal();
  tg?.HapticFeedback?.notificationOccurred?.('success');
}

function loadSavedProfileName() {
  const nameDisplay = document.getElementById('profile-user-name');
  if (!nameDisplay) return;

  const savedName = localStorage.getItem('pact_user_name');
  if (savedName && savedName.trim() !== '') {
    nameDisplay.innerText = savedName;
    return;
  }

  const tgFirstName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name;
  if (tgFirstName) {
    nameDisplay.innerText = tgFirstName;
    return;
  }

  nameDisplay.innerText = 'Имя';
}

/* ========================================================
   7. ЖЕНСКИЙ КАЛЕНДАРЬ
   ======================================================== */
let cycleStartDate = localStorage.getItem('cycle_start_date') || new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
let cycleDuration = parseInt(localStorage.getItem('cycle_duration') || '28');

function toggleCycleSettings() {
  document.getElementById('cycle-settings').classList.toggle('open');
}

function updateCycleSettings() {
  const startIn = document.getElementById('cycle-start-input').value;
  const lenIn = document.getElementById('cycle-length-input').value;
  if (startIn) cycleStartDate = startIn;
  if (lenIn) cycleDuration = parseInt(lenIn);

  localStorage.setItem('cycle_start_date', cycleStartDate);
  localStorage.setItem('cycle_duration', cycleDuration.toString());
  renderCycleInfo();
}

function renderCycleInfo() {
  const startEl = document.getElementById('cycle-start-input');
  const lenEl = document.getElementById('cycle-length-input');
  if (startEl) startEl.value = cycleStartDate;
  if (lenEl) lenEl.value = cycleDuration;

  const start = new Date(cycleStartDate);
  const now = new Date();
  const diffDays = Math.floor((now - start) / 86400000) % cycleDuration;
  const daysToPeriod = cycleDuration - diffDays;
  const ovulationDay = Math.round(cycleDuration - 14);
  let daysToOvulation = ovulationDay - diffDays;
  if (daysToOvulation < 0) daysToOvulation += cycleDuration;

  const pVal = document.getElementById('box-period-val');
  const pSub = document.getElementById('box-period-sub');
  const oVal = document.getElementById('box-ovulation-val');
  const oSub = document.getElementById('box-ovulation-sub');

  if (pVal) pVal.innerText = `${daysToPeriod} дн.`;
  if (pSub) pSub.innerText = 'Следующий цикл';
  if (oVal) oVal.innerText = daysToOvulation === 0 ? 'Сегодня' : `${daysToOvulation} дн.`;
  if (oSub) oSub.innerText = 'Фертильная фаза';

  const calGrid = document.getElementById('calendar-grid');
  if (!calGrid) return;
  calGrid.innerHTML = '';
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  daysOfWeek.forEach(d => { calGrid.innerHTML += `<div class="calendar-weekday">${d}</div>`; });

  for (let i = 1; i <= cycleDuration; i++) {
    let cls = 'cal-day';
    if (i <= 5) cls += ' period';
    if (i === ovulationDay) cls += ' ovulation';
    if (i === (diffDays + 1)) cls += ' today';
    calGrid.innerHTML += `<div class="${cls}">${i}</div>`;
  }
}

/* ========================================================
   8. СЕССИИ И ЗАДАНИЯ (ВЕРХНИЙ ♂ / НИЖНЯЯ ♀)
   ======================================================== */
let maleTasks = JSON.parse(localStorage.getItem('male_tasks')) || [
  { id: 1, title: 'Утренний кофейный обряд', points: 150 },
  { id: 2, title: 'Выбор вечернего гардероба', points: 200 }
];
let femaleTasks = JSON.parse(localStorage.getItem('female_tasks')) || [
  { id: 1, title: 'Выбор ароматических масел', points: 250 },
  { id: 2, title: 'Принятие расслабляющей ванны', points: 180 }
];

function renderTasks() {
  const mCont = document.getElementById('male-tasks-container');
  const fCont = document.getElementById('female-tasks-container');

  if (mCont) {
    mCont.innerHTML = maleTasks.map((t, idx) => `
      <div class="contract-item">
        <div class="contract-info">
          <div class="name">${t.title}</div>
          <div class="reward">+${t.points} PTS</div>
        </div>
        <button class="back-action-btn" onclick="deleteTask('male', ${idx})">✕</button>
      </div>
    `).join('');
  }

  if (fCont) {
    fCont.innerHTML = femaleTasks.map((t, idx) => `
      <div class="contract-item">
        <div class="contract-info">
          <div class="name">${t.title}</div>
          <div class="reward">+${t.points} PTS</div>
        </div>
        <button class="back-action-btn" onclick="deleteTask('female', ${idx})">✕</button>
      </div>
    `).join('');
  }
}

function addCustomTask(gender) {
  if (gender === 'male') {
    const title = document.getElementById('input-male-title').value.trim();
    const pts = document.getElementById('input-male-points').value || 100;
    if (!title) return;
    maleTasks.push({ id: Date.now(), title, points: parseInt(pts) });
    localStorage.setItem('male_tasks', JSON.stringify(maleTasks));
    document.getElementById('input-male-title').value = '';
  } else {
    const title = document.getElementById('input-female-title').value.trim();
    const pts = document.getElementById('input-female-points').value || 100;
    if (!title) return;
    femaleTasks.push({ id: Date.now(), title, points: parseInt(pts) });
    localStorage.setItem('female_tasks', JSON.stringify(femaleTasks));
    document.getElementById('input-female-title').value = '';
  }
  renderTasks();
}

function deleteTask(gender, idx) {
  if (gender === 'male') {
    maleTasks.splice(idx, 1);
    localStorage.setItem('male_tasks', JSON.stringify(maleTasks));
  } else {
    femaleTasks.splice(idx, 1);
    localStorage.setItem('female_tasks', JSON.stringify(femaleTasks));
  }
  renderTasks();
}

/* ========================================================
   9. ЖЕЛАНИЯ & ПОДАРКИ
   ======================================================== */
let giftWishes = JSON.parse(localStorage.getItem('gift_wishes')) || [
  'Шелковый халат глубокого рубинового цвета',
  'Массажное масло с ароматом ванили'
];

function renderGifts() {
  const gCont = document.getElementById('gifts-list-container');
  if (gCont) {
    gCont.innerHTML = giftWishes.map((w, i) => `
      <div class="contract-item">
        <div class="contract-info"><div class="name">🎁 ${w}</div></div>
        <button class="back-action-btn" onclick="deleteGiftWish(${i})">✕</button>
      </div>
    `).join('');
  }
}

function addGiftWish() {
  const val = document.getElementById('input-gift-title').value.trim();
  if (!val) return;
  giftWishes.push(val);
  localStorage.setItem('gift_wishes', JSON.stringify(giftWishes));
  document.getElementById('input-gift-title').value = '';
  renderGifts();
}

function deleteGiftWish(i) {
  giftWishes.splice(i, 1);
  localStorage.setItem('gift_wishes', JSON.stringify(giftWishes));
  renderGifts();
}

/* ========================================================
   10. БУТИК & СЕКС-ШОП
   ======================================================== */
let boutiqueItems = JSON.parse(localStorage.getItem('boutique_items')) || [
  { id: 101, title: 'Кружевной Комплект Velour', category: 'Комплект', mainImg: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400', pricePts: 450 }
];
let sexshopItems = JSON.parse(localStorage.getItem('sexshop_items')) || [
  { id: 201, title: 'Кожаный Бондажный Набор', category: 'Бондаж', mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400', pricePts: 850 }
];

let shopFilterCat = 'all';
let sexshopFilterCat = 'all';

function setShopCategory(cat, btn) {
  shopFilterCat = cat;
  document.querySelectorAll('#tab-shop .chip-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  renderProducts();
}

function setSexshopCategory(cat, btn) {
  sexshopFilterCat = cat;
  document.querySelectorAll('#tab-sexshop .chip-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  renderProducts();
}

function renderProducts() {
  const bCont = document.getElementById('shop-products-list');
  const sCont = document.getElementById('custom-products-sexshop');

  if (bCont) {
    const filteredBoutique = (shopFilterCat === 'all')
      ? boutiqueItems
      : boutiqueItems.filter(item => item.category === shopFilterCat);

    bCont.innerHTML = filteredBoutique.map(p => `
      <div class="product-card">
        <img class="product-main-img" src="${p.mainImg}" alt="${p.title}">
        <div class="product-title">${p.title}</div>
        <div class="product-category-lbl">${p.category}</div>
        <div class="product-price-lbl">🔥 ${p.pricePts} PTS</div>
      </div>
    `).join('');
  }

  if (sCont) {
    const filteredSexshop = (sexshopFilterCat === 'all')
      ? sexshopItems
      : sexshopItems.filter(item => item.category === sexshopFilterCat);

    sCont.innerHTML = filteredSexshop.map(p => `
      <div class="product-card">
        <img class="product-main-img" src="${p.mainImg}" alt="${p.title}">
        <div class="product-title">${p.title}</div>
        <div class="product-category-lbl">${p.category}</div>
        <div class="product-price-lbl">🔥 ${p.pricePts} PTS</div>
      </div>
    `).join('');
  }
}

function openAddProductModal(shop) {
  document.getElementById('target-modal-shop').value = shop;
  document.getElementById('add-product-modal')?.classList.add('active');
}
function closeAddProductModal() {
  document.getElementById('add-product-modal')?.classList.remove('active');
}

function handleProductSubmit(e) {
  e.preventDefault();
  const shop = document.getElementById('target-modal-shop').value;
  const newProd = {
    id: Date.now(),
    title: document.getElementById('prod-title').value.trim(),
    category: document.getElementById('prod-category').value.trim(),
    mainImg: document.getElementById('prod-main-img').value.trim(),
    pricePts: parseInt(document.getElementById('prod-price-pts').value || '0')
  };

  if (shop === 'boutique') {
    boutiqueItems.push(newProd);
    localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));
  } else {
    sexshopItems.push(newProd);
    localStorage.setItem('sexshop_items', JSON.stringify(sexshopItems));
  }

  document.getElementById('add-product-form').reset();
  closeAddProductModal();
  renderProducts();
}

/* ========================================================
   11. СООБЩЕНИЯ & ЧАТ С БОТОМ
   ======================================================== */
let chatHistory = [
  { sender: 'bot', text: 'Приветствую в личном пространстве Pact & Passion. Готовы ли вы закрепить новые правила вечера?' }
];

function renderChat() {
  const box = document.getElementById('chat-messages');
  if (!box) return;
  box.innerHTML = chatHistory.map(m => `
    <div class="chat-msg ${m.sender}">${m.text}</div>
  `).join('');
  box.scrollTop = box.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const txt = input.value.trim();
  if (!txt) return;

  chatHistory.push({ sender: 'user', text: txt });
  input.value = '';
  renderChat();

  setTimeout(() => {
    chatHistory.push({ sender: 'bot', text: 'Соглашение принято и зафиксировано в протоколе сессии ✨' });
    renderChat();
  }, 700);
}

/* ========================================================
   12. БЛОКИРОВКА СКРОЛЛА & ИНИЦИАЛИЗАЦИЯ
   ======================================================== */
document.addEventListener('touchmove', (e) => {
  if (document.body.classList.contains('lock-scroll')) {
    if (!e.target.closest('.modal-card') && !e.target.closest('.modal-overlay') && !e.target.closest('.tab-content')) {
      e.preventDefault();
    }
  }
}, { passive: false });

document.body.classList.add('lock-scroll');

document.addEventListener('DOMContentLoaded', () => {
  try {
    loadSavedWallpaper();
    loadSavedRole();
    loadSavedAvatars();
    loadSavedProfileName();
    updateContractButtonUI();
    renderDesktop();
    renderCycleInfo();
    renderTasks();
    renderGifts();
    renderProducts();
    renderChat();
  } catch (err) {
    console.error('Ошибка инициализации приложения:', err);
  }
});
/* ========================================================
   13. ЛОГИКА ИГРЫ «СУДЬБА & ЖРЕБИЙ» (МОНЕТКА + ЧИСЛА + ЭФФЕКТЫ)
   ======================================================== */
function switchRandomMode(mode) {
  tg?.HapticFeedback?.impactOccurred?.('light');
  document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#tab-randomizer .tab-section').forEach(s => s.classList.remove('active'));

  if (mode === 'coin') {
    document.getElementById('tab-btn-coin')?.classList.add('active');
    document.getElementById('section-coin')?.classList.add('active');
  } else {
    document.getElementById('tab-btn-dice')?.classList.add('active');
    document.getElementById('section-dice')?.classList.add('active');
  }
}

// ХОЛСТ САЛЮТА, КОНФЕТТИ И СЕРПАНТИНА
const burstCanvas = document.getElementById('burst-canvas');
const burstCtx = burstCanvas?.getContext('2d');
let burstParticles = [];
let burstAnimId = null;

function resizeBurstCanvas() {
  const card = document.getElementById('random-app-card');
  if (card && burstCanvas) {
    burstCanvas.width = card.clientWidth;
    burstCanvas.height = card.clientHeight;
  }
}
window.addEventListener('resize', resizeBurstCanvas);

function launchCelebration(x, y) {
  resizeBurstCanvas();
  burstParticles = [];

  const originX = (x !== undefined) ? x : burstCanvas.width / 2;
  const originY = (y !== undefined) ? y : burstCanvas.height / 2;

  const colors = [
    '#FFD700', '#FFB703', '#FFFFFF',
    '#E63956', '#FF1493', '#FF2A85',
    '#00F0FF', '#00D2FF', '#9B51E0',
    '#00E676', '#FF5722'
  ];

  // 1. Искры салюта
  for (let i = 0; i < 45; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8.5 + 4;
    burstParticles.push({
      type: 'spark',
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 2.5 + 1.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.025 + 0.016,
      gravity: 0.14
    });
  }

  // 2. Порхающее конфетти
  for (let i = 0; i < 48; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6.5 + 3;
    burstParticles.push({
      type: 'confetti',
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3.2,
      w: Math.random() * 7 + 4.5,
      h: Math.random() * 4.5 + 2.8,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.28,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.014 + 0.008,
      gravity: 0.1
    });
  }

  // 3. Серпантин — длинные извивающиеся спиральные ленты
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5.5 + 2.5;
    burstParticles.push({
      type: 'serpentine',
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4.5,
      length: Math.random() * 26 + 22,
      width: Math.random() * 2.6 + 2.4,
      wave: Math.random() * Math.PI * 2,
      waveSpeed: Math.random() * 0.16 + 0.09,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.009 + 0.006,
      gravity: 0.08
    });
  }

  if (!burstAnimId) animateBurstParticles();
}

function animateBurstParticles() {
  if (!burstCtx || !burstCanvas) return;
  burstCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);

  for (let i = burstParticles.length - 1; i >= 0; i--) {
    const p = burstParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      burstParticles.splice(i, 1);
      continue;
    }

    burstCtx.save();
    burstCtx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'spark') {
      burstCtx.beginPath();
      burstCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      burstCtx.fillStyle = p.color;
      burstCtx.shadowBlur = 10;
      burstCtx.shadowColor = p.color;
      burstCtx.fill();
    } else if (p.type === 'confetti') {
      p.rot += p.vRot;
      burstCtx.translate(p.x, p.y);
      burstCtx.rotate(p.rot);
      burstCtx.fillStyle = p.color;
      burstCtx.shadowBlur = 4;
      burstCtx.shadowColor = p.color;
      burstCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.type === 'serpentine') {
      p.wave += p.waveSpeed;
      burstCtx.translate(p.x, p.y);
      burstCtx.beginPath();
      const segments = 6;
      const segLen = p.length / segments;
      burstCtx.lineWidth = p.width;
      burstCtx.strokeStyle = p.color;
      burstCtx.lineCap = 'round';
      burstCtx.lineJoin = 'round';
      burstCtx.shadowBlur = 6;
      burstCtx.shadowColor = p.color;

      for (let s = 0; s <= segments; s++) {
        const px = Math.sin(p.wave + s * 1.1) * (p.width * 2.8);
        const py = s * segLen;
        if (s === 0) burstCtx.moveTo(px, py);
        else burstCtx.lineTo(px, py);
      }
      burstCtx.stroke();
    }

    burstCtx.restore();
  }

  if (burstParticles.length > 0) {
    burstAnimId = requestAnimationFrame(animateBurstParticles);
  } else {
    cancelAnimationFrame(burstAnimId);
    burstAnimId = null;
    burstCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
  }
}

// БРОСОК МОНЕТКИ
let isTossing = false;
let currentRotationX = 0;

function tossCoin() {
  if (isTossing) return;
  isTossing = true;

  const stage = document.getElementById('coin-stage');
  const coin3D = document.getElementById('coin-3d');
  const isMale = Math.random() < 0.5; // true = ♂, false = ♀

  stage?.classList.add('toss-flying');
  tg?.HapticFeedback?.impactOccurred?.('medium');

  const fullSpins = 360 * 6;
  currentRotationX += fullSpins + (isMale ? 0 : 180) - (currentRotationX % 360);

  if (coin3D) {
    coin3D.style.transition = 'transform 1.35s cubic-bezier(0.2, 0.85, 0.25, 1)';
    coin3D.style.transform = `rotateX(${currentRotationX}deg)`;
  }

  setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('light'), 300);
  setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('light'), 650);

  setTimeout(() => {
    tg?.HapticFeedback?.impactOccurred?.('heavy');
    
    if (stage && burstCanvas) {
      const stageRect = stage.getBoundingClientRect();
      const cardRect = document.getElementById('random-app-card')?.getBoundingClientRect() || stageRect;
      const originX = (stageRect.left + stageRect.width / 2) - cardRect.left;
      const originY = (stageRect.top + stageRect.height / 2) - cardRect.top;
      launchCelebration(originX, originY);
    }

    stage?.classList.remove('toss-flying');
    isTossing = false;
  }, 1350);
}

// РАНДОМАЙЗЕР ЧИСЕЛ
let isRollingDice = false;

function setDiceMax(val, btnEl) {
  const input = document.getElementById('dice-max-input');
  if (input) input.value = val;

  document.querySelectorAll('#section-dice .chip-btn').forEach(b => b.classList.remove('active'));
  btnEl?.classList.add('active');
  tg?.HapticFeedback?.impactOccurred?.('light');
}

function syncPresetChips(val) {
  const num = parseInt(val);
  document.querySelectorAll('#section-dice .chip-btn').forEach(b => {
    const chipNum = parseInt(b.innerText.replace('до ', ''));
    b.classList.toggle('active', chipNum === num);
  });
}

function rollRandomNumber() {
  if (isRollingDice) return;

  const input = document.getElementById('dice-max-input');
  let max = parseInt(input?.value) || 10;
  if (max < 2) max = 2;
  if (input) input.value = max;

  isRollingDice = true;
  const display = document.getElementById('dice-display-num');
  const statusLbl = document.getElementById('dice-status-lbl');
  if (statusLbl) statusLbl.innerText = `Вращение от 1 до ${max}...`;

  let ticks = 0;
  const totalTicks = 18;

  const interval = setInterval(() => {
    const temp = Math.floor(Math.random() * max) + 1;
    if (display) {
      display.innerText = temp;
      display.style.transform = `scale(${1 + (ticks % 2 === 0 ? 0.08 : -0.04)})`;
    }
    tg?.HapticFeedback?.impactOccurred?.('light');
    ticks++;

    if (ticks >= totalTicks) {
      clearInterval(interval);
      const finalResult = Math.floor(Math.random() * max) + 1;
      if (display) {
        display.innerText = finalResult;
        display.style.transform = 'scale(1)';
      }
      if (statusLbl) statusLbl.innerText = `Выпало число: ${finalResult}`;
      tg?.HapticFeedback?.notificationOccurred?.('success');

      if (display && burstCanvas) {
        const dispRect = display.getBoundingClientRect();
        const cardRect = document.getElementById('random-app-card')?.getBoundingClientRect() || dispRect;
        const originX = (dispRect.left + dispRect.width / 2) - cardRect.left;
        const originY = (dispRect.top + dispRect.height / 2) - cardRect.top;
        launchCelebration(originX, originY);
      }

      isRollingDice = false;
    }
  }, 65);
}
