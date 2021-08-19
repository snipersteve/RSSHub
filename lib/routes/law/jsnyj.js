/**
 * 江苏发改委
 * author：steve
 */

 const cheerio = require('cheerio');
 const got = require('@/utils/got');
 const date = require('@/utils/date');
 
 module.exports = async (ctx) => {
     const url = 'http://fzggw.jiangsu.gov.cn/col/col284/index.html';
     const ori_url = 'http://fzggw.jiangsu.gov.cn';
 
     const browser = await require('@/utils/puppeteer')();
 
     const page = await browser.newPage();
     await page.goto(url);
     const html = await page.evaluate(() => document.documentElement.innerHTML);
 
     browser.close();
     const $ = cheerio.load(html);
 
     const list = $('div.default_pgContainer li').get();
 
     const out = await Promise.all(
         list.map(async (item) => {
             const $ = cheerio.load(item);
 
             const title = $('a').attr('title');
             const sub_url = $('a').attr('href');
             const itemUrl = ori_url + sub_url;
 
             const cache = await ctx.cache.get(itemUrl);
             if (cache) {
                 return Promise.resolve(JSON.parse(cache));
             }
 
             const responses = await got.get(itemUrl);
             const $d = cheerio.load(responses.data);
 
             const content = $d('div.detail_con').html();
 
             const single = {
                 title,
                 link: itemUrl,
                 description: content,
             };
 
             ctx.cache.set(itemUrl, JSON.stringify(single));
             return Promise.resolve(single);
         })
     );
     ctx.state.data = {
         title: $('title').text(),
         link: url,
         item: out,
     };
 };
 