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

async function setupBaseDir({ dir, lang }) {
  const basedir = path.join(path.resolve(dir), lang);

  await fs.remove(basedir);
  await fs.mkdirs(path.join(basedir, 'assets'));

  ['post', 'category'].map(async (type) => {
    await fs.mkdirs(path.join(basedir, 'entries', type));
  });

  return basedir;
}

export default async ({ host, lang, site, dir }) => {
  const wp = connect({ host, lang, site });

  try {
    const basedir = await setupBaseDir({ dir, lang });

    const posts = await fetchAllPosts(wp);
    logger.info(`Retrieved ${posts.length} posts`);

    posts.map(async (post) => {
      const file = path.join(basedir, 'entries', 'post', `${post.id}.json`);
      logger.info(`Outputting post ${post.id} in ${path.relative(basedir, file)}`);
      await fs.writeJson(file, post);
    });
  } catch (error) {
    logger.error(error);
  }
};
