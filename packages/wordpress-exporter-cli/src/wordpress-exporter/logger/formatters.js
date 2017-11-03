/*
 * Copyright Remi Barraquand
 * The code was borrowed from https://github.com/barraq/spinr
 *
 * @see https://github.com/barraq/spinr/blob/master/lib/logger/formatters.js
 */

import chalk from 'chalk';
import LEVELS from './levels';
import { isFunction, timestamp } from '../utils';

const FORMATTERS = [
  {
    name: 'log',
    handler: 'log',
    level: LEVELS.NOTICE,
  },
  {
    name: 'info',
    output: 'stdout',
    format: chalk.blue,
    level: LEVELS.INFO,
  },
  {
    name: 'warn',
    output: 'stderr',
    format: chalk.cyan,
    level: LEVELS.WARN,
  },
  {
    name: 'error',
    output: 'stderr',
    format: chalk.red,
    level: LEVELS.ERROR,
  },
  {
    name: 'time',
    output: 'stdout',
    format: chalk.bold,
    aside: option => `[${timestamp(option)}]`,
    level: LEVELS.NOTICE,
  },
];

function aside(formatter, options = {}) {
  let value;

  if (options.aside !== undefined) {
    value = options.aside;
  } else if (isFunction(formatter.aside)) {
    value = formatter.aside(options);
  } else {
    value = formatter.name;
  }

  if (value) {
    return formatter.format(value);
  }

  return false;
}

export default Object.freeze(FORMATTERS.map(formatter => ({
  name: formatter.name,
  output: formatter.output,
  handler: formatter.handler,
  format: formatter.format,
  level: formatter.level,
  aside: options => aside(formatter, options),
})));
