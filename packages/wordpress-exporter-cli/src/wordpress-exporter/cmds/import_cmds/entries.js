import path from 'path';
import fs from 'fs-extra';

export const command = 'entries';
export const describe = 'Import entries to Contentful';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'Select root directory where to prepare data.',
    default: `.${path.sep}data`,
  });
}
export async function handler({ lang, dir }) {
  // TODO
}
