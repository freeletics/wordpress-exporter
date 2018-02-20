import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import Promise from 'bluebird';

import logger from '../../logger';

import { importToSpace, exportFromSpace, CHUNK_SIZE } from '../../contentful';
import { SPACE_CONFIG_DIR, SPACE_CONFIG_FILE } from '../../utils';

export const command = 'assets';
export const describe = 'Import assets to Contentful';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'Select root directory where to prepare data.',
    default: `.${path.sep}data`,
  });
}
export async function handler({ site, lang, dir }) {
  try {
    const configFile = path.join(SPACE_CONFIG_DIR, SPACE_CONFIG_FILE(site, lang));

    if (!fs.pathExistsSync(configFile)) {
      throw new Error(`No space config found for site ${site} and lang ${lang}`);
    } else {
      const space = await fs.readJson(configFile);
      const assets = await fs.readJson(path.resolve(dir, lang, 'export', 'assets.json'));

      const chunks = _.chunk(assets, CHUNK_SIZE);
      logger.info(`Importing ${assets.length} assets into ${chunks.length} chunks to space ${space.id}`);

      await Promise.mapSeries(chunks, async (chunk, id) => {
        logger.info(` Processing chunk ${id}/${chunks.length}`);
        return importToSpace(
          space.id,
          { assets: chunk },
        );
      });

      logger.info(`Fetching Contentful assets URLs from space ${space.id}`);
      const spaceExport = await exportFromSpace(
        space.id,
        path.resolve(dir, lang, 'export'),
        {
          skipContentModel: true,
          skipContent: false,
          skipRoles: true,
          skipWebhooks: true,
          saveFile: false,
        },
      );

      await fs.writeJson(path.resolve(dir, lang, 'export', 'contentful-export-assets.json'), spaceExport.assets);
    }
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}
