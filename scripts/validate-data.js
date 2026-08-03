const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
for (const file of ['data/ingredients.js','data/recipes.js']) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}

const ingredients = [
  ...context.window.INGREDIENTS,
  ...context.window.PANTRY_INGREDIENTS
];
const recipes = context.window.RECIPES;
const ingredientIds = new Set(ingredients.map(item => item.id));
const errors = [];

function duplicateIds(items,label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) errors.push(`${label}: повторный id ${item.id}`);
    seen.add(item.id);
  }
}

duplicateIds(ingredients,'Ингредиенты');
duplicateIds(recipes,'Рецепты');

for (const recipe of recipes) {
  if (!recipe.title || !recipe.ingredients?.length || !recipe.steps?.length) errors.push(`${recipe.id}: неполная структура рецепта`);
  if (!(recipe.totalMinutes > 0) || !(recipe.activeMinutes > 0)) errors.push(`${recipe.id}: некорректное время`);
  const recipeIngredientIds = new Set();
  for (const item of recipe.ingredients) {
    if (!ingredientIds.has(item.id)) errors.push(`${recipe.id}: неизвестный ингредиент ${item.id}`);
    if (recipeIngredientIds.has(item.id)) errors.push(`${recipe.id}: ингредиент ${item.id} указан дважды`);
    recipeIngredientIds.add(item.id);
    if (!['critical','required','recommended','pantry'].includes(item.role)) errors.push(`${recipe.id}: неизвестная роль ${item.role}`);
  }
  for (const sub of recipe.substitutions || []) {
    if (!recipeIngredientIds.has(sub.from)) errors.push(`${recipe.id}: замена относится к отсутствующему в рецепте ${sub.from}`);
    if (!ingredientIds.has(sub.to)) errors.push(`${recipe.id}: неизвестная замена ${sub.to}`);
  }
  for (const [index,step] of recipe.steps.entries()) {
    if (!step.text || !(step.minutes > 0)) errors.push(`${recipe.id}: некорректный шаг ${index+1}`);
  }
}

if (errors.length) {
  console.error('Найдены ошибки:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`Проверка пройдена: ${ingredients.length} ингредиентов, ${recipes.length} рецептов.`);
