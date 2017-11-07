import fs from 'fs-extra';
import glob from 'globby';
import path from 'path';

import makeContentfulAssetFrom from '../../templates/asset';

const IMAGES_REGEX = /(src="(https?:\/\/(www.freeletics.com\/)([a-zA-Z0-9-_./]+)(\/wp-content\/uploads\/sites\/)([a-zA-Z0-9-_./]+)(\.(png|gif|jpg|jpeg))))/gi;

async function extractUrls(filename) {
  const post = await fs.readJson(filename);
  const urls = (post.content.rendered.match(IMAGES_REGEX) || []).map(url =>
    // Remove 'src="' prefix from urls
    url.replace(url.substr(0, 5), ''));

  if (post.image_landscape && post.image_landscape[0]) {
    urls.push(post.image_landscape[0]);
  }

  return urls;
}

async function listAssets(postDir) {
  const posts = await glob('*.json', { cwd: postDir });
  const assetsUrls = await Promise.all(posts.map(post =>
    extractUrls(path.join(postDir, post))));

  return new Set([].concat(...assetsUrls));
}

function generateId() {
  // TODO
}

function prepareAssets(lang, urlsSet) {
  const urls = Array.from(urlsSet);

  return urls.map(url => makeContentfulAssetFrom({
    lang,
    id: generateId(),
    url,
    filename: url.match(/([a-zA-Z0-9-_.]+)(\.(png|gif|jpg|jpeg))/gi).toString(),
  }));
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
  const urls = await listAssets(path.resolve(dir, lang, 'dump/entries/post'));
  const assets = prepareAssets(lang, urls);

  await fs.writeJson(path.resolve(dir, lang, 'export/assets.json'), assets);
}
