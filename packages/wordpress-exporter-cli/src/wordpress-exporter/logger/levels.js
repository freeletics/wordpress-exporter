/*
 * Copyright Remi Barraquand
 * The code was borrowed from https://github.com/barraq/spinr
 *
 * @see https://github.com/barraq/spinr/blob/master/lib/logger/levels.js
 */

const NONE = Symbol.for('none');
const ERROR = Symbol.for('error');
const WARN = Symbol.for('warn');
const NOTICE = Symbol.for('notice');
const INFO = Symbol.for('info');
const ALL = Symbol.for('all');

const LEVELS = Object.create({
  for: (name) => {
    const level = LEVELS[name.toUpperCase()];

    if (level) {
      return level;
    }

    throw new Error(`Unknown level '${name}'`);
  },
  from: (thing) => {
    if (typeof thing === 'symbol') {
      return thing;
    }

    return LEVELS.for(thing);
  },
}, {
  NONE: { value: NONE, enumerable: true },
  ERROR: { value: ERROR, enumerable: true },
  WARN: { value: WARN, enumerable: true },
  NOTICE: { value: NOTICE, enumerable: true },
  INFO: { value: INFO, enumerable: true },
  ALL: { value: ALL, enumerable: true },
});

export function verbosity(name) {
  switch (LEVELS.from(name)) {
    case NONE: return Infinity;
    case ERROR: return 5;
    case WARN: return 4;
    case INFO: return 2;
    case ALL: return 1;
    default: return 3;
  }
}

export default Object.freeze(LEVELS);
