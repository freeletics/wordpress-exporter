import path from 'path';
import WPAPI from 'wpapi';
import logger from './logger';

export function connect({ host, lang, site }) {
  logger.info(`Create connection with ${host}/${lang}/${site}/wp-json`);

  return new WPAPI({
    endpoint: `${host}/${lang}/${site}/wp-json`,
  });
}

export function isFunction(thing) {
  return typeof thing === 'function';
}

export function timestamp({ date = new Date() } = {}) {
  return date.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

export function rewriteWithCDN(url) {
  return url.replace(/^\/\/www./, '//cdn.');
}

export const SPACE_CONFIG_DIR = path.resolve(process.cwd(), '.wordpress-exporter', 'spaces');
export const SPACE_CONFIG_FILE = (site, lang) => `${site}-${lang}.json`;
