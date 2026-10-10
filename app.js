/* ========================================================
   1. ИНИЦИАЛИЗАЦИЯ И ХРАНИЛИЩЕ ВАЛЮТ
   ======================================================== */
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

let currentRole = localStorage.getItem('pact_user_role') || 'female';

// Балансы сердец Нижней (💜 Страсть, 🖤 Покорность, ❤️ Секс-валюта)
let femaleBalances = JSON.parse(localStorage.getItem('pact_female_balances')) || {
  ptc: 650,
  otc: 480,
  stc: 240
};

// Балансы сердец Верхнего (💙 Внимание, 💚 Забота, ❤️ Секс-валюта)
let maleBalances = JSON.parse(localStorage.getItem('pact_male_balances')) || {
  atc: 850,
  ctc: 720,
  stc: 400
};

// Версионирование кэша
if (localStorage.getItem('pact_single_ver') !== 'v27_integrated_modular_flask') {
  localStorage.removeItem('boutique_items');
  localStorage.removeItem('wardrobe_items');
  localStorage.removeItem('pact_selected_wardrobe_ids');
  localStorage.removeItem('pact_female_balances');
  localStorage.removeItem('pact_male_balances');
  localStorage.removeItem('pact_transactions_log');
  localStorage.removeItem('pact_desktop_items');
  localStorage.setItem('pact_single_ver', 'v27_integrated_modular_flask');
}

// Лог истории операций
let transactionsLog = JSON.parse(localStorage.getItem('pact_transactions_log')) || [
  { id: 1, time: 'Сегодня, 14:20', type: 'reward', recipient: 'female', currency: 'PTC', amount: 50, reason: 'Кофе в постель ☕' },
  { id: 2, time: 'Сегодня, 16:45', type: 'penalty', recipient: 'female', currency: 'OTC', amount: 30, reason: 'Дерзкий тон без разрешения ⚡' },
  { id: 3, time: 'Вчера, 19:10', type: 'reward', recipient: 'male', currency: 'ATC', amount: 40, reason: 'Внимание и романтический жест 💙' }
];

/* ========================================================
   2. ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ (TOASTS)
   ======================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  if (type === 'success') tg?.HapticFeedback?.notificationOccurred?.('success');
  else if (type === 'penalty' || type === 'error') tg?.HapticFeedback?.notificationOccurred?.('warning');
  else tg?.HapticFeedback?.impactOccurred?.('medium');

  const toast = document.createElement('div');
  toast.className = `app-toast toast-${type}`;
  toast.innerHTML = `<div style="line-height: 1.45;">${message}</div>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3400);
}

/* ========================================================
   3. ХЕЛПЕРЫ ВАЛЮТ, ПЕРЧИНОК И ЗВАНИЙ СТРАСТИ
   ======================================================== */
function getHeartByCurrency(curr) {
  if (curr === 'PTC') return '💜';
  if (curr === 'OTC') return '🖤';
  if (curr === 'STC') return '❤️';
  if (curr === 'ATC') return '💙';
  if (curr === 'CTC') return '💚';
  return curr;
}

