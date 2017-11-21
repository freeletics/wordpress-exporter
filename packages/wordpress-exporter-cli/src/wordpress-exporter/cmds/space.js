import path from 'path';
import fs from 'fs-extra';

import getClient, { importToSpace } from '../contentful';
import logger from '../logger';
import compileToContentfulContentTypes from '../templates/space/contentTypes';

import { SPACE_CONFIG_DIR, SPACE_CONFIG_FILE } from '../utils';

export const command = 'space <cmd>';
export const describe = 'Manage Contentful spaces';
export function builder(yargs) {
  return yargs
    .command({
      command: 'create',
      describe: 'Create a Contentful space for given lang and site',
      handler: async ({ site, lang }) => {
        try {
          const configFile = path.join(SPACE_CONFIG_DIR, SPACE_CONFIG_FILE(site, lang));

          if (!fs.pathExistsSync(configFile)) {
            // Ensure space config dir exists
            await fs.mkdirs(SPACE_CONFIG_DIR);

            // Create space
            logger.info(`Creating space for site ${site} and lang ${lang}`);
            const space = await getClient().createSpace({
              name: `${site}/${lang}`,
              defaultLocale: lang,
            });
            fs.writeJson(configFile, {
              id: space.sys.id,
              name: space.name,
              lang,
            });

            logger.info(`Creating contentTypes for space ${space.sys.id}`);

            await importToSpace(
              space.sys.id,
              { contentTypes: compileToContentfulContentTypes(space.sys.id) },
            );
          } else {
            logger.error(`Space already exists for site ${site} and lang ${lang}`);
          }
        } catch (error) {
          logger.error(error);
        }
      },
    })
    .command({
      command: 'delete',
      describe: 'Delete the Contentful space for given lang and site',
      handler: async ({ site, lang }) => {
        try {
          const configFile = path.join(SPACE_CONFIG_DIR, SPACE_CONFIG_FILE(site, lang));

          if (!fs.pathExistsSync(configFile)) {
            throw new Error(`No space config found for site ${site} and lang ${lang}`);
          } else {
            const config = await fs.readJson(configFile);
            const space = await getClient().getSpace(config.id);

            logger.info(`Deleting space ${space.sys.id} for site ${site} and lang ${lang}`);

            await space.delete();
            fs.remove(configFile);
          }
        } catch (error) {
          logger.error(error);
          process.exit(1);
        }
      },
    });
}
