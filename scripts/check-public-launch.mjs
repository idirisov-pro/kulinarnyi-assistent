import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };

const privacy = read('privacy.html');
const terms = read('terms.html');
const pilot = read('docs/PUBLIC_ACQUISITION_PILOT_2026-08.md');
const release = read('release-3.1.js');
const launchReadme = read('docs/README_PUBLIC_LAUNCH.md');
const organicChecklist = read('docs/ORGANIC_PILOT_READINESS_CHECKLIST.md');
const organicMetrics = read('docs/ORGANIC_PILOT_METRICS_TEMPLATE.md');

expect(privacy.includes('<title>Конфиденциальность'), 'privacy.html: отсутствует заголовок');
expect(privacy.includes('не отправляются приложением автоматически'), 'privacy.html: должна быть явная формулировка об отсутствии автоматической отправки UTM');
expect(privacy.includes('локальное хранилище браузера'), 'privacy.html: не описано локальное хранение');
expect(terms.includes('<title>Условия использования'), 'terms.html: отсутствует заголовок');
expect(terms.includes('публичная бета'), 'terms.html: не обозначен статус публичной беты');
expect(terms.includes('не используйте приложение как единственный источник'), 'terms.html: отсутствует ограничение по пищевой безопасности');

expect(pilot.includes('0 сомов'), 'pilot: бюджет первой волны должен быть явно равен 0 сомов');
expect(pilot.includes('без рекламного бюджета'), 'pilot: должен быть явно обозначен бесплатный запуск');
expect(launchReadme.includes('0 сомов'), 'launch README: не зафиксирован нулевой бюджет');
expect(organicChecklist.includes('0 сомов'), 'organic checklist: не зафиксирован нулевой бюджет');
expect(organicMetrics.includes('0 сомов'), 'organic metrics: не зафиксирован нулевой бюджет');

const utmLinks = [...pilot.matchAll(/https:\/\/idirisov-pro\.github\.io\/kulinarnyi-assistent\/\?utm_[^`\s]+/g)].map(match => match[0]);
expect(utmLinks.length >= 4, 'pilot: ожидается минимум четыре размеченные бесплатные ссылки');
for (const link of utmLinks) {
  const url = new URL(link);
  const medium = url.searchParams.get('utm_medium') || '';
  expect(Boolean(url.searchParams.get('utm_source')), `pilot: нет utm_source в ${link}`);
  expect(Boolean(medium), `pilot: нет utm_medium в ${link}`);
  expect(Boolean(url.searchParams.get('utm_campaign')), `pilot: нет utm_campaign в ${link}`);
  expect(Boolean(url.searchParams.get('utm_content')), `pilot: нет utm_content в ${link}`);
  expect(!medium.startsWith('paid_'), `pilot: запрещён платный utm_medium ${medium}`);
}

expect(!pilot.includes('utm_medium=paid_social'), 'pilot: не должен содержать paid_social');
expect(!pilot.includes('utm_medium=paid_search'), 'pilot: не должен содержать paid_search');
expect(release.includes("const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']"), 'release-3.1.js: UTM-схема приложения не совпадает с пилотом');
expect(!/\bfetch\s*\(/.test(release), 'release-3.1.js: обнаружена автоматическая сеть через fetch');
expect(!release.includes('XMLHttpRequest'), 'release-3.1.js: обнаружена автоматическая сеть через XMLHttpRequest');

if (errors.length) {
  console.error(JSON.stringify({ passed: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ passed: true, legalPages: 2, taggedLinks: utmLinks.length, acquisitionBudgetKgs: 0 }, null, 2));
