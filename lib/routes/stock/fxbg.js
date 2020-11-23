const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const url = 'https://www.fxbaogao.com/archives/industry/%E7%94%B5%E6%B0%94%E8%AE%BE%E5%A4%87';
    const ori_url = 'https://www.fxbaogao.com';
    const res = await got.get(url);
    const $ = cheerio.load(res.data);
    const list = $('._1AK5AZscMXh_zS2JdcTUzq .LEHU3AZ7fprVSjdmVdCRU').get();

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

            const single = {
                title,
                link: itemUrl,
                description: $d('._3YkZ9CkQoaVjdG6JHSLmoe').html(),
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
