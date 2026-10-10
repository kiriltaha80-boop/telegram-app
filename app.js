/* ========================================================

ИНИЦИАЛИЗАЦИЯ TELEGRAM WEB APP & СИСТЕМНЫЕ ПЕРЕМЕННЫЕ
======================================================== */
const tg = window.Telegram?.WebApp;
if (tg) {
try {
tg.ready();
tg.expand();
if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0')) tg.requestFullscreen?.();
if (tg.isVersionAtLeast && tg.isVersionAtLeast('7.7')) tg.disableVerticalSwipes?.();
} catch (e) {
console.warn('Telegram WebApp init warning:', e);
}
}

// Активная роль игрока (Верхний ♂: 'male', Нижняя ♀: 'female')
let currentAvatarRole = localStorage.getItem('pact_current_role') || 'female';

// Балансы сердец Нижней (💜 Страсть, 🖤 Покорность, ❤️ Секс-валюта)
let femaleBalances = JSON.parse(localStorage.getItem('pact_female_balances')) || {
ptc: 750,
otc: 330,
stc: 290
};

// Балансы сердец Верхнего (💙 Внимание, 💚 Забота, ❤️ Секс-валюта)
let maleBalances = JSON.parse(localStorage.getItem('pact_male_balances')) || {
atc: 850,
ctc: 720,
stc: 90
};

// Версионирование кэша для безопасного сброса устаревших структур
if (localStorage.getItem('pact_single_ver') !== 'v36_final_stable_release') {
localStorage.removeItem('pact_desktop_items');
localStorage.setItem('pact_single_ver', 'v36_final_stable_release');
}

// Лог истории операций
let transactionsLog = JSON.parse(localStorage.getItem('pact_transactions_log')) || [
{ id: 1, time: 'Сегодня, 14:20', type: 'reward', recipient: 'female', currency: 'PTC', amount: 50, reason: 'Кофе в постель ☕' },
{ id: 2, time: 'Сегодня, 16:45', type: 'penalty', recipient: 'female', currency: 'OTC', amount: 30, reason: 'Дерзкий тон без разрешения ⚡' },
{ id: 3, time: 'Вчера, 19:10', type: 'reward', recipient: 'male', currency: 'ATC', amount: 40, reason: 'Внимание и романтический жест 💙' }
];

/* ========================================================
2. ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ (TOASTS) & ХЕЛПЕРЫ
======================================================== */
function showToast(message, type = 'info') {
const container = document.getElementById('toast-container');
if (!container) return;

if (type === 'success') tg?.HapticFeedback?.notificationOccurred?.('success');
else if (type === 'penalty' || type === 'error') tg?.HapticFeedback?.notificationOccurred?.('warning');
else tg?.HapticFeedback?.impactOccurred?.('medium');

const toast = document.createElement('div');
toast.className = app-toast toast-${type};
toast.innerHTML = <div style="line-height: 1.45;">${message}</div>;
container.appendChild(toast);

requestAnimationFrame(() => toast.classList.add('visible'));

setTimeout(() => {
toast.classList.remove('visible');
setTimeout(() => toast.remove(), 300);
}, 3400);
}

function getHeartByCurrency(curr) {
if (curr === 'PTC') return '💜';
if (curr === 'OTC') return '🖤';
if (curr === 'STC') return '❤️';
if (curr === 'ATC') return '💙';
if (curr === 'CTC') return '💚';
return curr;
}

/* ========================================================
3. ЗАСТАВКА (SPLASH SCREEN) & НАВИГАЦИЯ
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
if (tabId === 'tab-male-session' && currentAvatarRole !== 'male') {
showToast('Доступно только Верхнему ♂', 'error');
tg?.HapticFeedback?.notificationOccurred?.('warning');
return;
}
if (tabId === 'tab-female-session' && currentAvatarRole !== 'female') {
showToast('Доступно только Нижней ♀', 'error');
tg?.HapticFeedback?.notificationOccurred?.('warning');
return;
}

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
closeCapsuleToolbar();

document.querySelectorAll('.tab-content:not(#tab-home)').forEach(tab => tab.classList.remove('active'));

const homeEl = document.getElementById('tab-home');
const activeEl = document.getElementById(tabId);

if (tabId === 'tab-home') {
if (homeEl) homeEl.style.filter = 'none';
} else {
if (activeEl) {
activeEl.classList.add('active');
activeEl.scrollTop = 0;
}
if (homeEl) homeEl.style.filter = 'blur(6px) brightness(0.65)';
if (isDesktopEditMode) {
toggleDesktopEditMode();
}
}

document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
if (tabId === 'tab-home') document.getElementById('nav-home')?.classList.add('active');
else if (tabId === 'tab-profile') document.getElementById('nav-profile')?.classList.add('active');
else if (tabId === 'tab-messenger' || tabId === 'tab-chat-1') document.getElementById('nav-chat')?.classList.add('active');

if (tabId === 'tab-bank') renderBankScreen();
if (tabId === 'tab-wardrobe') renderWardrobe();
if (tabId === 'tab-shop') renderProducts();
}

/* ========================================================
4. ВСПЛЫВАЮЩАЯ ПАНЕЛЬ НАД НИЖНИМ НАВБАРОМ
======================================================== */
function toggleCapsuleToolbar() {
const toolbar = document.getElementById('capsule-dock-toolbar');
const capsule = document.getElementById('brand-capsule-btn');
if (!toolbar) return;

const isActive = toolbar.classList.toggle('active');
capsule?.classList.toggle('active', isActive);

if (isActive) {
tg?.HapticFeedback?.impactOccurred?.('medium');
} else {
tg?.HapticFeedback?.impactOccurred?.('light');
}
}

function closeCapsuleToolbar() {
const toolbar = document.getElementById('capsule-dock-toolbar');
const capsule = document.getElementById('brand-capsule-btn');
toolbar?.classList.remove('active');
capsule?.classList.remove('active');
}

function openAddWidgetModalDirect() {
closeCapsuleToolbar();
openCustomizationModal();
setCustomModalTab('widgets');
tg?.HapticFeedback?.selectionChanged?.();
}

function openWallpaperModalDirect() {
closeCapsuleToolbar();
openCustomizationModal();
setCustomModalTab('wallpapers');
tg?.HapticFeedback?.selectionChanged?.();
}

document.addEventListener('touchstart', (e) => {
const toolbar = document.getElementById('capsule-dock-toolbar');
const capsule = document.getElementById('brand-capsule-btn');
if (toolbar && toolbar.classList.contains('active')) {
if (!toolbar.contains(e.target) && !capsule.contains(e.target)) {
closeCapsuleToolbar();
}
}
}, { passive: true });

