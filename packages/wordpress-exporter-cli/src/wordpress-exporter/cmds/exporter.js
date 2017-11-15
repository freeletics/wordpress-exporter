import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';
import { connect } from '../utils';

async function fetchAllPosts(wp, { offset = 0, perPage = 100 } = {}) {
  const posts = await wp.posts().perPage(perPage).offset(offset);

  if (posts.length === perPage) {
    return posts.concat(await fetchAllPosts(wp, { offset: offset + perPage }));
  }

  return posts;
}

async function fetchAllCategories(wp) {
  return wp.categories();
}

function validBaseDir(basedir) {
  return fs.existsSync(path.join(basedir, 'dump', 'assets')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'post')) &&
  fs.existsSync(path.join(basedir, 'dump', 'entries', 'category'));
}

export const command = 'export';
export const describe = 'Export site to json';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to export data',
    default: `.${path.sep}data`,
  });
}
export async function handler({
  host, lang, site, dir,
}) {
  const wp = connect({ host, lang, site });
  logger.info('Connection to Wordpress established.');

  try {
    const basedir = path.join(path.resolve(dir), lang);

    if (!validBaseDir(basedir)) {
      throw new Error(`Directory ${dir} is not setup properly, please run init first`);
    }

    logger.info('Fetching posts...');
    const posts = await fetchAllPosts(wp);
    logger.info(`Retrieved ${posts.length} posts`);

    logger.info('Fetching categories...');
    const categories = await fetchAllCategories(wp);
    logger.info(`Retrieved ${categories.length} categories`);

    logger.info('Exporting posts...');
    posts.map(async (post) => {
      const file = path.join(basedir, 'dump', 'entries', 'post', `${site}-${post.id}.json`);
      logger.info(`Outputting post ${post.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, post);
    });

    logger.info('Exporting categories...');
    categories.map(async (category) => {
      const file = path.join(basedir, 'dump', 'entries', 'category', `${site}-${category.id}.json`);
      logger.info(`Outputting category ${category.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, category);
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
