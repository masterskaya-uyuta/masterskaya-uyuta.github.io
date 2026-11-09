/**
 * Логика и интерактивность сайта «Мастерская Уюта»
 * Кировград — Невьянск | Мебель из ЛДСП и профильной трубы
 */

document.addEventListener("DOMContentLoaded", () => {
  // Загрузка пользовательских настроек из Панели Управления (если были сохранены локально)
  try {
    const customCfg = localStorage.getItem("masterskaya_custom_config");
    if (customCfg && typeof SITE_CONFIG !== "undefined") {
      Object.assign(SITE_CONFIG, JSON.parse(customCfg));
    }
    const customProds = localStorage.getItem("masterskaya_custom_products");
    if (customProds && typeof PRODUCTS !== "undefined") {
      PRODUCTS = JSON.parse(customProds);
    }
  } catch (err) {
    console.warn("Custom config load info:", err);
  }

  // Инициализация данных сайта из SITE_CONFIG
  initSiteInfo();
  // Отрисовка примеров изделий
  renderCatalog("all");
  // Инициализация фильтров и поиска
  initFilters();
  // Инициализация калькулятора эскизов
  initCalculator();
  // Инициализация блока «Всё, что важно знать перед заказом»
  initFaq();
  // Инициализация мобильного меню
  initMobileNav();
  // Инициализация модальных окон
  initModals();
});

// Глобальное состояние модалки галереи
let currentProduct = null;
let currentImageIndex = 0;

/**
 * Заполнение данных компании из SITE_CONFIG
 */
function initSiteInfo() {
  if (typeof SITE_CONFIG === "undefined") return;

  // Текстовые вставки
  document.querySelectorAll("[data-config-brand]").forEach(el => el.textContent = SITE_CONFIG.brandName);
  document.querySelectorAll("[data-config-tagline]").forEach(el => el.textContent = SITE_CONFIG.tagline);
  document.querySelectorAll("[data-config-location]").forEach(el => el.textContent = SITE_CONFIG.location);
  document.querySelectorAll("[data-config-coverage]").forEach(el => el.textContent = SITE_CONFIG.coverage);
  document.querySelectorAll("[data-config-phone]").forEach(el => el.textContent = SITE_CONFIG.phone);
  document.querySelectorAll("[data-config-hours]").forEach(el => el.textContent = SITE_CONFIG.workingHours);
  document.querySelectorAll("[data-config-guarantee]").forEach(el => el.textContent = SITE_CONFIG.guarantee);

  // Ссылки
  document.querySelectorAll("[data-config-phone-link]").forEach(el => el.href = SITE_CONFIG.phoneLink);
  document.querySelectorAll("[data-config-avito-link]").forEach(el => el.href = SITE_CONFIG.avitoUrl);

  // Обработчики кнопок MAX
  document.querySelectorAll(".btn-trigger-max").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openMaxModal();
    });
  });

  // Кнопка копирования номера в модалке MAX
  const copyBtn = document.getElementById("copy-phone-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(SITE_CONFIG.phoneRaw || "79634487612").then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `✓ Скопировано`;
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
        }, 2000);
      }).catch(() => {
        alert("Номер для связи в MAX: " + SITE_CONFIG.phone);
      });
    });
  }
}

/**
 * Отрисовка карточек с примерами изделий
 */
