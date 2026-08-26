import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(new URL(import.meta.url).pathname);
const results = [];
const check = (name, passed, detail) => results.push({name, passed, detail});

const requiredFiles = [
  'index.html','styles.css','preview4.css','preview5.css','preview6.css','search-utils.js','release-3.1.js','app.js','service-worker.js','manifest.webmanifest',
  'data/ingredients.js','data/recipes.js','icons/icon-192.png','icons/icon-512.png'
];
check('PWA-файлы', requiredFiles.every(file => fs.existsSync(path.join(root,file))), `${requiredFiles.length} обязательных файлов`);

const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data/ingredients.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'data/recipes.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'search-utils.js'),'utf8'),context);
const recipes = context.window.RECIPES;
const ingredients = context.window.INGREDIENTS;
const searchUtils = context.window.SEARCH_UTILS;
const ingredientIds = new Set([...ingredients,...context.window.PANTRY_INGREDIENTS].map(item => item.id));
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
const css4 = fs.readFileSync(path.join(root,'preview4.css'),'utf8');
const css5 = fs.readFileSync(path.join(root,'preview5.css'),'utf8');
const readme = fs.readFileSync(path.join(root,'README.md'),'utf8');
const css6 = fs.readFileSync(path.join(root,'preview6.css'),'utf8');
const release31 = fs.readFileSync(path.join(root,'release-3.1.js'),'utf8');

check('Маркер сборки', html.includes('3.1-beta.1') && app.includes("BUILD_VERSION = '3.1-beta.1'") && sw.includes('v3-1-beta-1'), 'HTML, приложение и кэш согласованы');
check('Версионные ресурсы', html.includes('app.js?v=3.1-beta.1') && html.includes('search-utils.js?v=3.1-beta.1') && sw.includes('app.js?v=3.1-beta.1'), 'старый PWA-кэш не маскирует новую сборку');
check('Порции 1–20', html.includes('id="servingsRange"') && html.includes('max="20"') && html.includes('id="servings"') && app.includes('MAX_SERVINGS = 20'), 'бегунок и ручной ввод используют диапазон 1–20');
check('Надёжный ручной ввод порций', app.includes('previewServingsInput') && app.includes('commitServingsInput') && app.includes("servingsInput.addEventListener('change', commitServingsInput)") && !app.includes("servingsInput.addEventListener('input', () => syncServings"), 'двухзначное число не переписывается после первой цифры');
check('Кнопки порций', html.includes('id="decreaseServings"') && html.includes('id="increaseServings"') && app.includes('adjustServings(-1)') && app.includes('adjustServings(1)'), 'есть мобильные кнопки −/+');
check('Сохранение параметров', app.includes("settings: 'ka_settings_v4'") && app.includes('saveSettings') && app.includes('restoreSettings'), 'время, порции, сложность и режим сохраняются');

const namesFor = query => searchUtils.rankIngredientMatches(ingredients, query).map(item => item.name);
check('Поиск по первым буквам', JSON.stringify(namesFor('кар')) === JSON.stringify(['Картофель']), 'кар → Картофель без нерелевантных Макарон');
check('Поиск по синонимам', namesFor('том')[0] === 'Помидоры' && namesFor('овся')[0] === 'Овсяные хлопья' && namesFor('бедра')[0] === 'Куриные бёдра', 'том/овся/бедра распознаются');
check('Поиск общего фарша', namesFor('фарш').length === 3, 'фарш возвращает три уточнённых варианта');
check('Enter и кнопка поиска', html.includes('id="addIngredientFromSearch"') && app.includes("event.key !== 'Enter'") && app.includes('addFromSearch()'), 'поиск можно подтвердить без отправки всей формы');
check('Очистка поиска', html.includes('id="clearIngredientSearch"') && app.includes('clearSearchField') && app.includes('clearSearchField({ focus: false })'), 'есть крестик и автоочистка после выбора');

check('Гибкий подбор', app.includes('coveredCritical > 0') && app.includes('requiredAdditions > 2') && app.includes('buildNearMatches'), 'разрешены 1–2 добавления и показываются близкие варианты');
check('Строгий режим без докупки', app.includes("mode === 'strict' && additions > 0") && app.includes('return false'), 'строгий режим не предлагает обязательную докупку');
check('Расширенная выдача', app.includes('state.results = evaluated;') && app.includes('visibleResultCount: 6') && app.includes('data-show-more'), 'искусственный лимит в три рецепта снят');
check('Грамматика количества', app.includes("productsLabel(number)") && app.includes("'продукт', 'продукта', 'продуктов'"), '1 продукт / 2 продукта / 5 продуктов');
check('Быстрые действия при пустой выдаче', app.includes('data-relax-mode') && app.includes('data-relax-time') && app.includes('data-relax-difficulty'), 'можно расширить условия одним нажатием');

