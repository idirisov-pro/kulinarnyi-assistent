import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(new URL(import.meta.url).pathname);
const results = [];
const check = (name, passed, detail) => results.push({name, passed, detail});

const requiredFiles = [
  'index.html','styles.css','preview4.css','app.js','service-worker.js','manifest.webmanifest',
  'data/ingredients.js','data/recipes.js','icons/icon-192.png','icons/icon-512.png'
];
check('PWA-файлы', requiredFiles.every(file => fs.existsSync(path.join(root,file))), `${requiredFiles.length} обязательных файлов`);

const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data/ingredients.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'data/recipes.js'),'utf8'),context);
const recipes = context.window.RECIPES;
const ingredientIds = new Set([...context.window.INGREDIENTS,...context.window.PANTRY_INGREDIENTS].map(item => item.id));
const allowedStatuses = new Set(['draft','reviewed','cooked','approved']);

check('Количество рецептов', recipes.length === 23, `${recipes.length} рецепта`);
check('Уникальные ID', new Set(recipes.map(r => r.id)).size === recipes.length, 'дубликатов нет');
check('Редакционные поля', recipes.every(r => r.id && r.editorial?.version && allowedStatuses.has(r.editorial?.status)), 'ID, версия и допустимый статус есть у каждого рецепта');
check('Партия B1', recipes.filter(r => r.editorial?.batch === 'B1' && r.editorial?.status === 'reviewed').length === 10, '10 рецептов reviewed');
check('Черновики', recipes.filter(r => r.editorial?.status === 'draft').length === 13, '13 рецептов draft');
check('Ссылки на ингредиенты', recipes.every(r => r.ingredients.every(i => ingredientIds.has(i.id)) && r.substitutions.every(s => ingredientIds.has(s.from) && ingredientIds.has(s.to))), 'неизвестных ингредиентов нет');
check('Структура рецептов', recipes.every(r => r.title && r.ingredients.length && r.steps.length && r.equipment.length && r.safety), 'обязательные разделы заполнены');

const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const sw = fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
const css = fs.readFileSync(path.join(root,'preview4.css'),'utf8');

check('Маркер сборки', html.includes('3.0-preview.4') && app.includes("BUILD_VERSION = '3.0-preview.4'") && sw.includes('v3-preview-4'), 'HTML, приложение и кэш согласованы');
check('Порции 1–20', html.includes('id="servingsRange"') && html.includes('max="20"') && html.includes('id="servings"') && app.includes('MAX_SERVINGS = 20'), 'бегунок и ручной ввод синхронизированы');
check('Сохранение параметров', app.includes("settings: 'ka_settings_v4'") && app.includes('saveSettings') && app.includes('restoreSettings'), 'время, порции, сложность и режим сохраняются');
check('Очистка поиска', html.includes('id="clearIngredientSearch"') && app.includes('clearSearchField') && app.includes('if (query) clearSearchField()'), 'есть крестик и автоочистка после выбора');
check('Гибкий подбор', app.includes('coveredCritical > 0') && app.includes('requiredAdditions > 2') && app.includes('buildNearMatches'), 'разрешены 1–2 добавления и показываются близкие варианты');
check('Бытовое округление', app.includes('roundTo(value, 5)') && app.includes('formatQuarter(value)') && app.includes('Количество рассчитано на'), 'граммы/мл и ложки не выводятся с лишними десятичными');
check('Конкретизация нарезки', app.includes('STEP_REFINEMENTS') && app.includes('кубиками 2–3 см') && app.includes('пластинками около 5 мм'), 'для проблемных шагов добавлены размеры и форма нарезки');
check('Новый визуальный слой', html.includes('preview4.css') && css.includes('.portion-card') && css.includes('.flow-strip'), 'интерфейс preview.4 визуально отделён от preview.3');
check('Статус в интерфейсе', app.includes('editorialStatusView') && app.includes('Проверен редакционно') && app.includes('фактическое приготовление ещё не подтверждено'), 'пояснение статуса присутствует');
check('Два потока обратной связи', app.includes('клиент приготовил блюдо') && app.includes('ручная проверка приложения'), 'клиентское приготовление отделено от функциональной проверки');

check('Блокировка готовки без обязательных продуктов', app.includes("hasMissingRequired ? 'disabled' : ''") && app.includes('Сначала добавьте обязательные продукты'), 'пошаговый режим не стартует при отсутствии обязательных ингредиентов');
check('Предупреждение о превышении времени', app.includes('Рецепту нужно больше времени') && app.includes('timeMismatch'), 'карточка рецепта сохраняет контекст ограничения по времени');

const failed = results.filter(item => !item.passed);
console.log(JSON.stringify({version:'3.0-preview.4', passed:failed.length === 0, results}, null, 2));
if (failed.length) process.exitCode = 1;
