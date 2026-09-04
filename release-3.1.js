(() => {
  'use strict';

  const RELEASE_VERSION = '3.1-beta.1';
  const ATTRIBUTION_KEY = 'ka_attribution_v1';
  const METRICS_KEY = 'ka_session_metrics_v1';
  const TRUSTED_STATUSES = new Set(['reviewed', 'cooked', 'approved']);
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const P0_TELEMETRY_SCRIPT = `p0-telemetry.js?v=${RELEASE_VERSION}-p0a2`;

  function safeParse(raw, fallback = null) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function catalogStats() {
    const recipes = Array.isArray(window.RECIPES) ? window.RECIPES : [];
    const trusted = recipes.filter(recipe => TRUSTED_STATUSES.has(recipe.editorial?.status)).length;
    return { total: recipes.length, trusted, draft: recipes.filter(recipe => recipe.editorial?.status === 'draft').length };
  }

  function kitchenState() {
    const stored = safeParse(localStorage.getItem('ka_kitchen_v4'), null) || safeParse(localStorage.getItem('ka_kitchen_v3'), null) || {};
    return {
      selected: new Set(Array.isArray(stored.selected) ? stored.selected : []),
      pantry: new Set(Array.isArray(stored.pantry) ? stored.pantry : [])
    };
  }

  function directMatchNames(recipe) {
    const { selected, pantry } = kitchenState();
    const names = [];
    for (const ingredient of recipe?.ingredients || []) {
      if (!selected.has(ingredient.id) && !pantry.has(ingredient.id)) continue;
      const item = [...(window.INGREDIENTS || []), ...(window.PANTRY_INGREDIENTS || [])].find(candidate => candidate.id === ingredient.id);
      if (item?.name && !names.includes(item.name)) names.push(item.name);
    }
    return names;
  }

  function captureAttribution() {
    const params = new URLSearchParams(location.search);
    const current = safeParse(localStorage.getItem(ATTRIBUTION_KEY), {}) || {};
    let changed = false;
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (!value) continue;
      current[key] = value.slice(0, 160);
      changed = true;
    }
    if (changed) {
      current.firstSeenAt ||= new Date().toISOString();
      current.lastSeenAt = new Date().toISOString();
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
    }
  }

  function sessionMetrics() {
    return safeParse(sessionStorage.getItem(METRICS_KEY), { searches: 0, recipeOpens: 0, trustedRecipeOpens: 0, draftRecipeOpens: 0 }) || { searches: 0, recipeOpens: 0, trustedRecipeOpens: 0, draftRecipeOpens: 0 };
  }

  function bumpMetric(name) {
    const metrics = sessionMetrics();
    metrics[name] = Number(metrics[name] || 0) + 1;
    sessionStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  }

  function renderCatalogPanel() {
    const hero = document.querySelector('.hero-v4');
    if (!hero || document.querySelector('.catalog-state-panel')) return;
    const stats = catalogStats();
    const panel = document.createElement('section');
    panel.className = 'catalog-state-panel';
    panel.setAttribute('aria-label', 'Состояние каталога рецептов');
    panel.innerHTML = `
      <div class="catalog-state-item catalog-state-trusted"><span class="catalog-state-icon">✓</span><div><strong>${stats.trusted} рецептов прошли редакционную проверку</strong><span>Они показываются первыми в результатах.</span></div></div>
      <div class="catalog-state-item catalog-state-draft"><span class="catalog-state-icon">◌</span><div><strong>${stats.draft} рецептов пока черновые</strong><span>Они доступны отдельно как экспериментальные варианты и не маскируются под проверенные.</span></div></div>`;
    hero.insertAdjacentElement('afterend', panel);
  }

  function recipeByCard(card) {
    const id = card.querySelector('.open-recipe')?.dataset.id || card.querySelector('.favorite-toggle')?.dataset.id;
    return (window.RECIPES || []).find(recipe => recipe.id === id) || null;
  }

  function trustLabel(recipe) {
    const status = recipe?.editorial?.status || 'draft';
    if (status === 'approved') return { strong: 'Утверждённый рецепт', note: 'Фактическое приготовление и итоговая проверка подтверждены.' };
    if (status === 'cooked') return { strong: 'Приготовлен по текущей версии', note: 'Фактическая готовка подтверждена; итоговое утверждение ещё впереди.' };
    if (status === 'reviewed') return { strong: 'Проверен редакционно', note: 'Структура и безопасность проверены; фактическая готовка ещё не подтверждена.' };
    return { strong: 'Экспериментальный рецепт', note: 'Черновик ещё требует редакционной и фактической проверки.' };
  }

  function enhanceResultCard(card, recipe) {
    if (!recipe || card.dataset.trustEnhanced === RELEASE_VERSION) return;
    const trusted = TRUSTED_STATUSES.has(recipe.editorial?.status);
    const label = trustLabel(recipe);
    card.dataset.trust = trusted ? 'trusted' : 'draft';
    card.dataset.trustEnhanced = RELEASE_VERSION;

    const titleRow = card.querySelector('.recipe-title-row');
    if (titleRow && !card.querySelector('.trust-line')) {
      titleRow.insertAdjacentHTML('afterend', `<p class="trust-line ${trusted ? 'trust-line-good' : 'trust-line-draft'}"><strong>${escapeHtml(label.strong)}.</strong> ${escapeHtml(label.note)}</p>`);
    }

    const reasons = card.querySelector('.reasons');
    if (reasons && !card.querySelector('.why-fit-box')) {
      const direct = directMatchNames(recipe);
      const text = direct.length
        ? `Из выбранного у вас напрямую используются: ${direct.slice(0, 6).map(escapeHtml).join(', ')}${direct.length > 6 ? ` и ещё ${direct.length - 6}` : ''}.`
        : 'Ниже показаны причины, по которым этот вариант попал в выдачу.';
      reasons.insertAdjacentHTML('beforebegin', `<div class="why-fit-box"><strong>Почему подходит</strong><span>${text}</span></div>`);
    }
  }

  const resultsList = document.getElementById('resultsList');
  let resultsObserver = null;
  let resultsProcessing = false;

  function observeResults() {
    if (!resultsList) return;
    resultsObserver = new MutationObserver(() => window.requestAnimationFrame(enhanceResults));
    resultsObserver.observe(resultsList, { childList: true });
  }

  function enhanceResults() {
    if (!resultsList || resultsProcessing) return;
    resultsProcessing = true;
    resultsObserver?.disconnect();
    try {
      const initialCards = [...resultsList.querySelectorAll('article.result-card')];
      if (!initialCards.length) {
        const empty = resultsList.querySelector('.empty-state');
        if (empty && !empty.querySelector('.catalog-limit-note')) {
          const stats = catalogStats();
          empty.insertAdjacentHTML('afterbegin', `<p class="catalog-limit-note"><strong>Важно:</strong> отсутствие результата может означать только то, что подходящего блюда пока нет в текущем каталоге из ${stats.total} рецептов. Это не означает, что из ваших продуктов в принципе нечего приготовить.</p>`);
        }
        return;
      }

      if (resultsList.querySelector('.catalog-trust-summary') && initialCards.every(card => card.dataset.trustEnhanced === RELEASE_VERSION)) return;

      const previousExperimental = resultsList.querySelector('.experimental-results');
      if (previousExperimental) {
        [...previousExperimental.querySelectorAll('article.result-card')].forEach(card => resultsList.appendChild(card));
        previousExperimental.remove();
      }
      resultsList.querySelector('.catalog-trust-summary')?.remove();

      const cards = [...resultsList.querySelectorAll('article.result-card')];
      cards.forEach(card => enhanceResultCard(card, recipeByCard(card)));
      const trustedCards = cards.filter(card => card.dataset.trust === 'trusted');
      const draftCards = cards.filter(card => card.dataset.trust === 'draft');
      const stats = catalogStats();

      const summary = document.createElement('div');
      summary.className = 'catalog-trust-summary';
      summary.innerHTML = `<strong>Сначала — более надёжные варианты.</strong><span>В текущей выдаче: ${trustedCards.length} редакционно проверенных и ${draftCards.length} экспериментальных. Весь каталог: ${stats.trusted} проверенных + ${stats.draft} черновых.</span>`;
      resultsList.prepend(summary);

      const firstTrusted = trustedCards.find(card => !card.classList.contains('near-card')) || trustedCards[0];
      if (firstTrusted && !firstTrusted.querySelector('.top-choice-label')) {
        firstTrusted.insertAdjacentHTML('afterbegin', '<span class="top-choice-label">Первый из проверенных вариантов</span>');
      }

      if (draftCards.length) {
        const details = document.createElement('details');
        details.className = 'experimental-results';
        details.open = trustedCards.length === 0;
        const summaryNode = document.createElement('summary');
        summaryNode.textContent = trustedCards.length
          ? `Экспериментальные рецепты (${draftCards.length})`
          : `Проверенного варианта пока нет — показать экспериментальные (${draftCards.length})`;
        const warning = document.createElement('p');
        warning.className = 'experimental-warning';
        warning.textContent = 'Эти рецепты находятся в статусе «Черновик». Используйте их только как тестовые варианты: фактическое приготовление ещё не подтверждено.';
        details.append(summaryNode, warning);
        draftCards.forEach(card => details.appendChild(card));
        resultsList.append(details);
      }
    } finally {
      resultsObserver?.observe(resultsList, { childList: true });
      resultsProcessing = false;
    }
  }

  const recipeCard = document.getElementById('recipeCard');
  let recipeProcessing = false;

  function enhanceRecipe() {
    if (!recipeCard || recipeProcessing) return;
    const panel = recipeCard.querySelector('.recipe-panel');
    if (!panel || panel.dataset.trustEnhanced === RELEASE_VERSION) return;
    recipeProcessing = true;
    try {
      const id = panel.querySelector('.favorite-toggle')?.dataset.id;
      const recipe = (window.RECIPES || []).find(item => item.id === id);
      if (!recipe) return;
      panel.dataset.trustEnhanced = RELEASE_VERSION;
      const trusted = TRUSTED_STATUSES.has(recipe.editorial?.status);
      const label = trustLabel(recipe);
      const meta = panel.querySelector('.meta');
      if (meta) meta.insertAdjacentHTML('afterend', `<div class="recipe-trust-panel ${trusted ? 'recipe-trust-good' : 'recipe-trust-draft'}"><strong>${escapeHtml(label.strong)}</strong><span>${escapeHtml(label.note)}</span></div>`);

      const availability = panel.querySelector('.availability-box');
      const direct = directMatchNames(recipe);
      if (availability && direct.length) {
        availability.insertAdjacentHTML('afterend', `<div class="recipe-fit-panel"><strong>Почему этот рецепт попал в подбор</strong><span>Из вашего текущего набора напрямую используются: ${direct.slice(0, 8).map(escapeHtml).join(', ')}${direct.length > 8 ? ` и ещё ${direct.length - 8}` : ''}.</span><small>Обязательные недостающие позиции, замены и ограничение по времени показаны отдельно выше и в списке ингредиентов.</small></div>`);
      }
    } finally {
      recipeProcessing = false;
    }
  }

  function attachAcquisitionSignals() {
    document.getElementById('searchForm')?.addEventListener('submit', () => bumpMetric('searches'));
    document.addEventListener('click', event => {
      const button = event.target.closest?.('.open-recipe');
      if (!button) return;
      bumpMetric('recipeOpens');
      const recipe = (window.RECIPES || []).find(item => item.id === button.dataset.id);
      bumpMetric(TRUSTED_STATUSES.has(recipe?.editorial?.status) ? 'trustedRecipeOpens' : 'draftRecipeOpens');
    });

    document.getElementById('feedbackForm')?.addEventListener('submit', () => {
      const textarea = document.getElementById('problemText');
      if (!textarea || textarea.value.includes('[Данные публичного теста]')) return;
      const attribution = safeParse(localStorage.getItem(ATTRIBUTION_KEY), {}) || {};
      const metrics = sessionMetrics();
      const source = UTM_KEYS
        .filter(key => attribution[key])
        .map(key => `${key.replace('utm_', '')}=${attribution[key]}`)
        .join(', ') || 'прямой/неизвестный';
      textarea.value = `${textarea.value}\n\n[Данные публичного теста]\nИсточник: ${source}\nСессия: подборов ${metrics.searches || 0}, открытий рецептов ${metrics.recipeOpens || 0}, из них проверенных ${metrics.trustedRecipeOpens || 0}, черновых ${metrics.draftRecipeOpens || 0}.`;
    }, true);
  }

  function initializeP0Telemetry() {
    const telemetry = window.KA_TELEMETRY;
    if (!telemetry) return;

    telemetry.start({
      appVersion: RELEASE_VERSION,
      endpoint: typeof window.KA_P0_EVENT_ENDPOINT === 'string' ? window.KA_P0_EVENT_ENDPOINT : ''
    });

    const pending = Array.isArray(window.KA_PENDING_PRODUCT_EVENTS)
      ? window.KA_PENDING_PRODUCT_EVENTS.splice(0, window.KA_PENDING_PRODUCT_EVENTS.length)
      : [];

    pending.forEach(item => {
      const accepted = telemetry.track(item?.eventName, item?.properties || {});
      if (!accepted) {
        if (!Array.isArray(window.KA_PENDING_PRODUCT_EVENTS)) window.KA_PENDING_PRODUCT_EVENTS = [];
        window.KA_PENDING_PRODUCT_EVENTS.push(item);
      }
    });
  }

  function loadP0Telemetry() {
    if (window.KA_TELEMETRY) {
      initializeP0Telemetry();
      return;
    }
    const script = document.createElement('script');
    script.src = P0_TELEMETRY_SCRIPT;
    script.async = true;
    script.addEventListener('load', initializeP0Telemetry, { once: true });
    script.addEventListener('error', () => { /* Аналитика не должна ломать приложение. */ }, { once: true });
    document.head.appendChild(script);
  }

  captureAttribution();
  renderCatalogPanel();
  attachAcquisitionSignals();
  observeResults();
  if (recipeCard) new MutationObserver(() => window.requestAnimationFrame(enhanceRecipe)).observe(recipeCard, { childList: true });
  loadP0Telemetry();
})();
