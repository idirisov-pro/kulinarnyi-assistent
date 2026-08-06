(() => {
  'use strict';

  const BUILD_VERSION = '3.0-preview.3';

  const state = {
    selectedIngredients: new Set(),
    excludedIngredients: new Set(),
    pantryIngredients: new Set(),
    results: [],
    currentRecipe: null,
    currentEvaluation: null,
    currentStep: 0,
    timerId: null,
    remainingSeconds: 0,
    wakeLock: null,
    lastSessionCode: createSessionCode(),
    currentView: 'home',
    feedbackSource: 'general',
    lastDiagnostics: []
  };

  const views = [...document.querySelectorAll('.view')];
  const chips = document.getElementById('ingredientChips');
  const search = document.getElementById('ingredientSearch');
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

  const allIngredients = [
    ...window.INGREDIENTS,
    ...window.PANTRY_INGREDIENTS.map(item => ({ ...item, category: 'pantry', aliases: [] }))
  ];

  function createSessionCode() {
    const day = new Date().toISOString().slice(5,10).replace('-','');
    return `KA-${day}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
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

  function saveKitchen() {
    const kitchen = {
      selected:[...state.selectedIngredients],
      excluded:[...state.excludedIngredients],
      pantry:[...state.pantryIngredients]
    };
    localStorage.setItem('ka_kitchen_v3',JSON.stringify(kitchen));
    if (kitchenSaveStatus) {
      kitchenSaveStatus.textContent = 'Моя кухня сохранена на этом устройстве.';
      window.clearTimeout(saveKitchen.statusTimer);
      saveKitchen.statusTimer = window.setTimeout(() => {
        kitchenSaveStatus.textContent = 'Выбор сохраняется только на этом устройстве.';
      },1800);
    }
  }

  function restoreKitchen() {
    try {
      const kitchen = JSON.parse(localStorage.getItem('ka_kitchen_v3') || 'null');
      if (!kitchen || typeof kitchen !== 'object') return;
      const validIngredients = new Set(window.INGREDIENTS.map(item => item.id));
      const validPantry = new Set(window.PANTRY_INGREDIENTS.map(item => item.id));
      state.selectedIngredients = new Set((kitchen.selected || []).filter(id => validIngredients.has(id)));
      state.excludedIngredients = new Set((kitchen.excluded || []).filter(id => validIngredients.has(id) && !state.selectedIngredients.has(id)));
      state.pantryIngredients = new Set((kitchen.pantry || []).filter(id => validPantry.has(id)));
    } catch {
      localStorage.removeItem('ka_kitchen_v3');
    }
  }

  function showView(name, pushHistory = true) {
    state.currentView = name;
    views.forEach(view => view.classList.toggle('active', view.id === `${name}View`));
    homeButton.classList.toggle('hidden', name === 'home');
    if (pushHistory) history.pushState({ view:name }, '', `#${name}`);
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function initializeHistory() {
    history.replaceState({ view:'home' }, '', '#home');
    window.addEventListener('popstate', event => {
      const target = event.state?.view || 'home';
      if (target === 'results' && !state.results.length) showView('home', false);
      else if (target === 'recipe' && !state.currentRecipe) showView('home', false);
      else if (target === 'cooking' && !state.currentRecipe) showView('home', false);
      else showView(target, false);
    });
  }

  function initializeCategories() {
    categorySelect.innerHTML = window.INGREDIENT_CATEGORIES
      .map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
      .join('');
  }

  function initializePantry() {
    window.PANTRY_INGREDIENTS.forEach(item => {
      if (item.defaultChecked) state.pantryIngredients.add(item.id);
    });
    pantryOptions.innerHTML = window.PANTRY_INGREDIENTS.map(item => `
      <label class="checkbox-option">
        <input type="checkbox" data-pantry-id="${item.id}" ${item.defaultChecked ? 'checked' : ''} />
        ${escapeHtml(item.name)}
      </label>`).join('');
    pantryOptions.querySelectorAll('[data-pantry-id]').forEach(input => {
      input.addEventListener('change', () => {
        input.checked ? state.pantryIngredients.add(input.dataset.pantryId) : state.pantryIngredients.delete(input.dataset.pantryId);
        saveKitchen();
      });
    });
  }

  function initializeExclusions() {
    excludeSelect.innerHTML = '<option value="">Выберите продукт</option>' + window.INGREDIENTS
      .slice()
      .sort((a,b) => a.name.localeCompare(b.name,'ru'))
      .map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
      .join('');
    document.getElementById('addExclusion').addEventListener('click', () => {
      const id = excludeSelect.value;
      if (!id) return;
      state.excludedIngredients.add(id);
      state.selectedIngredients.delete(id);
      excludeSelect.value = '';
      renderIngredients();
      renderSelectedIngredients();
      renderExcludedIngredients();
      saveKitchen();
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

  function ingredientMatchesQuery(item, query) {
    if (!query) return true;
    const haystack = [item.name, ...(item.aliases || [])].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderIngredients() {
    const query = search.value.trim().toLowerCase();
    const selectedCategory = categorySelect.value;
    const matches = window.INGREDIENTS.filter(item => {
      const categoryMatches = query
        ? true
        : selectedCategory === 'all'
          ? true
          : selectedCategory === 'common'
            ? item.common
            : item.category === selectedCategory;
      return categoryMatches && ingredientMatchesQuery(item, query);
    });

    chips.innerHTML = '';
    matches.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chip ${state.selectedIngredients.has(item.id) ? 'selected' : ''}`;
      button.textContent = item.name;
      button.setAttribute('aria-pressed', state.selectedIngredients.has(item.id));
      button.addEventListener('click', () => toggleIngredient(item.id));
      chips.appendChild(button);
    });
    emptyIngredientSearch.classList.toggle('hidden', matches.length > 0);
  }

  function toggleIngredient(id) {
    const wasExcluded = state.excludedIngredients.has(id);
    if (wasExcluded) {
      state.excludedIngredients.delete(id);
      state.selectedIngredients.add(id);
      renderExcludedIngredients();
    } else if (state.selectedIngredients.has(id)) {
      state.selectedIngredients.delete(id);
    } else {
      state.selectedIngredients.add(id);
    }
    renderIngredients();
    renderSelectedIngredients();
    saveKitchen();
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
    return { critical:5, required:3, recommended:1, pantry:.7 }[role] || 1;
  }

  function findSubstitution(recipe, ingredientId, available) {
    return recipe.substitutions.find(sub => sub.from === ingredientId && available.has(sub.to) && !state.excludedIngredients.has(sub.to)) || null;
  }

  function analyzeRecipe(recipe, maxTime, difficulty, mode) {
    const available = getAvailableSet();
    const statuses = recipe.ingredients.map(ingredient => {
      if (available.has(ingredient.id)) return { ingredient, status: ingredient.role === 'pantry' ? 'pantry' : 'available', substitution:null };
      const substitution = findSubstitution(recipe, ingredient.id, available);
      if (substitution) return { ingredient, status:'substituted', substitution };
      return { ingredient, status:'missing', substitution:null };
    });

    const blockedItems = recipe.ingredients.filter(ingredient =>
      state.excludedIngredients.has(ingredient.id) && ingredient.role !== 'recommended'
    );
    const missingCritical = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'critical');
    const missingRequired = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'required');
    const missingPantry = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'pantry');
    const missingRecommended = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'recommended');
    const requiredAdditions = missingRequired.length + missingPantry.length;
    const blockers = [];

    if (recipe.totalMinutes > maxTime) blockers.push(`нужно около ${recipe.totalMinutes} минут, выбран лимит ${maxTime}`);
    if (difficulty !== 'any' && recipe.difficulty !== difficulty) blockers.push(`сложность рецепта — ${difficultyName(recipe.difficulty)}`);
    if (blockedItems.length) blockers.push(`исключены продукты: ${blockedItems.map(item => ingredientName(item.id)).join(', ')}`);
    if (missingCritical.length) blockers.push(`нет основного продукта: ${missingCritical.map(item => ingredientName(item.ingredient.id)).join(', ')}`);
    if (mode === 'strict' && requiredAdditions > 0) blockers.push(`нужно добавить: ${[...missingRequired,...missingPantry].map(item => ingredientName(item.ingredient.id)).join(', ')}`);
    if (mode === 'flexible' && requiredAdditions > 2) blockers.push(`нужно добавить ${requiredAdditions} обязательных продуктов, разрешено не более двух`);

    const possibleSubstitutions = statuses
      .filter(item => item.status === 'missing')
      .flatMap(item => recipe.substitutions
        .filter(sub => sub.from === item.ingredient.id && !state.excludedIngredients.has(sub.to))
        .map(sub => ({ from:sub.from, to:sub.to, note:sub.note })));

    const totalWeight = statuses.reduce((sum,item) => sum + roleWeight(item.ingredient.role),0);
    const coveredWeight = statuses.reduce((sum,item) => {
      if (item.status === 'available' || item.status === 'pantry') return sum + roleWeight(item.ingredient.role);
      if (item.status === 'substituted') return sum + roleWeight(item.ingredient.role) * .9;
      return sum;
    },0);
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
      eligible:blockers.length === 0
    };
  }

  function evaluateRecipe(recipe, maxTime, difficulty, mode) {
    const analysis = analyzeRecipe(recipe,maxTime,difficulty,mode);
    if (!analysis.eligible) return null;

    const { statuses, missingCritical, missingRequired, missingPantry, missingRecommended, requiredAdditions } = analysis;
    const totalWeight = statuses.reduce((sum,item) => sum + roleWeight(item.ingredient.role),0);
    const coveredWeight = statuses.reduce((sum,item) => {
      if (item.status === 'available' || item.status === 'pantry') return sum + roleWeight(item.ingredient.role);
      if (item.status === 'substituted') return sum + roleWeight(item.ingredient.role) * .9;
      return sum;
    },0);
    const coverageScore = coveredWeight / totalWeight;
    const timeScore = Math.max(0,1 - (recipe.totalMinutes / maxTime) * .28);
    const additionScore = Math.max(0,1 - requiredAdditions * .28 - missingRecommended.length * .04);
    const score = coverageScore * .62 + timeScore * .18 + additionScore * .12 + recipe.editorialPriority * .08;

    const matchedMain = statuses.filter(item => ['available','substituted'].includes(item.status) && item.ingredient.role !== 'pantry').length;
    const allMain = statuses.filter(item => item.ingredient.role !== 'pantry').length;
    const reasons = [
      `Подходят ${matchedMain} из ${allMain} основных ингредиентов`,
      `Общее время — около ${recipe.totalMinutes} минут`
    ];
    if (requiredAdditions === 0) reasons.push('Все обязательные продукты есть');
    else reasons.push(`Нужно добавить: ${[...missingRequired,...missingPantry].map(item => ingredientName(item.ingredient.id)).join(', ')}`);

    return { ...analysis, score, reasons };
  }

  function difficultyName(value) {
    return value === 'easy' ? 'простая' : value === 'medium' ? 'средняя' : value;
  }

  function editorialStatusView(recipe) {
    const status = recipe.editorial?.status || 'draft';
    const views = {
      draft:{ label:'Черновик', className:'editorial-draft', description:'Рецепт ещё проходит редакционную проверку.' },
      reviewed:{ label:'Проверен редакционно', className:'editorial-reviewed', description:'Структура и безопасность проверены; фактическое приготовление ещё не подтверждено.' },
      cooked:{ label:'Приготовлен', className:'editorial-cooked', description:'Рецепт приготовлен по текущей версии; ожидает итогового утверждения.' },
      approved:{ label:'Утверждён', className:'editorial-approved', description:'Рецепт прошёл фактическое приготовление и итоговую проверку.' }
    };
    return views[status] || views.draft;
  }

  function portionsLabel(number) {
    const mod10 = number % 10;
    const mod100 = number % 100;
    if (mod10 === 1 && mod100 !== 11) return `${number} порция`;
    if ([2,3,4].includes(mod10) && ![12,13,14].includes(mod100)) return `${number} порции`;
    return `${number} порций`;
  }

  function runSearch(event) {
    event.preventDefault();
    const error = document.getElementById('formError');
    error.textContent = '';
    if (state.selectedIngredients.size < 1) {
      error.textContent = 'Выберите хотя бы один основной продукт.';
      return;
    }

    const maxTime = Number(document.querySelector('input[name="maxTime"]:checked').value);
    const difficulty = document.getElementById('difficulty').value;
    const mode = document.querySelector('input[name="shoppingMode"]:checked').value;
    const servings = Number(document.getElementById('servings').value);

    state.results = window.RECIPES
      .map(recipe => evaluateRecipe(recipe,maxTime,difficulty,mode))
      .filter(Boolean)
      .sort((a,b) => b.score - a.score)
      .slice(0,3);

    state.lastDiagnostics = window.RECIPES
      .map(recipe => analyzeRecipe(recipe,maxTime,difficulty,mode))
      .filter(item => !item.eligible)
      .sort((a,b) => b.closeness - a.closeness)
      .slice(0,3);

    resultContext.textContent = `${state.selectedIngredients.size} основных продуктов из всех выбранных категорий · до ${maxTime} минут · ${portionsLabel(servings)}`;
    renderResults(state.results,resultsList);
    recordHistory({
      type:'search',
      at:new Date().toISOString(),
      ingredients:[...state.selectedIngredients],
      pantry:[...state.pantryIngredients],
      excluded:[...state.excludedIngredients],
      mode,
      results:state.results.map(item => item.recipe.id),
      session:state.lastSessionCode
    });
    showView('results');
  }

  function requiredAdditionNames(item) {
    return [...item.missingRequired,...item.missingPantry].map(status => ingredientName(status.ingredient.id));
  }

  function recommendedNames(item) {
    return item.missingRecommended.map(status => ingredientName(status.ingredient.id));
  }

  function renderResults(items,container) {
    if (!items.length) {
      const diagnostics = state.lastDiagnostics.slice(0,2);
      const diagnosticHtml = diagnostics.length ? `
        <div class="diagnostic-list">
          <strong>Почему ближайшие варианты не показаны</strong>
          ${diagnostics.map(item => {
            const missing = [...item.missingCritical,...item.missingRequired,...item.missingPantry]
              .map(status => ingredientName(status.ingredient.id));
            const substitutions = item.possibleSubstitutions
              .map(sub => `${ingredientName(sub.from)} → ${ingredientName(sub.to)}`);
            return `<div class="diagnostic-item">
              <b>${escapeHtml(item.recipe.title)}</b>
              ${missing.length ? `<span>Не хватает: ${escapeHtml(missing.join(', '))}.</span>` : ''}
              ${item.blockers.length ? `<span>${escapeHtml(item.blockers.join('; '))}.</span>` : ''}
              ${substitutions.length ? `<span>Возможные замены: ${escapeHtml(substitutions.join(', '))}.</span>` : ''}
            </div>`;
          }).join('')}
        </div>` : '';
      container.innerHTML = `
        <div class="empty-state panel">
          <strong>Подходящих рецептов пока не найдено.</strong>
          <p>Ниже показаны конкретные причины. Измените продукты, увеличьте время или разрешите добавить 1–2 позиции.</p>
          ${diagnosticHtml}
          <div class="empty-actions">
            <button class="primary-button" type="button" data-empty-home>Изменить параметры</button>
            <button class="ghost-button" type="button" data-empty-feedback>Сообщить о проблеме</button>
          </div>
        </div>`;
      container.querySelector('[data-empty-home]').addEventListener('click',() => showView('home'));
      container.querySelector('[data-empty-feedback]').addEventListener('click',() => openFeedback('general'));
      return;
    }

    const selectedServings = Number(document.getElementById('servings').value);
    container.innerHTML = items.map(item => {
      const additions = requiredAdditionNames(item);
      const recommended = recommendedNames(item);
      const ready = additions.length === 0;
      const editorial = editorialStatusView(item.recipe);
      return `
        <article class="result-card">
          <div class="recipe-title-row">
            <h3>${escapeHtml(item.recipe.title)}</h3>
            <span class="match-badge ${ready ? 'match-ready' : 'match-add'}">${ready ? 'Можно готовить' : `Добавить ${additions.length}`}</span>
          </div>
          <div class="meta">
            <span>${item.recipe.totalMinutes} мин</span>
            <span>${difficultyName(item.recipe.difficulty)}</span>
            <span>${portionsLabel(selectedServings)}</span>
            <span class="editorial-badge ${editorial.className}" title="${escapeHtml(editorial.description)}">${escapeHtml(editorial.label)}</span>
          </div>
          <ul class="reasons">${item.reasons.map(reason => `<li>${escapeHtml(reason)}</li>`).join('')}</ul>
          ${additions.length ? `<p class="add-note"><strong>Перед приготовлением добавьте:</strong> ${escapeHtml(additions.join(', '))}.</p>` : ''}
          ${recommended.length ? `<p class="optional-note"><strong>Для лучшего результата:</strong> ${escapeHtml(recommended.join(', '))}.</p>` : ''}
          <div class="card-actions">
            <button class="primary-button open-recipe" type="button" data-id="${item.recipe.id}">Открыть рецепт</button>
            <button class="ghost-button favorite-toggle" type="button" data-id="${item.recipe.id}">${isFavorite(item.recipe.id) ? 'Убрать из избранного' : 'В избранное'}</button>
          </div>
        </article>`;
    }).join('');

    container.querySelectorAll('.open-recipe').forEach(button => button.addEventListener('click',() => openRecipe(button.dataset.id)));
    container.querySelectorAll('.favorite-toggle').forEach(button => button.addEventListener('click',() => {
      toggleFavorite(button.dataset.id);
      renderResults(items,container);
    }));
  }

  function parseQuantity(value) {
    const fractions = { '¼':.25, '½':.5, '¾':.75, '⅓':1/3, '⅔':2/3 };
    if (fractions[value] !== undefined) return fractions[value];
    const number = Number(value.replace(',','.'));
    return Number.isFinite(number) ? number : null;
  }

  function formatQuantity(value) {
    if (Number.isInteger(value)) return String(value);
    const rounded = Math.round(value * 10) / 10;
    const known = [[.25,'¼'],[.5,'½'],[.75,'¾']].find(([number]) => Math.abs(rounded-number) < .03);
    if (known) return known[1];
    return rounded.toFixed(1).replace('.',',');
  }

  function scaleAmount(amount,factor) {
    if (factor === 1) return amount;
    const range = amount.match(/^([0-9]+(?:[.,][0-9]+)?|[¼½¾⅓⅔])\s*[–-]\s*([0-9]+(?:[.,][0-9]+)?|[¼½¾⅓⅔])\s*(.*)$/);
    if (range) {
      const first = parseQuantity(range[1]);
      const second = parseQuantity(range[2]);
      if (first !== null && second !== null) return `${formatQuantity(first*factor)}–${formatQuantity(second*factor)} ${range[3]}`.trim();
    }
    const single = amount.match(/^([0-9]+(?:[.,][0-9]+)?|[¼½¾⅓⅔])\s*(.*)$/);
    if (single) {
      const value = parseQuantity(single[1]);
      if (value !== null) return `${formatQuantity(value*factor)} ${single[2]}`.trim();
    }
    return `${amount} × ${factor.toFixed(1).replace('.',',')}`;
  }

  function statusPresentation(status) {
    if (status.status === 'available') return { icon:'✓',className:'status-ready',label:'есть' };
    if (status.status === 'pantry') return { icon:'•',className:'status-pantry',label:'базовый запас' };
    if (status.status === 'substituted') return { icon:'↔',className:'status-ready',label:`замена: ${ingredientName(status.substitution.to)}` };
    if (status.ingredient.role === 'recommended') return { icon:'+',className:'status-add',label:'рекомендуется добавить' };
    return { icon:'!',className:'status-missing',label:'нужно добавить' };
  }

  function openRecipe(id) {
    const recipe = window.RECIPES.find(item => item.id === id);
    if (!recipe) return;
    state.currentRecipe = recipe;

    const maxTime = 999;
    const difficulty = 'any';
    const evaluation = evaluateRecipe(recipe,maxTime,difficulty,'flexible') || evaluateFavoriteRecipe(recipe);
    state.currentEvaluation = evaluation;
    const selectedServings = Number(document.getElementById('servings').value || recipe.servings);
    const factor = selectedServings / recipe.servings;
    const additions = requiredAdditionNames(evaluation);
    const recommended = recommendedNames(evaluation);
    const criticalMissing = evaluation.missingCritical.map(item => ingredientName(item.ingredient.id));
    const editorial = editorialStatusView(recipe);

    let availabilityClass = '';
    let availabilityTitle = 'Можно начинать готовить';
    let availabilityDetails = 'Все обязательные продукты отмечены как доступные.';
    if (criticalMissing.length) {
      availabilityClass = 'danger-state';
      availabilityTitle = 'Не хватает основного продукта';
      availabilityDetails = `Добавьте: ${criticalMissing.join(', ')}.`;
    } else if (additions.length) {
      availabilityClass = 'warning-state';
      availabilityTitle = 'Перед приготовлением проверьте продукты';
      availabilityDetails = `Нужно добавить: ${additions.join(', ')}.`;
    }
    if (recommended.length) availabilityDetails += ` Для лучшего результата рекомендуется: ${recommended.join(', ')}.`;

    recipeCard.innerHTML = `
      <div class="recipe-panel">
        <div class="recipe-title-row">
          <h1>${escapeHtml(recipe.title)}</h1>
          <button class="ghost-button favorite-toggle" type="button" data-id="${recipe.id}" aria-label="Избранное">${isFavorite(recipe.id) ? '★' : '☆'}</button>
        </div>
        <div class="meta">
          <span>${recipe.activeMinutes} мин активно</span>
          <span>${recipe.totalMinutes} мин всего</span>
          <span>${portionsLabel(selectedServings)}</span>
          <span>${difficultyName(recipe.difficulty)}</span>
          <span class="editorial-badge ${editorial.className}">${escapeHtml(editorial.label)}</span>
        </div>
        <p class="editorial-note"><strong>Статус рецепта:</strong> ${escapeHtml(editorial.description)} Версия ${escapeHtml(recipe.editorial?.version || '0.1-draft')}${recipe.editorial?.batch ? ` · партия ${escapeHtml(recipe.editorial.batch)}` : ''}.</p>
        <div class="availability-box ${availabilityClass}">
          <strong>${escapeHtml(availabilityTitle)}</strong>
          <span>${escapeHtml(availabilityDetails)}</span>
        </div>
        <button id="startCooking" class="primary-button" type="button" ${criticalMissing.length ? 'disabled' : ''}>Начать готовить</button>

        <h2 class="section-title">Ингредиенты</h2>
        <ul class="ingredient-status-list">
          ${evaluation.statuses.map(status => {
            const view = statusPresentation(status);
            return `<li class="ingredient-row">
              <span class="status-icon ${view.className}">${view.icon}</span>
              <span><strong>${escapeHtml(ingredientName(status.ingredient.id))}</strong><br><small class="muted">${escapeHtml(view.label)}</small></span>
              <span class="ingredient-amount">${escapeHtml(scaleAmount(status.ingredient.amount,factor))}</span>
            </li>`;
          }).join('')}
        </ul>

        ${recipe.substitutions.length ? `
          <h2 class="section-title">Допустимые замены</h2>
          <ul class="ingredients-list">${recipe.substitutions.map(sub => `<li><strong>${escapeHtml(ingredientName(sub.from))} → ${escapeHtml(ingredientName(sub.to))}:</strong> ${escapeHtml(sub.note)}</li>`).join('')}</ul>` : ''}

        <h2 class="section-title">Техника</h2>
        <p>${recipe.equipment.map(escapeHtml).join(', ')}</p>

        <h2 class="section-title">Порядок действий</h2>
        <ol class="steps-list">${recipe.steps.map(step => `<li>${escapeHtml(step.text)} <strong>≈ ${step.minutes} мин.</strong></li>`).join('')}</ol>

        <p class="warning"><strong>Безопасность:</strong> ${escapeHtml(recipe.safety)}</p>
      </div>`;

    recipeCard.querySelector('.favorite-toggle').addEventListener('click',() => {
      toggleFavorite(recipe.id);
      openRecipe(recipe.id);
    });
    document.getElementById('startCooking').addEventListener('click',startCooking);
    recordHistory({ type:'recipe_opened',at:new Date().toISOString(),recipe:recipe.id,session:state.lastSessionCode });
    showView('recipe');
  }

  function evaluateFavoriteRecipe(recipe) {
    const available = getAvailableSet();
    const statuses = recipe.ingredients.map(ingredient => {
      if (available.has(ingredient.id)) return { ingredient,status:ingredient.role === 'pantry' ? 'pantry' : 'available',substitution:null };
      const substitution = findSubstitution(recipe,ingredient.id,available);
      if (substitution) return { ingredient,status:'substituted',substitution };
      return { ingredient,status:'missing',substitution:null };
    });
    return {
      recipe,
      statuses,
      missingCritical:statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'critical'),
      missingRequired:statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'required'),
      missingPantry:statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'pantry'),
      missingRecommended:statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'recommended'),
      requiredAdditions:0,
      reasons:[]
    };
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
    recordHistory({ type:'cooking_started',at:new Date().toISOString(),recipe:state.currentRecipe.id,session:state.lastSessionCode });
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
        <div class="progress-track" role="progressbar" aria-label="Прогресс приготовления" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
          <span style="width:${progress}%"></span>
        </div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="cooking-step">${escapeHtml(step.text)}</p>
        <div id="timerDisplay" class="timer">${formatSeconds(state.remainingSeconds)}</div>
        <p class="timer-note">Ориентировочное время этого шага</p>
        <button id="timerButton" class="ghost-button" type="button">Запустить таймер</button>
        <div class="cooking-actions">
          <button id="prevStep" class="ghost-button" type="button" ${state.currentStep === 0 ? 'disabled' : ''}>Назад</button>
          <button id="nextStep" class="primary-button" type="button">${state.currentStep === recipe.steps.length - 1 ? 'Я приготовил(а)' : 'Готово, дальше'}</button>
        </div>
      </div>`;

    document.getElementById('timerButton').addEventListener('click',toggleTimer);
    document.getElementById('prevStep').addEventListener('click',() => {
      stopTimer();
      state.currentStep--;
      renderCookingStep();
    });
    document.getElementById('nextStep').addEventListener('click',async () => {
      stopTimer();
      if (state.currentStep < recipe.steps.length - 1) {
        state.currentStep++;
        renderCookingStep();
      } else {
        await releaseWakeLock();
        recordHistory({ type:'cooking_completed',at:new Date().toISOString(),recipe:recipe.id,session:state.lastSessionCode });
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
      if (display) display.textContent = formatSeconds(Math.max(0,state.remainingSeconds));
      if (state.remainingSeconds <= 0) {
        stopTimer();
        button.textContent = 'Время истекло';
        if ('vibrate' in navigator) navigator.vibrate([200,100,200]);
      }
    },1000);
  }

  function stopTimer() {
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
  }

  function formatSeconds(seconds) {
    return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }

  function getFavorites() { return safeStorageArray('ka_favorites'); }
  function isFavorite(id) { return getFavorites().includes(id); }
  function toggleFavorite(id) {
    const favorites = new Set(getFavorites());
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    localStorage.setItem('ka_favorites',JSON.stringify([...favorites]));
    updateFavoriteCount();
  }
  function updateFavoriteCount() { document.getElementById('favoriteCount').textContent = getFavorites().length; }

  function showFavorites() {
    const items = getFavorites().map(id => {
      const recipe = window.RECIPES.find(item => item.id === id);
      if (!recipe) return null;
      const evaluation = evaluateFavoriteRecipe(recipe);
      evaluation.score = recipe.editorialPriority;
      evaluation.requiredAdditions = evaluation.missingRequired.length + evaluation.missingPantry.length;
      evaluation.reasons = [`${recipe.totalMinutes} минут`, `Сложность: ${difficultyName(recipe.difficulty)}`];
      return evaluation;
    }).filter(Boolean);
    renderResults(items,favoritesList);
    showView('favorites');
  }

  function recordHistory(event) {
    const historyItems = safeStorageArray('ka_history');
    historyItems.push(event);
    localStorage.setItem('ka_history',JSON.stringify(historyItems.slice(-150)));
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
      return recipe?.title || event.recipe;
    }
    if (event.type === 'search') {
      const names = (event.ingredients || []).slice(0,4).map(ingredientName);
      const extra = (event.ingredients || []).length > 4 ? ` и ещё ${(event.ingredients || []).length - 4}` : '';
      return names.length ? `${names.join(', ')}${extra}` : 'Без выбранных продуктов';
    }
    return '';
  }

  function formatHistoryDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date);
  }

  function showHistory() {
    const events = safeStorageArray('ka_history')
      .filter(event => ['search','recipe_opened','cooking_completed','feedback_ready'].includes(event.type))
      .slice(-30)
      .reverse();
    if (!events.length) {
      historyList.innerHTML = '<div class="empty-state panel"><strong>История пока пуста.</strong><p>Здесь появятся подборы, открытые рецепты и завершённые приготовления.</p></div>';
    } else {
      historyList.innerHTML = events.map(event => `
        <article class="history-item">
          <div><strong>${escapeHtml(historyEventTitle(event))}</strong><span>${escapeHtml(historyEventDetails(event))}</span></div>
          <time>${escapeHtml(formatHistoryDate(event.at))}</time>
        </article>`).join('');
    }
    showView('history');
  }

  function clearHistory() {
    if (!window.confirm('Очистить историю на этом устройстве?')) return;
    localStorage.removeItem('ka_history');
    showHistory();
  }

  function openFeedback(source = 'general') {
    state.feedbackSource = source;
    feedbackTitle.textContent = source === 'cooking' ? 'Как получилось блюдо?' : 'Проверка работы приложения';
    feedbackDialog.showModal();
  }

  function sendFeedback(event) {
    event.preventDefault();
    const rating = document.getElementById('rating').value;
    const actualTime = document.getElementById('actualTime').value;
    const problem = document.getElementById('problemText').value.trim();
    if (!problem) {
      document.getElementById('feedbackForm').reportValidity();
      return;
    }
    const wouldReturn = document.getElementById('wouldReturn').checked ? 'да' : 'нет';
    const shown = state.results.map(item => item.recipe.id).join(', ') || 'избранное';
    const additions = state.currentEvaluation ? requiredAdditionNames(state.currentEvaluation).join(', ') || 'не требовались' : 'не указано';
    const text = [
      'Обратная связь — кулинарный ассистент',
      `Версия: ${BUILD_VERSION}`,
      `Тип проверки: ${state.feedbackSource === 'cooking' ? 'клиент приготовил блюдо' : 'ручная проверка приложения'}`,
      `Код сессии: ${state.lastSessionCode}`,
      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      `Выбранные продукты: ${[...state.selectedIngredients].map(ingredientName).join(', ')}`,
      `Не использовать: ${[...state.excludedIngredients].map(ingredientName).join(', ') || 'нет'}`,
      `Показаны рецепты: ${shown}`,
      `Выбран рецепт: ${state.currentRecipe?.id || 'не указан'}`,
      `Рекомендовано добавить: ${additions}`,
      `Нашёлся рецепт: ${state.results.length ? 'да' : 'нет'}`,
      `Начал(а) готовить: ${state.feedbackSource === 'cooking' ? 'да' : 'не указано'}`,
      `Приготовил(а): ${state.feedbackSource === 'cooking' ? 'да' : 'не указано'}`,
      `Оценка: ${rating ? `${rating}/5` : 'не указана'}`,
      `Фактическое время: ${actualTime ? `${actualTime} минут` : 'не указано'}`,
      `Проблема: ${problem}`,
      `Использовал(а) бы снова: ${wouldReturn}`
    ].join('\n');

    recordHistory({
      type:'feedback_ready',at:new Date().toISOString(),recipe:state.currentRecipe?.id,
      rating:rating ? Number(rating) : null,actualTime:actualTime ? Number(actualTime) : null,wouldReturn,session:state.lastSessionCode
    });
    feedbackDialog.close();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');
    state.lastSessionCode = createSessionCode();
    document.getElementById('feedbackForm').reset();
    document.getElementById('wouldReturn').checked = true;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  document.getElementById('searchForm').addEventListener('submit',runSearch);
  search.addEventListener('input',renderIngredients);
  categorySelect.addEventListener('change',renderIngredients);
  document.getElementById('clearIngredients').addEventListener('click',() => {
    state.selectedIngredients.clear();
    renderIngredients();
    renderSelectedIngredients();
    saveKitchen();
  });
  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click',() => {
    const target = button.dataset.nav;
    if (target === 'results' && !state.results.length) showView('home');
    else showView(target);
  }));
  homeButton.addEventListener('click',() => showView('home'));
  document.getElementById('favoritesButton').addEventListener('click',showFavorites);
  document.getElementById('historyButton').addEventListener('click',showHistory);
  document.getElementById('clearHistoryButton').addEventListener('click',clearHistory);
  testFeedbackButton.addEventListener('click',() => openFeedback('general'));
  document.getElementById('feedbackForm').addEventListener('submit',sendFeedback);
  document.getElementById('cancelFeedback').addEventListener('click',() => feedbackDialog.close());
  document.addEventListener('visibilitychange',() => {
    if (document.visibilityState === 'visible' && state.currentView === 'cooking') requestWakeLock();
  });

  initializeCategories();
  initializePantry();
  restoreKitchen();
  pantryOptions.querySelectorAll('[data-pantry-id]').forEach(input => {
    input.checked = state.pantryIngredients.has(input.dataset.pantryId);
  });
  initializeExclusions();
  renderExcludedIngredients();
  renderIngredients();
  renderSelectedIngredients();
  updateFavoriteCount();
  initializeHistory();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
  }
})();
