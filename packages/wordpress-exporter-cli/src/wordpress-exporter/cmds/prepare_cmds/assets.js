import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import uniqid from 'uniqid';

import { rewriteWithCDN } from '../../utils';
import compileToContentfulAsset from '../../templates/asset';

const IMAGES_REGEX = /(src="(https?:\/\/(www.freeletics.com\/)([a-zA-Z0-9-_./]+)(\/wp-content\/uploads\/sites\/)([a-zA-Z0-9-_./]+)(\.(png|gif|jpg|jpeg))))/gi;

async function extractUrls(filename) {
  const post = await fs.readJson(filename);
  const urls = (post.content.rendered.match(IMAGES_REGEX) || []).map(url =>
    // Remove 'src="' prefix from urls
    url.replace(/^src="/, ''));

  if (post.image_landscape && post.image_landscape[0]) {
    urls.push(post.image_landscape[0]);
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
  const assets = Array.from(urls).map(url => compileToContentfulAsset({
    lang,
    // Note: here we generate our own Contentful sys.id
    // we prefix it with "asset-" for easier debugging.
    id: uniqid('asset-'),
    url: rewriteWithCDN(url),
  }));

  await fs.writeJson(path.resolve(dir, lang, 'export/assets.json'), assets);
}