/* ========================================================
5. ГРАДУС СТРАСТИ 🌶️ & ГАРДЕРОБ
======================================================== */
let wardrobeItems = JSON.parse(localStorage.getItem('wardrobe_items')) || [
{ id: 1, title: '«Винтажная Муза»', desc: 'Корсетный топ цвета слоновой кости с кружевом', category: 'Белье', peppers: 1, mainImg: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600' },
{ id: 2, title: '«Тёмная Покорность»', desc: 'Чёрное кружево, чокер, пояс с гартерами и портупея', category: 'Белье', peppers: 2, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' },
{ id: 3, title: '«Цветение Айвори»', desc: 'Цветочная вышивка, глубокий вырез и двойные бретели', category: 'Белье', peppers: 2, mainImg: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600' },
{ id: 4, title: '«Чистый Соблазн»', desc: 'Белоснежный открытый бра с кольцами и микро-стринги', category: 'Белье', peppers: 3, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' },
{ id: 5, title: '«Атласные Ленты & Повязка»', desc: 'Для ограничения зрения и депривации чувств', category: 'Игрушки', peppers: 1, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' },
{ id: 6, title: '«Бархатный Ошейник»', desc: 'Чёрный ошейник с позолоченным кольцом и поводком', category: 'Игрушки', peppers: 2, mainImg: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=900' }
];

let wardrobeFilterCat = 'Белье';
let selectedWardrobeIds = JSON.parse(localStorage.getItem('pact_selected_wardrobe_ids')) || [1, 2];

function renderPeppers(count = 1) {
const peppers = '🌶️'.repeat(Math.min(Math.max(count, 1), 3));
return <span class="peppers-indicator" title="Степень откровенности: ${count}">${peppers}</span>;
}

function getPepperDescription(count = 1) {
if (count === 1) return 'Чувственный';
if (count === 2) return 'Провокационный';
return 'Экстремальный';
}

function getPassionStatus() {
let total = 0;
let countItems = 0;

selectedWardrobeIds.forEach(id => {
const item = wardrobeItems.find(w => w.id === id);
if (item) {
total += (item.peppers || 1);
countItems++;
}
});

let title = 'Невинный образ 🕊️';
let desc = 'Ничего не надето на вечер';
const maxCap = 9;

if (countItems === 0 || total === 0) {
title = 'Невинный образ 🕊️';
desc = 'Ничего не надето на вечер';
} else if (total <= 2) {
title = 'Скромная девочка 🎀';
desc = 'Будуарная романтика и нежность';
} else if (total <= 4) {
title = 'Игривая кокетка ✨';
desc = 'Соблазнительный флирт и акценты';
} else if (total <= 6) {
title = 'Опасная искусительница 🥀';
desc = 'Тонкая провокация и скрытая страсть';
} else if (total <= 8) {
title = 'Покорная грешница ⛓️';
desc = 'Строгие гартеры и покорность слову';
} else {
title = 'Развратная богиня 🔥';
desc = 'Пик наготы, экстаза и повиновения';
}

const progressPercent = Math.min(Math.round((total / maxCap) * 100), 100);
return { total, countItems, title, desc, progressPercent };
}

function setWardrobeCategory(cat, btn) {
wardrobeFilterCat = cat;
document.querySelectorAll('#tab-wardrobe .chip-btn').forEach(b => b.classList.remove('active'));
btn?.classList.add('active');
tg?.HapticFeedback?.selectionChanged?.();
renderWardrobe();
}

function selectWardrobeItem(id) {
const index = selectedWardrobeIds.indexOf(id);
if (index > -1) {
selectedWardrobeIds.splice(index, 1);
tg?.HapticFeedback?.impactOccurred?.('light');
} else {
selectedWardrobeIds.push(id);
tg?.HapticFeedback?.notificationOccurred?.('success');
}

localStorage.setItem('pact_selected_wardrobe_ids', JSON.stringify(selectedWardrobeIds));
renderWardrobe();
renderDesktop();
}

function renderWardrobe() {
const banner = document.getElementById('wardrobe-passion-summary');
const passion = getPassionStatus();
if (banner) {
banner.innerHTML = <div> <div style="font-size: 9px; font-weight: 800; color: #FF8566; text-transform: uppercase;">Текущий образ:</div> <div style="font-size: 13px; font-weight: 800; color: #fff;">${passion.title}</div> </div> <div style="text-align: right;"> <div style="font-size: 12.5px; font-weight: 900; color: #FFB703;">${passion.total} 🌶️</div> <div style="font-size: 9px; color: var(--text-muted);">${passion.countItems} предмет(ов)</div> </div>;
}

const container = document.getElementById('wardrobe-items-list');
if (!container) return;

const filtered = wardrobeItems.filter(item => item.category === wardrobeFilterCat);

if (filtered.length === 0) {
container.innerHTML = 'В этой категории пока пусто';
return;
}

container.innerHTML = filtered.map(item => {
const isSelected = selectedWardrobeIds.includes(item.id);
const isToy = (item.category === 'Игрушки');
const badgeText = isToy ? 'БУДЕТ ИСПОЛЬЗОВАНО ⚡' : 'НАДЕТО ✨';
const activeBtnText = isToy ? '✓ Будет использовано' : '✓ Надето';

return `
  <div class="wardrobe-card-row ${isSelected ? 'is-selected' : ''}" onclick="selectWardrobeItem(${item.id})">
    <div class="wardrobe-img-wrap" onclick="event.stopPropagation(); openFullscreenPhoto('${item.mainImg}')">
      <img class="wardrobe-row-img" src="${item.mainImg}" alt="${item.title}" loading="lazy">
      ${isSelected ? `<span class="selected-badge ${isToy ? 'badge-toy' : ''}">${badgeText}</span>` : ''}
    </div>
    <div class="wardrobe-row-info">
      <div>
        <div class="wardrobe-row-title-bar">
          <div class="wardrobe-row-title">${item.title}</div>
          <div>${renderPeppers(item.peppers || 1)}</div>
        </div>
        <div class="wardrobe-row-desc">${item.desc}</div>
      </div>
      <div class="wardrobe-row-footer">
        <span class="wardrobe-row-cat">${item.category === 'Белье' ? 'Белье' : 'Секс-шоп'}</span>
        <button class="wardrobe-select-btn ${isSelected ? (isToy ? 'active-toy' : 'active-lingerie') : ''}">
          ${isSelected ? activeBtnText : 'Выбрать'}
        </button>
      </div>
    </div>
  </div>
`;


}).join('');
}

/* ========================================================
6. РАБОЧИЙ СТОЛ (3 СТОЛА, СВАЙП, DRAG & DROP)
======================================================== */
let isDesktopEditMode = false;
let isContractSigned = localStorage.getItem('pact_contract_signed') !== 'false';
let currentDesktopPage = 0;
let editingTileId = null;

let desktopItems = JSON.parse(localStorage.getItem('pact_desktop_items')) || [
{ id: 'w-passion', type: 'widget-passion', span: 4, page: 0 },
{ id: 'w-balance', type: 'widget-balance', span: 4, page: 0 },
{ id: 'tile-male', type: 'tile', title: 'Верхний ♂', icon: '⚡', target: 'tab-male-session', page: 0 },
{ id: 'tile-female', type: 'tile', title: 'Нижняя ♀', icon: '🌹', target: 'tab-female-session', page: 0 },
{ id: 'tile-bank', type: 'tile', title: 'Баланс', icon: '💖', target: 'tab-bank', page: 0 },
{ id: 'tile-wardrobe', type: 'tile', title: 'Гардероб', icon: '🩱', target: 'tab-wardrobe', page: 0 },
{ id: 'tile-boutique', type: 'tile', title: 'Бутик', icon: '🛍️', target: 'tab-shop', page: 0 },
{ id: 'tile-sexshop', type: 'tile', title: 'Секс-шоп', icon: '🔮', target: 'tab-sexshop', page: 0 },
{ id: 'tile-random', type: 'tile', title: 'Жребий', icon: '🎲', target: 'tab-randomizer', page: 1 },
{ id: 'tile-contract', type: 'tile', title: 'Контракт', icon: '📜', target: 'tab-contract', page: 1 },
{ id: 'tile-gifts', type: 'tile', title: 'Желания', icon: '✨', target: 'tab-gifts', page: 1 },
{ id: 'tile-cycle', type: 'tile', title: 'Календарь', icon: '🌸', target: 'tab-cycle', page: 1 },
{ id: 'tile-chat', type: 'tile', title: 'Чат', icon: '💬', target: 'tab-messenger', page: 1 },
{ id: 'w-contract', type: 'widget-contract', span: 4, page: 1 }
];

function saveDesktopItems() {
localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
}

function toggleDesktopEditMode() {
isDesktopEditMode = !isDesktopEditMode;
const homeTab = document.getElementById('tab-home');

if (isDesktopEditMode) {
homeTab?.classList.add('edit-mode');
showToast('Режим редактирования: зажмите и перемещайте элементы или нажмите для смены иконки', 'info');
} else {
homeTab?.classList.remove('edit-mode');
}
tg?.HapticFeedback?.impactOccurred?.('medium');
renderDesktop();
}

function goToDesktopPage(pageIdx) {
currentDesktopPage = Math.max(0, Math.min(2, pageIdx));
const track = document.getElementById('desktop-pages-track');
if (track) {
track.style.transform = translateX(-${currentDesktopPage * 100}%);
}

const dots = document.querySelectorAll('.desktop-dot');
dots.forEach((dot, idx) => {
dot.classList.toggle('active', idx === currentDesktopPage);
});

tg?.HapticFeedback?.selectionChanged?.();
}

let touchStartX = 0;
let touchStartY = 0;
let touchDeltaX = 0;
let isSwiping = false;

function initSwipeGestures() {
const viewport = document.getElementById('desktop-viewport');
if (!viewport) return;

viewport.addEventListener('touchstart', (e) => {
if (isDesktopEditMode) return;
touchStartX = e.touches[0].clientX;
touchStartY = e.touches[0].clientY;
touchDeltaX = 0;
isSwiping = true;
}, { passive: true });

viewport.addEventListener('touchmove', (e) => {
if (!isSwiping || isDesktopEditMode) return;
const currentX = e.touches[0].clientX;
const currentY = e.touches[0].clientY;
const diffX = currentX - touchStartX;
const diffY = currentY - touchStartY;

if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 12) {
  isSwiping = false;
  return;
}
touchDeltaX = diffX;


}, { passive: true });

viewport.addEventListener('touchend', () => {
if (!isSwiping || isDesktopEditMode) return;
isSwiping = false;
const threshold = 45;
if (touchDeltaX < -threshold && currentDesktopPage < 2) {
goToDesktopPage(currentDesktopPage + 1);
} else if (touchDeltaX > threshold && currentDesktopPage > 0) {
goToDesktopPage(currentDesktopPage - 1);
}
});
}

/* СЕНСОРНЫЙ DRAG & DROP */
let draggedElement = null;
let dragGhost = null;
let dragGhostStartX = 0;
let dragGhostStartY = 0;
let isItemDragging = false;
let edgeFlipTimeout = null;

function renderDesktop() {
const pages = [
document.getElementById('desktop-page-0'),
document.getElementById('desktop-page-1'),
document.getElementById('desktop-page-2')
];

if (!pages[0] || !pages[1] || !pages[2]) return;
pages.forEach(p => p.innerHTML = '');

if (!isContractSigned) {
pages[0].innerHTML = <div class="desktop-locked-hero" onclick="openSubScreen('tab-contract')"> <div class="hero-contract-icon">📜</div> <div class="hero-contract-label">Контракт D/S</div> </div>;
return;
}

const passion = getPassionStatus();
const unseenShopCount = boutiqueItems.filter(p => !p.seen).length;

desktopItems.forEach(item => {
if (item.target === 'tab-male-session' && currentAvatarRole !== 'male') return;
if (item.target === 'tab-female-session' && currentAvatarRole !== 'female') return;

const itemPage = item.page !== undefined ? item.page : 0;
const targetContainer = pages[itemPage] || pages[0];

const wrap = document.createElement('div');
wrap.className = `desktop-item-wrapper ${item.span ? 'widget-span-' + item.span : ''}`;
wrap.setAttribute('data-id', item.id);

const deleteBtn = `<button class="item-delete-btn" onclick="event.stopPropagation(); deleteDesktopItem('${item.id}')">✕</button>`;
let inner = '';

if (item.type === 'tile') {
  const showBadge = (item.target === 'tab-shop' && currentAvatarRole === 'female' && unseenShopCount > 0);
  const badgeHtml = showBadge ? `<div class="tile-unread-badge">${unseenShopCount}</div>` : '';

  inner = `
    ${deleteBtn}
    <div class="desktop-tile">
      ${badgeHtml}
      <div class="tile-icon">${item.icon}</div>
      <div class="tile-label">${item.title}</div>
    </div>`;

  wrap.onclick = () => {
    if (isItemDragging) return;
    if (isDesktopEditMode) {
      openIconPickerModal(item.id);
    } else {
      openSubScreen(item.target);
    }
  };
} else if (item.type === 'widget-passion') {
  inner = `
    ${deleteBtn}
    <div class="desktop-widget widget-passion-box">
      <div class="passion-top-row">
        <div class="widget-title-lbl" style="color: #FF8566; margin: 0;">🌶️ Градус Страсти & Звание</div>
        <div class="passion-peppers-badge">${passion.total} 🌶️</div>
      </div>
      <div class="passion-rank-title">${passion.title}</div>
      <div class="passion-progress-bg">
        <div class="passion-progress-fill" style="width: ${passion.progressPercent}%;"></div>
      </div>
      <div class="passion-status-desc">
        <span>${passion.desc}</span>
        <span style="color: var(--accent-color); font-weight: 700;">В гардероб →</span>
      </div>
    </div>`;

  wrap.onclick = () => {
    if (!isItemDragging && !isDesktopEditMode) openSubScreen('tab-wardrobe');
  };
} else if (item.type === 'widget-balance') {
  let balanceHtml = '';
  if (currentAvatarRole === 'female') {
    balanceHtml = `
      <div class="curr-chip ptc">💜 ${femaleBalances.ptc}</div>
      <div class="curr-chip otc">🖤 ${femaleBalances.otc}</div>
      <div class="curr-chip stc">❤️ ${femaleBalances.stc}</div>
    `;
  } else {
    balanceHtml = `
      <div class="curr-chip att">💙 ${maleBalances.atc}</div>
      <div class="curr-chip care">💚 ${maleBalances.ctc}</div>
      <div class="curr-chip stc">❤️ ${maleBalances.stc}</div>
    `;
  }

  inner = `
    ${deleteBtn}
    <div class="desktop-widget">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="widget-title-lbl" style="margin: 0;">💖 Баланс Очков</div>
        <div style="font-size: 10px; color: var(--accent-color); font-weight: 700;">Открыть ⚖️</div>
      </div>
      <div class="widget-balance-grid" style="display: flex; gap: 4px; margin-top: 4px;">
        ${balanceHtml}
      </div>
    </div>`;

  wrap.onclick = () => {
    if (!isItemDragging && !isDesktopEditMode) openSubScreen('tab-bank');
  };
} else if (item.type === 'widget-contract') {
  inner = `
    ${deleteBtn}
    <div class="desktop-widget">
      <div class="widget-header"><span>Обет Дня</span><span>📜</span></div>
      <div class="widget-title">"Согласие и правила вечера"</div>
      <div class="widget-sub">Статус: Действует</div>
    </div>`;

  wrap.onclick = () => {
    if (!isItemDragging && !isDesktopEditMode) openSubScreen('tab-contract');
  };
}

wrap.innerHTML = inner;
attachDragEvents(wrap);
targetContainer.appendChild(wrap);


});

pages.forEach((p, idx) => {
if (p.children.length === 0) {
p.innerHTML = <div style="grid-column: span 4; text-align: center; color: var(--text-muted); font-size: 11px; padding: 60px 10px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;"> Стол ${idx + 1} пока пуст.<br>Нажмите на колбу вверху, чтобы добавить элементы. </div>;
}
});
}

function attachDragEvents(el) {
el.addEventListener('touchstart', (e) => {
if (!isDesktopEditMode || e.target.closest('.item-delete-btn')) return;
dragGhostStartX = e.touches[0].clientX;
dragGhostStartY = e.touches[0].clientY;
draggedElement = el;
isItemDragging = false;
}, { passive: true });

el.addEventListener('touchmove', (e) => {
if (!isDesktopEditMode || !draggedElement) return;

const curX = e.touches[0].clientX;
const curY = e.touches[0].clientY;
const dist = Math.hypot(curX - dragGhostStartX, curY - dragGhostStartY);

if (!isItemDragging && dist > 7) {
  isItemDragging = true;
  tg?.HapticFeedback?.impactOccurred?.('medium');

  dragGhost = draggedElement.cloneNode(true);
  dragGhost.classList.add('drag-ghost');
  const rect = draggedElement.getBoundingClientRect();
  dragGhost.style.width = rect.width + 'px';
  dragGhost.style.height = rect.height + 'px';
  document.body.appendChild(dragGhost);
  draggedElement.classList.add('is-dragging');
}

if (isItemDragging && dragGhost) {
  if (e.cancelable) e.preventDefault();
  dragGhost.style.left = curX + 'px';
  dragGhost.style.top = curY + 'px';

  const elemBelow = document.elementFromPoint(curX, curY);
  const targetItem = elemBelow?.closest('.desktop-item-wrapper');
  const currentGrid = document.getElementById(`desktop-page-${currentDesktopPage}`);

  if (targetItem && targetItem !== draggedElement && currentGrid.contains(targetItem)) {
    const children = Array.from(currentGrid.children);
    const draggedIdx = children.indexOf(draggedElement);
    const targetIdx = children.indexOf(targetItem);

    if (draggedIdx < targetIdx) {
      currentGrid.insertBefore(draggedElement, targetItem.nextSibling);
    } else {
      currentGrid.insertBefore(draggedElement, targetItem);
    }
    tg?.HapticFeedback?.selectionChanged?.();
  }

  if (curX < 35 && currentDesktopPage > 0 && !edgeFlipTimeout) {
    edgeFlipTimeout = setTimeout(() => {
      goToDesktopPage(currentDesktopPage - 1);
      const newGrid = document.getElementById(`desktop-page-${currentDesktopPage}`);
      newGrid?.appendChild(draggedElement);
      edgeFlipTimeout = null;
    }, 450);
  } else if (curX > window.innerWidth - 35 && currentDesktopPage < 2 && !edgeFlipTimeout) {
    edgeFlipTimeout = setTimeout(() => {
      goToDesktopPage(currentDesktopPage + 1);
      const newGrid = document.getElementById(`desktop-page-${currentDesktopPage}`);
      newGrid?.appendChild(draggedElement);
      edgeFlipTimeout = null;
    }, 450);
  }
}


}, { passive: false });

el.addEventListener('touchend', () => {
if (edgeFlipTimeout) {
clearTimeout(edgeFlipTimeout);
edgeFlipTimeout = null;
}

if (isItemDragging) {
  if (dragGhost) {
    dragGhost.remove();
    dragGhost = null;
  }
  draggedElement?.classList.remove('is-dragging');
  saveDesktopReorder();
  tg?.HapticFeedback?.notificationOccurred?.('success');

  setTimeout(() => {
    isItemDragging = false;
    draggedElement = null;
  }, 60);
} else {
  draggedElement = null;
}


});
}

function saveDesktopReorder() {
const updatedList = [];
const itemsMap = new Map(desktopItems.map(item => [item.id, item]));

[0, 1, 2].forEach(pageIdx => {
const grid = document.getElementById(desktop-page-${pageIdx});
if (!grid) return;
const domItems = grid.querySelectorAll('.desktop-item-wrapper');
domItems.forEach(el => {
const id = el.getAttribute('data-id');
if (itemsMap.has(id)) {
const item = itemsMap.get(id);
item.page = pageIdx;
updatedList.push(item);
}
});
});

desktopItems = updatedList;
saveDesktopItems();
}

function deleteDesktopItem(id) {
desktopItems = desktopItems.filter(item => item.id !== id);
saveDesktopItems();
tg?.HapticFeedback?.notificationOccurred?.('warning');
showToast('Элемент удален с экрана', 'info');
renderDesktop();
}

/* ========================================================
7. МЕНЮ НАСТРОЙКИ ПЛИТКИ
======================================================== */
const availableIconsList = [
'💖', '⚖️', '🩱', '🛍️', '🌸', '📜', '🌶️', '💎',
'👑', '🗝️', '🎀', '⛓️', '🍷', '💋', '🧸', '🔥',
'✨', '☕', '🛌', '🕯️', '🔒', '🖤', '💜', '❤️'
];
let selectedTileIcon = '💖';
let selectedTileTargetPage = 0;

function openIconPickerModal(tileId) {
const tile = desktopItems.find(i => i.id === tileId);
if (!tile || tile.type !== 'tile') return;

editingTileId = tileId;
selectedTileIcon = tile.icon || '💖';
selectedTileTargetPage = tile.page !== undefined ? tile.page : currentDesktopPage;

const titleInput = document.getElementById('tile-edit-title-input');
if (titleInput) titleInput.value = tile.title;

const grid = document.getElementById('icon-picker-grid');
if (grid) {
grid.innerHTML = availableIconsList.map(ico => <div style="font-size: 22px; text-align: center; padding: 6px; border-radius: 10px; cursor: pointer; background: ${ico === selectedTileIcon ? 'rgba(230,57,86,0.3)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${ico === selectedTileIcon ? 'var(--accent-color)' : 'var(--border-color)'};" onclick="selectPickerIcon('${ico}', this)"> ${ico} </div>).join('');
}

setTileTargetPage(selectedTileTargetPage);
document.getElementById('icon-picker-modal')?.classList.add('active');
}

function selectPickerIcon(ico, el) {
selectedTileIcon = ico;
document.querySelectorAll('#icon-picker-grid > div').forEach(d => {
d.style.background = 'rgba(255,255,255,0.05)';
d.style.borderColor = 'var(--border-color)';
});
el.style.background = 'rgba(230,57,86,0.3)';
el.style.borderColor = 'var(--accent-color)';
tg?.HapticFeedback?.selectionChanged?.();
}

function setTileTargetPage(pIdx) {
selectedTileTargetPage = pIdx;
[0, 1, 2].forEach(idx => {
document.getElementById(btn-move-page-${idx})?.classList.toggle('active', idx === pIdx);
});
}

function closeIconPickerModal() {
document.getElementById('icon-picker-modal')?.classList.remove('active');
editingTileId = null;
}

function saveTileSettings() {
if (!editingTileId) return;
const tile = desktopItems.find(i => i.id === editingTileId);
if (tile) {
const titleInput = document.getElementById('tile-edit-title-input');
if (titleInput && titleInput.value.trim()) {
tile.title = titleInput.value.trim();
}
tile.icon = selectedTileIcon;
tile.page = selectedTileTargetPage;
saveDesktopItems();
showToast('Плитка обновлена!', 'success');
}
closeIconPickerModal();
renderDesktop();
}

/* ========================================================
8. ЕДИНЫЙ ЦЕНТР КАСТОМИЗАЦИИ (ВИДЖЕТЫ + ОБОИ)
======================================================== */
function openCustomizationModal() {
document.getElementById('customization-modal')?.classList.add('active');
tg?.HapticFeedback?.impactOccurred?.('light');
}

function closeCustomizationModal() {
document.getElementById('customization-modal')?.classList.remove('active');
}

function setCustomModalTab(tab) {
document.querySelectorAll('.custom-tab-btn').forEach(b => b.classList.remove('active'));
document.getElementById(btn-tab-${tab})?.classList.add('active');

const widgetsContent = document.getElementById('custom-tab-content-widgets');
const wallpapersContent = document.getElementById('custom-tab-content-wallpapers');

if (tab === 'widgets') {
if (widgetsContent) widgetsContent.style.display = 'flex';
if (wallpapersContent) wallpapersContent.style.display = 'none';
} else {
if (widgetsContent) widgetsContent.style.display = 'none';
if (wallpapersContent) wallpapersContent.style.display = 'grid';
}
tg?.HapticFeedback?.selectionChanged?.();
}

function createWidgetOnDesktop(type, span) {
desktopItems.push({
id: 'w-' + Date.now(),
type,
span,
page: currentDesktopPage
});
saveDesktopItems();
closeCustomizationModal();
renderDesktop();
showToast(Виджет добавлен на Стол ${currentDesktopPage + 1}!, 'success');
}

function createTileOnDesktop(title, icon, target) {
desktopItems.push({
id: 't-' + Date.now(),
type: 'tile',
title,
icon,
target,
page: currentDesktopPage
});
saveDesktopItems();
closeCustomizationModal();
renderDesktop();
showToast(Плитка «${title}» добавлена на Стол ${currentDesktopPage + 1}!, 'success');
}

/* ========================================================
9. КОНТРАКТ D/S & ЦЕРЕМОНИИ
======================================================== */
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
tg?.HapticFeedback?.impactOccurred?.('medium');
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
closeContractConfirmModal();
if (pendingContractAction === 'sign') {
runSigningCeremony();
} else if (pendingContractAction === 'terminate') {
runTearingCeremony();
}
pendingContractAction = null;
}

function runSigningCeremony() {
const modal = document.getElementById('contract-ceremony-modal');
const box = document.getElementById('ceremony-container');
if (!modal || !box) return;

box.classList.remove('anim-tearing', 'anim-rumble', 'anim-signing');
box.querySelectorAll('.sig-path-word').forEach(p => p.style.strokeDashoffset = '1200');
box.querySelectorAll('.sig-path-slash').forEach(p => p.style.strokeDashoffset = '400');

modal.classList.add('active');

setTimeout(() => {
box.classList.add('anim-signing');
tg?.HapticFeedback?.impactOccurred?.('medium');
setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('light'), 600);
setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('medium'), 1200);
setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('light'), 1800);
setTimeout(() => tg?.HapticFeedback?.impactOccurred?.('heavy'), 2200);

setTimeout(() => {
  isContractSigned = true;
  localStorage.setItem('pact_contract_signed', 'true');
  modal.classList.remove('active');
  box.classList.remove('anim-signing');

  updateContractButtonUI();
  renderDesktop();
  tg?.HapticFeedback?.notificationOccurred?.('success');
  handleBackAction();
}, 3200);


}, 2000);
}

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
tg?.HapticFeedback?.impactOccurred?.('medium');

setTimeout(() => {
  box.classList.remove('anim-rumble');
  box.classList.add('anim-tearing');
  tg?.HapticFeedback?.impactOccurred?.('heavy');

  setTimeout(() => {
    tg?.HapticFeedback?.notificationOccurred?.('warning');
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
10. ОБОИ РАБОЧЕГО СТОЛА & ДИНАМИЧЕСКИЕ ЧАСТИЦЫ
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
document.querySelector([data-wp="${key}"])?.classList.add('selected');

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
openCustomizationModal();
setCustomModalTab('wallpapers');
}
function closeWallpaperModal() {
closeCustomizationModal();
}

/* ========================================================
11. ПРОФИЛЬ, ИМЯ & АВАТАРКИ
======================================================== */
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

function updateRoleUI() {
const statLbl = document.getElementById('profile-pts-val');
const isMale = (currentAvatarRole === 'male');
if (statLbl) {
statLbl.innerText = isMale ? ${maleBalances.atc + maleBalances.ctc} PTS : ${femaleBalances.ptc + femaleBalances.otc} PTS;
}
}

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
renderBankScreen();
renderProducts();
showToast(Активная роль: ${currentAvatarRole === 'male' ? '👑 Верхний ♂' : '🗝️ Нижняя ♀'}, 'info');
tg?.HapticFeedback?.impactOccurred?.('medium');
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
uploadCard.innerHTML = <span class="avatar-upload-icon">+</span> <span class="avatar-upload-label">Своё фото</span>;
grid.appendChild(uploadCard);

list.forEach((url, idx) => {
const card = document.createElement('div');
card.className = 'avatar-thumb-card' + (currentSaved === url ? ' selected' : '');
card.onclick = () => selectAvatar(url);
card.innerHTML = <img src="${url}" alt="Avatar ${idx + 1}" loading="lazy">;
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
modal.style.display = 'none';
modal.classList.remove('active');
}
}

function saveProfileName() {
const input = document.getElementById('input-profile-name');
const newName = (input?.value || '').trim();

if (!newName) {
showToast('Пожалуйста, введите имя.', 'error');
return;
}

localStorage.setItem('pact_user_name', newName);

const nameDisplay = document.getElementById('profile-user-name');
if (nameDisplay) {
nameDisplay.innerText = newName;
}

closeNameModal();
showToast('Имя сохранено!', 'success');
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
12. БАЛАНС: РОЛЕВАЯ ФИЛЬТРАЦИЯ & ВАЛЮТЫ
======================================================== */
let rewardTarget = 'female';
let rewardCurrency = 'PTC';
let penaltyTarget = 'female';
let penaltyCurrency = 'OTC';
let transferDirection = 'f2m';

function setBalanceTab(tabKey, btn) {
document.querySelectorAll('.bal-tab-btn').forEach(b => b.classList.remove('active'));
btn?.classList.add('active');

document.querySelectorAll('#tab-bank .bank-sub-content').forEach(c => c.classList.remove('active'));
document.getElementById('bal-sec-' + tabKey)?.classList.add('active');
tg?.HapticFeedback?.selectionChanged?.();

if (tabKey === 'transfer') renderBankScreen();
if (tabKey === 'history') renderBankHistory();
if (tabKey === 'exchange') calculateBankConversion();
}

function setRewardTarget(target) {
rewardTarget = target;
document.getElementById('btn-reward-target-f')?.classList.toggle('active', target === 'female');
document.getElementById('btn-reward-target-m')?.classList.toggle('active', target === 'male');
rewardCurrency = target === 'female' ? 'PTC' : 'ATC';
renderRewardCurrencySelector();
updateRewardBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function renderRewardCurrencySelector() {
const slot = document.getElementById('reward-curr-pills-slot');
if (!slot) return;
const list = rewardTarget === 'female'
? [{ code: 'PTC', label: '💜 Страсть' }, { code: 'OTC', label: '🖤 Покорность' }, { code: 'STC', label: '❤️ Секс-токен' }]
: [{ code: 'ATC', label: '💙 Внимание' }, { code: 'CTC', label: '💚 Забота' }, { code: 'STC', label: '❤️ Секс-токен' }];

slot.innerHTML = list.map(c => <button class="bank-curr-pill ${c.code === rewardCurrency ? 'active' : ''}" onclick="selectRewardCurrency('${c.code}')">${c.label}</button>).join('');
}

function selectRewardCurrency(code) {
rewardCurrency = code;
renderRewardCurrencySelector();
updateRewardBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function setQuickRewardAmount(amt) {
const inp = document.getElementById('reward-amount-input');
if (inp) inp.value = amt;
updateRewardBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function setQuickRewardReason(txt) {
const inp = document.getElementById('reward-reason-input');
if (inp) inp.value = txt;
tg?.HapticFeedback?.impactOccurred?.('light');
}

function updateRewardBtnText() {
const btn = document.getElementById('btn-submit-reward');
const amt = document.getElementById('reward-amount-input')?.value || 0;
if (btn) btn.innerText = ➕ Начислить ${amt} ${getHeartByCurrency(rewardCurrency)};
}

function executeRewardTransaction() {
const amt = parseInt(document.getElementById('reward-amount-input')?.value) || 0;
const reasonInp = document.getElementById('reward-reason-input');
const reason = reasonInp?.value.trim() || 'Поощрение за задачу';

if (amt <= 0) {
showToast('Введите количество очков больше 0.', 'error');
return;
}
const key = rewardCurrency.toLowerCase();

if (rewardTarget === 'female') {
femaleBalances[key] = (femaleBalances[key] || 0) + amt;
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
} else {
maleBalances[key] = (maleBalances[key] || 0) + amt;
localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));
}

logTransaction('reward', rewardTarget, rewardCurrency, amt, reason);
if (reasonInp) reasonInp.value = '';
showToast(✨ Начислено ${amt} ${getHeartByCurrency(rewardCurrency)} (${reason})!, 'success');

updateRoleUI();
renderDesktop();
renderBankScreen();
renderShopBalance();
}

function setPenaltyTarget(target) {
penaltyTarget = target;
document.getElementById('btn-penalty-target-f')?.classList.toggle('active', target === 'female');
document.getElementById('btn-penalty-target-m')?.classList.toggle('active', target === 'male');
penaltyCurrency = target === 'female' ? 'OTC' : 'CTC';
renderPenaltyCurrencySelector();
updatePenaltyBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function renderPenaltyCurrencySelector() {
const slot = document.getElementById('penalty-curr-pills-slot');
if (!slot) return;
const list = penaltyTarget === 'female'
? [{ code: 'OTC', label: '🖤 Покорность' }, { code: 'PTC', label: '💜 Страсть' }, { code: 'STC', label: '❤️ Секс-токен' }]
: [{ code: 'CTC', label: '💚 Забота' }, { code: 'ATC', label: '💙 Внимание' }, { code: 'STC', label: '❤️ Секс-токен' }];

slot.innerHTML = list.map(c => <button class="bank-curr-pill ${c.code === penaltyCurrency ? 'active' : ''}" onclick="selectPenaltyCurrency('${c.code}')">${c.label}</button>).join('');
}

function selectPenaltyCurrency(code) {
penaltyCurrency = code;
renderPenaltyCurrencySelector();
updatePenaltyBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function setQuickPenaltyAmount(amt) {
const inp = document.getElementById('penalty-amount-input');
if (inp) inp.value = amt;
updatePenaltyBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function setQuickPenaltyReason(txt) {
const inp = document.getElementById('penalty-reason-input');
if (inp) inp.value = txt;
tg?.HapticFeedback?.impactOccurred?.('light');
}

function updatePenaltyBtnText() {
const btn = document.getElementById('btn-submit-penalty');
const amt = document.getElementById('penalty-amount-input')?.value || 0;
if (btn) btn.innerText = ➖ Списать штраф ${amt} ${getHeartByCurrency(penaltyCurrency)};
}

function executePenaltyTransaction() {
const amt = parseInt(document.getElementById('penalty-amount-input')?.value) || 0;
const reasonInp = document.getElementById('penalty-reason-input');
const reason = reasonInp?.value.trim() || 'Штраф';

if (amt <= 0) {
showToast('Введите количество очков больше 0.', 'error');
return;
}
const key = penaltyCurrency.toLowerCase();

if (penaltyTarget === 'female') {
femaleBalances[key] = Math.max((femaleBalances[key] || 0) - amt, 0);
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
} else {
maleBalances[key] = Math.max((maleBalances[key] || 0) - amt, 0);
localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));
}

logTransaction('penalty', penaltyTarget, penaltyCurrency, amt, reason);
if (reasonInp) reasonInp.value = '';
showToast(⚡ Списан штраф: ${amt} ${getHeartByCurrency(penaltyCurrency)} (${reason})!, 'penalty');

updateRoleUI();
renderDesktop();
renderBankScreen();
renderShopBalance();
}

function setTransferDirection(dir) {
transferDirection = dir;
document.getElementById('btn-transfer-f2m')?.classList.toggle('active', dir === 'f2m');
document.getElementById('btn-transfer-m2f')?.classList.toggle('active', dir === 'm2f');
updateTransferBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function setQuickTransferAmount(amt) {
const input = document.getElementById('transfer-amount-input');
if (!input) return;

if (amt === 'all') {
const available = transferDirection === 'f2m' ? femaleBalances.stc : maleBalances.stc;
input.value = Math.max(available, 0);
} else {
input.value = amt;
}
updateTransferBtnText();
tg?.HapticFeedback?.selectionChanged?.();
}

function updateTransferBtnText() {
const btn = document.getElementById('transfer-submit-btn');
const input = document.getElementById('transfer-amount-input');
if (!btn || !input) return;
const amt = parseInt(input.value) || 0;
btn.innerText = transferDirection === 'f2m'
? 💌 Перевести ${amt} ❤️ Верхнему
: 💌 Отправить ${amt} ❤️ Нижней;
}

function executeSexTokensTransfer() {
const input = document.getElementById('transfer-amount-input');
const noteInput = document.getElementById('transfer-note-input');
const amount = parseInt(input?.value) || 0;
let note = noteInput?.value.trim();

if (amount <= 0) {
showToast('Введите корректное число ❤️ для перевода.', 'error');
return;
}

if (transferDirection === 'f2m') {
if (femaleBalances.stc < amount) {
showToast(У Нижней недостаточно ❤️! Доступно: ${femaleBalances.stc}, 'error');
return;
}

femaleBalances.stc -= amount;
maleBalances.stc += amount;
if (!note) note = 'Дань Верхнему 💋';


} else {
if (maleBalances.stc < amount) {
showToast(У Верхнего недостаточно ❤️! Доступно: ${maleBalances.stc}, 'error');
return;
}

maleBalances.stc -= amount;
femaleBalances.stc += amount;
if (!note) note = 'Подарок Нижней на желания 🔥';


}

localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));

const dirText = transferDirection === 'f2m' ? 'Нижняя ➔ Верхний' : 'Верхний ➔ Нижняя';
logTransaction('reward', transferDirection === 'f2m' ? 'male' : 'female', 'STC', amount, Перевод (${dirText}): ${note} 💌);

if (noteInput) noteInput.value = '';
updateRoleUI();
renderDesktop();
renderBankScreen();
renderShopBalance();
showToast(💌 Переведено ${amount} ❤️ (${dirText})!, 'success');
}

function calculateBankConversion() {
const fromCurr = document.getElementById('bank-conv-from-currency')?.value;
const toCurr = document.getElementById('bank-conv-to-currency')?.value;
const fromAmount = parseFloat(document.getElementById('bank-conv-from-amount')?.value) || 0;
const toInput = document.getElementById('bank-conv-to-amount');
if (!toInput) return;

if (fromCurr === toCurr) {
toInput.value = fromAmount;
return;
}

if ((fromCurr === 'PTC' || fromCurr === 'OTC') && toCurr === 'STC') {
toInput.value = Math.floor(fromAmount / 2);
} else if (fromCurr === 'STC' && (toCurr === 'PTC' || toCurr === 'OTC')) {
toInput.value = Math.floor(fromAmount * 2);
} else {
toInput.value = fromAmount;
}
}

function executeBankCurrencyExchange() {
const fromCurr = document.getElementById('bank-conv-from-currency').value;
const toCurr = document.getElementById('bank-conv-to-currency').value;
const fromAmount = parseInt(document.getElementById('bank-conv-from-amount').value) || 0;
const toAmount = parseInt(document.getElementById('bank-conv-to-amount').value) || 0;

if (fromAmount <= 0) {
showToast('Введите корректную сумму для обмена.', 'error');
return;
}

const keyMap = { 'PTC': 'ptc', 'OTC': 'otc', 'STC': 'stc' };
const fromKey = keyMap[fromCurr];
const toKey = keyMap[toCurr];

if (femaleBalances[fromKey] < fromAmount) {
showToast(Недостаточно средств на балансе ${getHeartByCurrency(fromCurr)}! У вас: ${femaleBalances[fromKey]}, 'error');
return;
}

femaleBalances[fromKey] -= fromAmount;
femaleBalances[toKey] += toAmount;
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));

logTransaction('reward', 'female', toCurr, toAmount, Обмен ${fromAmount} ${getHeartByCurrency(fromCurr)} ➔ ${toAmount} ${getHeartByCurrency(toCurr)} 🔄);

updateRoleUI();
renderDesktop();
renderBankScreen();
renderShopBalance();
showToast(🔄 Успешно обменяно ${fromAmount} ${getHeartByCurrency(fromCurr)} на ${toAmount} ${getHeartByCurrency(toCurr)}!, 'success');
}

function logTransaction(type, recipient, currency, amount, reason) {
const now = new Date();
const timeStr = ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}, ${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth()+1).padStart(2, '0')};
transactionsLog.unshift({ id: Date.now(), time: timeStr, type, recipient, currency, amount, reason });
if (transactionsLog.length > 50) transactionsLog.pop();
localStorage.setItem('pact_transactions_log', JSON.stringify(transactionsLog));
}

function renderBankHistory() {
const slot = document.getElementById('bank-history-items-slot');
if (!slot) return;

if (transactionsLog.length === 0) {
slot.innerHTML = <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 25px 10px;">История операций пуста.</div>;
return;
}

slot.innerHTML = transactionsLog.map(t => {
const isReward = t.type === 'reward';
const sign = isReward ? '+' : '−';
const icon = isReward ? '➕' : '➖';
const targetName = t.recipient === 'female' ? 'Нижняя' : 'Верхний';
return <div class="bank-history-item"> <div class="bank-hist-left"> <div class="bank-hist-badge ${t.type}">${icon}</div> <div style="overflow: hidden;"> <div class="bank-hist-reason">${t.reason}</div> <div class="bank-hist-meta">${targetName} • ${t.time}</div> </div> </div> <div class="bank-hist-val ${t.type}">${sign}${t.amount} ${getHeartByCurrency(t.currency)}</div> </div>;
}).join('');
}

function clearBankHistory() {
transactionsLog = [];
localStorage.setItem('pact_transactions_log', JSON.stringify(transactionsLog));
renderBankHistory();
showToast('История операций очищена.', 'info');
}

function renderBankScreen() {
const fPtc = document.getElementById('bank-f-ptc');
const fOtc = document.getElementById('bank-f-otc');
const fStc = document.getElementById('bank-f-stc');
const mAtc = document.getElementById('bank-m-atc');
const mCtc = document.getElementById('bank-m-ctc');
const mStc = document.getElementById('bank-m-stc');

if (fPtc) fPtc.innerText = femaleBalances.ptc;
if (fOtc) fOtc.innerText = femaleBalances.otc;
if (fStc) fStc.innerText = femaleBalances.stc;
if (mAtc) mAtc.innerText = maleBalances.atc;
if (mCtc) mCtc.innerText = maleBalances.ctc;
if (mStc) mStc.innerText = maleBalances.stc;

const tfStc = document.getElementById('transfer-f-stc');
const tmStc = document.getElementById('transfer-m-stc');
if (tfStc) tfStc.innerText = femaleBalances.stc;
if (tmStc) tmStc.innerText = maleBalances.stc;

const btnRewardTab = document.getElementById('bal-tab-btn-reward');
const btnPenaltyTab = document.getElementById('bal-tab-btn-penalty');
const btnTransferTab = document.getElementById('bal-tab-btn-transfer');
const btnExchangeTab = document.getElementById('bal-tab-btn-exchange');
const clearHistoryBtn = document.querySelector('.clear-history-btn');
const transferDirBlock = document.getElementById('transfer-direction-row');
const rewardTargetBlock = document.getElementById('reward-target-field-group');
const penaltyTargetBlock = document.getElementById('penalty-target-field-group');

const boxFemale = document.getElementById('bank-box-female');
const boxMale = document.getElementById('bank-box-male');
const titleFemale = document.getElementById('bank-title-female');
const titleMale = document.getElementById('bank-title-male');

if (currentAvatarRole === 'female') {
boxFemale?.classList.add('is-active-role');
boxMale?.classList.remove('is-active-role');
if (titleFemale) titleFemale.innerHTML = 🗝️ Нижняя <span class="role-active-indicator">(Ты)</span>;
if (titleMale) titleMale.innerHTML = 👑 Верхний;

if (btnRewardTab) btnRewardTab.style.display = 'none';
if (btnPenaltyTab) btnPenaltyTab.style.display = 'none';
if (btnExchangeTab) btnExchangeTab.style.display = 'block';
if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';

if (document.getElementById('bal-sec-reward')?.classList.contains('active') ||
    document.getElementById('bal-sec-penalty')?.classList.contains('active')) {
  setBalanceTab('transfer', btnTransferTab);
}

setTransferDirection('f2m');
if (transferDirBlock) transferDirBlock.style.display = 'none';


} else {
boxMale?.classList.add('is-active-role');
boxFemale?.classList.remove('is-active-role');
if (titleMale) titleMale.innerHTML = 👑 Верхний <span class="role-active-indicator">(Ты)</span>;
if (titleFemale) titleFemale.innerHTML = 🗝️ Нижняя;

if (btnRewardTab) btnRewardTab.style.display = 'block';
if (btnPenaltyTab) btnPenaltyTab.style.display = 'block';
if (btnExchangeTab) btnExchangeTab.style.display = 'none';
if (clearHistoryBtn) clearHistoryBtn.style.display = 'block';

if (document.getElementById('bal-sec-exchange')?.classList.contains('active')) {
  setBalanceTab('reward', btnRewardTab);
}

setTransferDirection('m2f');
if (transferDirBlock) transferDirBlock.style.display = 'none';

setRewardTarget('female');
setPenaltyTarget('female');
if (rewardTargetBlock) rewardTargetBlock.style.display = 'none';
if (penaltyTargetBlock) penaltyTargetBlock.style.display = 'none';


}

renderRewardCurrencySelector();
renderPenaltyCurrencySelector();
updateRewardBtnText();
updatePenaltyBtnText();
updateTransferBtnText();
renderBankHistory();
calculateBankConversion();
}

/* ========================================================
13. БУТИК & СЕКС-ШОП С ПЛАШКОЙ NEW
======================================================== */
let boutiqueItems = JSON.parse(localStorage.getItem('boutique_items')) || [
{ id: 101, title: 'Кружевной Комплект Velour', category: 'Комплект', pricePtc: 220, priceOtc: 80, peppers: 1, mainImg: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600', desc: 'Корсетный топ с кружевом цвета слоновой кости', seen: true },
{ id: 102, title: '«Тёмная Покорность»', category: 'Комплект', pricePtc: 160, priceOtc: 340, peppers: 2, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', desc: 'Чёрное кружево, чокер, пояс с гартерами', seen: true },
{ id: 103, title: '«Цветение Айвори»', category: 'Комплект', pricePtc: 280, priceOtc: 140, peppers: 2, mainImg: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600', desc: 'Невесомый бралетт с цветочной вышивкой', seen: true },
{ id: 104, title: '«Чистый Соблазн»', category: 'Комплект', pricePtc: 380, priceOtc: 300, peppers: 3, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', desc: 'Белоснежный открытый бра с кольцами', seen: false }
];

let sexshopItems = JSON.parse(localStorage.getItem('sexshop_items')) || [
{ id: 201, title: '«Бархатный Ошейник»', category: 'Бондаж', priceStc: 180, peppers: 2, mainImg: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=900', desc: 'Чёрный ошейник с позолоченным кольцом и поводком' },
{ id: 202, title: '«Атласные Ленты & Повязка»', category: 'Бондаж', priceStc: 120, peppers: 1, mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600', desc: 'Для депривации чувств во время сессии' },
{ id: 203, title: '«Кожаный Флоггер Покора»', category: 'Игрушки', priceStc: 260, peppers: 3, mainImg: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900', desc: 'Мягкие замшевые хвосты на эргономичной рукояти' },
{ id: 204, title: '«Вибратор Неоновый Пульс»', category: 'Игрушки', priceStc: 350, peppers: 3, mainImg: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900', desc: '10 режимов глубокой пульсации' }
];

let shopFilterCat = 'all';
let sexshopFilterCat = 'all';
let currentDetailItem = null;
let activeDetailPhotoSrc = '';

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

function renderShopBalance() {
const slot = document.getElementById('shop-account-balance-slot');
if (!slot) return;

if (currentAvatarRole === 'female') {
slot.innerHTML = <div> <div class="shop-bal-label">Твой баланс</div> <div class="shop-bal-chips-group"> <span class="curr-chip ptc">💜 <b>${femaleBalances.ptc}</b></span> <span class="curr-chip otc">🖤 <b>${femaleBalances.otc}</b></span> <span class="curr-chip stc">❤️ <b>${femaleBalances.stc}</b></span> </div> </div> <button class="shop-bal-action-btn" onclick="openConverterModal()"> <span>🔄</span> Обмен </button>;
} else {
slot.innerHTML = <div> <div class="shop-bal-label">Баланс Верхнего</div> <div class="shop-bal-chips-group"> <span class="curr-chip att">💙 <b>${maleBalances.atc}</b></span> <span class="curr-chip care">💚 <b>${maleBalances.ctc}</b></span> <span class="curr-chip stc">❤️ <b>${maleBalances.stc}</b></span> </div> </div> <button class="shop-bal-action-btn" onclick="openSubScreen('tab-bank')"> <span>💖</span> Баланс </button>;
}
}

function renderProducts() {
renderShopBalance();
const bCont = document.getElementById('shop-products-list');
const sCont = document.getElementById('custom-products-sexshop');

if (bCont) {
const filteredBoutique = (shopFilterCat === 'all')
? boutiqueItems
: boutiqueItems.filter(item => item.category === shopFilterCat);

bCont.innerHTML = filteredBoutique.map(p => {
  const newBadgeHtml = (!p.seen && currentAvatarRole === 'female') ? `<div class="product-new-badge">NEW</div>` : '';
  return `
    <div class="product-card" onclick="openProductDetail(${p.id}, 'boutique')">
      ${newBadgeHtml}
      <img class="product-main-img" src="${p.mainImg}" alt="${p.title}" loading="lazy">
      <div class="product-title">${p.title}</div>
      <div class="product-category-lbl">${p.category}</div>
      <div class="product-price-lbl">💜 ${p.pricePtc} + 🖤 ${p.priceOtc}</div>
    </div>
  `;
}).join('');


}

if (sCont) {
const filteredSexshop = (sexshopFilterCat === 'all')
? sexshopItems
: sexshopItems.filter(item => item.category === sexshopFilterCat);

sCont.innerHTML = filteredSexshop.map(p => `
  <div class="product-card" onclick="openProductDetail(${p.id}, 'sexshop')">
    <img class="product-main-img" src="${p.mainImg}" alt="${p.title}" loading="lazy">
    <div class="product-title">${p.title}</div>
    <div class="product-category-lbl">${p.category}</div>
    <div class="product-price-lbl">❤️ ${p.priceStc}</div>
  </div>
`).join('');


}
}

function openProductDetail(id, type) {
const item = (type === 'boutique') ? boutiqueItems.find(p => p.id === id) : sexshopItems.find(p => p.id === id);
if (!item) return;

if (!item.seen && currentAvatarRole === 'female') {
item.seen = true;
localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));
renderDesktop();
renderProducts();
}

currentDetailItem = { ...item, _type: type };
activeDetailPhotoSrc = item.mainImg;
renderProductDetail(currentDetailItem);
openSubScreen('tab-product-detail');
}

function renderProductDetail(item) {
if (!item) return;

document.getElementById('detail-top-title').innerText = item._type === 'boutique' ? 'БУТИК' : 'СЕКС-ШОП';
document.getElementById('detail-title-elem').innerText = item.title;

const priceElem = document.getElementById('detail-price-elem');
if (item._type === 'boutique') {
priceElem.innerHTML = 💜 ${item.pricePtc} + 🖤 ${item.priceOtc};
} else {
priceElem.innerHTML = ❤️ ${item.priceStc};
}

document.getElementById('detail-desc-elem').innerText = item.desc || 'Эксклюзивный будуарный атрибут из коллекции Pact & Passion.';

const peppersSlot = document.getElementById('detail-peppers-slot');
peppersSlot.innerHTML = <div class="peppers-pill"> ${renderPeppers(item.peppers || 1)} <span>${getPepperDescription(item.peppers || 1)}</span> </div>;

document.getElementById('detail-main-img-elem').src = activeDetailPhotoSrc;

const gallery = item.gallery && item.gallery.length > 0 ? item.gallery : [item.mainImg];
document.getElementById('detail-gallery-strip').innerHTML = gallery.map(photoUrl => <img class="detail-thumb-img ${photoUrl === activeDetailPhotoSrc ? 'active' : ''}"  src="${photoUrl}"  alt="thumb"  onclick="selectDetailPhoto('${photoUrl}', this)">).join('');

const actionSlot = document.getElementById('detail-action-slot');
if (item._type === 'boutique') {
if (currentAvatarRole === 'female') {
actionSlot.innerHTML = <button class="shop-buy-btn" onclick="buyBoutiqueItem(${item.id})">Приобрести комплект • 💜 ${item.pricePtc} + 🖤 ${item.priceOtc}</button>;
} else {
actionSlot.innerHTML = <button class="shop-buy-btn" style="background: rgba(255,255,255,0.06); border: 1px dashed rgba(255,255,255,0.2); color: var(--text-muted); cursor: default;" onclick="showToast('Бельё выбирает и приобретает Нижняя за 💜 и 🖤.', 'info')">👙 Бельё выбирает Нижняя</button>;
}
} else {
actionSlot.innerHTML = <button class="shop-buy-btn" onclick="buySexshopItem(${item.id})">Купить девайс • ❤️ ${item.priceStc}</button>;
}
}

function selectDetailPhoto(photoUrl, thumbElem) {
activeDetailPhotoSrc = photoUrl;
document.getElementById('detail-main-img-elem').src = photoUrl;
document.querySelectorAll('.detail-thumb-img').forEach(el => el.classList.remove('active'));
thumbElem?.classList.add('active');
tg?.HapticFeedback?.selectionChanged?.();
}

function openCurrentFullscreen() {
openFullscreenPhoto(activeDetailPhotoSrc);
}

function openFullscreenPhoto(src) {
const modal = document.getElementById('fullscreen-photo-modal');
const img = document.getElementById('fullscreen-photo-elem');
img.src = src;
modal.classList.add('active');
tg?.HapticFeedback?.impactOccurred?.('medium');
}

function closeFullscreenPhoto() {
document.getElementById('fullscreen-photo-modal')?.classList.remove('active');
}

function buyBoutiqueItem(id) {
const item = boutiqueItems.find(p => p.id === id);
if (!item) return;

if (currentAvatarRole !== 'female') {
showToast('Бельё за 💜 и 🖤 выбирает и приобретает Нижняя.', 'info');
return;
}

const deficits = [];
if (femaleBalances.ptc < item.pricePtc) {
deficits.push({ heart: '💜', amount: item.pricePtc - femaleBalances.ptc });
}
if (femaleBalances.otc < item.priceOtc) {
deficits.push({ heart: '🖤', amount: item.priceOtc - femaleBalances.otc });
}

if (deficits.length > 0) {
showInsufficientFundsModal(item, deficits, 'boutique');
return;
}

femaleBalances.ptc -= item.pricePtc;
femaleBalances.otc -= item.priceOtc;
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));

if (!wardrobeItems.some(w => w.title === item.title)) {
wardrobeItems.unshift({
id: Date.now(),
title: item.title,
desc: item.desc || '',
category: 'Белье',
peppers: item.peppers || 1,
mainImg: item.mainImg
});
localStorage.setItem('wardrobe_items', JSON.stringify(wardrobeItems));
}

logTransaction('penalty', 'female', '💜+🖤', ${item.pricePtc}+${item.priceOtc}, Покупка: ${item.title} 🛍️);

updateRoleUI();
renderShopBalance();
renderWardrobe();
showToast(✨ Комплект ${item.title} приобретен и добавлен в Гардероб!, 'success');
}

function buySexshopItem(id) {
const item = sexshopItems.find(p => p.id === id);
if (!item) return;

const activeBalance = currentAvatarRole === 'female' ? femaleBalances.stc : maleBalances.stc;
if (activeBalance < item.priceStc) {
showInsufficientFundsModal(item, [{ heart: '❤️', amount: item.priceStc - activeBalance }], 'sexshop');
return;
}

if (currentAvatarRole === 'female') {
femaleBalances.stc -= item.priceStc;
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
} else {
maleBalances.stc -= item.priceStc;
localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));
}

if (!wardrobeItems.some(w => w.title === item.title)) {
wardrobeItems.unshift({
id: Date.now(),
title: item.title,
desc: item.desc || '',
category: 'Игрушки',
peppers: item.peppers || 2,
mainImg: item.mainImg
});
localStorage.setItem('wardrobe_items', JSON.stringify(wardrobeItems));
}

logTransaction('penalty', currentAvatarRole, '❤️', item.priceStc, Покупка: ${item.title} 🔮);

updateRoleUI();
renderShopBalance();
renderWardrobe();
showToast(✨ Девайс ${item.title} приобретен и добавлен в Гардероб!, 'success');
}

function showInsufficientFundsModal(item, deficits, type) {
const modal = document.getElementById('insufficient-funds-modal');
const previewSlot = document.getElementById('insufficient-item-info');
if (!modal || !previewSlot) return;

tg?.HapticFeedback?.notificationOccurred?.('error');

const chipsHtml = deficits.map(d => <span class="deficit-chip">Не хватает: ${d.amount} ${d.heart}</span>).join('');
const priceText = type === 'boutique' ? 💜 ${item.pricePtc} + 🖤 ${item.priceOtc} : ❤️ ${item.priceStc};

previewSlot.innerHTML = <img class="insufficient-item-img" src="${item.mainImg}" alt="${item.title}"> <div class="insufficient-item-meta"> <div style="font-size: 12px; font-weight: 800; color: #fff;">${item.title}</div> <div style="font-size: 9.5px; color: var(--text-muted);">Стоимость: ${priceText}</div> <div style="margin-top: 4px;">${chipsHtml}</div> </div>;

modal.classList.add('active');
}

function closeInsufficientFundsModal() {
document.getElementById('insufficient-funds-modal')?.classList.remove('active');
}

function goToEarnFromMaster() {
closeInsufficientFundsModal();
openSubScreen('tab-bank');
setBalanceTab(currentAvatarRole === 'female' ? 'transfer' : 'reward', document.getElementById(currentAvatarRole === 'female' ? 'bal-tab-btn-transfer' : 'bal-tab-btn-reward'));
}

function goToExchangeCurrency() {
closeInsufficientFundsModal();
if (currentAvatarRole === 'male') {
openSubScreen('tab-bank');
setBalanceTab('transfer', document.getElementById('bal-tab-btn-transfer'));
} else {
openConverterModal();
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
peppers: 2,
seen: false
};

if (shop === 'boutique') {
newProd.pricePtc = 250;
newProd.priceOtc = 150;
boutiqueItems.push(newProd);
localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));
} else {
newProd.priceStc = parseInt(document.getElementById('prod-price-pts').value || '200');
sexshopItems.push(newProd);
localStorage.setItem('sexshop_items', JSON.stringify(sexshopItems));
}

document.getElementById('add-product-form').reset();
closeAddProductModal();
renderProducts();
showToast('Товар добавлен в каталог!', 'success');
}

/* ========================================================
14. КОНВЕРТЕР ВАЛЮТ
======================================================== */
function openConverterModal() {
updateConverterUI();
document.getElementById('currency-converter-modal')?.classList.add('active');
}

function closeConverterModal() {
document.getElementById('currency-converter-modal')?.classList.remove('active');
}

function updateConverterUI() {
const bView = document.getElementById('converter-balances-view');
if (currentAvatarRole === 'female') {
bView.innerHTML = <span>💜 <b>${femaleBalances.ptc}</b></span> <span>🖤 <b>${femaleBalances.otc}</b></span> <span>❤️ <b>${femaleBalances.stc}</b></span>;
} else {
bView.innerHTML = <span>💙 <b>${maleBalances.atc}</b></span> <span>💚 <b>${maleBalances.ctc}</b></span> <span>❤️ <b>${maleBalances.stc}</b></span>;
}
calculateConversion();
}

function calculateConversion() {
const fromCurr = document.getElementById('conv-from-currency').value;
const toCurr = document.getElementById('conv-to-currency').value;
const fromAmount = parseFloat(document.getElementById('conv-from-amount').value) || 0;
const toInput = document.getElementById('conv-to-amount');

if (fromCurr === toCurr) {
toInput.value = fromAmount;
return;
}

if ((fromCurr === 'PTC' || fromCurr === 'OTC') && toCurr === 'STC') {
toInput.value = Math.floor(fromAmount / 2);
} else if (fromCurr === 'STC' && (toCurr === 'PTC' || toCurr === 'OTC')) {
toInput.value = Math.floor(fromAmount * 2);
} else {
toInput.value = fromAmount;
}
}

function executeCurrencyExchange() {
if (currentAvatarRole !== 'female') {
showToast('Обмен сердец страсти и покорности доступен для Нижней.', 'info');
return;
}

const fromCurr = document.getElementById('conv-from-currency').value;
const toCurr = document.getElementById('conv-to-currency').value;
const fromAmount = parseInt(document.getElementById('conv-from-amount').value) || 0;
const toAmount = parseInt(document.getElementById('conv-to-amount').value) || 0;

if (fromAmount <= 0) {
showToast('Введите корректное число для обмена.', 'error');
return;
}

const keyMap = { 'PTC': 'ptc', 'OTC': 'otc', 'STC': 'stc' };
const fromKey = keyMap[fromCurr];
const toKey = keyMap[toCurr];

if (femaleBalances[fromKey] < fromAmount) {
showToast(Недостаточно средств на балансе ${getHeartByCurrency(fromCurr)}! У вас: ${femaleBalances[fromKey]}, 'error');
return;
}

femaleBalances[fromKey] -= fromAmount;
femaleBalances[toKey] += toAmount;
localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));

updateRoleUI();
updateConverterUI();
renderDesktop();
renderShopBalance();
showToast(🔄 Успешно обменяно ${fromAmount} ${getHeartByCurrency(fromCurr)} на ${toAmount} ${getHeartByCurrency(toCurr)}!, 'success');
}

