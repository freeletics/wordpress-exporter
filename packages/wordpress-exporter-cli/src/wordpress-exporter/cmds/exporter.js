import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';
import Promise from 'bluebird';
import logger from '../logger';
import { connect } from '../utils';
import settings from '../../../settings';

async function fetchFeaturedImage(wp, post) {
  const featuredImageId = post.featured_media;

  if (featuredImageId) {
    try {
      const featuredImage = await wp.media().id(featuredImageId);

      return Object.assign(
        {},
        post,
        { featured_media_url: featuredImage.guid.rendered },
      );
    } catch (error) {
      logger.error(`Couldn't fetch featured image for post ${post.id}`);
      logger.error(error.stack);

      return post;
    }
  }

  logger.warn(`Post ${post.id} with category ${post.categories[0]} is missing the featured image.`);

  return post;
}

async function fetchAllPosts(wp, categoryIds, { offset = 0, perPage = 100 } = {}) {
  let posts = await wp.posts().categories(categoryIds).perPage(perPage).offset(offset);
  posts = await Promise.mapSeries(posts, async post => fetchFeaturedImage(wp, post));

  if (posts.length === perPage) {
    return posts.concat(await fetchAllPosts(wp, categoryIds, { offset: offset + perPage }));
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

    logger.info('Fetching categories...');
    const allCategories = await fetchAllCategories(wp);
    const excludedCategoryIds = _.get(settings, `prepare.exclude.categories.${site}.${lang}`, []);
    const categories = allCategories.filter(category => !excludedCategoryIds.includes(category.id));
    logger.info(`Retrieved ${categories.length} categories`);

    logger.info('Fetching posts...');
    const categoryIds = categories.map(category => category.id);
    const posts = await fetchAllPosts(wp, categoryIds);
    logger.info(`Retrieved ${posts.length} posts`);

    logger.info('Exporting categories...');
    categories.map(async (category) => {
      const file = path.join(basedir, 'dump', 'entries', 'category', `${site}-${category.id}.json`);
      logger.info(`Outputting category ${category.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, category);
    });

    logger.info('Exporting posts...');
    posts.map(async (post) => {
      const file = path.join(basedir, 'dump', 'entries', 'post', `${site}-${post.id}.json`);
      logger.info(`Outputting post ${post.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, Object.assign({}, post, { site }));
    });
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
