import fs from 'node:fs';

const OLD_VERSION = '3.0-preview.5';
const NEW_VERSION = '3.1-beta.1';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function write(file, value) {
  fs.writeFileSync(file, value, 'utf8');
}

function replaceRequired(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw new Error(`Upgrade marker not found: ${label}`);
  return text.replace(from, to);
}

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

function insertBefore(text, marker, addition, label) {
  if (text.includes(addition.trim())) return text;
  if (!text.includes(marker)) throw new Error(`Insert marker not found: ${label}`);
  return text.replace(marker, `${addition}${marker}`);
}

function patchIndex() {
  let html = read('index.html');
  html = replaceAll(html, OLD_VERSION, NEW_VERSION);
  html = html.replace('Кулинарный ассистент — открытая бета', 'Кулинарный ассистент — публичная бета 3.1');
  html = html.replace(
    'Выберите продукты, время и количество порций — получите подходящие рецепты и пошаговое приготовление.',
    'Выберите продукты, время и порции — получите объяснимый подбор с явным статусом проверки каждого рецепта.'
  );
  html = insertBefore(
    html,
    '  <title>Кулинарный ассистент</title>',
    `  <link rel="stylesheet" href="preview6.css?v=${NEW_VERSION}" />\n`,
    'preview6 stylesheet'
  );
  html = insertBefore(
    html,
    '</body>',
    `  <script src="release-3.1.js?v=${NEW_VERSION}"></script>\n`,
    'release 3.1 script'
  );
  html = html.replace(
    /<p class="alpha-notice">[\s\S]*?<\/p>/,
    '<p class="alpha-notice"><strong>Публичная бета 3.1:</strong> каталог пока ограничен. Редакционно проверенные рецепты показываются первыми, а черновики вынесены отдельно и явно помечены как экспериментальные. Каждый результат объясняет, почему он попал в подбор. «Проверен редакционно» всё ещё не означает подтверждённое фактическое приготовление. При серьёзной пищевой аллергии не используйте приложение как единственный источник безопасности.</p>'
  );
  write('index.html', html);
}

function patchApp() {
  let app = read('app.js');
  app = replaceAll(app, OLD_VERSION, NEW_VERSION);
  write('app.js', app);
}

function patchManifest() {
  let manifest = read('manifest.webmanifest');
  manifest = replaceAll(manifest, OLD_VERSION, NEW_VERSION);
  manifest = manifest.replace(
    'Подбор рецептов по продуктам, времени и порциям с близкими вариантами, бытовым округлением и пошаговым режимом.',
    'Подбор рецептов по продуктам, времени и порциям с объяснением совпадений, явным статусом проверки и пошаговым режимом.'
  );
  write('manifest.webmanifest', manifest);
}

function patchServiceWorker() {
  let sw = read('service-worker.js');
  sw = replaceAll(sw, OLD_VERSION, NEW_VERSION);
  sw = replaceRequired(
    sw,
    "const CACHE_NAME = 'culinary-assistant-v3-preview-5-public-beta-brand-3';",
    "const CACHE_NAME = 'culinary-assistant-v3-1-beta-1-trust-release-brand-3';",
    'service worker cache name'
  );
  sw = insertBefore(
    sw,
    `  './app.js?v=${NEW_VERSION}',`,
    `  './preview6.css?v=${NEW_VERSION}',\n`,
    'preview6 cached asset'
  );
  sw = insertBefore(
    sw,
    `  './search-utils.js?v=${NEW_VERSION}',`,
    `  './release-3.1.js?v=${NEW_VERSION}',\n`,
    'release 3.1 cached asset'
  );
  write('service-worker.js', sw);
}