check('Бытовое округление', app.includes('roundTo(value, 5)') && app.includes('formatQuarter(value)') && app.includes('Количество рассчитано на'), 'граммы/мл и ложки не выводятся с лишними десятичными');
check('Конкретизация нарезки', app.includes('STEP_REFINEMENTS') && app.includes('кубиками 2–3 см') && app.includes('пластинками около 5 мм'), 'для проблемных шагов добавлены размеры и форма нарезки');
check('Визуальный слой', html.includes('preview4.css') && html.includes('preview5.css') && css4.includes('.portion-card') && css5.includes('.portion-stepper'), 'новые контролы оформлены для desktop/mobile');
check('Статус в интерфейсе', app.includes('editorialStatusView') && app.includes('Проверен редакционно') && app.includes('фактическое приготовление ещё не подтверждено'), 'пояснение статуса присутствует');
check('Два потока обратной связи', app.includes('приготовление блюда') && app.includes('открытая бета'), 'приготовление отделено от общего отзыва об открытой бете');
check('Блокировка готовки без обязательных продуктов', app.includes("hasMissingRequired ? 'disabled' : ''") && app.includes('Сначала добавьте обязательные продукты'), 'пошаговый режим не стартует при отсутствии обязательных ингредиентов');
check('Предупреждение о превышении времени', app.includes('Рецепту нужно больше времени') && app.includes('timeMismatch'), 'карточка рецепта сохраняет контекст ограничения по времени');
check('Свежесть PWA', sw.includes('async function networkFirst') && !sw.includes('cached || fetch'), 'при наличии сети загружается актуальный файл');
check('Публичная ссылка', readme.includes('https://idirisov-pro.github.io/kulinarnyi-assistent/') && html.includes('Открытая бета · версия 3.1-beta.1'), 'публичная бета и ссылка зафиксированы');
check('Отзыв не привязан к WhatsApp', !html.includes('Отправить через WhatsApp') && !app.includes('wa.me'), 'обратная связь не зависит от конкретного мессенджера');
check('Share/clipboard обратная связь', app.includes('navigator.share') && app.includes('navigator.clipboard.writeText'), 'используется системное меню или буфер обмена');
check('Open Graph metadata', html.includes('og:title') && html.includes('og:url'), 'публичная ссылка готова к превью в соцсетях');

check('Прозрачность каталога 3.1', release31.includes('catalog-state-panel') && release31.includes('catalogStats()'), 'состояние каталога показано до первого подбора');
check('Разделение черновиков 3.1', release31.includes('experimental-results') && release31.includes("new Set(['reviewed', 'cooked', 'approved'])"), 'черновики вынесены отдельно от более надёжных рецептов');
check('Объяснимый подбор 3.1', release31.includes('Почему подходит') && release31.includes('directMatchNames'), 'карточка объясняет прямые совпадения по продуктам');
check('Честная пустая выдача 3.1', release31.includes('отсутствие результата может означать только то') && release31.includes('catalog-limit-note'), 'ограниченность каталога не маскируется');
check('Локальная UTM-атрибуция 3.1', release31.includes('utm_source') && release31.includes('sessionStorage') && !/\bfetch\s*\(/.test(release31) && !release31.includes('XMLHttpRequest'), 'источник теста сохраняется локально без автоматической сетевой аналитики');
check('Стили 3.1', css6.includes('.experimental-results') && css6.includes('.why-fit-box') && css6.includes('.catalog-state-panel'), 'слой доверия адаптирован для интерфейса');
check('PWA-ресурсы 3.1', sw.includes('preview6.css?v=3.1-beta.1') && sw.includes('release-3.1.js?v=3.1-beta.1'), 'новый слой входит в offline cache');

const failed = results.filter(item => !item.passed);
console.log(JSON.stringify({version:'3.1-beta.1', passed:failed.length === 0, results}, null, 2));
if (failed.length) process.exitCode = 1;