function renderPeppers(count = 1) {
  const peppers = '🌶️'.repeat(Math.min(Math.max(count, 1), 3));
  return `<span class="peppers-indicator" title="Степень откровенности: ${count}">${peppers}</span>`;
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
  let desc = 'Ничего не надето';
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

/* ========================================================
   4. РАБОЧИЙ СТОЛ (3 ЭКРАНА, СВАЙП, DRAG & DROP, МЕНЮ)
   ======================================================== */
let currentDesktopPage = 0;
let isEditMode = false;
let editingTileId = null;

let desktopItems = JSON.parse(localStorage.getItem('pact_desktop_items')) || [
  { id: 'w-passion', type: 'widget', widgetKey: 'widget-passion', span: 4, page: 0 },
  { id: 'w-balance', type: 'widget', widgetKey: 'widget-balance', span: 4, page: 0 },
  { id: 't-bank', type: 'tile', title: 'Баланс', icon: '💖', target: 'tab-bank', page: 0 },
  { id: 't-wardrobe', type: 'tile', title: 'Гардероб', icon: '🩱', target: 'tab-wardrobe', page: 0 },
  { id: 't-shop', type: 'tile', title: 'Бутик', icon: '🛍️', target: 'tab-shop', page: 0 },
  { id: 't-cycle', type: 'tile', title: 'Календарь', icon: '🌸', target: 'tab-cycle', page: 0 },
  { id: 'w-contract', type: 'widget', widgetKey: 'widget-contract', span: 4, page: 1 },
  { id: 't-contract', type: 'tile', title: 'Договор', icon: '📜', target: 'tab-contract', page: 1 }
];

function toggleDesktopEditMode() {
  isEditMode = !isEditMode;
  const desktopSec = document.getElementById('tab-desktop');
  const flaskEditBtn = document.getElementById('flask-edit-btn');
  const iconSpan = document.getElementById('flask-edit-icon');

  if (isEditMode) {
    desktopSec?.classList.add('is-editing');
    flaskEditBtn?.classList.add('active');
    if (iconSpan) iconSpan.innerText = '✓';
    showToast('Режим настройки активен: зажми и тащи элемент или нажми на плитку для смены иконки!', 'info');
  } else {
    desktopSec?.classList.remove('is-editing');
    flaskEditBtn?.classList.remove('active');
    if (iconSpan) iconSpan.innerText = '✏️';
  }
  tg?.HapticFeedback?.impactOccurred?.('medium');
  renderDesktop();
}

function goToDesktopPage(pageIdx) {
  currentDesktopPage = Math.max(0, Math.min(2, pageIdx));
  const track = document.getElementById('desktop-pages-track');
  if (track) {
    track.style.transform = `translateX(-${currentDesktopPage * 100}%)`;
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
    if (isEditMode) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    isSwiping = true;
  }, { passive: true });

  viewport.addEventListener('touchmove', (e) => {
    if (!isSwiping || isEditMode) return;
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
    if (!isSwiping || isEditMode) return;
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
let dragStartX = 0;
let dragStartY = 0;
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

  const passion = getPassionStatus();
  const unseenShopCount = boutiqueItems.filter(p => !p.seen).length;

  desktopItems.forEach(item => {
    const itemPage = item.page !== undefined ? item.page : 0;
    const targetContainer = pages[itemPage] || pages[0];

    const el = document.createElement('div');
    el.setAttribute('data-id', item.id);

    if (item.type === 'tile') {
      el.className = 'desktop-tile';
      const showBadge = (item.target === 'tab-shop' && currentRole === 'female' && unseenShopCount > 0);
      const badgeHtml = showBadge ? `<div class="tile-unread-badge">${unseenShopCount}</div>` : '';

      el.innerHTML = `
        <div class="tile-delete-badge" onclick="event.stopPropagation(); deleteDesktopItem('${item.id}')">✕</div>
        ${badgeHtml}
        <div class="tile-icon">${item.icon}</div>
        <div class="tile-title">${item.title}</div>
      `;

      el.onclick = () => {
        if (isItemDragging) return;
        if (isEditMode) {
          openIconPickerModal(item.id);
        } else {
          switchTab(item.target);
        }
      };
    } else {
      el.className = `desktop-widget widget-span-4 ${item.widgetKey === 'widget-passion' ? 'widget-passion-box' : ''}`;
      let widgetInner = `<div class="tile-delete-badge" onclick="event.stopPropagation(); deleteDesktopItem('${item.id}')">✕</div>`;

      if (item.widgetKey === 'widget-passion') {
        widgetInner += `
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
            <span style="color: var(--accent-pink); font-weight: 700;">В гардероб →</span>
          </div>
        `;
        el.onclick = () => { if (!isItemDragging && !isEditMode) switchTab('tab-wardrobe'); };
      } else if (item.widgetKey === 'widget-balance') {
        let balanceHtml = currentRole === 'female'
          ? `<div class="curr-chip ptc">💜 ${femaleBalances.ptc}</div><div class="curr-chip otc">🖤 ${femaleBalances.otc}</div><div class="curr-chip stc">❤️ ${femaleBalances.stc}</div>`
          : `<div class="curr-chip att">💙 ${maleBalances.atc}</div><div class="curr-chip care">💚 ${maleBalances.ctc}</div><div class="curr-chip stc">❤️ ${maleBalances.stc}</div>`;

        widgetInner += `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="widget-title-lbl" style="margin: 0;">💖 Баланс Очков</div>
            <div style="font-size: 10px; color: var(--accent-pink); font-weight: 700;">Открыть ⚖️</div>
          </div>
          <div class="widget-balance-grid">${balanceHtml}</div>
        `;
        el.onclick = () => { if (!isItemDragging && !isEditMode) switchTab('tab-bank'); };
      } else {
        widgetInner += `
          <div class="widget-title-lbl">📜 Обет Дня</div>
          <div style="font-size: 10.5px; color: var(--text-muted);">Договор активен • Нажмите для просмотра</div>
        `;
        el.onclick = () => { if (!isItemDragging && !isEditMode) switchTab('tab-contract'); };
      }
      el.innerHTML = widgetInner;
    }

    attachDragEvents(el);
    targetContainer.appendChild(el);
  });

  pages.forEach((p, idx) => {
    if (p.children.length === 0) {
      p.innerHTML = `
        <div style="grid-column: span 4; text-align: center; color: var(--text-muted); font-size: 11px; padding: 60px 10px; border: 1px dashed rgba(255,255,255,0.1); border-radius: 16px;">
          Стол ${idx + 1} пока пуст.<br>Нажми «Настройка стола & Обои» ниже.
        </div>
      `;
    }
  });
}

function attachDragEvents(el) {
  el.addEventListener('touchstart', (e) => {
    if (!isEditMode) return;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    draggedElement = el;
    isItemDragging = false;
  }, { passive: true });

  el.addEventListener('touchmove', (e) => {
    if (!isEditMode || !draggedElement) return;

    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    const dist = Math.hypot(curX - dragStartX, curY - dragStartY);

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
      const targetItem = elemBelow?.closest('.desktop-tile, .desktop-widget');
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
    const grid = document.getElementById(`desktop-page-${pageIdx}`);
    if (!grid) return;
    const domItems = grid.querySelectorAll('.desktop-tile, .desktop-widget');
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
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
}

function deleteDesktopItem(id) {
  desktopItems = desktopItems.filter(item => item.id !== id);
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
  tg?.HapticFeedback?.notificationOccurred?.('warning');
  showToast('Элемент удален с рабочего стола.', 'info');
  renderDesktop();
}

/* ========================================================
   5. МЕНЮ НАСТРОЙКИ ПЛИТКИ
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
    grid.innerHTML = availableIconsList.map(ico => `
      <div style="font-size: 22px; text-align: center; padding: 6px; border-radius: 10px; cursor: pointer; background: ${ico === selectedTileIcon ? 'rgba(230,57,86,0.3)' : 'rgba(255,255,255,0.05)'}; border: 1px solid ${ico === selectedTileIcon ? 'var(--accent-pink)' : 'var(--border-subtle)'};" onclick="selectPickerIcon('${ico}', this)">
        ${ico}
      </div>
    `).join('');
  }

  setTileTargetPage(selectedTileTargetPage);
  document.getElementById('icon-picker-modal')?.classList.add('active');
}

function selectPickerIcon(ico, el) {
  selectedTileIcon = ico;
  document.querySelectorAll('#icon-picker-grid > div').forEach(d => {
    d.style.background = 'rgba(255,255,255,0.05)';
    d.style.borderColor = 'var(--border-subtle)';
  });
  el.style.background = 'rgba(230,57,86,0.3)';
  el.style.borderColor = 'var(--accent-pink)';
  tg?.HapticFeedback?.selectionChanged?.();
}

function setTileTargetPage(pIdx) {
  selectedTileTargetPage = pIdx;
  [0, 1, 2].forEach(idx => {
    document.getElementById(`btn-move-page-${idx}`)?.classList.toggle('active', idx === pIdx);
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
    localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
    showToast('Плитка сохранена!', 'success');
  }
  closeIconPickerModal();
  renderDesktop();
}

/* ========================================================
   6. ЕДИНЫЙ ЦЕНТР КАСТОМИЗАЦИИ (ВИДЖЕТЫ + ОБОИ)
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
  document.getElementById(`btn-tab-${tab}`)?.classList.add('active');

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

function applyWallpaper(themeKey, cardEl) {
  document.body.className = `bg-${themeKey}`;
  localStorage.setItem('pact_wallpaper', themeKey);

  document.querySelectorAll('.wallpaper-card').forEach(c => c.classList.remove('active'));
  cardEl?.classList.add('active');

  showToast('Обои успешно применены! ✨', 'success');
}

function initSavedWallpaper() {
  const saved = localStorage.getItem('pact_wallpaper') || 'noir-boudoir';
  document.body.className = `bg-${saved}`;
}

function createWidgetOnDesktop(widgetKey, span) {
  desktopItems.push({
    id: 'w-' + Date.now(),
    type: 'widget',
    widgetKey,
    span,
    page: currentDesktopPage
  });
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
  closeCustomizationModal();
  renderDesktop();
  showToast(`Виджет добавлен на Стол ${currentDesktopPage + 1}!`, 'success');
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
  localStorage.setItem('pact_desktop_items', JSON.stringify(desktopItems));
  closeCustomizationModal();
  renderDesktop();
  showToast(`Плитка «${title}» добавлена на Стол ${currentDesktopPage + 1}!`, 'success');
}

/* ========================================================
   7. ИНТЕРАКТИВНЫЙ ТУТОРИАЛ (?)
   ======================================================== */
const tutorialsData = {
  desktop: {
    icon: '📱',
    title: 'Рабочий стол смартфона',
    bullets: [
      '<b>3 экрана:</b> свайпай влево или вправо по экрану для перехода между рабочими столами.',
      '<b>Центральная колба:</b> содержит кнопку настроек ✏️ и справку ? без лишних кнопок в шапке.',
      '<b>Режим настройки:</b> нажми ✏️ на колбе, чтобы перетаскивать иконки и виджеты (Touch Drag & Drop) или нажать на них для смены значка.',
      '<b>Крестик ✕:</b> удаляет элемент с экрана.',
      '<b>Градус Страсти 🌶️:</b> виджет считает сумму перчинок надетых комплектов и девайсов на вечер.'
    ]
  },
  bank: {
    icon: '💖',
    title: 'Баланс & Сердечные валюты',
    bullets: [
      '<b>Валюты Нижней:</b> 💜 Страсть (за чувственность), 🖤 Покорность (за послушание), ❤️ Секс-токены.',
      '<b>Валюты Верхнего:</b> 💙 Внимание и 💚 Забота.',
      '<b>➕ Поощрение & ➖ Штраф:</b> дисциплинарные инструменты Верхнего.',
      '<b>💌 Перевод ❤️:</b> прямая пересылка секс-токенов между партнерами.',
      '<b>🔄 Обмен (Нижняя):</b> конвертация 💜 и 🖤 в ❤️ по курсу казны 2 к 1.'
    ]
  },
  wardrobe: {
    icon: '🩱',
    title: 'Гардероб и примерка',
    bullets: [
      '<b>Выбор на вечер:</b> тапай по вещам, чтобы надеть комплект или активировать игрушку.',
      '<b>Шкала Перчинок 🌶️:</b> каждая вещь приносит от 1 до 3 перчинок, формируя ранг вечера.'
    ]
  },
  shop: {
    icon: '🛍️',
    title: 'Бутик & Секс-шоп',
    bullets: [
      '<b>Бельё за 💜 и 🖤:</b> комплекты выбирает и приобретает Нижняя.',
      '<b>Секс-шоп за ❤️:</b> девайсы и игрушки доступны обоим партнерам.',
      '<b>Бейдж NEW:</b> гаснет после первого просмотра карточки Нижней.'
    ]
  },
  contract: {
    icon: '📜',
    title: 'Договор пары',
    bullets: [
      '<b>Закон отношений:</b> правила, границы, табу и священные слова.'
    ]
  },
  cycle: {
    icon: '🌸',
    title: 'Женский календарь',
    bullets: [
      '<b>Фазы цикла:</b> подсказки Верхнему о настроении и допустимой строгости.'
    ]
  },
  product: {
    icon: '🔍',
    title: 'Карточка товара',
    bullets: [
      '<b>Галерея:</b> нажимай на фото для полноэкранного просмотра.'
    ]
  }
};

function openTutorial(sectionKey) {
  const data = tutorialsData[sectionKey] || tutorialsData.desktop;
  document.getElementById('tutorial-icon').innerText = data.icon;
  document.getElementById('tutorial-title').innerText = data.title;

  const slot = document.getElementById('tutorial-content-slot');
  if (slot) {
    slot.innerHTML = data.bullets.map(b => `
      <div class="tutorial-bullet-item">
        <span class="tutorial-bullet-icon">✦</span>
        <div>${b}</div>
      </div>
    `).join('');
  }

  document.getElementById('tutorial-modal')?.classList.add('active');
  tg?.HapticFeedback?.impactOccurred?.('light');
}

function closeTutorial() {
  document.getElementById('tutorial-modal')?.classList.remove('active');
}

/* ========================================================
   8. УПРАВЛЕНИЕ РОЛЯМИ И НАВИГАЦИЯ
   ======================================================== */
function updateRoleUI() {
  const roleName = document.getElementById('role-name');
  const roleIcon = document.getElementById('role-icon');

  if (currentRole === 'male') {
    roleName.innerText = 'Верхний';
    roleIcon.innerText = '👑';
  } else {
    roleName.innerText = 'Нижняя';
    roleIcon.innerText = '🗝️';
  }
  localStorage.setItem('pact_user_role', currentRole);
}

function toggleRole() {
  currentRole = currentRole === 'male' ? 'female' : 'male';
  tg?.HapticFeedback?.selectionChanged?.();
  updateRoleUI();
  renderDesktop();
  renderShopBalance();
  renderBankScreen();
  if (document.getElementById('tab-product-detail').classList.contains('active')) {
    renderProductDetail(currentDetailItem);
  }
  showToast(`Роль переключена: ${currentRole === 'male' ? '👑 Верхний' : '🗝️ Нижняя'}`, 'info');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
    tg?.HapticFeedback?.impactOccurred?.('light');
  }

  if (tabId === 'tab-desktop') renderDesktop();
  if (tabId === 'tab-bank') renderBankScreen();
  if (tabId === 'tab-wardrobe') renderWardrobe();
  if (tabId === 'tab-shop') renderProducts();
}

/* ========================================================
   9. БУТИК & СЕКС-ШОП
   ======================================================== */
let boutiqueItems = JSON.parse(localStorage.getItem('boutique_items')) || [
  {
    id: 1,
    title: '«Винтажная Муза»',
    category: 'Белье',
    pricePtc: 220,
    priceOtc: 80,
    peppers: 1,
    mainImg: 'wardrobe/b1.webp',
    gallery: ['wardrobe/b1.webp'],
    desc: 'Полупрозрачный будуарный корсетный топ цвета слоновой кости с аккуратными пуговицами и французским кружевом.',
    status: 'available',
    seen: true
  },
  {
    id: 2,
    title: '«Тёмная Покорность»',
    category: 'Белье',
    pricePtc: 160,
    priceOtc: 340,
    peppers: 2,
    mainImg: 'wardrobe/b2.webp',
    gallery: ['wardrobe/b2.webp'],
    desc: 'Комплект из чёрного кружева с бархатным чокером, золотой фурнитурой, поясом и гартерами.',
    status: 'available',
    seen: true
  },
  {
    id: 3,
    title: '«Цветение Айвори»',
    category: 'Белье',
    pricePtc: 280,
    priceOtc: 140,
    peppers: 2,
    mainImg: 'wardrobe/b3.webp',
    gallery: ['wardrobe/b3.webp'],
    desc: 'Невесомый бралетт с цветочной вышивкой, глубоким декольте и тонкими стрепами.',
    status: 'available',
    seen: true
  },
  {
    id: 4,
    title: '«Чистый Соблазн»',
    category: 'Белье',
    pricePtc: 380,
    priceOtc: 300,
    peppers: 3,
    mainImg: 'wardrobe/b4.webp',
    gallery: ['wardrobe/b4.webp'],
    desc: 'Откровенный белоснежный микро-сет с открытой линией груди и золотистыми кольцами.',
    status: 'available',
    seen: false
  },
  {
    id: 5,
    title: '«Бархатный Ошейник»',
    category: 'Игрушки',
    priceStc: 180,
    peppers: 2,
    mainImg: 'https://images.unsplash.com/photo-1611042553365-9b101441c135?w=900',
    gallery: ['https://images.unsplash.com/photo-1611042553365-9b101441c135?w=900'],
    desc: 'Чёрный бархатный ошейник с позолоченным кольцом и съёмным тонким поводком.',
    status: 'available',
    seen: true
  },
  {
    id: 6,
    title: '«Атласные Ленты & Повязка»',
    category: 'Игрушки',
    priceStc: 120,
    peppers: 1,
    mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
    gallery: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'],
    desc: 'Шелковая повязка для глаз и ленты для депривации чувств во время сессии.',
    status: 'available',
    seen: true
  },
  {
    id: 7,
    title: '«Кожаный Флоггер Покора»',
    category: 'Игрушки',
    priceStc: 260,
    peppers: 3,
    mainImg: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900',
    gallery: ['https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=900'],
    desc: 'Мягкие замшевые хвосты на эргономичной рукояти для осязаемых поощрений.',
    status: 'available',
    seen: true
  },
  {
    id: 8,
    title: '«Вибратор Неоновый Пульс»',
    category: 'Игрушки',
    priceStc: 350,
    peppers: 3,
    mainImg: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=900',
    gallery: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=900'],
    desc: 'Эргономичный стимулятор с 10 режимами глубокой пульсации.',
    status: 'available',
    seen: false
  }
];

let shopFilterCat = 'Все';
let currentDetailItem = null;
let activeDetailPhotoSrc = '';

function setShopCategory(cat, btn) {
  shopFilterCat = cat;
  document.querySelectorAll('#tab-shop .chip-btn').forEach(b => b.classList.remove('active'));
  btn?.classList.add('active');
  tg?.HapticFeedback?.selectionChanged?.();
  renderProducts();
}

function renderShopBalance() {
  const slot = document.getElementById('shop-account-balance-slot');
  if (!slot) return;

  if (currentRole === 'female') {
    slot.innerHTML = `
      <div>
        <div class="shop-bal-label">Твой баланс</div>
        <div class="shop-bal-chips-group">
          <span class="curr-chip ptc">💜 <b>${femaleBalances.ptc}</b></span>
          <span class="curr-chip otc">🖤 <b>${femaleBalances.otc}</b></span>
          <span class="curr-chip stc">❤️ <b>${femaleBalances.stc}</b></span>
        </div>
      </div>
      <button class="shop-bal-action-btn" onclick="openConverterModal()">
        <span>🔄</span> Обмен
      </button>
    `;
  } else {
    slot.innerHTML = `
      <div>
        <div class="shop-bal-label">Баланс Верхнего</div>
        <div class="shop-bal-chips-group">
          <span class="curr-chip att">💙 <b>${maleBalances.atc}</b></span>
          <span class="curr-chip care">💚 <b>${maleBalances.ctc}</b></span>
          <span class="curr-chip stc">❤️ <b>${maleBalances.stc}</b></span>
        </div>
      </div>
      <button class="shop-bal-action-btn" onclick="switchTab('tab-bank')">
        <span>💖</span> Баланс
      </button>
    `;
  }
}

function renderProducts() {
  renderShopBalance();
  const bCont = document.getElementById('shop-products-list');
  if (!bCont) return;

  const filtered = boutiqueItems.filter(p => {
    if (shopFilterCat === 'Все') return true;
    return p.category === shopFilterCat;
  });

  if (filtered.length === 0) {
    bCont.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11.5px; padding: 40px 10px;">В этой категории пока нет товаров.</div>`;
    return;
  }

  bCont.innerHTML = filtered.map(p => {
    let actionBtnHtml = '';
    if (p.status === 'available') {
      actionBtnHtml = `<button class="shop-view-action-btn">Смотреть →</button>`;
    } else if (p.status === 'bought') {
      actionBtnHtml = `<span class="shop-status-pill bought">📦 Ожидает</span>`;
    } else {
      actionBtnHtml = `<span class="shop-status-pill owned">✓ В гардеробе</span>`;
    }

    let priceHtml = '';
    if (p.category === 'Белье') {
      priceHtml = `<div class="shop-price-badge dual">💜 ${p.pricePtc} + 🖤 ${p.priceOtc}</div>`;
    } else {
      priceHtml = `<div class="shop-price-badge stc">❤️ ${p.priceStc}</div>`;
    }

    const newBadgeHtml = (!p.seen && currentRole === 'female') ? `<div class="product-new-badge">NEW</div>` : '';

    return `
      <div class="shop-card-row" onclick="openProductDetail(${p.id})">
        <div class="shop-img-wrap" onclick="event.stopPropagation(); openFullscreenPhoto('${p.mainImg}')">
          <img class="shop-row-img" src="${p.mainImg}" alt="${p.title}" loading="lazy">
          ${newBadgeHtml}
          <div class="shop-peppers-tag">${renderPeppers(p.peppers || 1)}</div>
        </div>
        <div class="shop-row-info">
          <div>
            <div class="shop-row-title-bar">
              <div class="shop-row-title">${p.title}</div>
              ${priceHtml}
            </div>
            <div class="shop-row-desc">${p.desc || ''}</div>
          </div>
          <div class="shop-row-footer">
            <span class="shop-row-cat">${p.category === 'Белье' ? 'Белье' : 'Секс-шоп'}</span>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openProductDetail(id) {
  const item = boutiqueItems.find(p => p.id === id);
  if (!item) return;

  if (!item.seen && currentRole === 'female') {
    item.seen = true;
    localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));
    renderDesktop();
    renderProducts();
  }

  currentDetailItem = item;
  activeDetailPhotoSrc = item.mainImg;
  renderProductDetail(item);
  switchTab('tab-product-detail');
}

function renderProductDetail(item) {
  if (!item) return;

  document.getElementById('detail-top-title').innerText = item.category === 'Белье' ? 'БУТИК' : 'СЕКС-ШОП';
  document.getElementById('detail-title-elem').innerText = item.title;

  const priceElem = document.getElementById('detail-price-elem');
  if (item.category === 'Белье') {
    priceElem.innerHTML = `💜 ${item.pricePtc} + 🖤 ${item.priceOtc}`;
  } else {
    priceElem.innerHTML = `❤️ ${item.priceStc}`;
  }

  document.getElementById('detail-desc-elem').innerText = item.desc;

  const peppersSlot = document.getElementById('detail-peppers-slot');
  peppersSlot.innerHTML = `
    <div class="peppers-pill">
      ${renderPeppers(item.peppers)}
      <span>${getPepperDescription(item.peppers)}</span>
    </div>
  `;

  document.getElementById('detail-main-img-elem').src = activeDetailPhotoSrc;

  const gallery = item.gallery && item.gallery.length > 0 ? item.gallery : [item.mainImg];
  document.getElementById('detail-gallery-strip').innerHTML = gallery.map(photoUrl => `
    <img class="detail-thumb-img ${photoUrl === activeDetailPhotoSrc ? 'active' : ''}" 
         src="${photoUrl}" 
         alt="thumb" 
         onclick="selectDetailPhoto('${photoUrl}', this)">
  `).join('');

  const actionSlot = document.getElementById('detail-action-slot');
  if (item.status === 'available') {
    if (item.category === 'Белье') {
      if (currentRole === 'female') {
        actionSlot.innerHTML = `<button class="shop-buy-btn" onclick="buyBoutiqueItem(${item.id})">Приобрести комплект • 💜 ${item.pricePtc} + 🖤 ${item.priceOtc}</button>`;
      } else {
        actionSlot.innerHTML = `<button class="shop-buy-btn" style="background: rgba(255,255,255,0.06); border: 1px dashed rgba(255,255,255,0.2); color: var(--text-muted); cursor: default;" onclick="showToast('Бельё выбирает и приобретает Нижняя за 💜 и 🖤.', 'info')">👙 Бельё выбирает Нижняя</button>`;
      }
    } else {
      const buyerRoleLabel = currentRole === 'female' ? '' : ' (Верхний)';
      actionSlot.innerHTML = `<button class="shop-buy-btn" onclick="buyBoutiqueItem(${item.id})">Купить девайс${buyerRoleLabel} • ❤️ ${item.priceStc}</button>`;
    }
  } else if (item.status === 'bought') {
    actionSlot.innerHTML = `<button class="shop-receive-btn" onclick="receiveBoutiqueItem(${item.id})">📦 Подтвердить получение!</button>`;
  } else {
    actionSlot.innerHTML = `<div class="shop-owned-badge">✓ Товар уже в Гардеробе</div>`;
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
  tg?.HapticFeedback?.impactOccurred?.('light');
}

function buyBoutiqueItem(id) {
  const item = boutiqueItems.find(p => p.id === id);
  if (!item || item.status !== 'available') return;

  if (item.category === 'Белье') {
    if (currentRole !== 'female') {
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
      showInsufficientFundsModal(item, deficits);
      return;
    }

    femaleBalances.ptc -= item.pricePtc;
    femaleBalances.otc -= item.priceOtc;
    localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
  } else {
    const activeBalance = currentRole === 'female' ? femaleBalances.stc : maleBalances.stc;
    if (activeBalance < item.priceStc) {
      const deficits = [{ heart: '❤️', amount: item.priceStc - activeBalance }];
      showInsufficientFundsModal(item, deficits);
      return;
    }

    if (currentRole === 'female') {
      femaleBalances.stc -= item.priceStc;
      localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
    } else {
      maleBalances.stc -= item.priceStc;
      localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));
    }
  }

  item.status = 'bought';
  item.boughtBy = currentRole;
  localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));

  logTransaction('penalty', currentRole, item.category === 'Белье' ? '💜+🖤' : '❤️', item.category === 'Белье' ? `${item.pricePtc}+${item.priceOtc}` : item.priceStc, `Покупка: ${item.title} 🛍️`);

  updateRoleUI();
  renderShopBalance();
  renderProductDetail(item);
  showToast(`🛍️ ${item.title} оформлен! Ожидает подтверждения получения.`, 'success');
}

function showInsufficientFundsModal(item, deficits) {
  const modal = document.getElementById('insufficient-funds-modal');
  const previewSlot = document.getElementById('insufficient-item-info');
  if (!modal || !previewSlot) return;

  tg?.HapticFeedback?.notificationOccurred?.('error');

  const chipsHtml = deficits.map(d => `<span class="deficit-chip">Не хватает: ${d.amount} ${d.heart}</span>`).join('');
  const priceText = item.category === 'Белье' ? `💜 ${item.pricePtc} + 🖤 ${item.priceOtc}` : `❤️ ${item.priceStc}`;

  previewSlot.innerHTML = `
    <img class="insufficient-item-img" src="${item.mainImg}" alt="${item.title}">
    <div class="insufficient-item-meta">
      <div class="title">${item.title}</div>
      <div style="font-size: 10px; color: var(--text-muted);">Стоимость: ${priceText}</div>
      <div class="insufficient-deficits">${chipsHtml}</div>
    </div>
  `;

  const storyElem = document.querySelector('.insufficient-story-text');
  if (storyElem) {
    if (currentRole === 'male') {
      storyElem.innerText = 'Недостаточно ❤️ на балансе Верхнего. Получи перевод от Нижней или начисли очки в Балансе.';
    } else {
      storyElem.innerText = 'Этот наряд требует большей страсти и покорности... Заслужи одобрение Верхнего или используй обмен.';
    }
  }

  modal.classList.add('active');
}

function closeInsufficientFundsModal() {
  document.getElementById('insufficient-funds-modal')?.classList.remove('active');
}

function goToEarnFromMaster() {
  closeInsufficientFundsModal();
  switchTab('tab-bank');
  if (currentRole === 'female') {
    setBalanceTab('transfer', document.getElementById('bal-tab-btn-transfer'));
  } else {
    setBalanceTab('reward', document.getElementById('bal-tab-btn-reward'));
  }
}

function goToExchangeCurrency() {
  closeInsufficientFundsModal();
  if (currentRole === 'male') {
    switchTab('tab-bank');
    setBalanceTab('transfer', document.getElementById('bal-tab-btn-transfer'));
  } else {
    openConverterModal();
  }
}

function receiveBoutiqueItem(id) {
  const item = boutiqueItems.find(p => p.id === id);
  if (!item || item.status !== 'bought') return;

  item.status = 'received';
  localStorage.setItem('boutique_items', JSON.stringify(boutiqueItems));

  if (!wardrobeItems.some(w => w.id === item.id)) {
    wardrobeItems.unshift({
      id: item.id,
      title: item.title,
      desc: item.desc,
      category: item.category === 'Игрушки' ? 'Игрушки' : 'Белье',
      peppers: item.peppers || 1,
      mainImg: item.mainImg
    });
    localStorage.setItem('wardrobe_items', JSON.stringify(wardrobeItems));
  }

  renderProductDetail(item);
  renderWardrobe();
  showToast(`✨ Товар ${item.title} доставлен в Гардероб!`, 'success');
}

/* ========================================================
   10. ГАРДЕРОБ
   ======================================================== */
let wardrobeItems = JSON.parse(localStorage.getItem('wardrobe_items')) || [
  {
    id: 1,
    title: '«Винтажная Муза»',
    desc: 'Полупрозрачный будуарный корсетный топ цвета слоновой кости',
    category: 'Белье',
    peppers: 1,
    mainImg: 'wardrobe/b1.webp'
  },
  {
    id: 2,
    title: '«Тёмная Покорность»',
    desc: 'Чёрное кружево, чокер, пояс с гартерами и портупея',
    category: 'Белье',
    peppers: 2,
    mainImg: 'wardrobe/b2.webp'
  },
  {
    id: 3,
    title: '«Цветение Айвори»',
    desc: 'Цветочная вышивка, глубокий вырез и двойные бретели',
    category: 'Белье',
    peppers: 2,
    mainImg: 'wardrobe/b3.webp'
  },
  {
    id: 4,
    title: '«Чистый Соблазн»',
    desc: 'Белоснежный открытый бра с кольцами и микро-стринги',
    category: 'Белье',
    peppers: 3,
    mainImg: 'wardrobe/b4.webp'
  },
  {
    id: 6,
    title: '«Атласные Ленты & Повязка»',
    desc: 'Для ограничения зрения и депривации чувств во время сессии',
    category: 'Игрушки',
    peppers: 1,
    mainImg: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'
  }
];

let wardrobeFilterCat = 'Белье';
let selectedWardrobeIds = JSON.parse(localStorage.getItem('pact_selected_wardrobe_ids')) || [1, 2];

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
    banner.innerHTML = `
      <div>
        <div style="font-size: 9px; font-weight: 800; color: #FF8566; text-transform: uppercase;">Текущий образ:</div>
        <div style="font-size: 13px; font-weight: 800; color: #fff;">${passion.title}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12.5px; font-weight: 900; color: #FFB703;">${passion.total} 🌶️</div>
        <div style="font-size: 9px; color: var(--text-muted);">${passion.countItems} предмет(ов)</div>
      </div>
    `;
  }

  const container = document.getElementById('wardrobe-items-list');
  if (!container) return;

  const filtered = wardrobeItems.filter(item => item.category === wardrobeFilterCat);

  if (filtered.length === 0) {
    const emptyMsg = wardrobeFilterCat === 'Белье' 
      ? 'В гардеробе пока нет белья.<br>Выбери комплект в <b>Бутике</b> за 💜 и 🖤 🛍️' 
      : 'В гардеробе пока нет девайсов.<br>Загляни в <b>Секс-шоп</b> за ❤️ 💋';
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11.5px; padding: 45px 15px; line-height: 1.5;">${emptyMsg}</div>`;
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
   11. ЭКРАН «БАЛАНС» С РОЛЕВЫМ РАЗДЕЛЕНИЕМ
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

  slot.innerHTML = list.map(c => `
    <button class="bank-curr-pill ${c.code === rewardCurrency ? 'active' : ''}" onclick="selectRewardCurrency('${c.code}')">${c.label}</button>
  `).join('');
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
  if (btn) btn.innerText = `➕ Начислить ${amt} ${getHeartByCurrency(rewardCurrency)}`;
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
  showToast(`✨ Начислено ${amt} ${getHeartByCurrency(rewardCurrency)} (${reason})!`, 'success');

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

  slot.innerHTML = list.map(c => `
    <button class="bank-curr-pill ${c.code === penaltyCurrency ? 'active' : ''}" onclick="selectPenaltyCurrency('${c.code}')">${c.label}</button>
  `).join('');
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
  if (btn) btn.innerText = `➖ Списать штраф ${amt} ${getHeartByCurrency(penaltyCurrency)}`;
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
  showToast(`⚡ Списан штраф: ${amt} ${getHeartByCurrency(penaltyCurrency)} (${reason})!`, 'penalty');

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
    ? `💌 Перевести ${amt} ❤️ Верхнему`
    : `💌 Отправить ${amt} ❤️ Нижней`;
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
      showToast(`У Нижней недостаточно ❤️! Доступно: ${femaleBalances.stc}`, 'error');
      return;
    }

    femaleBalances.stc -= amount;
    maleBalances.stc += amount;
    if (!note) note = 'Дань Верхнему 💋';
  } else {
    if (maleBalances.stc < amount) {
      showToast(`У Верхнего недостаточно ❤️! Доступно: ${maleBalances.stc}`, 'error');
      return;
    }

    maleBalances.stc -= amount;
    femaleBalances.stc += amount;
    if (!note) note = 'Подарок Нижней на желания 🔥';
  }

  localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));
  localStorage.setItem('pact_male_balances', JSON.stringify(maleBalances));

  const dirText = transferDirection === 'f2m' ? 'Нижняя ➔ Верхний' : 'Верхний ➔ Нижняя';
  logTransaction('reward', transferDirection === 'f2m' ? 'male' : 'female', 'STC', amount, `Перевод (${dirText}): ${note} 💌`);

  if (noteInput) noteInput.value = '';
  updateRoleUI();
  renderDesktop();
  renderBankScreen();
  renderShopBalance();
  showToast(`💌 Переведено ${amount} ❤️ (${dirText})!`, 'success');
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
    showToast(`Недостаточно средств на балансе ${getHeartByCurrency(fromCurr)}! У вас: ${femaleBalances[fromKey]}`, 'error');
    return;
  }

  femaleBalances[fromKey] -= fromAmount;
  femaleBalances[toKey] += toAmount;
  localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));

  logTransaction('reward', 'female', toCurr, toAmount, `Обмен ${fromAmount} ${getHeartByCurrency(fromCurr)} ➔ ${toAmount} ${getHeartByCurrency(toCurr)} 🔄`);

  updateRoleUI();
  renderDesktop();
  renderBankScreen();
  renderShopBalance();
  showToast(`🔄 Успешно обменяно ${fromAmount} ${getHeartByCurrency(fromCurr)} на ${toAmount} ${getHeartByCurrency(toCurr)}!`, 'success');
}

