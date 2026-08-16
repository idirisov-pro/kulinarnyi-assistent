(() => {
  'use strict';

  function normalizeSearchText(value) {
    return String(value || '')
      .toLocaleLowerCase('ru-RU')
      .replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function ingredientSearchRank(item, rawQuery) {
    const query = normalizeSearchText(rawQuery);
    if (!query) return 1;
    const labels = [item.name, ...(item.aliases || [])]
      .map(normalizeSearchText)
      .filter(Boolean);
    let best = 0;
    labels.forEach(label => {
      if (label === query) best = Math.max(best, 100);
      else if (label.startsWith(query)) best = Math.max(best, 90);
      else if (label.split(' ').some(word => word.startsWith(query))) best = Math.max(best, 80);
      else if (label.includes(query)) best = Math.max(best, 40);
    });
    return best;
  }

  function rankIngredientMatches(items, rawQuery) {
    const query = normalizeSearchText(rawQuery);
    if (!query) return [...items];
    const ranked = items
      .map(item => ({ item, rank: ingredientSearchRank(item, query) }))
      .filter(entry => entry.rank > 0);
    const prefixMatches = ranked.filter(entry => entry.rank >= 80);
    const pool = prefixMatches.length ? prefixMatches : ranked;
    return pool
      .sort((a, b) => b.rank - a.rank || Number(b.item.common) - Number(a.item.common) || a.item.name.localeCompare(b.item.name, 'ru'))
      .map(entry => entry.item);
  }

  function uniqueExactMatch(items, rawQuery) {
    const query = normalizeSearchText(rawQuery);
    const exact = items.filter(item => [item.name, ...(item.aliases || [])].some(label => normalizeSearchText(label) === query));
    return exact.length === 1 ? exact[0] : null;
  }

  window.SEARCH_UTILS = { normalizeSearchText, ingredientSearchRank, rankIngredientMatches, uniqueExactMatch };
})();
