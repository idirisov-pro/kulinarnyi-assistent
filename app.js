(() => {
  'use strict';

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
    currentView: 'home'
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
      const categoryMatches = query ? true : (selectedCategory === 'common' ? item.common : item.category === selectedCategory);
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
    if (state.excludedIngredients.has(id)) state.excludedIngredients.delete(id);
    state.selectedIngredients.has(id) ? state.selectedIngredients.delete(id) : state.selectedIngredients.add(id);
    renderIngredients();
    renderSelectedIngredients();
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

  function evaluateRecipe(recipe, maxTime, difficulty, mode) {
    if (recipe.totalMinutes > maxTime) return null;
    if (difficulty !== 'any' && recipe.difficulty !== difficulty) return null;

    const blocked = recipe.ingredients.some(ingredient =>
      state.excludedIngredients.has(ingredient.id) && ingredient.role !== 'recommended'
    );
    if (blocked) return null;

    const available = getAvailableSet();
    const statuses = recipe.ingredients.map(ingredient => {
      if (available.has(ingredient.id)) return { ingredient, status: ingredient.role === 'pantry' ? 'pantry' : 'available', substitution:null };
      const substitution = findSubstitution(recipe, ingredient.id, available);
      if (substitution) return { ingredient, status:'substituted', substitution };
      return { ingredient, status:'missing', substitution:null };
    });

    const missingCritical = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'critical');
    const missingRequired = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'required');
    const missingPantry = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'pantry');
    const missingRecommended = statuses.filter(item => item.status === 'missing' && item.ingredient.role === 'recommended');

    if (missingCritical.length > 0) return null;
    const requiredAdditions = missingRequired.length + missingPantry.length;
    if (mode === 'strict' && requiredAdditions > 0) return null;
    if (mode === 'flexible' && requiredAdditions > 2) return null;

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

    return {
      recipe,
      score,
      statuses,
      missingCritical,
      missingRequired,
      missingPantry,
      missingRecommended,
      requiredAdditions,
      reasons
    };
  }

  function difficultyName(value) {
    return value === 'easy' ? 'простая' : value === 'medium' ? 'средняя' : value;
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

    resultContext.textContent = `${state.selectedIngredients.size} основных продуктов · до ${maxTime} минут · ${portionsLabel(servings)}`;
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
      container.innerHTML = `
        <div class="empty-state panel">
          <strong>Подходящих рецептов не найдено.</strong>
          <p>Попробуйте увеличить время, выбрать ещё один основной продукт или разрешить добавление 1–2 продуктов.</p>
          <button class="primary-button" type="button" data-empty-home>Изменить параметры</button>
        </div>`;
      container.querySelector('[data-empty-home]').addEventListener('click',() => showView('home'));
      return;
    }

    const selectedServings = Number(document.getElementById('servings').value);
    container.innerHTML = items.map(item => {
      const additions = requiredAdditionNames(item);
      const recommended = recommendedNames(item);
      const ready = additions.length === 0;
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
        </div>
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
    cookingMode.innerHTML = `
      <div class="cooking-panel">
        <p class="step-counter">Шаг ${state.currentStep + 1} из ${recipe.steps.length}</p>
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
        feedbackDialog.showModal();
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

  function sendFeedback(event) {
    event.preventDefault();
    const rating = document.getElementById('rating').value;
    const actualTime = document.getElementById('actualTime').value;
    if (!rating || !actualTime) {
      document.getElementById('feedbackForm').reportValidity();
      return;
    }
    const problem = document.getElementById('problemText').value.trim() || 'нет';
    const wouldReturn = document.getElementById('wouldReturn').checked ? 'да' : 'нет';
    const shown = state.results.map(item => item.recipe.id).join(', ') || 'избранное';
    const additions = state.currentEvaluation ? requiredAdditionNames(state.currentEvaluation).join(', ') || 'не требовались' : 'не указано';
    const text = [
      'Тест кулинарного ассистента',
      `Код сессии: ${state.lastSessionCode}`,
      `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
      `Выбранные продукты: ${[...state.selectedIngredients].map(ingredientName).join(', ')}`,
      `Не использовать: ${[...state.excludedIngredients].map(ingredientName).join(', ') || 'нет'}`,
      `Показаны рецепты: ${shown}`,
      `Выбран рецепт: ${state.currentRecipe?.id || 'не указан'}`,
      `Рекомендовано добавить: ${additions}`,
      'Начал(а) готовить: да',
      'Приготовил(а): да',
      `Оценка: ${rating}/5`,
      `Фактическое время: ${actualTime} минут`,
      `Проблема: ${problem}`,
      `Использовал(а) бы снова: ${wouldReturn}`
    ].join('\n');

    recordHistory({
      type:'feedback_ready',at:new Date().toISOString(),recipe:state.currentRecipe?.id,
      rating:Number(rating),actualTime:Number(actualTime),wouldReturn,session:state.lastSessionCode
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
  });
  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click',() => {
    const target = button.dataset.nav;
    if (target === 'results' && !state.results.length) showView('home');
    else showView(target);
  }));
  homeButton.addEventListener('click',() => showView('home'));
  document.getElementById('favoritesButton').addEventListener('click',showFavorites);
  document.getElementById('feedbackForm').addEventListener('submit',sendFeedback);
  document.getElementById('cancelFeedback').addEventListener('click',() => feedbackDialog.close());
  document.addEventListener('visibilitychange',() => {
    if (document.visibilityState === 'visible' && state.currentView === 'cooking') requestWakeLock();
  });

  initializeCategories();
  initializePantry();
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