function patchReadme() {
  let md = read('README.md');
  md = md.replace(/^# Кулинарный ассистент — версия .*$/m, `# Кулинарный ассистент — версия ${NEW_VERSION}`);
  md = md.replace(
    'Пятый рабочий инкремент версии 3.0. Это статическое PWA без сервера, регистрации, платных API и внешней базы данных.',
    'Публичная beta-сборка 3.1 для тестов с незнакомыми пользователями. Это статическое PWA без сервера, регистрации, платных API и внешней базы данных.'
  );
  const section = `## Что изменено в ${NEW_VERSION}\n\nИзменения основаны на исследовательском отчёте 2026-08-26 и направлены на доверие к выдаче и качество первого результата.\n\n- на главной явно показано текущее состояние каталога;\n- reviewed/cooked/approved-рецепты показываются раньше draft;\n- draft-рецепты вынесены в отдельный раскрываемый блок «Экспериментальные рецепты»;\n- если проверенных вариантов нет, экспериментальный блок раскрывается автоматически с предупреждением;\n- на каждой карточке появился блок «Почему подходит» с прямыми совпадениями по выбранным продуктам;\n- карточка самого рецепта получила усиленный статус доверия и объяснение попадания в подбор;\n- пустая выдача честно объясняет ограничение текущего каталога;\n- UTM-метки платных/публичных тестов сохраняются только локально и добавляются в отзыв только при добровольной отправке пользователем;\n- автоматической сетевой аналитики и новых внешних сервисов нет.\n\n`;
  if (!md.includes(`## Что изменено в ${NEW_VERSION}`)) {
    md = insertBefore(md, '## Что сохранено', section, 'README current release section');
  }
  md = md.replace('Сборка 3.0-preview.5 переведена из закрытого тестирования в открытую публичную бету.', `Сборка ${NEW_VERSION} продолжает открытую публичную бету и подготовлена для контролируемых тестов привлечения пользователей.`);
  md = md.replace('## Что изменено в 3.0-preview.5', '## История: что было исправлено в 3.0-preview.5');
  write('README.md', md);
}

function patchQualityCheck() {
  let qc = read('quality-check.mjs');
  qc = replaceAll(qc, OLD_VERSION, NEW_VERSION);
  qc = replaceAll(qc, 'v3-preview-5', 'v3-1-beta-1');
  qc = replaceRequired(
    qc,
    "  'index.html','styles.css','preview4.css','preview5.css','search-utils.js','app.js','service-worker.js','manifest.webmanifest',",
    "  'index.html','styles.css','preview4.css','preview5.css','preview6.css','search-utils.js','release-3.1.js','app.js','service-worker.js','manifest.webmanifest',",
    'required 3.1 files'
  );
  qc = replaceRequired(
    qc,
    "const readme = fs.readFileSync(path.join(root,'README.md'),'utf8');",
    "const readme = fs.readFileSync(path.join(root,'README.md'),'utf8');\nconst css6 = fs.readFileSync(path.join(root,'preview6.css'),'utf8');\nconst release31 = fs.readFileSync(path.join(root,'release-3.1.js'),'utf8');",
    '3.1 fixture reads'
  );
  const extraChecks = `check('Прозрачность каталога 3.1', release31.includes('catalog-state-panel') && release31.includes('catalogStats()'), 'состояние каталога показано до первого подбора');\ncheck('Разделение черновиков 3.1', release31.includes('experimental-results') && release31.includes("new Set(['reviewed', 'cooked', 'approved'])"), 'черновики вынесены отдельно от более надёжных рецептов');\ncheck('Объяснимый подбор 3.1', release31.includes('Почему подходит') && release31.includes('directMatchNames'), 'карточка объясняет прямые совпадения по продуктам');\ncheck('Честная пустая выдача 3.1', release31.includes('отсутствие результата может означать только то') && release31.includes('catalog-limit-note'), 'ограниченность каталога не маскируется');\ncheck('Локальная UTM-атрибуция 3.1', release31.includes('utm_source') && release31.includes('sessionStorage') && !/\\bfetch\\s*\\(/.test(release31) && !release31.includes('XMLHttpRequest'), 'источник теста сохраняется локально без автоматической сетевой аналитики');\ncheck('Стили 3.1', css6.includes('.experimental-results') && css6.includes('.why-fit-box') && css6.includes('.catalog-state-panel'), 'слой доверия адаптирован для интерфейса');\ncheck('PWA-ресурсы 3.1', sw.includes('preview6.css?v=${NEW_VERSION}') && sw.includes('release-3.1.js?v=${NEW_VERSION}'), 'новый слой входит в offline cache');\n\n`;
  if (!qc.includes("check('Прозрачность каталога 3.1'")) {
    qc = insertBefore(qc, 'const failed = results.filter(item => !item.passed);', extraChecks, '3.1 quality checks');
  }
  write('quality-check.mjs', qc);
}

function patchWorkflow() {
  let workflow = read('.github/workflows/quality-check.yml');
  if (!workflow.includes('node --check release-3.1.js')) {
    workflow = workflow.replace('          node --check app.js\n', '          node --check app.js\n          node --check release-3.1.js\n');
  }
  write('.github/workflows/quality-check.yml', workflow);
}

patchIndex();
patchApp();
patchManifest();
patchServiceWorker();
patchReadme();
patchQualityCheck();
patchWorkflow();
console.log(`Applied ${NEW_VERSION} upgrade.`);