/* ========================================================
15. ИНТЕРАКТИВНЫЙ ТУТОРИАЛ (?)
======================================================== */
const tutorialsData = {
desktop: {
icon: '📱',
title: 'Рабочий стол смартфона',
bullets: [
'3 экрана: свайпайте влево или вправо по экрану для переключения между столами.',
'Центральная колба: нажмите на колбу вверху, чтобы открыть меню смены обоев и добавления элементов.',
'Крестик ✕: удаляет элемент с экрана в режиме настройки.',
'Градус Страсти 🌶️: виджет считает сумму перчинок надетых комплектов и девайсов на вечер.'
]
},
bank: {
icon: '💖',
title: 'Баланс & Сердечные валюты',
bullets: [
'Валюты Нижней: 💜 Страсть (за чувственность), 🖤 Покорность (за послушание), ❤️ Секс-токены.',
'Валюты Верхнего: 💙 Внимание и 💚 Забота.',
'➕ Поощрение & ➖ Штраф: дисциплинарные инструменты Верхнего.',
'💌 Перевод ❤️: прямая пересылка секс-токенов между партнерами.',
'🔄 Обмен (Нижняя): конвертация 💜 и 🖤 в ❤️ по курсу казны 2 к 1.'
]
},
wardrobe: {
icon: '🩱',
title: 'Гардероб и примерка',
bullets: [
'Выбор на вечер: тапайте по вещам, чтобы надеть комплект или активировать игрушку.',
'Шкала Перчинок 🌶️: каждая вещь приносит от 1 до 3 перчинок, формируя ранг вечера.'
]
},
shop: {
icon: '🛍️',
title: 'Бутик & Секс-шоп',
bullets: [
'Бельё за 💜 и 🖤: комплекты выбирает и приобретает Нижняя.',
'Секс-шоп за ❤️: девайсы и игрушки доступны обоим партнерам.',
'Бейдж NEW: гаснет после первого просмотра карточки Нижней.'
]
},
contract: {
icon: '📜',
title: 'Договор пары',
bullets: [
'Закон отношений: правила, границы, табу и священные слова.'
]
},
cycle: {
icon: '🌸',
title: 'Женский календарь',
bullets: [
'Фазы цикла: подсказки Верхнему о настроении и допустимой строгости.'
]
},
randomizer: {
icon: '🎲',
title: 'Судьба & Жребий',
bullets: [
'3D-монетка: Марс ♂ и Венера ♀ для мгновенного разрешения споров.',
'Рандомайзер чисел: бросок кубика от 1 до N с праздничным салютом.'
]
},
gifts: {
icon: '✨',
title: 'Подарки & Просьбы',
bullets: [
'Список сокровенных желаний: подсказки для знаков внимания и сюрпризов.'
]
},
messenger: {
icon: '💬',
title: 'Сообщения',
bullets: [
'Связь: журнал сообщений и уведомлений Pact Bot.'
]
},
session_male: {
icon: '⚡',
title: 'Верхний Сессия ♂',
bullets: [
'Ритуалы и задания: список практик и поощрений от Верхнего.'
]
},
session_female: {
icon: '🌹',
title: 'Нижняя Сессия ♀',
bullets: [
'Будуарные обряды: принятие ванны, аромамасла и подготовка к сессии.'
]
},
product: {
icon: '🔍',
title: 'Карточка товара',
bullets: [
'Галерея: нажимайте на фото для полноэкранного просмотра.',
'Перчинки 🌶️: уровень будуарной откровенности комплекта.'
]
}
};

