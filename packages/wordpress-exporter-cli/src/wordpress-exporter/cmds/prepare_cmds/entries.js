import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import remark from 'remark';
import uniqid from 'uniqid';
import json2csv from 'json2csv';
import breakdance from 'breakdance';
import { AllHtmlEntities } from 'html-entities';

import logger from '../../logger';
import { rewriteWithCDN } from '../../utils';
import compileToContentfulPost from '../../templates/entries/post';
import compileToContentfulCategory from '../../templates/entries/category';

const entities = new AllHtmlEntities();

async function listEntries(dir) {
  const files = await glob('*.json', { cwd: dir });
  return Promise.all(files.map(async (file) => {
    const site = path.basename(file).split('-')[0];
    const entry = await fs.readJson(path.join(dir, file));

    // Extend the entry with the source to know from which
    // site, blog or knowledge, this entry comes from.
    return Object.assign(entry, { site });
  }));
}

function htmlToMarkdown(content) {
  return new Promise((resolve, reject) => {
    remark().process(breakdance(content, { unsmarty: false }), (err, file) => {
      if (err) {
        reject(err);
      } else {
        resolve(String(file));
      }
    });
  });
}

function sanitizeString(string) {
  return entities.decode(string)
    .replace(/"| +(?= )/g, '')
    .trim();
}

function sanitizeTags(tags) {
  return tags.map(tag => sanitizeString(tag).toLowerCase());
}

function generateId({ code, site, id }) {
  // In Contentful the id of a post/category will be composed of:
  // - a code part - used to identify the source
  // - an id part - which is unique in a space
  // By transition the Contentful post id is also unique
  // Note: site is used to avoid id clash between blog and knowledge sites
  // during the merge.
  return `${String(code).padStart(2, '0')}${site === 'blog' ? 1 : 0}${String(id).padStart(5, '0')}`;
}

function getSource(settings, entry) {
  return entry.mlp_translations.find(element => element.lang === settings.source.lang);
}

function remapEntryId({ settings, lang, entry }) {
  const { codes } = settings.prepare.spaces;

  // In case we are processing the source language
  // we simply build up the new id based on the current id
  if (settings.source.lang === lang) {
    return generateId({
      code: codes[lang],
      site: entry.site,
      id: entry.id,
    });
  }

  // Check if the entry has a translation in source language
  // In our case the source language is always the same
  const source = getSource(settings, entry);

  if (source) {
    // In case the entry is mapped to the source, then use the source id
    return generateId({
      code: codes[settings.source.lang],
      site: entry.site,
      id: entry.type && entry.type === 'post' ? source.post_id : source.category_id,
    });
  }

  // This post become its own source in Contentful
  logger.warn(`Entry "${entry.type || entry.taxonomy}/${entry.id}.json" couldn't be linked to any source.`);
  return generateId({
    code: codes[lang],
    site: entry.site,
    id: entry.id,
  });
}

async function processHtml({
  content, wpAssetsUrlToContentfulIdMap, contentfulIdtoContentfulAssetsUrlMap,
}) {
  const ASSETS_REGEX = /(\/\/(www.freeletics.com\/)([a-zA-Z0-9-_./]+)(\/wp-content\/uploads\/sites\/)([a-zA-Z0-9-_./]+)(\.(png|gif|jpg|jpeg)))/gi;
  const markdown = await htmlToMarkdown(content);

  return markdown.replace(
    ASSETS_REGEX,
    url => contentfulIdtoContentfulAssetsUrlMap[wpAssetsUrlToContentfulIdMap[rewriteWithCDN(url)]],
  ).replace(/<\/?u>/gi, '');
}

export const command = 'entries';
export const describe = 'Prepare entries for a Contentful import.';
export function builder(yargs) {
  return yargs.option('dir', {
    describe: 'Select root directory where to prepare data.',
    default: `.${path.sep}data`,
  });
}
export async function handler({
  settings, host, lang, dir,
}) {
  const urlsRewrite = [];
  const wpCategoryIdToContentfulIdMap = {
    blog: {},
    knowledge: {},
  };
  try {
    // Load assets to be exported to contentful and generate a map mapping
    // Wordpress asset URLs to Contentful asset id
    const exportedAssets = await fs.readJson(path.resolve(dir, lang, 'export', 'assets.json'));

    // Load assets re-exported from Contentful to generate a mapping between
    // Contentful asset id and Contentful asset URLs
    const reExportedAssets = await fs.readJson(path.resolve(dir, lang, 'export', 'contentful-export-assets.json'));

    const wpAssetsUrlToContentfulIdMap = Object.assign({}, ...exportedAssets.map(asset => ({
      [_.get(asset, `fields.file.${lang}.url`)]: asset.sys.id,
    })));
    const contentfulIdtoContentfulAssetsUrlMap = Object.assign(
      {},
      ...reExportedAssets.map(asset => ({
        [asset.sys.id]: _.get(asset, `fields.file.${lang}.url`),
      })),
    );

    // Prepare categories
    const categoryEntries = (await listEntries(path.resolve(dir, lang, 'dump', 'entries', 'category')))
      // filter out exluded categories
      .filter(category => !(_.get(settings, `prepare.exclude.categories.${category.site}.${lang}`, []).includes(category.id)));
    logger.info(`Preparing ${categoryEntries.length} Category entries...`);

    const categories = await Promise.all(categoryEntries
      // Only prepare blog category for the export
      .filter(category => category.site === 'blog')
      .map(async (category) => {
        const contentfulId = uniqid();
        const categoryId = remapEntryId({ settings, lang, entry: category });

        // Keep mapping to generate nginx redirect
        urlsRewrite.push({
          old: category.link,
          new: `${host}/${lang}/blog/categories/${categoryId}`,
        });

        // Keep mapping for post processing
        wpCategoryIdToContentfulIdMap[category.site][category.id] = contentfulId;

        // Output reformated category
        return compileToContentfulCategory({
          lang,
          // Note: here we generate our own Contentful sys.id
          id: contentfulId,
          categoryId,
          name: sanitizeString(category.name),
          description: sanitizeString(category.description),
        });
      }));

    categoryEntries
      .filter(category => category.site !== 'blog')
      .forEach((category) => {
        const remaper = settings.prepare.remap.categories;

        // Get source category id in the category's site
        const source = getSource(settings, category);
        if (!source || !source.category_id) throw new Error(`Missing source for knowledge category id="${category.id}"`);

        // then remap it with its related blog category
        const remapedsourceId = remaper[source.category_id];
        if (!remapedsourceId) throw new Error(`Missing mapping for knowledge category id="${source.category_id}"`);

        // Get associated contentful id and use it to remap the curent category
        const contentfulId = wpCategoryIdToContentfulIdMap.blog[remapedsourceId];
        wpCategoryIdToContentfulIdMap[category.site][category.id] = contentfulId;
      });

    // Prepare posts
    const postEntries = (await listEntries(path.resolve(dir, lang, 'dump', 'entries', 'post')))
      // filter out posts with excluded category
      .filter(post => !(_.get(settings, `prepare.exclude.categories.${post.site}.${lang}`, []).includes(post.categories[0])));
    logger.info(`Preparing ${postEntries.length} Post entries`);

    const posts = await Promise.all(postEntries.map(async (post) => {
      // Generate a unique post id
      const postId = remapEntryId({ settings, lang, entry: post });

      // Keep mapping to generate nginx redirect
      urlsRewrite.push({
        old: post.link,
        new: `${host}/${lang}/blog/posts/${postId}`,
      });

      // Output reformated post
      return compileToContentfulPost({
        lang,
        // Note: here we generate our own Contentful sys.id
        id: uniqid(),
        postId,
        title: sanitizeString(post.title.rendered),
        description: sanitizeString(post.yoast_meta.description),
        featuredImageId: post.image_landscape ? wpAssetsUrlToContentfulIdMap[rewriteWithCDN(post.image_landscape[0].replace(/^https?:/, ''))] : null,
        tags: sanitizeTags(post.yoast_meta.keywords.split(',')),
        categoryId: wpCategoryIdToContentfulIdMap[post.site][post.categories[0]],
        body: await processHtml({
          content: post.site === 'blog' ? post.content.rendered : post.custom_fields_content,
          wpAssetsUrlToContentfulIdMap,
          contentfulIdtoContentfulAssetsUrlMap,
        }),
        publishedOn: post.date_gmt.split('T')[0],
      });
    }));

    // Output all entries and rewrites
    logger.info('Exporting all entries and entries rewrite...');
    fs.writeJson(path.resolve(dir, lang, 'export/entries.json'), [...categories, ...posts]);

    // Output URLs rewrite
    fs.writeFile(path.resolve(dir, lang, 'export/rewrite.csv'), json2csv({ data: urlsRewrite }));
  } catch (error) {
    logger.error(error.stack);
    process.exit(1);
  }
}
