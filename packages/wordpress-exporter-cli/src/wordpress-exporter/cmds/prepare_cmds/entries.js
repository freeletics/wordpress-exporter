import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import glob from 'globby';
import remark from 'remark';
import uniqid from 'uniqid';
import json2csv from 'json2csv';
import TurndownService from 'turndown';
import { AllHtmlEntities } from 'html-entities';

import logger from '../../logger';
import compileToContentfulAuthor from '../../templates/entries/author';
import compileToContentfulCategory from '../../templates/entries/category';
import compileToContentfulTag from '../../templates/entries/tag';
import compileToContentfulPost from '../../templates/entries/post';
import { rewriteWithCDN } from '../../utils';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  strongDelimiter: '__',
  // Convert YouTube and Vimeo iframes to Embedly cards
  blankReplacement(content, node) {
    const types = ['IFRAME'];
    const convertToAnchor = (iframe) => {
      const src = iframe.getAttribute('src').split('?')[0];

      // Use the same syntax as "Embed external content" button in Contentful
      return `<a href="${src}" class="embedly-card" data-card-width="100%" data-card-controls="0">Embedded content: ${src}</a>`;
    };

    // Handle <iframe></iframe>
    if (types.includes(node.nodeName)) {
      return `\n\n${convertToAnchor(node)}\n\n`;
    }

    // Handle <div><iframe></iframe></div>
    const output = [];
    node.childNodes.forEach((child) => {
      if (types.includes(child.nodeName)) {
        output.push(convertToAnchor(child));
      }
    });

    if (output.length) {
      return `\n\n${output.join('\n\n')}\n\n`;
    }

    // Default blankReplacement implementation
    return node.isBlock ? '\n\n' : '';
  },
})
  .keep('iframe')
  // Convert <cite> elements inside <blockquote> to <em>, so that they can be
  // easily targeted with CSS.
  .addRule('cite', {
    filter: 'cite',
    replacement(content, node, options) {
      const text = content.replace('– ', '');
      return `${options.emDelimiter}${text}${options.emDelimiter}`;
    },
  });

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
    remark().process(turndownService.turndown(content), (err, file) => {
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
      id: source[`${entry.type}_id`], // post_id, category_id or tag_id
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
  const IMAGES_REGEX = /(\/\/((cdn|www).freeletics.com\/)([a-zA-Z0-9-_./]+)(\/wp-content\/uploads\/sites\/)([a-zA-Z0-9-_./]+)(\.(png|gif|jpg|jpeg)))/gi;
  const POSTS_REGEX = /https:\/\/www.freeletics.com\/([a-z]{2})\/(blog|knowledge)\/([a-zA-Z0-9-_.]+)\/\)/gi;
  const markdown = await htmlToMarkdown(content);

  return markdown
    // Replace image urls that use Freeletics CDN to Contentful and resize them to be 1232px wide
    .replace(
      IMAGES_REGEX,
      wpUrl =>
        `${contentfulIdtoContentfulAssetsUrlMap[
          wpAssetsUrlToContentfulIdMap[rewriteWithCDN(wpUrl)]
        ]}?w=1232&fm=jpg&q=76&fl=progressive`,
    )
    // Replace urls to posts with the new url structure:
    // https://www.freeletics.com/:locale/blog/:slug      => /:locale/blog/posts/:slug
    // https://www.freeletics.com/:locale/knowledge/:slug => /:locale/blog/posts/:slug
    .replace(
      POSTS_REGEX,
      (url, locale, site, slug) => `/${locale}/blog/posts/${slug}/)`,
    )
    .replace(/<\/?u>/gi, '');
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

    /**
     * Prepare authors
     */
    const authorEntries = [{
      name: 'Seana Forbes',
    }];

    logger.info(`Preparing ${authorEntries.length} Author entries`);

    const authors = await Promise.all(authorEntries.map(async (author) => {
      const { codes } = settings.prepare.spaces;
      const code = codes.en;
      const authorId = generateId({ code, site: 'blog', id: 1 });

      return compileToContentfulAuthor({
        lang,
        id: uniqid(),
        authorId,
        name: author.name,
      });
    }));

    /**
     * Prepare categories
     */
    const wpCategoryIdToContentfulIdMap = {
      blog: {},
      knowledge: {},
    };
    const categoryEntries = (await listEntries(path.resolve(dir, lang, 'dump', 'entries', 'category')))
      // filter out exluded categories
      .filter((category) => {
        const excludedCategoryIds = _.get(settings, `prepare.exclude.categories.${category.site}.${lang}`, []);
        return !(excludedCategoryIds.includes(category.id));
      });

    logger.info(`Preparing ${categoryEntries.length} Category entries...`);

    /**
     * Prepare blog categories
     */
    const categories = await Promise.all(categoryEntries
      .filter(category => category.site === 'blog')
      .map(async (category) => {
        const contentfulId = uniqid();
        const sourceCategoryId = getSource(settings, category).category_id;
        const newCategoryId = remapEntryId({ settings, lang, entry: category });
        const slug = sanitizeString(category.slug);

        // Keep mapping to generate nginx redirect
        urlsRewrite.push({
          old: category.link,
          new: `${host}/${lang}/blog/categories/${slug}/`,
        });

        // Keep mapping for post processing
        wpCategoryIdToContentfulIdMap[category.site][sourceCategoryId] = contentfulId;

        // Output reformated category
        return compileToContentfulCategory({
          lang,
          // Note: here we generate our own Contentful sys.id
          id: contentfulId,
          categoryId: newCategoryId,
          name: sanitizeString(category.name),
          slug,
          description: sanitizeString(category.description),
        });
      }));

    /**
     * Prepare knowledge categories
     */
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
        wpCategoryIdToContentfulIdMap[category.site][remapedsourceId] = contentfulId;
      });

    /**
     * Prepare tags
     */
    const wpTagIdToContentfulIdMap = {
      blog: {},
      knowledge: {},
    };
    const tagEntries = (await listEntries(path.resolve(dir, lang, 'dump', 'entries', 'tag')));

    logger.info(`Preparing ${tagEntries.length} Tag entries`);

    /**
     * Prepare blog tags
     */
    const tags = await Promise.all(tagEntries
      .filter(tag => tag.site === 'blog')
      .map(async (tag) => {
        const contentfulId = uniqid();
        const sourceTagId = getSource(settings, tag).tag_id;
        const newTagId = remapEntryId({ settings, lang, entry: tag });
        const slug = sanitizeString(tag.slug);

        // Keep mapping for post processing
        wpTagIdToContentfulIdMap[tag.site][sourceTagId] = contentfulId;

        return compileToContentfulTag({
          lang,
          id: contentfulId,
          tagId: newTagId,
          name: sanitizeString(tag.name),
          slug,
        });
      }));

    /**
     * Prepare knowledge tags
     */
    tagEntries
      .filter(tag => tag.site !== 'blog')
      .forEach((tag) => {
        const remaper = settings.prepare.remap.tags;

        // Get source tag id in the tag's site
        const source = getSource(settings, tag);
        if (!source || !source.tag_id) throw new Error(`Missing source for ${tag.site} tag id="${tag.id}"`);

        // Then remap it with its related blog tag
        const remapedsourceId = remaper[source.tag_id];
        if (!remapedsourceId) throw new Error(`Missing mapping for ${tag.site} tag id="${source.tag_id}"`);

        // Get associated contentful id and use it to remap the current tag
        const contentfulId = wpTagIdToContentfulIdMap.blog[remapedsourceId];
        wpTagIdToContentfulIdMap[tag.site][remapedsourceId] = contentfulId;
      });

    /**
     * Prepare posts
     */
    const postEntries = (await listEntries(path.resolve(dir, lang, 'dump', 'entries', 'post')))
      // filter out posts with excluded category
      .filter(post => !(_.get(settings, `prepare.exclude.categories.${post.site}.${lang}`, []).includes(post.categories[0])));

    logger.info(`Preparing ${postEntries.length} Post entries`);

    const posts = await Promise.all(postEntries.map(async (post) => {
      const contentfulId = uniqid();
      const postId = remapEntryId({ settings, lang, entry: post }); // Generate a unique post id
      const authorId = authors[0].sys.id;

      const categoryIds = post.categories.map((categoryId) => {
        // Find category used in post
        const category = categoryEntries
          .find(c => c.site === post.site && c.id === categoryId);

        // Find source category id
        const sourceCategoryId = getSource(settings, category).category_id;

        // Remap source category id to blog version if necessary
        const mappedSourceCategoryId = post.site === 'blog' ?
          sourceCategoryId :
          settings.prepare.remap.categories[sourceCategoryId];

        // Find contentful id for given category id
        return wpCategoryIdToContentfulIdMap[post.site][mappedSourceCategoryId];
      });

      const tagIds = post.tags.map((tagId) => {
        // Find tag used in post
        const tag = tagEntries
          .find(t => t.site === post.site && t.id === tagId);

        // Find source tag id
        const sourceTagId = getSource(settings, tag).tag_id;

        // Remap source tag id to blog version if necessary
        const mappedSourceTagId = post.site === 'blog' ?
          sourceTagId :
          settings.prepare.remap.tags[sourceTagId];

        // Find contentful id for given tag id
        return wpTagIdToContentfulIdMap[post.site][mappedSourceTagId];
      });

      const slug = sanitizeString(post.slug);

      // Keep mapping to generate nginx redirect
      urlsRewrite.push({
        old: post.link,
        new: `${host}/${lang}/blog/posts/${slug}/`,
      });

      return compileToContentfulPost({
        lang,
        id: contentfulId,
        postId,
        authorId,
        categoryId: categoryIds[0],
        tagIds,
        title: sanitizeString(post.title.rendered),
        slug,
        description: sanitizeString(post.yoast_meta.description),
        featuredImageId: post.featured_media_url ? wpAssetsUrlToContentfulIdMap[rewriteWithCDN(post.featured_media_url.replace(/^https?:/, ''))] : null,
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
    fs.writeJson(path.resolve(dir, lang, 'export/entries.json'), [...authors, ...categories, ...tags, ...posts]);

    // Output URLs rewrite
    fs.writeFile(path.resolve(dir, lang, 'export/rewrite.csv'), json2csv({ data: urlsRewrite }));
  } catch (error) {
    logger.error(error.stack);
    process.exit(1);
  }
}
