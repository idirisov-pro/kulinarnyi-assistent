import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.dirname(new URL(import.meta.url).pathname);
const results = [];
const check = (name, passed, detail) => results.push({name,passed,detail});

const requiredFiles = ['index.html','styles.css','app.js','service-worker.js','manifest.webmanifest','data/ingredients.js','data/recipes.js','icons/icon-192.png','icons/icon-512.png'];
check('PWA-файлы',requiredFiles.every(file => fs.existsSync(path.join(root,file))),`${requiredFiles.length} обязательных файлов`);

const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'data/ingredients.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'data/recipes.js'),'utf8'),context);
const recipes = context.window.RECIPES;
const ingredientIds = new Set([...context.window.INGREDIENTS,...context.window.PANTRY_INGREDIENTS].map(item => item.id));
const allowedStatuses = new Set(['draft','reviewed','cooked','approved']);

check('Количество рецептов',recipes.length === 23,`${recipes.length} рецепта`);
check('Уникальные ID',new Set(recipes.map(r => r.id)).size === recipes.length,'дубликатов нет');
check('Редакционные поля',recipes.every(r => r.id && r.editorial?.version && allowedStatuses.has(r.editorial?.status)),'ID, версия и допустимый статус есть у каждого рецепта');
check('Партия B1',recipes.filter(r => r.editorial?.batch === 'B1' && r.editorial?.status === 'reviewed').length === 10,'10 рецептов reviewed');
check('Черновики',recipes.filter(r => r.editorial?.status === 'draft').length === 13,'13 рецептов draft');
check('Ссылки на ингредиенты',recipes.every(r => r.ingredients.every(i => ingredientIds.has(i.id)) && r.substitutions.every(s => ingredientIds.has(s.from) && ingredientIds.has(s.to))),'неизвестных ингредиентов нет');
check('Структура рецептов',recipes.every(r => r.title && r.ingredients.length && r.steps.length && r.equipment.length && r.safety),'обязательные разделы заполнены');

const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const app = fs.readFileSync(path.join(root,'app.js'),'utf8');
const sw = fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
check('Маркер сборки',html.includes('3.0-preview.3') && app.includes("BUILD_VERSION = '3.0-preview.3'") && sw.includes('v3-preview-3'),'HTML, приложение и кэш согласованы');
check('Статус в интерфейсе',app.includes('editorialStatusView') && app.includes('Проверен редакционно') && app.includes('фактическое приготовление ещё не подтверждено'),'пояснение статуса присутствует');
check('Два потока обратной связи',app.includes('клиент приготовил блюдо') && app.includes('ручная проверка приложения') && html.includes('Проверка приложения'),'клиентское приготовление отделено от функциональной проверки');

const failed = results.filter(item => !item.passed);
console.log(JSON.stringify({version:'3.0-preview.3',passed:failed.length === 0,results},null,2));
if (failed.length) process.exitCode = 1;
