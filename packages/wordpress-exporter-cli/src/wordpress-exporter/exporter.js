import path from 'path';
import fs from 'fs-extra';
import logger from './logger';
import { connect } from './utils';

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

async function setupBaseDir({ dir, lang }) {
  const basedir = path.join(path.resolve(dir), lang);

  await fs.remove(basedir);
  await fs.mkdirs(path.join(basedir, 'dump'));
  await fs.mkdirs(path.join(basedir, 'export'));

  await fs.mkdirs(path.resolve(basedir, 'dump', 'assets'));

  ['post', 'category'].map(async (type) => {
    await fs.mkdirs(path.resolve(basedir, 'dump', 'entries', type));
  });

  return basedir;
}

export default async ({
  host, lang, site, dir,
}) => {
  const wp = connect({ host, lang, site });

  try {
    const basedir = await setupBaseDir({ dir, lang });

    const posts = await fetchAllPosts(wp);
    logger.info(`Retrieved ${posts.length} posts`);

    const categories = await fetchAllCategories(wp);
    logger.info(`Retrieved ${categories.length} categories`);

    posts.map(async (post) => {
      const file = path.join(basedir, 'dump', 'entries', 'post', `${post.id}.json`);
      logger.info(`Outputting post ${post.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, post);
    });

    categories.map(async (category) => {
      const file = path.join(basedir, 'dump', 'entries', 'category', `${category.id}.json`);
      logger.info(`Outputting category ${category.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, category);
    });
  } catch (error) {
    logger.error(error);
  }
};
