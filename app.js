(() => {
  'use strict';

  const BUILD_VERSION = '3.1-beta.1';
  const MAX_SERVINGS = 20;
  const STORAGE = {
    kitchen: 'ka_kitchen_v4',
    legacyKitchen: 'ka_kitchen_v3',
    settings: 'ka_settings_v4',
    favorites: 'ka_favorites',
    history: 'ka_history'
  };

  const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    pantryIngredients: new Set(),
    results: [],
    nearMatches: [],
    currentRecipe: null,
    currentEvaluation: null,
    currentStep: 0,
    timerId: null,
    remainingSeconds: 0,
    wakeLock: null,
    lastSessionCode: createSessionCode(),
    currentView: 'home',
    feedbackSource: 'general',
    lastDiagnostics: [],
    visibleResultCount: 6
  };

  const views = [...document.querySelectorAll('.view')];
  const chips = document.getElementById('ingredientChips');
  const search = document.getElementById('ingredientSearch');
  const clearIngredientSearch = document.getElementById('clearIngredientSearch');
  const addIngredientFromSearch = document.getElementById('addIngredientFromSearch');
  const ingredientSearchStatus = document.getElementById('ingredientSearchStatus');
  const categorySelect = document.getElementById('ingredientCategory');
  const selectedChips = document.getElementById('selectedChips');
  const selectedCount = document.getElementById('selectedCount');
  const pantryOptions = document.getElementById('pantryOptions');
  const resultContext = document.getElementById('resultContext');
  const resultsList = document.getElementById('resultsList');
  const recipeCard = document.getElementById('recipeCard');
  const cookingMode = document.getElementById('cookingMode');
  const favoritesList = document.getElementById('favoritesList');
  const feedbackDialog = document.getElementById('feedbackDialog');
  const homeButton = document.getElementById('homeButton');
  const emptyIngredientSearch = document.getElementById('emptyIngredientSearch');
  const excludeSelect = document.getElementById('excludeSelect');
  const excludedChips = document.getElementById('excludedChips');
  const testFeedbackButton = document.getElementById('testFeedbackButton');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const historyList = document.getElementById('historyList');
  const kitchenSaveStatus = document.getElementById('kitchenSaveStatus');
  const servingsInput = document.getElementById('servings');
  const servingsRange = document.getElementById('servingsRange');
  const servingsDisplay = document.getElementById('servingsDisplay');
  const servingsMessage = document.getElementById('servingsMessage');
  const decreaseServings = document.getElementById('decreaseServings');
  const increaseServings = document.getElementById('increaseServings');

  const allIngredients = [
    ...window.INGREDIENTS,
    ...window.PANTRY_INGREDIENTS.map(item => ({ ...item, category: 'pantry', aliases: [] }))
  ];
  const { normalizeSearchText, rankIngredientMatches, uniqueExactMatch } = window.SEARCH_UTILS;

  const STEP_REFINEMENTS = {
    buckwheat_chicken: {
      0: 'Промойте гречку. Лук нарежьте мелкими кубиками 5–7 мм, морковь — тонкой соломкой или натрите крупно. Куриное филе нарежьте отдельно кубиками 2–3 см.'
    },
    chicken_rice: {
      0: 'Промойте рис. Лук нарежьте мелкими кубиками 5–7 мм, морковь — тонкой соломкой или натрите крупно. Куриное филе нарежьте кубиками 2–3 см.'
    },
    chicken_potato: {
      0: 'Картофель нарежьте кубиками примерно 3 см, лук — полукольцами толщиной около 5 мм. Куриные бёдра промокните бумажным полотенцем.'
    },
    beef_potato_stew: {
      0: 'Говядину нарежьте кубиками 2–3 см, картофель — кубиками 3–4 см, лук — кубиками около 1 см, морковь — полукружьями толщиной 4–5 мм.'
    },
    lamb_rice: {
      0: 'Промойте рис. Баранину нарежьте кубиками 2–3 см, лук — полукольцами около 5 мм, морковь — соломкой толщиной 4–5 мм.'
    },
    pasta_minced_beef: {
      0: 'Поставьте воду для макарон. Лук нарежьте мелкими кубиками 5–7 мм, помидоры — кубиками примерно 1,5–2 см.'
    },
    cabbage_minced: {
      0: 'Капусту нашинкуйте полосками шириной 5–7 мм. Лук нарежьте мелкими кубиками, морковь — тонкой соломкой или натрите крупно.'
    },
    omelet_cheese: {
      0: 'Помидор нарежьте тонкими ломтиками около 5 мм, сыр натрите на крупной тёрке.'
    },
    omelet_sausage: {
      0: 'Колбасу нарежьте кубиками или короткими полосками около 1 см. Если используете помидор, нарежьте его кубиками 1–1,5 см.'
    },
    potato_eggs: {
      0: 'Картофель нарежьте одинаковыми кубиками примерно 1,5–2 см, чтобы он приготовился равномерно.'
    },
    lentil_soup: {
      0: 'Переберите и промойте чечевицу. Картофель нарежьте кубиками 1,5–2 см, лук — мелкими кубиками, морковь — тонкими полукружьями или натрите крупно.'
    },
    rice_vegetables: {
      1: 'Лук нарежьте мелкими кубиками 5–7 мм, морковь и сладкий перец — кубиками или короткой соломкой примерно такой же толщины.'
    },
    beans_tomato: {
      1: 'Лук нарежьте мелкими кубиками 5–7 мм, помидоры — кубиками 1,5–2 см. При наличии чеснок мелко порубите.'
    },
    hot_sandwich: {
      0: 'Помидор нарежьте кружками около 5 мм. Сыр нарежьте тонкими ломтиками 3–4 мм или натрите крупно. При наличии тонко смажьте хлеб сливочным маслом.'
    },
    cucumber_yogurt_salad: {
      0: 'Огурцы вымойте и нарежьте тонкими кружками или полукружьями толщиной 3–4 мм.'
    },
    zucchini_eggs: {
      0: 'Кабачок нарежьте кубиками примерно 1,5 см. При наличии лук нарежьте мелкими кубиками 5–7 мм.'
    },
    eggplant_tomato: {
      0: 'Баклажаны нарежьте кубиками примерно 2 см, помидоры — кубиками 1,5–2 см, лук — мелкими кубиками. При наличии чеснок мелко порубите.'
    },
    mushrooms_potato: {
      0: 'Картофель нарежьте брусочками толщиной 7–10 мм или кубиками 1,5–2 см, шампиньоны — пластинками около 5 мм, лук — тонкими полукольцами.'
    }
  };

  function createSessionCode() {
    const day = new Date().toISOString().slice(5, 10).replace('-', '');
    return `KA-${day}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function safeStorageArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  }

  function safeStorageObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  function trackProductEvent(eventName, properties = {}) {
    try {
      const accepted = window.KA_TELEMETRY?.track?.(eventName, properties);
      if (accepted) return;
      if (!Array.isArray(window.KA_PENDING_PRODUCT_EVENTS)) window.KA_PENDING_PRODUCT_EVENTS = [];
      window.KA_PENDING_PRODUCT_EVENTS.push({ eventName, properties });
      if (window.KA_PENDING_PRODUCT_EVENTS.length > 100) window.KA_PENDING_PRODUCT_EVENTS.shift();
    } catch {
      /* Аналитика не должна влиять на основную продуктовую логику. */
    }
  }

  function searchEventContext(settings = getSettings()) {
    return {
      selected_count: state.selectedIngredients.size,
      max_time: settings.maxTime,
      servings: settings.servings,
      mode: settings.shoppingMode,
      difficulty: settings.difficulty
    };
  }

  function saveKitchen() {
    const kitchen = {
      selected: [...state.selectedIngredients],
      excluded: [...state.excludedIngredients],
      pantry: [...state.pantryIngredients]
    };
    localStorage.setItem(STORAGE.kitchen, JSON.stringify(kitchen));
    if (kitchenSaveStatus) {
      kitchenSaveStatus.textContent = 'Моя кухня сохранена на этом устройстве.';
      window.clearTimeout(saveKitchen.statusTimer);
      saveKitchen.statusTimer = window.setTimeout(() => {
        kitchenSaveStatus.textContent = 'Выбор сохраняется только на этом устройстве.';
      }, 1600);
    }
  }

  function restoreKitchen() {
    const kitchen = safeStorageObject(STORAGE.kitchen) || safeStorageObject(STORAGE.legacyKitchen);
    if (!kitchen) return;
    const validIngredients = new Set(window.INGREDIENTS.map(item => item.id));
    const validPantry = new Set(window.PANTRY_INGREDIENTS.map(item => item.id));
    state.selectedIngredients = new Set((kitchen.selected || []).filter(id => validIngredients.has(id)));
    state.excludedIngredients = new Set((kitchen.excluded || []).filter(id => validIngredients.has(id) && !state.selectedIngredients.has(id)));
    state.pantryIngredients = new Set((kitchen.pantry || []).filter(id => validPantry.has(id)));
  }

  function getSettings() {
    return {
      maxTime: Number(document.querySelector('input[name="maxTime"]:checked')?.value || 45),
      servings: clampServings(servingsInput.value || servingsRange.value),
      difficulty: document.getElementById('difficulty').value,
      shoppingMode: document.querySelector('input[name="shoppingMode"]:checked')?.value || 'strict',
      category: categorySelect.value || 'all'
    };
  }

  function saveSettings() {
    localStorage.setItem(STORAGE.settings, JSON.stringify(getSettings()));
  }

  function restoreSettings() {
    const settings = safeStorageObject(STORAGE.settings);
    if (!settings) {
      syncServings(3, false);
      return;
    }
    const timeRadio = document.querySelector(`input[name="maxTime"][value="${Number(settings.maxTime)}"]`);
    if (timeRadio) timeRadio.checked = true;
    const difficulty = document.getElementById('difficulty');
    if (['any', 'easy', 'medium'].includes(settings.difficulty)) difficulty.value = settings.difficulty;
    const modeRadio = document.querySelector(`input[name="shoppingMode"][value="${settings.shoppingMode}"]`);
    if (modeRadio) modeRadio.checked = true;
    syncServings(settings.servings || 3, false);
    if (settings.category && [...categorySelect.options].some(option => option.value === settings.category)) {
      categorySelect.value = settings.category;
    }
  }

  function clampServings(value) {
    const numeric = Math.round(Number(value));
    if (!Number.isFinite(numeric)) return 3;
    return Math.min(MAX_SERVINGS, Math.max(1, numeric));
  }

  function setServingsMessage(message = '', warning = false) {
    servingsMessage.textContent = message || 'Количество ингредиентов пересчитывается автоматически с бытовым округлением.';
    servingsMessage.classList.toggle('is-warning', warning);
  }

  function updateServingsButtons(servings) {
    decreaseServings.disabled = servings <= 1;
    increaseServings.disabled = servings >= MAX_SERVINGS;
  }

  function syncServings(value, persist = true) {
    const servings = clampServings(value);
    servingsInput.value = String(servings);
    servingsRange.value = String(servings);
    servingsDisplay.textContent = String(servings);
    updateServingsButtons(servings);
    setServingsMessage();
    if (persist) saveSettings();
    return servings;
  }

  function previewServingsInput() {
    const raw = servingsInput.value.trim();
    if (!raw) {
      servingsDisplay.textContent = '—';
      setServingsMessage('Введите число от 1 до 20.', true);
      return;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      setServingsMessage('Введите целое число от 1 до 20.', true);
      return;
    }
    if (numeric < 1 || numeric > MAX_SERVINGS) {
      servingsDisplay.textContent = String(Math.round(numeric));
      setServingsMessage(`Допустимо от 1 до ${MAX_SERVINGS} порций. Значение будет исправлено после подтверждения.`, true);
      return;
    }
    const servings = Math.round(numeric);
    servingsRange.value = String(servings);
    servingsDisplay.textContent = String(servings);
    updateServingsButtons(servings);
    setServingsMessage(`Выбрано: ${portionsLabel(servings)}.`);
    saveSettings();
  }

  function commitServingsInput() {
    const raw = servingsInput.value.trim();
    const numeric = Number(raw);
    const hadInvalidValue = !raw || !Number.isFinite(numeric) || numeric < 1 || numeric > MAX_SERVINGS;
    const servings = syncServings(hadInvalidValue ? (Number.isFinite(numeric) ? numeric : servingsRange.value) : numeric);
    if (hadInvalidValue) setServingsMessage(`Установлено допустимое значение: ${portionsLabel(servings)}.`, true);
    else setServingsMessage(`Выбрано: ${portionsLabel(servings)}.`);
    return servings;
  }

  function adjustServings(delta) {
    const current = clampServings(servingsInput.value || servingsRange.value);
    syncServings(current + delta);
    setServingsMessage(`Выбрано: ${portionsLabel(clampServings(current + delta))}.`);
  }

  function showView(name, pushHistory = true) {
    state.currentView = name;
    views.forEach(view => view.classList.toggle('active', view.id === `${name}View`));
    homeButton.classList.toggle('hidden', name === 'home');
    if (pushHistory) history.pushState({ view: name }, '', `#${name}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initializeHistory() {
    history.replaceState({ view: 'home' }, '', '#home');
    window.addEventListener('popstate', event => {
      const target = event.state?.view || 'home';
      if (target === 'results' && !state.results.length && !state.nearMatches.length) showView('home', false);
      else if (['recipe', 'cooking'].includes(target) && !state.currentRecipe) showView('home', false);
      else showView(target, false);
    });
  }

  function initializeCategories() {
    categorySelect.innerHTML = window.INGREDIENT_CATEGORIES
      .map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
      .join('');
  }

  function initializePantry() {
    pantryOptions.innerHTML = window.PANTRY_INGREDIENTS.map(item => `
      <label class="checkbox-option">
        <input type="checkbox" data-pantry-id="${item.id}" />
        ${escapeHtml(item.name)}
      </label>`).join('');

    pantryOptions.querySelectorAll('[data-pantry-id]').forEach(input => {
      input.addEventListener('change', () => {
        input.checked ? state.pantryIngredients.add(input.dataset.pantryId) : state.pantryIngredients.delete(input.dataset.pantryId);
        saveKitchen();
      });
    });
  }

  function applyPantryState() {
    if (!state.pantryIngredients.size && !safeStorageObject(STORAGE.kitchen) && !safeStorageObject(STORAGE.legacyKitchen)) {
      window.PANTRY_INGREDIENTS.filter(item => item.defaultChecked).forEach(item => state.pantryIngredients.add(item.id));
    }
    pantryOptions.querySelectorAll('[data-pantry-id]').forEach(input => {
      input.checked = state.pantryIngredients.has(input.dataset.pantryId);
    });
  }

  function initializeExclusions() {
    excludeSelect.innerHTML = '<option value="">Выберите продукт</option>' + window.INGREDIENTS
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
      .join('');

    document.getElementById('addExclusion').addEventListener('click', () => {
      const id = excludeSelect.value;
      if (!id) return;
      const wasSelected = state.selectedIngredients.has(id);
      state.excludedIngredients.add(id);
      state.selectedIngredients.delete(id);
      excludeSelect.value = '';
      renderIngredients();
      renderSelectedIngredients();
      renderExcludedIngredients();
      saveKitchen();
      if (wasSelected) trackProductEvent('ingredient_removed', { ingredient_id: id, selected_count: state.selectedIngredients.size, reason: 'excluded' });
    });
  }

  function renderExcludedIngredients() {
    const items = window.INGREDIENTS.filter(item => state.excludedIngredients.has(item.id));
    if (!items.length) {
      excludedChips.innerHTML = '<span class="muted">Исключений нет.</span>';
      return;
    }
    excludedChips.innerHTML = items.map(item => `
      <span class="selected-token">${escapeHtml(item.name)}
        <button type="button" data-include-id="${item.id}" aria-label="Убрать исключение ${escapeHtml(item.name)}">×</button>
      </span>`).join('');
    excludedChips.querySelectorAll('[data-include-id]').forEach(button => {
      button.addEventListener('click', () => {
        state.excludedIngredients.delete(button.dataset.includeId);
        renderExcludedIngredients();
        renderIngredients();
        saveKitchen();
      });
    });
  }

  function updateSearchClearButton() {
    clearIngredientSearch.classList.toggle('hidden', !search.value);
  }

  function setSearchStatus(message, kind = '') {
    ingredientSearchStatus.textContent = message;
    ingredientSearchStatus.classList.toggle('status-success', kind === 'success');
    ingredientSearchStatus.classList.toggle('status-warning', kind === 'warning');
  }

  function currentIngredientMatches() {
    const query = normalizeSearchText(search.value);
    const selectedCategory = categorySelect.value;
    if (query) return rankIngredientMatches(window.INGREDIENTS, query);
    return window.INGREDIENTS.filter(item => selectedCategory === 'all'
      ? true
      : selectedCategory === 'common'
        ? item.common
        : item.category === selectedCategory);
  }

  function clearSearchField({ focus = true } = {}) {
    search.value = '';
    updateSearchClearButton();
    renderIngredients();
    if (focus) search.focus({ preventScroll: true });
  }

  function addFromSearch() {
    const query = normalizeSearchText(search.value);
    if (!query) {
      setSearchStatus('Введите первые буквы или название продукта.', 'warning');
      search.focus({ preventScroll: true });
      return false;
    }
    const matches = currentIngredientMatches();
    const exact = uniqueExactMatch(matches, query);
    const candidate = exact || (matches.length === 1 ? matches[0] : null);
    if (!candidate) {
      setSearchStatus(matches.length
        ? `Найдено ${matches.length} варианта. Выберите нужный продукт из списка ниже.`
        : 'Ничего не найдено. Попробуйте другое название или синоним.', 'warning');
      return false;
    }
    if (!state.selectedIngredients.has(candidate.id)) toggleIngredient(candidate.id);
    clearSearchField({ focus: false });
    setSearchStatus(`${candidate.name} добавлен в выбранные продукты.`, 'success');
    return true;
  }

  function renderIngredients() {
    const query = normalizeSearchText(search.value);
    const matches = currentIngredientMatches();

    chips.innerHTML = '';
    matches.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chip ${state.selectedIngredients.has(item.id) ? 'selected' : ''}`;
      button.textContent = item.name;
      button.setAttribute('aria-pressed', state.selectedIngredients.has(item.id));
      button.addEventListener('click', () => {
        toggleIngredient(item.id);
        if (query) {
          clearSearchField({ focus: false });
          setSearchStatus(`${item.name} добавлен в выбранные продукты.`, 'success');
        }
      });
      chips.appendChild(button);
    });
    emptyIngredientSearch.classList.toggle('hidden', matches.length > 0);
    if (query) {
      if (!matches.length) setSearchStatus('Ничего не найдено. Попробуйте другое название или синоним.', 'warning');
      else if (matches.length === 1) setSearchStatus(`Найдено: ${matches[0].name}. Нажмите «Добавить» или Enter.`, 'success');
      else setSearchStatus(`Найдено ${matches.length} варианта. Выберите нужный продукт.`);
    } else if (!ingredientSearchStatus.classList.contains('status-success')) {
      setSearchStatus('Введите первые буквы или название продукта, затем выберите вариант.');
    }
    addIngredientFromSearch.disabled = !query || !matches.length;
    updateSearchClearButton();
  }

  function toggleIngredient(id) {
    const wasSelected = state.selectedIngredients.has(id);
    if (state.excludedIngredients.has(id)) {
      state.excludedIngredients.delete(id);
      state.selectedIngredients.add(id);
      renderExcludedIngredients();
    } else if (state.selectedIngredients.has(id)) {
      state.selectedIngredients.delete(id);
    } else {
      state.selectedIngredients.add(id);
    }
    const isSelected = state.selectedIngredients.has(id);
    renderIngredients();
    renderSelectedIngredients();
    saveKitchen();
    if (!wasSelected && isSelected) trackProductEvent('ingredient_added', { ingredient_id: id, selected_count: state.selectedIngredients.size });
    if (wasSelected && !isSelected) trackProductEvent('ingredient_removed', { ingredient_id: id, selected_count: state.selectedIngredients.size });
  }

  function renderSelectedIngredients() {
    const selected = window.INGREDIENTS.filter(item => state.selectedIngredients.has(item.id));
    selectedCount.textContent = String(selected.length);
    if (!selected.length) {
      selectedChips.innerHTML = '<span class="muted">Пока ничего не выбрано.</span>';
      return;
    }
    selectedChips.innerHTML = selected.map(item => `
      <span class="selected-token">${escapeHtml(item.name)}
        <button type="button" data-remove-id="${item.id}" aria-label="Убрать ${escapeHtml(item.name)}">×</button>
      </span>`).join('');
    selectedChips.querySelectorAll('[data-remove-id]').forEach(button => {
      button.addEventListener('click', () => toggleIngredient(button.dataset.removeId));
    });
  }

  function getAvailableSet() {
    return new Set([...state.selectedIngredients, ...state.pantryIngredients]);
  }

  function ingredientName(id) {
    return allIngredients.find(item => item.id === id)?.name || id;
  }

  function roleWeight(role) {
    return { critical: 5, required: 3, recommended: 1, pantry: 0.7 }[role] || 1;
  }

  function findSubstitution(recipe, ingredientId, available) {
    return recipe.substitutions.find(sub => sub.from === ingredientId && available.has(sub.to) && !state.excludedIngredients.has(sub.to)) || null;
  }

  function analyzeRecipe(recipe, maxTime, difficulty, mode) {
    const available = getAvailableSet();
    const statuses = recipe.ingredients.map(ingredient => {
      if (available.has(ingredient.id)) return { ingredient, status: ingredient.role === 'pantry' ? 'pantry' : 'available', substitution: null };
      const substitution = findSubstitution(recipe, ingredient.id, available);
      if (substitution) return { ingredient, status: 'substituted', substitution };
      return { ingredient, status: 'missing', substitution: null };
    });

    const blockedItems = recipe.ingredients.filter(ingredient => state.excludedIngredients.has(ingredient.id) && ingredient.role !== 'recommended');
    const missingCritical = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'critical');
    const missingRequired = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'required');
    const missingPantry = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'pantry');
    const missingRecommended = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'recommended');
    const coveredCritical = statuses.filter(item => ['available', 'substituted'].includes(item.status) && item.ingredient.role === 'critical').length;
    const flexibleCritical = mode === 'flexible' && coveredCritical > 0 ? missingCritical.length : 0;
    const requiredAdditions = flexibleCritical + missingRequired.length + missingPantry.length;
    const blockers = [];

    if (recipe.totalMinutes > maxTime) blockers.push(`нужно около ${recipe.totalMinutes} минут, выбран лимит ${maxTime}`);
    if (difficulty !== 'any' && recipe.difficulty !== difficulty) blockers.push(`сложность рецепта — ${difficultyName(recipe.difficulty)}`);
    if (blockedItems.length) blockers.push(`исключены продукты: ${blockedItems.map(item => ingredientName(item.id)).join(', ')}`);
    if (mode === 'strict' && missingCritical.length) blockers.push(`нет основного продукта: ${missingCritical.map(item => ingredientName(item.ingredient.id)).join(', ')}`);
    if (mode === 'flexible' && missingCritical.length && coveredCritical === 0) blockers.push('нет ни одного основного продукта этого рецепта');
    if (mode === 'strict' && (missingRequired.length + missingPantry.length) > 0) blockers.push(`нужно добавить: ${[...missingRequired, ...missingPantry].map(item => ingredientName(item.ingredient.id)).join(', ')}`);
    if (mode === 'flexible' && requiredAdditions > 2) blockers.push(`нужно добавить ${requiredAdditions} обязательных продуктов, разрешено не более двух`);

    const possibleSubstitutions = statuses
      .filter(item => item.status === 'missing')
      .flatMap(item => recipe.substitutions
        .filter(sub => sub.from === item.ingredient.id && !state.excludedIngredients.has(sub.to))
        .map(sub => ({ from: sub.from, to: sub.to, note: sub.note })));

    const totalWeight = statuses.reduce((sum, item) => sum + roleWeight(item.ingredient.role), 0);
    const coveredWeight = statuses.reduce((sum, item) => {
      if (item.status === 'available' || item.status === 'pantry') return sum + roleWeight(item.ingredient.role);
      if (item.status === 'substituted') return sum + roleWeight(item.ingredient.role) * 0.9;
      return sum;
    }, 0);
    const closeness = totalWeight ? coveredWeight / totalWeight : 0;

    return {
      recipe,
      statuses,
      blockedItems,
      missingCritical,
      missingRequired,
      missingPantry,
      missingRecommended,
      requiredAdditions,
      blockers,
      possibleSubstitutions,
      closeness,
      eligible: blockers.length === 0
    };
  }

  function evaluateRecipe(recipe, maxTime, difficulty, mode) {
    const analysis = analyzeRecipe(recipe, maxTime, difficulty, mode);
    if (!analysis.eligible) return null;
    const totalWeight = analysis.statuses.reduce((sum, item) => sum + roleWeight(item.ingredient.role), 0);
    const coveredWeight = analysis.statuses.reduce((sum, item) => {
      if (item.status === 'available' || item.status === 'pantry') return sum + roleWeight(item.ingredient.role);
      if (item.status === 'substituted') return sum + roleWeight(item.ingredient.role) * 0.9;
      return sum;
    }, 0);
    const coverageScore = coveredWeight / totalWeight;
    const timeScore = Math.max(0, 1 - (recipe.totalMinutes / maxTime) * 0.28);
    const additionScore = Math.max(0, 1 - analysis.requiredAdditions * 0.25 - analysis.missingRecommended.length * 0.04);
    const score = coverageScore * 0.62 + timeScore * 0.18 + additionScore * 0.12 + recipe.editorialPriority * 0.08;

    const matchedMain = analysis.statuses.filter(item => ['available', 'substituted'].includes(item.status) && item.ingredient.role !== 'pantry').length;
    const allMain = analysis.statuses.filter(item => item.ingredient.role !== 'pantry').length;
    const reasons = [`Подходят ${matchedMain} из ${allMain} основных ингредиентов`, `Общее время — около ${recipe.totalMinutes} минут`];
    const additions = requiredAdditionNames(analysis);
    reasons.push(additions.length ? `Нужно добавить: ${additions.join(', ')}` : 'Все обязательные продукты есть');
    return { ...analysis, score, reasons };
  }

  function buildNearMatches(maxTime, difficulty, mode, excludedRecipeIds) {
    return window.RECIPES
      .map(recipe => analyzeRecipe(recipe, maxTime, difficulty, mode))
      .filter(item => !item.eligible && !excludedRecipeIds.has(item.recipe.id))
      .filter(item => !item.blockedItems.length)
      .filter(item => {
        const coveredCritical = item.statuses.filter(status => ['available', 'substituted'].includes(status.status) && status.ingredient.role === 'critical').length;
        if (!coveredCritical) return false;
        const additions = [...item.missingCritical, ...item.missingRequired, ...item.missingPantry].length;
        const timeOver = Math.max(0, item.recipe.totalMinutes - maxTime);
        if (mode === 'strict' && additions > 0) return false;
        return additions <= 3 && timeOver <= 30;
      })
      .sort((a, b) => {
        const aPenalty = Math.max(0, a.recipe.totalMinutes - maxTime) / 60 + [...a.missingCritical, ...a.missingRequired, ...a.missingPantry].length * 0.08;
        const bPenalty = Math.max(0, b.recipe.totalMinutes - maxTime) / 60 + [...b.missingCritical, ...b.missingRequired, ...b.missingPantry].length * 0.08;
        return (b.closeness - bPenalty) - (a.closeness - aPenalty);
      })
      .slice(0, 4);
  }

  function difficultyName(value) {
    return value === 'easy' ? 'простая' : value === 'medium' ? 'средняя' : value;
  }

  function editorialStatusView(recipe) {
    const status = recipe.editorial?.status || 'draft';
    const statusViews = {
      draft: { label: 'Черновик', className: 'editorial-draft', description: 'Рецепт ещё проходит редакционную проверку.' },
      reviewed: { label: 'Проверен редакционно', className: 'editorial-reviewed', description: 'Структура и безопасность проверены; фактическое приготовление ещё не подтверждено.' },
      cooked: { label: 'Приготовлен', className: 'editorial-cooked', description: 'Рецепт приготовлен по текущей версии; ожидает итогового утверждения.' },
      approved: { label: 'Утверждён', className: 'editorial-approved', description: 'Рецепт прошёл фактическое приготовление и итоговую проверку.' }
    };
    return statusViews[status] || statusViews.draft;
  }

  function countLabel(number, one, few, many) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return `${number} ${one}`;
    if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return `${number} ${few}`;
    return `${number} ${many}`;
  }

  function portionsLabel(number) {
    return countLabel(number, 'порция', 'порции', 'порций');
  }

  function productsLabel(number) {
    return countLabel(number, 'продукт', 'продукта', 'продуктов');
  }

  function recipesLabel(number) {
    return countLabel(number, 'рецепт', 'рецепта', 'рецептов');
  }

  function runSearch(event) {
    event.preventDefault();
    commitServingsInput();
    const error = document.getElementById('formError');
    error.textContent = '';
    if (state.selectedIngredients.size < 1) {
      error.textContent = 'Выберите хотя бы один основной продукт.';
      return;
    }

    const { maxTime, difficulty, shoppingMode: mode, servings } = getSettings();
    const settings = { maxTime, difficulty, shoppingMode: mode, servings };
    const eventContext = searchEventContext(settings);
    trackProductEvent('search_submitted', eventContext);
    saveSettings();
    const evaluated = window.RECIPES
      .map(recipe => evaluateRecipe(recipe, maxTime, difficulty, mode))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    state.results = evaluated;
    state.visibleResultCount = 6;
    const exactIds = new Set(state.results.map(item => item.recipe.id));
    state.nearMatches = buildNearMatches(maxTime, difficulty, mode, exactIds);
    state.lastDiagnostics = window.RECIPES
      .map(recipe => analyzeRecipe(recipe, maxTime, difficulty, mode))
      .filter(item => !item.eligible)
      .sort((a, b) => b.closeness - a.closeness)
      .slice(0, 4);

    const resultEvent = { ...eventContext, exact_count: state.results.length, near_count: state.nearMatches.length };
    if (!state.results.length && !state.nearMatches.length) trackProductEvent('zero_results', eventContext);
    trackProductEvent('results_shown', resultEvent);

    const foundText = state.results.length
      ? `${recipesLabel(state.results.length)} ${state.results.length === 1 ? 'подходит' : 'подходят'}`
      : state.nearMatches.length
        ? `${recipesLabel(state.nearMatches.length)} ${state.nearMatches.length === 1 ? 'почти подходит' : 'почти подходят'}`
        : 'вариантов не найдено';
    resultContext.textContent = `${productsLabel(state.selectedIngredients.size)} · до ${maxTime} минут · ${portionsLabel(servings)} · ${mode === 'flexible' ? 'можно добавить 1–2 продукта' : 'строгий подбор'} · ${foundText}`;
    renderSearchResults();
    recordHistory({
      type: 'search',
      at: new Date().toISOString(),
      ingredients: [...state.selectedIngredients],
      pantry: [...state.pantryIngredients],
      excluded: [...state.excludedIngredients],
      mode,
      maxTime,
      difficulty,
      servings,
      results: state.results.map(item => item.recipe.id),
      nearResults: state.nearMatches.map(item => item.recipe.id),
      session: state.lastSessionCode
    });
    showView('results');
  }

  function requiredAdditionStatuses(item) {
    return [...item.missingCritical, ...item.missingRequired, ...item.missingPantry];
  }

  function requiredAdditionNames(item) {
    return requiredAdditionStatuses(item).map(status => ingredientName(status.ingredient.id));
  }

  function recommendedNames(item) {
    return item.missingRecommended.map(status => ingredientName(status.ingredient.id));
  }

  function renderSearchResults() {
    if (!state.results.length && !state.nearMatches.length) {
      renderNoResults();
      return;
    }
    const chunks = [];
    const visibleResults = state.results.slice(0, state.visibleResultCount);
    chunks.push(`<p class="result-summary"><strong>Подходящих вариантов: ${state.results.length}.</strong> ${state.results.length > visibleResults.length ? `Сначала показаны первые ${visibleResults.length}.` : 'Показаны все найденные варианты.'}</p>`);
    if (visibleResults.length) {
      chunks.push('<p class="result-section-label">Подходит по выбранным условиям</p>');
      chunks.push(visibleResults.map(item => resultCardHtml(item, false)).join(''));
      if (state.results.length > visibleResults.length) {
        chunks.push(`<div class="show-more-wrap"><button class="ghost-button show-more-results" type="button" data-show-more>Показать ещё (${state.results.length - visibleResults.length})</button></div>`);
      }
    }
    if (state.nearMatches.length) {
      chunks.push('<p class="result-section-label">Почти подходит — можно рассмотреть</p>');
      chunks.push(state.nearMatches.map(item => resultCardHtml(item, true)).join(''));
    }
    resultsList.innerHTML = chunks.join('');
    attachResultActions(resultsList);
  }

  function nearReason(item) {
    const additions = requiredAdditionNames(item);
    const settings = getSettings();
    const reasons = [];
    if (additions.length) reasons.push(`добавить: ${additions.join(', ')}`);
    if (item.recipe.totalMinutes > settings.maxTime) reasons.push(`нужно примерно ${item.recipe.totalMinutes} мин вместо ${settings.maxTime}`);
    if (settings.difficulty !== 'any' && item.recipe.difficulty !== settings.difficulty) reasons.push(`сложность — ${difficultyName(item.recipe.difficulty)}`);
    return reasons.length ? `Почему это близкий вариант: ${reasons.join('; ')}.` : 'Это близкий вариант по выбранным продуктам.';
  }

  function resultCardHtml(item, near) {
    const additions = requiredAdditionNames(item);
    const recommended = recommendedNames(item);
    const ready = additions.length === 0;
    const editorial = editorialStatusView(item.recipe);
    const servings = getSettings().servings;
    const badge = near ? 'Почти подходит' : ready ? 'Можно готовить' : `Добавить ${additions.length}`;
    const badgeClass = near ? 'match-near' : ready ? 'match-ready' : 'match-add';
    const reasons = item.reasons || [`Совпадение по продуктам — ${Math.round(item.closeness * 100)}%`, `Общее время — около ${item.recipe.totalMinutes} минут`];
    return `
      <article class="result-card ${near ? 'near-card' : ''}">
        <div class="recipe-title-row">
          <h3>${escapeHtml(item.recipe.title)}</h3>
          <span class="match-badge ${badgeClass}">${escapeHtml(badge)}</span>
        </div>
        <div class="meta">
          <span>${item.recipe.totalMinutes} мин</span>
          <span>${difficultyName(item.recipe.difficulty)}</span>
          <span>${portionsLabel(servings)}</span>
          <span class="editorial-badge ${editorial.className}" title="${escapeHtml(editorial.description)}">${escapeHtml(editorial.label)}</span>
        </div>
        <ul class="reasons">${reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
        ${near ? `<p class="near-explanation">${escapeHtml(nearReason(item))}</p>` : ''}
        ${additions.length ? `<p class="add-note"><strong>Нужно добавить:</strong> ${escapeHtml(additions.join(', '))}.</p>` : ''}
        ${recommended.length ? `<p class="optional-note"><strong>Для лучшего результата:</strong> ${escapeHtml(recommended.join(', '))}.</p>` : ''}
        <div class="card-actions">
          <button class="primary-button open-recipe" type="button" data-id="${item.recipe.id}">Открыть рецепт</button>
          <button class="ghost-button favorite-toggle" type="button" data-id="${item.recipe.id}">${isFavorite(item.recipe.id) ? 'Убрать из избранного' : 'В избранное'}</button>
        </div>
      </article>`;
  }

  function attachResultActions(container) {
    container.querySelectorAll('.open-recipe').forEach(button => button.addEventListener('click', () => openRecipe(button.dataset.id)));
    container.querySelectorAll('.favorite-toggle').forEach(button => button.addEventListener('click', () => {
      toggleFavorite(button.dataset.id);
      if (container === resultsList) renderSearchResults();
      else showFavorites();
    }));
    container.querySelector('[data-show-more]')?.addEventListener('click', () => {
      state.visibleResultCount += 6;
      renderSearchResults();
    });
  }

  function renderNoResults() {
    const diagnostics = state.lastDiagnostics.slice(0, 3);
    const settings = getSettings();
    const diagnosticHtml = diagnostics.length ? `
      <div class="diagnostic-list">
        <strong>Что мешает ближайшим вариантам</strong>
        ${diagnostics.map(item => `<div class="diagnostic-item"><b>${escapeHtml(item.recipe.title)}</b><span>${escapeHtml(item.blockers.join('; ') || 'Не хватает подходящих продуктов')}.</span></div>`).join('')}
      </div>` : '';
    const quickActions = [
      settings.shoppingMode === 'strict' ? '<button class="ghost-button" type="button" data-relax-mode>Разрешить добавить 1–2 продукта</button>' : '',
      settings.maxTime < 60 ? '<button class="ghost-button" type="button" data-relax-time>Показать варианты до 60 минут</button>' : '',
      settings.difficulty !== 'any' ? '<button class="ghost-button" type="button" data-relax-difficulty>Снять ограничение сложности</button>' : ''
    ].filter(Boolean).join('');
    resultsList.innerHTML = `
      <div class="empty-state panel">
        <strong>Подходящего или близкого варианта пока нет.</strong>
        <p>Не нужно угадывать параметры рецепта. Ниже показано, что именно мешает; можно изменить один параметр и повторить подбор.</p>
        ${diagnosticHtml}
        ${quickActions ? `<div class="quick-adjustments">${quickActions}</div>` : ''}
        <div class="empty-actions"><button class="primary-button" type="button" data-empty-home>Изменить параметры</button><button class="ghost-button" type="button" data-empty-feedback>Сообщить о проблеме</button></div>
      </div>`;
    const repeatSearch = () => document.getElementById('searchForm').requestSubmit();
    resultsList.querySelector('[data-empty-home]').addEventListener('click', () => showView('home'));
    resultsList.querySelector('[data-empty-feedback]').addEventListener('click', () => openFeedback('general'));
    resultsList.querySelector('[data-relax-mode]')?.addEventListener('click', () => {
      document.querySelector('input[name="shoppingMode"][value="flexible"]').checked = true;
      saveSettings(); repeatSearch();
    });
    resultsList.querySelector('[data-relax-time]')?.addEventListener('click', () => {
      document.querySelector('input[name="maxTime"][value="60"]').checked = true;
      saveSettings(); repeatSearch();
    });
    resultsList.querySelector('[data-relax-difficulty]')?.addEventListener('click', () => {
      document.getElementById('difficulty').value = 'any';
      saveSettings(); repeatSearch();
    });
  }

  function parseQuantity(value) {
    const fractions = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
    if (fractions[value] !== undefined) return fractions[value];
    const mixed = String(value).match(/^(\d+)([¼½¾⅓⅔])$/);
    if (mixed) return Number(mixed[1]) + fractions[mixed[2]];
    const number = Number(String(value).replace(',', '.'));
    return Number.isFinite(number) ? number : null;
  }

  function formatQuarter(value) {
    const rounded = Math.max(0.25, Math.round(value * 4) / 4);
    const whole = Math.floor(rounded);
    const fraction = Math.round((rounded - whole) * 4);
    const glyph = { 0: '', 1: '¼', 2: '½', 3: '¾' }[fraction] || '';
    return `${whole || ''}${glyph}` || '¼';
  }

  function cleanDecimal(value, digits = 2) {
    return Number(value.toFixed(digits)).toString().replace('.', ',');
  }

  function roundTo(value, step) {
    return Math.max(step, Math.round(value / step) * step);
  }

  function formatScaledValue(value, unit, ingredientId) {
    const normalized = unit.toLowerCase().trim();
    if (normalized === 'г' || normalized.startsWith('г ')) return String(Math.round(roundTo(value, 5)));
    if (normalized === 'мл' || normalized.startsWith('мл ')) return String(Math.round(roundTo(value, 5)));
    if (normalized === 'л' || normalized.startsWith('л ') || normalized.includes('литр')) return cleanDecimal(roundTo(value, 0.05));
    if (/ч\.\s*л|ст\.\s*л/.test(normalized)) return formatQuarter(value);
    if (/шт\./.test(normalized)) {
      if (['eggs', 'potato', 'carrot', 'tomato', 'cucumber', 'sweet_pepper', 'eggplant'].includes(ingredientId)) return String(Math.max(1, Math.round(value)));
      return formatQuarter(Math.round(value * 2) / 2);
    }
    if (/зубчик/.test(normalized)) return formatQuarter(Math.round(value * 2) / 2);
    if (/ломтик/.test(normalized)) return String(Math.max(1, Math.round(value)));
    if (/щепот/.test(normalized)) return String(Math.max(1, Math.round(value)));
    return cleanDecimal(value, 1);
  }

  function scaleAmount(ingredient, factor) {
    const amount = ingredient.amount;
    if (factor === 1) return amount;
    const numberToken = '(?:[0-9]+(?:[.,][0-9]+)?|[¼½¾⅓⅔]|[0-9]+[¼½¾⅓⅔])';
    const range = amount.match(new RegExp(`^(${numberToken})\\s*[–-]\\s*(${numberToken})\\s*(.*)$`));
    if (range) {
      const first = parseQuantity(range[1]);
      const second = parseQuantity(range[2]);
      if (first !== null && second !== null) {
        const unit = range[3];
        return `${formatScaledValue(first * factor, unit, ingredient.id)}–${formatScaledValue(second * factor, unit, ingredient.id)} ${unit}`.trim();
      }
    }
    const single = amount.match(new RegExp(`^(${numberToken})\\s*(.*)$`));
    if (single) {
      const value = parseQuantity(single[1]);
      if (value !== null) {
        const unit = single[2];
        return `${formatScaledValue(value * factor, unit, ingredient.id)} ${unit}`.trim();
      }
    }
    return amount;
  }

  function statusPresentation(status) {
    if (status.status === 'available') return { icon: '✓', className: 'status-ready', label: 'есть' };
    if (status.status === 'pantry') return { icon: '•', className: 'status-pantry', label: 'базовый запас' };
    if (status.status === 'substituted') return { icon: '↔', className: 'status-ready', label: `замена: ${ingredientName(status.substitution.to)}` };
    if (status.ingredient.role === 'recommended') return { icon: '+', className: 'status-add', label: 'рекомендуется добавить' };
    return { icon: '!', className: 'status-missing', label: 'нужно добавить' };
  }

  function refinedStep(recipe, index) {
    return STEP_REFINEMENTS[recipe.id]?.[index] || recipe.steps[index].text;
  }

  function preparationTip(recipe) {
    const refinements = STEP_REFINEMENTS[recipe.id];
    if (!refinements) return '';
    const firstIndex = Number(Object.keys(refinements)[0]);
    return refinedStep(recipe, firstIndex);
  }

  function openRecipe(id, options = {}) {
    const recipe = window.RECIPES.find(item => item.id === id);
    if (!recipe) return;
    const recordOpen = options.recordOpen !== false;
    state.currentRecipe = recipe;
    const settings = getSettings();
    const evaluation = analyzeRecipe(recipe, 999, 'any', 'flexible');
    state.currentEvaluation = evaluation;
    const selectedServings = settings.servings;
    const factor = selectedServings / recipe.servings;
    const additions = requiredAdditionNames(evaluation);
    const hasMissingRequired = additions.length > 0;
    const timeMismatch = recipe.totalMinutes > settings.maxTime;
    const recommended = recommendedNames(evaluation);
    const criticalMissing = evaluation.missingCritical.map(item => ingredientName(item.ingredient.id));
    const editorial = editorialStatusView(recipe);

    let availabilityClass = '';
    let availabilityTitle = 'Можно начинать готовить';
    let availabilityDetails = 'Все обязательные продукты отмечены как доступные.';
    if (criticalMissing.length) {
      availabilityClass = 'warning-state';
      availabilityTitle = 'Перед приготовлением нужно добавить основной продукт';
      availabilityDetails = `Добавьте: ${criticalMissing.join(', ')}.`;
    } else if (additions.length) {
      availabilityClass = 'warning-state';
      availabilityTitle = 'Перед приготовлением проверьте продукты';
      availabilityDetails = `Нужно добавить: ${additions.join(', ')}.`;
    } else if (timeMismatch) {
      availabilityClass = 'warning-state';
      availabilityTitle = 'Рецепту нужно больше времени';
      availabilityDetails = `Нужно около ${recipe.totalMinutes} минут, а в подборе был выбран лимит ${settings.maxTime} минут.`;
    }
    if (timeMismatch && hasMissingRequired) availabilityDetails += ` Также нужно около ${recipe.totalMinutes} минут вместо выбранных ${settings.maxTime}.`;
    if (recommended.length) availabilityDetails += ` Для лучшего результата рекомендуется: ${recommended.join(', ')}.`;

    const tip = preparationTip(recipe);
    recipeCard.innerHTML = `
      <div class="recipe-panel">
        <div class="recipe-title-row"><h1>${escapeHtml(recipe.title)}</h1><button class="ghost-button favorite-toggle" type="button" data-id="${recipe.id}" aria-label="Избранное">${isFavorite(recipe.id) ? '★' : '☆'}</button></div>
        <div class="meta"><span>${recipe.activeMinutes} мин активно</span><span>${recipe.totalMinutes} мин всего</span><span>${portionsLabel(selectedServings)}</span><span>${difficultyName(recipe.difficulty)}</span><span class="editorial-badge ${editorial.className}">${escapeHtml(editorial.label)}</span></div>
        <p class="editorial-note"><strong>Статус рецепта:</strong> ${escapeHtml(editorial.description)} Версия ${escapeHtml(recipe.editorial?.version || '0.1-draft')}${recipe.editorial?.batch ? ` · партия ${escapeHtml(recipe.editorial.batch)}` : ''}.</p>
        <div class="availability-box ${availabilityClass}"><strong>${escapeHtml(availabilityTitle)}</strong><span>${escapeHtml(availabilityDetails)}</span></div>
        ${tip ? `<p class="prep-tip"><strong>Как подготовить продукты:</strong> ${escapeHtml(tip)}</p>` : ''}
        <button id="startCooking" class="primary-button" type="button" ${hasMissingRequired ? 'disabled' : ''}>${hasMissingRequired ? 'Сначала добавьте обязательные продукты' : 'Начать готовить'}</button>

        <h2 class="section-title">Ингредиенты</h2>
        <p class="amount-note">Количество рассчитано на ${portionsLabel(selectedServings)}. Граммы и миллилитры округлены до бытовых значений, ложки — до ¼.</p>
        <ul class="ingredient-status-list">
          ${evaluation.statuses.map(status => {
            const view = statusPresentation(status);
            return `<li class="ingredient-row"><span class="status-icon ${view.className}">${view.icon}</span><span><strong>${escapeHtml(ingredientName(status.ingredient.id))}</strong><br><small class="muted">${escapeHtml(view.label)}</small></span><span class="ingredient-amount">${escapeHtml(scaleAmount(status.ingredient, factor))}</span></li>`;
          }).join('')}
        </ul>

        ${recipe.substitutions.length ? `<h2 class="section-title">Допустимые замены</h2><ul class="ingredients-list">${recipe.substitutions.map(sub => `<li><strong>${escapeHtml(ingredientName(sub.from))} → ${escapeHtml(ingredientName(sub.to))}:</strong> ${escapeHtml(sub.note)}</li>`).join('')}</ul>` : ''}
        <h2 class="section-title">Техника</h2><p>${recipe.equipment.map(escapeHtml).join(', ')}</p>
        <h2 class="section-title">Порядок действий</h2><ol class="steps-list">${recipe.steps.map((step, index) => `<li>${escapeHtml(refinedStep(recipe, index))} <strong>≈ ${step.minutes} мин.</strong></li>`).join('')}</ol>
        <p class="warning"><strong>Безопасность:</strong> ${escapeHtml(recipe.safety)}</p>
      </div>`;

    recipeCard.querySelector('.favorite-toggle').addEventListener('click', () => {
      toggleFavorite(recipe.id);
      openRecipe(recipe.id, { recordOpen: false });
    });
    document.getElementById('startCooking').addEventListener('click', startCooking);
    if (recordOpen) {
      trackProductEvent('recipe_opened', { recipe_id: recipe.id, recipe_status: recipe.editorial?.status || null, servings: selectedServings });
      recordHistory({ type: 'recipe_opened', at: new Date().toISOString(), recipe: recipe.id, servings: selectedServings, session: state.lastSessionCode });
    }
    showView('recipe');
  }

  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { state.wakeLock = await navigator.wakeLock.request('screen'); } catch { state.wakeLock = null; }
  }

  async function releaseWakeLock() {
    try { await state.wakeLock?.release(); } catch { /* no-op */ }
    state.wakeLock = null;
  }

  function startCooking() {
    state.currentStep = 0;
    stopTimer();
    requestWakeLock();
    renderCookingStep();
    const servings = getSettings().servings;
    trackProductEvent('cooking_started', { recipe_id: state.currentRecipe.id, servings });
    recordHistory({ type: 'cooking_started', at: new Date().toISOString(), recipe: state.currentRecipe.id, servings, session: state.lastSessionCode });
    showView('cooking');
  }

  function renderCookingStep() {
    const recipe = state.currentRecipe;
    const step = recipe.steps[state.currentStep];
    if (!step) return;
    state.remainingSeconds = step.minutes * 60;
    const progress = Math.round(((state.currentStep + 1) / recipe.steps.length) * 100);
    cookingMode.innerHTML = `
      <div class="cooking-panel">
        <p class="step-counter">Шаг ${state.currentStep + 1} из ${recipe.steps.length}</p>
        <div class="progress-track" role="progressbar" aria-label="Прогресс приготовления" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width:${progress}%"></span></div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="cooking-step">${escapeHtml(refinedStep(recipe, state.currentStep))}</p>
        <div id="timerDisplay" class="timer">${formatSeconds(state.remainingSeconds)}</div>
        <p class="timer-note">Таймер необязателен: можно просто нажать «Готово, дальше».</p>
        <button id="timerButton" class="ghost-button" type="button">Запустить таймер</button>
        <div class="cooking-actions"><button id="prevStep" class="ghost-button" type="button" ${state.currentStep === 0 ? 'disabled' : ''}>Назад</button><button id="nextStep" class="primary-button" type="button">${state.currentStep === recipe.steps.length - 1 ? 'Я приготовил(а)' : 'Готово, дальше'}</button></div>
      </div>`;

    document.getElementById('timerButton').addEventListener('click', toggleTimer);
    document.getElementById('prevStep').addEventListener('click', () => { stopTimer(); state.currentStep--; renderCookingStep(); });
    document.getElementById('nextStep').addEventListener('click', async () => {
      stopTimer();
      if (state.currentStep < recipe.steps.length - 1) {
        state.currentStep++;
        renderCookingStep();
      } else {
        await releaseWakeLock();
        const servings = getSettings().servings;
        trackProductEvent('cooking_completed', { recipe_id: recipe.id, servings });
        recordHistory({ type: 'cooking_completed', at: new Date().toISOString(), recipe: recipe.id, servings, session: state.lastSessionCode });
        openFeedback('cooking');
      }
    });
  }

  function toggleTimer() {
    const button = document.getElementById('timerButton');
    if (state.timerId) {
      stopTimer();
      button.textContent = 'Продолжить таймер';
      return;
    }
    if (state.remainingSeconds <= 0) return;
    button.textContent = 'Пауза';
    state.timerId = setInterval(() => {
      state.remainingSeconds--;
      const display = document.getElementById('timerDisplay');
      if (display) display.textContent = formatSeconds(Math.max(0, state.remainingSeconds));
      if (state.remainingSeconds <= 0) {
        stopTimer();
        button.textContent = 'Время истекло';
        if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  }

  function formatSeconds(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function getFavorites() { return safeStorageArray(STORAGE.favorites); }
  function isFavorite(id) { return getFavorites().includes(id); }
  function toggleFavorite(id) {
    const favorites = new Set(getFavorites());
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem(STORAGE.favorites, JSON.stringify([...favorites]));
    updateFavoriteCount();
  }
  function updateFavoriteCount() { document.getElementById('favoriteCount').textContent = getFavorites().length; }

  function showFavorites() {
    const items = getFavorites().map(id => {
      const recipe = window.RECIPES.find(item => item.id === id);
      if (!recipe) return null;
      const evaluation = analyzeRecipe(recipe, 999, 'any', 'flexible');
      evaluation.reasons = [`${recipe.totalMinutes} минут`, `Сложность: ${difficultyName(recipe.difficulty)}`];
      return evaluation;
    }).filter(Boolean);
    if (!items.length) {
      favoritesList.innerHTML = '<div class="empty-state panel"><strong>Избранное пока пусто.</strong><p>Добавьте рецепты из результатов подбора.</p></div>';
    } else {
      favoritesList.innerHTML = items.map(item => resultCardHtml(item, false)).join('');
      attachResultActions(favoritesList);
    }
    showView('favorites');
  }

  function recordHistory(event) {
    const historyItems = safeStorageArray(STORAGE.history);
    historyItems.push(event);
    localStorage.setItem(STORAGE.history, JSON.stringify(historyItems.slice(-150)));
  }

  function historyEventTitle(event) {
    if (event.type === 'cooking_completed') return 'Приготовлено';
    if (event.type === 'recipe_opened') return 'Открыт рецепт';
    if (event.type === 'search') return 'Выполнен подбор';
    if (event.type === 'feedback_ready') return 'Подготовлен отзыв';
    return 'Действие';
  }

  function historyEventDetails(event) {
    if (event.recipe) {
      const recipe = window.RECIPES.find(item => item.id === event.recipe);
      return `${recipe?.title || event.recipe}${event.servings ? ` · ${portionsLabel(event.servings)}` : ''}`;
    }
    if (event.type === 'search') {
      const names = (event.ingredients || []).slice(0, 4).map(ingredientName);
      const extra = (event.ingredients || []).length > 4 ? ` и ещё ${(event.ingredients || []).length - 4}` : '';
      const portions = event.servings ? ` · ${portionsLabel(event.servings)}` : '';
      return names.length ? `${names.join(', ')}${extra}${portions}` : `Без выбранных продуктов${portions}`;
    }
    return '';
  }

  function formatHistoryDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  function showHistory() {
    const events = safeStorageArray(STORAGE.history)
      .filter(event => ['search', 'recipe_opened', 'cooking_completed', 'feedback_ready'].includes(event.type))
      .slice(-30)
      .reverse();
    if (!events.length) {
      historyList.innerHTML = '<div class="empty-state panel"><strong>История пока пуста.</strong><p>Здесь появятся подборы, открытые рецепты и завершённые приготовления.</p></div>';
    } else {
      historyList.innerHTML = events.map(event => `<article class="history-item"><div><strong>${escapeHtml(historyEventTitle(event))}</strong><span>${escapeHtml(historyEventDetails(event))}</span></div><time>${escapeHtml(formatHistoryDate(event.at))}</time></article>`).join('');
    }
    showView('history');
  }

  function clearHistory() {
    if (!window.confirm('Очистить историю на этом устройстве?')) return;
    localStorage.removeItem(STORAGE.history);
    showHistory();
  }

  function openFeedback(source = 'general') {
    state.feedbackSource = source;
    feedbackTitle.textContent = source === 'cooking' ? 'Как получилось блюдо?' : 'Отзыв об открытой бете';
    feedbackDialog.showModal();
  }

  async function sendFeedback(event) {
    event.preventDefault();
    const rating = document.getElementById('rating').value;
    const actualTime = document.getElementById('actualTime').value;
    const problem = document.getElementById('problemText').value.trim();
    if (!problem) {
      document.getElementById('feedbackForm').reportValidity();
      return;
    }
    const settings = getSettings();
    const wouldReturn = document.getElementById('wouldReturn').checked ? 'да' : 'нет';
    const shown = state.results.map(item => item.recipe.id).join(', ') || 'нет точных вариантов';
    const nearShown = state.nearMatches.map(item => item.recipe.id).join(', ') || 'нет';
    const additions = state.currentEvaluation ? requiredAdditionNames(state.currentEvaluation).join(', ') || 'не требовались' : 'не указано';
    const text = [
      'Обратная связь — кулинарный ассистент',
      `Версия: ${BUILD_VERSION}`,
      `Тип обратной связи: ${state.feedbackSource === 'cooking' ? 'приготовление блюда' : 'открытая бета'}`,
      `Код сессии: ${state.lastSessionCode}`,
      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      `Порции: ${settings.servings}`,
      `Лимит времени: ${settings.maxTime} минут`,
      `Режим: ${settings.shoppingMode}`,
      `Выбранные продукты: ${[...state.selectedIngredients].map(ingredientName).join(', ')}`,
      `Не использовать: ${[...state.excludedIngredients].map(ingredientName).join(', ') || 'нет'}`,
      `Точные варианты: ${shown}`,
      `Близкие варианты: ${nearShown}`,
      `Выбран рецепт: ${state.currentRecipe?.id || 'не указан'}`,
      `Нужно добавить: ${additions}`,
      `Приготовил(а): ${state.feedbackSource === 'cooking' ? 'да' : 'не указано'}`,
      `Оценка: ${rating ? `${rating}/5` : 'не указана'}`,
      `Фактическое время: ${actualTime ? `${actualTime} минут` : 'не указано'}`,
      `Проблема/наблюдение: ${problem}`,
      `Использовал(а) бы снова: ${wouldReturn}`
    ].join('\n');

    let delivered = false;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Кулинарный ассистент — отзыв', text });
        delivered = true;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    if (!delivered) {
      try {
        await navigator.clipboard.writeText(text);
        window.alert('Отзыв скопирован в буфер обмена. Вставьте его в комментарий под публикацией или отправьте удобным способом.');
        delivered = true;
      } catch {
        window.prompt('Скопируйте отзыв и отправьте его удобным способом:', text);
        delivered = true;
      }
    }

    if (!delivered) return;
    recordHistory({ type: 'feedback_ready', at: new Date().toISOString(), recipe: state.currentRecipe?.id, servings: settings.servings, rating: rating ? Number(rating) : null, actualTime: actualTime ? Number(actualTime) : null, wouldReturn, session: state.lastSessionCode });
    feedbackDialog.close();
    state.lastSessionCode = createSessionCode();
    document.getElementById('feedbackForm').reset();
    document.getElementById('wouldReturn').checked = true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  document.getElementById('searchForm').addEventListener('submit', runSearch);
  search.addEventListener('input', () => { renderIngredients(); updateSearchClearButton(); });
  search.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addFromSearch();
  });
  addIngredientFromSearch.addEventListener('click', addFromSearch);
  clearIngredientSearch.addEventListener('click', () => clearSearchField());
  categorySelect.addEventListener('change', () => { renderIngredients(); saveSettings(); });
  servingsRange.addEventListener('input', () => {
    const servings = syncServings(servingsRange.value);
    setServingsMessage(`Выбрано: ${portionsLabel(servings)}.`);
  });
  servingsInput.addEventListener('input', previewServingsInput);
  servingsInput.addEventListener('change', commitServingsInput);
  servingsInput.addEventListener('blur', commitServingsInput);
  servingsInput.addEventListener('focus', () => window.setTimeout(() => servingsInput.select(), 0));
  servingsInput.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commitServingsInput();
  });
  decreaseServings.addEventListener('click', () => adjustServings(-1));
  increaseServings.addEventListener('click', () => adjustServings(1));
  document.querySelectorAll('input[name="maxTime"], input[name="shoppingMode"]').forEach(input => input.addEventListener('change', saveSettings));
  document.getElementById('difficulty').addEventListener('change', saveSettings);
  document.getElementById('clearIngredients').addEventListener('click', () => {
    const removedIds = [...state.selectedIngredients];
    state.selectedIngredients.clear();
    renderIngredients();
    renderSelectedIngredients();
    saveKitchen();
    removedIds.forEach(id => trackProductEvent('ingredient_removed', { ingredient_id: id, selected_count: 0, reason: 'clear_all' }));
  });
  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => {
    const target = button.dataset.nav;
    if (target === 'results' && !state.results.length && !state.nearMatches.length) showView('home');
    else showView(target);
  }));
  homeButton.addEventListener('click', () => showView('home'));
  document.getElementById('favoritesButton').addEventListener('click', showFavorites);
  document.getElementById('historyButton').addEventListener('click', showHistory);
  document.getElementById('clearHistoryButton').addEventListener('click', clearHistory);
  testFeedbackButton.addEventListener('click', () => openFeedback('general'));
  document.getElementById('feedbackForm').addEventListener('submit', sendFeedback);
  document.getElementById('cancelFeedback').addEventListener('click', () => feedbackDialog.close());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.currentView === 'cooking') requestWakeLock();
  });

  initializeCategories();
  initializePantry();
  restoreKitchen();
  applyPantryState();
  initializeExclusions();
  restoreSettings();
  renderExcludedIngredients();
  renderIngredients();
  renderSelectedIngredients();
  updateFavoriteCount();
  initializeHistory();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  }
})();
