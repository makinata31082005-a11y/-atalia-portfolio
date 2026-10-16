// снимает каждую полосу из mock/build.html в jpg: node mock/build.mjs (нужен Playwright)
import { createRequire } from 'module';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const b = await chromium.launch(), p = await b.newPage();
await p.goto(new URL('build.html', import.meta.url).href); await p.evaluate(() => document.fonts.ready);
const out = { 'news-1':'news/p-1','news-2':'news/p-2','news-3':'news/p-3','news-4':'news/p-4','news-5':'news/p-5','news-6':'news/p-6',
  'bk-cover':'booklet/cover','bk-flap':'booklet/flap','bk-1':'booklet/p-1','bk-2':'booklet/p-2','bk-3':'booklet/p-3' };
for (const [id, f] of Object.entries(out)) await (await p.$('#' + id)).screenshot({ path: new URL('../' + f + '.jpg', import.meta.url).pathname, type: 'jpeg', quality: 82 });
console.log(await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).join(',')));
await b.close();
