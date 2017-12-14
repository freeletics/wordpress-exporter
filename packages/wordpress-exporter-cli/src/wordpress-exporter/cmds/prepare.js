export const command = 'prepare <cmd>';
export const describe = 'Prepare exported data for Contentful';

export function builder(yargs) {
  return yargs.commandDir('prepare_cmds');
}
