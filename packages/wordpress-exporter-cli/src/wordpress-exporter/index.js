import path from 'path';
import logger from './logger';
import exporter from './exporter';

const options = require('yargs') // eslint-disable-line
  .usage('\nUsage: fetch [options] <cmd> [args]')
  .option('host', {
    describe: 'choose a host',
    default: 'https://www.freeletics.com/',
  })
  .option('lang', {
    describe: 'choose locale',
    default: 'en',
    choices: ['en', 'fr', 'de', 'it', 'es', 'pt'],
  })
  .option('site', {
    describe: 'choose a site',
    default: 'blog',
    choices: ['blog', 'knowledge'],
  })
  .option('silent', {
    boolean: true,
    describe: 'disable all logging',
  })
  .option('verbose', {
    alias: 'debug',
    boolean: true,
    describe: 'enable all logging',
  })
  .option('info', {
    boolean: true,
    describe: 'display contextual information',
  })
  .option('verbosity', {
    choices: ['all', 'error', 'warn', 'notice', 'info', 'none'],
    default: 'notice',
  })
  .command({
    command: 'export',
    desc: 'Export site to json',
    builder: yargs => yargs.option('dir', {
      describe: 'select root directory to export data',
      default: `.${path.sep}data`,
    }),
    handler: (argv) => {
      const { host, lang, site, dir } = argv;
      exporter({ host, lang, site, dir });
    },
  })
  .argv;

if (options.silent) {
  logger.verbosity = 'none';
} else if (options.verbose || options.debug || options.info) {
  logger.verbosity = 'all';
} else {
  logger.verbosity = options.verbosity;
}
