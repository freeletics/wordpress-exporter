import fs from 'fs-extra';
import glob from 'globby';
import path from 'path';
import toMarkdown from 'to-markdown';

async function listPosts(postDir) {
  return glob('*.json', { cwd: postDir });
}

async function prepare(filename) {
  const post = await fs.readJson(filename);
  post.content.rendered = toMarkdown(post.content.rendered);
  return post;
}

export const command = 'posts';
export const describe = 'Prepare posts for a Contentful import.';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'Select root directory where to prepare data.',
    default: `.${path.sep}data`,
  });
}
export async function handler({ lang, dir }) {
  const postDir = path.resolve(dir, lang, 'dump/entries/post');
  const posts = await listPosts(postDir);
  const xport = await Promise.all(posts.map(post =>
    prepare(path.join(postDir, post))));
  console.log(xport);
}
