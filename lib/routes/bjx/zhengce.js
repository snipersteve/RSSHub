const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const url = 'http://m.bjx.com.cn/policy/';
    const res = await got.get(url);
    const $ = cheerio.load(res.data);
    const list = $('ul.news_list_dlindex li').get().slice(0, 10);

    const out = await Promise.all(
        list.map(async (item) => {
            const $ = cheerio.load(item);
            const title = $('a .bjxlistnr h5').html();
            const itemUrl = $('a').attr('href');

            const cache = await ctx.cache.get(itemUrl);
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }

            const responses = await got.get(itemUrl);
            const $d = cheerio.load(responses.data);

            const single = {
                title,
                link: itemUrl,
                description: $d('.bjxd_content .cont').html(),
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
