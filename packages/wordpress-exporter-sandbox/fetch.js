const WPAPI = require('wpapi');
const prettyjson = require('prettyjson');

function wp({host, lang, site}) {
  console.info(`Create connection with ${host}/${lang}/${site}/wp-json`)

  return new WPAPI({
    endpoint: `${host}/${lang}/${site}/wp-json`
  });
}

async function fetch_all_posts({ lang, site }, { offset=0, perPage=100 } = {}) {
  const posts = await wp({ lang, site }).posts().perPage(perPage).offset(offset);

  if (posts.length === 100) {
    return posts.concat(await fetch_all_posts({ offset: offset + perPage }));
  }

  return posts;
}

const parser = require('yargs')
  .usage('\nUsage: fetch [options] <cmd> [args]')
  .option('host', {
    describe: 'choose a host',
    default: 'https://www.freeletics.com/',
  })
  .option('lang', {
    describe: 'choose locale',
    default: 'en',
    choices: ['en', 'fr', 'de', 'it', 'es', 'pt'],
  })
  .option('site', {
    describe: 'choose a site',
    default: 'blog',
    choices: ['blog', 'knowledge'],
  })
  .command({
    command: 'posts',
    desc: 'Fetch all posts',
    handler: argv => {
      const {host, lang, site} = argv;
      fetch_all_posts({ host, lang, site }).then(posts => {
        console.log(`Found ${posts.length} in site '${site}' for lang '${lang}'`);
      });
    },
  })
  .command({
    command: 'post <id>',
    desc: 'Fetch a post with given id',
    handler: argv => {
      const {host, lang, site, id} = argv;
      wp({ host, lang, site }).posts().id(id).then(post => {
        console.log(prettyjson.render(post));
      }).catch(console.error);
    }
  })
  .argv;
