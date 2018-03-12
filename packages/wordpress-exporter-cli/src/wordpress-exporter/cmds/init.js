import path from 'path';
import fs from 'fs-extra';
import logger from '../logger';

async function setupBaseDir({ dir, lang }) {
  const basedir = path.join(path.resolve(dir), lang);

  await fs.remove(basedir);
  await fs.mkdirs(path.join(basedir, 'dump'));
  await fs.mkdirs(path.join(basedir, 'export'));

  await fs.mkdirs(path.resolve(basedir, 'dump', 'assets'));

  ['post', 'category', 'tag'].map(async (type) => {
    await fs.mkdirs(path.resolve(basedir, 'dump', 'entries', type));
  });

  return basedir;
}

export const command = 'init';
export const describe = 'Init import/export workspace';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'select root directory to export data',
    default: `.${path.sep}data`,
  });
}
export async function handler({
  lang, dir,
}) {
  try {
    logger.info('Setting up basedir...');
    await setupBaseDir({ dir, lang });
  } catch (error) {
    logger.error(error);
  }
}