function openTutorial(sectionKey) {
const data = tutorialsData[sectionKey] || tutorialsData.desktop;
document.getElementById('tutorial-icon').innerText = data.icon;
document.getElementById('tutorial-title').innerText = data.title;

const slot = document.getElementById('tutorial-content-slot');
if (slot) {
slot.innerHTML = data.bullets.map(b => <div class="tutorial-bullet-item"> <span class="tutorial-bullet-icon">✦</span> <div>${b}</div> </div>).join('');
}

document.getElementById('tutorial-modal')?.classList.add('active');
tg?.HapticFeedback?.impactOccurred?.('light');
}

function closeTutorial() {
document.getElementById('tutorial-modal')?.classList.remove('active');
}

/* ========================================================
16. ЖЕНСКИЙ КАЛЕНДАРЬ
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

if (pVal) pVal.innerText = ${daysToPeriod} дн.;
if (pSub) pSub.innerText = 'Следующий цикл';
if (oVal) oVal.innerText = daysToOvulation === 0 ? 'Сегодня' : ${daysToOvulation} дн.;
if (oSub) oSub.innerText = 'Фертильная фаза';

const calGrid = document.getElementById('calendar-grid');
if (!calGrid) return;
calGrid.innerHTML = '';
const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
daysOfWeek.forEach(d => { calGrid.innerHTML += <div class="calendar-weekday">${d}</div>; });

for (let i = 1; i <= cycleDuration; i++) {
let cls = 'cal-day';
if (i <= 5) cls += ' period';
if (i === ovulationDay) cls += ' ovulation';
if (i === (diffDays + 1)) cls += ' today';
calGrid.innerHTML += <div class="${cls}">${i}</div>;
}
}

/* ========================================================
17. СЕССИИ И ЗАДАНИЯ (ВЕРХНИЙ ♂ / НИЖНЯЯ ♀)
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
mCont.innerHTML = maleTasks.map((t, idx) => <div class="contract-item"> <div class="contract-info"> <div class="name">${t.title}</div> <div class="reward">+${t.points} PTS</div> </div> <button class="back-action-btn" onclick="deleteTask('male', ${idx})">✕</button> </div>).join('');
}

if (fCont) {
fCont.innerHTML = femaleTasks.map((t, idx) => <div class="contract-item"> <div class="contract-info"> <div class="name">${t.title}</div> <div class="reward">+${t.points} PTS</div> </div> <button class="back-action-btn" onclick="deleteTask('female', ${idx})">✕</button> </div>).join('');
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
18. ЖЕЛАНИЯ & ПОДАРКИ
======================================================== */
let giftWishes = JSON.parse(localStorage.getItem('gift_wishes')) || [
'Шелковый халат глубокого рубинового цвета',
'Массажное масло с ароматом ванили'
];