function renderCatalog(filterCategory = "all", searchQuery = "") {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = PRODUCTS.filter(p => {
    const matchCategory = (filterCategory === "all") || (p.category === filterCategory);
    const matchSearch = !normalizedQuery || 
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.shortDesc.toLowerCase().includes(normalizedQuery) ||
      p.categoryName.toLowerCase().includes(normalizedQuery);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 2.5rem; margin-bottom: 16px;">🔍</div>
        <h3 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 8px;">Ничего не найдено</h3>
        <p style="color: var(--text-muted); margin-bottom: 20px;">Попробуйте изменить поисковый запрос или напишите мастеру ваш запрос</p>
        <button class="btn btn-outline btn-sm" onclick="resetFilters()">Сбросить фильтр</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const photosCount = product.images.length;
    const badgeClass = product.category === "metal" ? "badge-metal" : "badge-wood";
    const mainImg = product.images[0];

    return `
      <article class="product-card" data-id="${product.id}">
        <div class="product-media" onclick="openProductModal('${product.id}')">
          <img src="${mainImg}" alt="${escapeHtml(product.title)}" loading="lazy">
          <div class="product-badge-overlay">
            <span class="badge ${badgeClass}">${escapeHtml(product.badge)}</span>
          </div>
          <div class="product-photos-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            ${photosCount} ${getPhotoDeclension(photosCount)}
          </div>
          <div class="product-zoom-hint">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Все фото изделия
            </span>
          </div>
        </div>

        <div class="product-content">
          <div class="product-category-tag">${escapeHtml(product.categoryName)}</div>
          <h3 class="product-title">${escapeHtml(product.title)}</h3>
          <p class="product-desc">${escapeHtml(product.shortDesc)}</p>

          <div class="product-custom-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            <span>Любая модификация по вашим габаритам и эскизам</span>
          </div>

          <div class="product-footer">
            <div class="product-price">
              <span class="product-price-label">Ориентир цены:</span>
              <div class="product-price-val"><span>от </span>${product.priceFrom} ₽</div>
            </div>

            <div class="product-actions">
              <button class="btn btn-outline btn-sm" onclick="openProductModal('${product.id}')" title="Смотреть подробнее и фото">
                Подробнее
              </button>
              <button class="btn btn-max btn-sm" onclick="contactForProduct('${product.id}', 'max')" title="Написать в MAX">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                В MAX
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function getPhotoDeclension(count) {
  if (count === 1) return "фото";
  if (count >= 2 && count <= 4) return "фото";
  return "фото";
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

/**
 * Инициализация фильтров примеров изделий
 */
function initFilters() {
  const tabs = document.querySelectorAll(".filter-btn");
  const searchInput = document.getElementById("catalog-search-input");

  let currentCategory = "all";

  // Подсчет количества примеров для бейджей
  const countAll = PRODUCTS.length;
  const countMetal = PRODUCTS.filter(p => p.category === "metal").length;
  const countLdsp = PRODUCTS.filter(p => p.category === "ldsp").length;

  const countAllEl = document.getElementById("count-all");
  const countMetalEl = document.getElementById("count-metal");
  const countLdspEl = document.getElementById("count-ldsp");

  if (countAllEl) countAllEl.textContent = countAll;
  if (countMetalEl) countMetalEl.textContent = countMetal;
  if (countLdspEl) countLdspEl.textContent = countLdsp;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentCategory = tab.getAttribute("data-category");
      renderCatalog(currentCategory, searchInput ? searchInput.value : "");
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      renderCatalog(currentCategory, e.target.value);
    });
  }
}

function resetFilters() {
  const tabs = document.querySelectorAll(".filter-btn");
  tabs.forEach(t => t.classList.remove("active"));
  const allTab = document.querySelector('.filter-btn[data-category="all"]');
  if (allTab) allTab.classList.add("active");

  const searchInput = document.getElementById("catalog-search-input");
  if (searchInput) searchInput.value = "";

  renderCatalog("all", "");
}

/**
 * Модальное окно просмотра изделия и галереи
 */
function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  currentProduct = product;
  currentImageIndex = 0;

  const modal = document.getElementById("product-modal");
  if (!modal) return;

  // Заполнение информации
  document.getElementById("modal-category").textContent = product.categoryName;
  document.getElementById("modal-badge").textContent = product.badge;
  document.getElementById("modal-title").textContent = product.title;
  document.getElementById("modal-price").textContent = "от " + product.priceFrom + " ₽";
  document.getElementById("modal-desc").textContent = product.fullDesc;

  // Заполнение характеристик
  const specsTbody = document.getElementById("modal-specs-tbody");
  if (specsTbody) {
    specsTbody.innerHTML = product.specs.map(s => `
      <tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.value)}</td>
      </tr>
    `).join("");
  }

  // Обновление галереи
  updateModalGallery();

  // Настройка кнопок заказа
  const maxBtn = document.getElementById("modal-btn-max");
  const avitoBtn = document.getElementById("modal-btn-avito");

  if (maxBtn) {
    maxBtn.onclick = () => contactForProduct(product.id, "max");
  }
  if (avitoBtn) {
    avitoBtn.onclick = () => {
      window.open(SITE_CONFIG.avitoUrl, "_blank");
    };
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateModalGallery() {
  if (!currentProduct) return;

  const mainImg = document.getElementById("modal-main-img");
  const thumbsContainer = document.getElementById("modal-thumbs");
  const prevBtn = document.getElementById("gallery-prev-btn");
  const nextBtn = document.getElementById("gallery-next-btn");

  const images = currentProduct.images;

  if (mainImg) {
    mainImg.src = images[currentImageIndex];
    mainImg.alt = currentProduct.title;
  }

  if (prevBtn && nextBtn) {
    if (images.length <= 1) {
      prevBtn.style.display = "none";
      nextBtn.style.display = "none";
    } else {
      prevBtn.style.display = "flex";
      nextBtn.style.display = "flex";
    }
  }

  if (thumbsContainer) {
    thumbsContainer.innerHTML = images.map((img, idx) => `
      <div class="modal-thumb ${idx === currentImageIndex ? 'active' : ''}" onclick="switchModalImage(${idx})">
        <img src="${img}" alt="Миниатюра ${idx + 1}">
      </div>
    `).join("");
  }
}

function switchModalImage(index) {
  if (!currentProduct) return;
  currentImageIndex = index;
  updateModalGallery();
}

function prevModalImage() {
  if (!currentProduct) return;
  currentImageIndex = (currentImageIndex - 1 + currentProduct.images.length) % currentProduct.images.length;
  updateModalGallery();
}

function nextModalImage() {
  if (!currentProduct) return;
  currentImageIndex = (currentImageIndex + 1) % currentProduct.images.length;
  updateModalGallery();
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    currentProduct = null;
  }
}

/**
 * Модалка мессенджера MAX
 */
function openMaxModal(customText = "") {
  const modal = document.getElementById("max-modal");
  if (!modal) return;

  const msgHint = document.getElementById("max-custom-msg-hint");
  if (msgHint) {
    if (customText) {
      msgHint.style.display = "block";
      msgHint.textContent = `Текст вашего запроса: «${customText}»`;
    } else {
      msgHint.style.display = "none";
    }
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeMaxModal() {
  const modal = document.getElementById("max-modal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

/**
 * Общая обработка модалок
 */
function initModals() {
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeProductModal();
        closeMaxModal();
      }
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProductModal();
      closeMaxModal();
    } else if (e.key === "ArrowLeft") {
      prevModalImage();
    } else if (e.key === "ArrowRight") {
      nextModalImage();
    }
  });
}

/**
 * Обработка заявки по конкретному изделию
 */
function contactForProduct(productId, channel = "max") {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const message = `Интересует изделие «${product.title}» (ориентир цены ${product.priceFrom} ₽). Нужен расчет под мои размеры или эскиз.`;

  if (channel === "max") {
    openMaxModal(message);
  } else if (channel === "avito") {
    window.open(SITE_CONFIG.avitoUrl, "_blank");
  }
}

/**
 * Интерактивный калькулятор эскизов под свои размеры
 */
function initCalculator() {
  const typeSelect = document.getElementById("calc-type");
  const widthInput = document.getElementById("calc-width");
  const heightInput = document.getElementById("calc-height");
  const depthInput = document.getElementById("calc-depth");
  const materialSelect = document.getElementById("calc-material");

  const btnMax = document.getElementById("calc-btn-max");
  const btnAvito = document.getElementById("calc-btn-avito");

  function buildMessage() {
    const type = typeSelect ? typeSelect.value : "Изделие по эскизу";
    const w = widthInput && widthInput.value ? widthInput.value : "стандарт";
    const h = heightInput && heightInput.value ? heightInput.value : "стандарт";
    const d = depthInput && depthInput.value ? depthInput.value : "стандарт";
    const mat = materialSelect ? materialSelect.value : "По рекомендации мастера";

    return `Расчет изделия по эскизу:
- Вид изделия: ${type}
- Габариты (Ш х В х Г): ${w} х ${h} х ${d} мм
- Материал/пожелания: ${mat}`;
  }

  if (btnMax) {
    btnMax.addEventListener("click", () => {
      const msg = buildMessage();
      openMaxModal(msg);
    });
  }

  if (btnAvito) {
    btnAvito.addEventListener("click", () => {
      window.open(SITE_CONFIG.avitoUrl, "_blank");
    });
  }
}

/**
 * Аккордеон блока «Всё, что важно знать перед заказом»
 */
function initFaq() {
  document.querySelectorAll(".faq-item").forEach(item => {
    const questionBtn = item.querySelector(".faq-question");
    if (!questionBtn) return;

    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("active"));
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/**
 * Мобильное навигационное меню
 */
function initMobileNav() {
  const toggleBtn = document.getElementById("mobile-menu-toggle");
  const overlay = document.getElementById("mobile-nav-overlay");
  const drawer = document.getElementById("mobile-nav-drawer");
  const closeBtn = document.getElementById("mobile-nav-close");

  function openMenu() {
    if (overlay) overlay.classList.add("active");
    if (drawer) drawer.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (overlay) overlay.classList.remove("active");
    if (drawer) drawer.classList.remove("active");
    document.body.style.overflow = "";
  }

  if (toggleBtn) toggleBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (overlay) overlay.addEventListener("click", closeMenu);

  document.querySelectorAll(".mobile-nav-links a").forEach(a => {
    a.addEventListener("click", closeMenu);
  });
}