function logTransaction(type, recipient, currency, amount, reason) {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}, ${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth()+1).padStart(2, '0')}`;
  transactionsLog.unshift({ id: Date.now(), time: timeStr, type, recipient, currency, amount, reason });
  if (transactionsLog.length > 50) transactionsLog.pop();
  localStorage.setItem('pact_transactions_log', JSON.stringify(transactionsLog));
}

function renderBankHistory() {
  const slot = document.getElementById('bank-history-items-slot');
  if (!slot) return;

  if (transactionsLog.length === 0) {
    slot.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 25px 10px;">История операций пуста.</div>`;
    return;
  }

  slot.innerHTML = transactionsLog.map(t => {
    const isReward = t.type === 'reward';
    const sign = isReward ? '+' : '−';
    const icon = isReward ? '➕' : '➖';
    const targetName = t.recipient === 'female' ? 'Нижняя' : 'Верхний';
    return `
      <div class="bank-history-item">
        <div class="bank-hist-left">
          <div class="bank-hist-badge ${t.type}">${icon}</div>
          <div style="overflow: hidden;">
            <div class="bank-hist-reason">${t.reason}</div>
            <div class="bank-hist-meta">${targetName} • ${t.time}</div>
          </div>
        </div>
        <div class="bank-hist-val ${t.type}">${sign}${t.amount} ${getHeartByCurrency(t.currency)}</div>
      </div>
    `;
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

  if (currentRole === 'female') {
    boxFemale?.classList.add('is-active-role');
    boxMale?.classList.remove('is-active-role');
    if (titleFemale) titleFemale.innerHTML = `🗝️ Нижняя <span class="role-active-indicator">(Ты)</span>`;
    if (titleMale) titleMale.innerHTML = `👑 Верхний`;

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
    if (titleMale) titleMale.innerHTML = `👑 Верхний <span class="role-active-indicator">(Ты)</span>`;
    if (titleFemale) titleFemale.innerHTML = `🗝️ Нижняя`;

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
   12. МОДАЛКА КОНВЕРТЕРА ВАЛЮТ
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
  if (currentRole === 'female') {
    bView.innerHTML = `
      <span>💜 <b>${femaleBalances.ptc}</b></span>
      <span>🖤 <b>${femaleBalances.otc}</b></span>
      <span>❤️ <b>${femaleBalances.stc}</b></span>
    `;
  } else {
    bView.innerHTML = `
      <span>💙 <b>${maleBalances.atc}</b></span>
      <span>💚 <b>${maleBalances.ctc}</b></span>
      <span>❤️ <b>${maleBalances.stc}</b></span>
    `;
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
  if (currentRole !== 'female') {
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
    showToast(`Недостаточно средств на балансе ${getHeartByCurrency(fromCurr)}! У вас: ${femaleBalances[fromKey]}`, 'error');
    return;
  }

  femaleBalances[fromKey] -= fromAmount;
  femaleBalances[toKey] += toAmount;
  localStorage.setItem('pact_female_balances', JSON.stringify(femaleBalances));

  updateRoleUI();
  updateConverterUI();
  renderDesktop();
  renderShopBalance();
  showToast(`🔄 Успешно обменяно ${fromAmount} ${getHeartByCurrency(fromCurr)} на ${toAmount} ${getHeartByCurrency(toCurr)}!`, 'success');
}

/* ========================================================
   13. СТАРТ ПРИЛОЖЕНИЯ
   ======================================================== */
window.addEventListener('DOMContentLoaded', () => {
  initSavedWallpaper();
  updateRoleUI();
  renderDesktop();
  renderWardrobe();
  renderProducts();
  renderBankScreen();
  initSwipeGestures();
});
