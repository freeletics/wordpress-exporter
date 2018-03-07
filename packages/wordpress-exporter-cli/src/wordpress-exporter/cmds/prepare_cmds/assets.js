import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import uniqid from 'uniqid';

import { rewriteWithCDN } from '../../utils';
import compileToContentfulAsset from '../../templates/asset';
import logger from '../../logger';

const IMAGES_REGEX = /(src="(https?:\/\/((cdn|www).freeletics.com\/)([a-zA-Z0-9-_./]+)(\/wp-content\/uploads\/sites\/)([a-zA-Z0-9-_./]+)(\.(png|gif|jpg|jpeg))))/gi;

async function extractUrls(filename) {
  const post = await fs.readJson(filename);
  const content = post.site === 'blog' ? post.content.rendered : post.custom_fields_content;

  // Remove 'src="' prefix from urls
  const urls = (content.replace('\\"', '"').match(IMAGES_REGEX) || []).map(url => url.replace(/^src="/, ''));

  if (post.featured_media_url) {
    urls.push(post.featured_media_url);
  }

  return urls.map(url => url.replace(/^https?:/, ''));
}

async function listAssets(dir) {
  const posts = await glob('*.json', { cwd: dir });
  const urls = await Promise.all(posts.map(post => extractUrls(path.join(dir, post))));

  return new Set([].concat(...urls));
}

export const command = 'assets';
export const describe = 'Prepare assets for a Contentful import.';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'Select root directory where to prepare data.',
    default: `.${path.sep}data`,
  });
}
export async function handler({ lang, dir }) {
  const urls = await listAssets(path.resolve(dir, lang, 'dump', 'entries', 'post'));

  logger.info(`Extracted ${urls.size} unique asset urls.`);

  const assets = Array.from(urls).map(url => compileToContentfulAsset({
    lang,
    // Note: here we generate our own Contentful sys.id
    // we prefix it with "asset-" for easier debugging.
    id: uniqid('asset-'),
    url: rewriteWithCDN(url),
  }));

  await fs.writeJson(path.resolve(dir, lang, 'export/assets.json'), assets);
}
