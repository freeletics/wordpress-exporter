export const command = 'import <cmd>';
export const describe = 'Import content to Contentful';
export function builder(yargs) {
  return yargs.commandDir('import_cmds');
}