function renderGifts() {
const gCont = document.getElementById('gifts-list-container');
if (gCont) {
gCont.innerHTML = giftWishes.map((w, i) => <div class="contract-item"> <div class="contract-info"><div class="name">🎁 ${w}</div></div> <button class="back-action-btn" onclick="deleteGiftWish(${i})">✕</button> </div>).join('');
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
19. ЧАТ & СООБЩЕНИЯ
======================================================== */
let chatHistory = [
{ sender: 'bot', text: 'Приветствую в личном пространстве Pact & Passion. Готовы ли вы закрепить новые правила вечера?' }
];

function renderChat() {
const box = document.getElementById('chat-messages');
if (!box) return;
box.innerHTML = chatHistory.map(m => <div class="chat-msg ${m.sender}">${m.text}</div>).join('');
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
20. СУДЬБА & ЖРЕБИЙ (МОНЕТКА + РАНДОМАЙЗЕР + САЛЮТ)
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

let isTossing = false;
let currentRotationX = 0;

function tossCoin() {
if (isTossing) return;
isTossing = true;

const stage = document.getElementById('coin-stage');
const coin3D = document.getElementById('coin-3d');
const isMale = Math.random() < 0.5;

stage?.classList.add('toss-flying');
tg?.HapticFeedback?.impactOccurred?.('medium');

const fullSpins = 360 * 6;
currentRotationX += fullSpins + (isMale ? 0 : 180) - (currentRotationX % 360);

if (coin3D) {
coin3D.style.transition = 'transform 1.35s cubic-bezier(0.2, 0.85, 0.25, 1)';
coin3D.style.transform = rotateX(${currentRotationX}deg);
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
if (statusLbl) statusLbl.innerText = Вращение от 1 до ${max}...;

let ticks = 0;
const totalTicks = 18;

const interval = setInterval(() => {
const temp = Math.floor(Math.random() * max) + 1;
if (display) {
display.innerText = temp;
display.style.transform = scale(${1 + (ticks % 2 === 0 ? 0.08 : -0.04)});
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

/* ========================================================
21. БЛОКИРОВКА СКРОЛЛА & ИНИЦИАЛИЗАЦИЯ
======================================================== */
document.addEventListener('touchmove', (e) => {
if (document.body.classList.contains('lock-scroll')) {
if (!e.target.closest('.modal-card') && !e.target.closest('.modal-overlay') && !e.target.closest('.tab-content') && !e.target.closest('.desktop-viewport')) {
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
renderWardrobe();
renderChat();
initSwipeGestures();
} catch (err) {
console.error('Ошибка инициализации приложения:', err);
}
});
