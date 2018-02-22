<div align="center">
  <p>
    <a href="https://github.com/freeletics/wordpress-exporter">
      <img alt="Freeletics Wordpress Exporter" src="https://github.com/freeletics/wordpress-exporter/blob/master/media/wordpress-exporter.jpg?raw=true" />
    </a>
  </p>
  <p style="font-size: 200%">
  Freeletics Wordpress-to-Contentful Exporter
  </p>
  <p style="font-size: 80%; width: 80%;">
  <strong>DISCLAIMER</strong>: this repository open-sources the code used at Freeletics for the migration of its content platform from Freeletics Wordpress sites to Contentful. The <strong>code is not generic, nor can be reused out of the box without prior modifications</strong>. Yet it provides a strong foundation for any body who wishes to perform a similar migration.
  </p>
</div>

## Context

The Freeletics content platform was initially managed by Wordpress through a multi network of sites. This content platform was composed of blogs, knowledge centers and support centers. While the support centers were migrated to [Zendesk Guide](https://help.freeletics.com/hc) the blogs and knowledge centers were migrated to [Contentful][].

Historically, the content of the blogs and the content of the knowledge Centers were dissociated and structured in a network of 13 Wordpress sites, all using unnecessary plugins. The blogs and knowledge centers were available in multiple languages, each language being provided by one Wordpress site. Plugins included the [Advanced Custom Fields][] and [MultilingualPress][].

In an effort to scale and restructure our content platform, but also remove the unnecessary complexity, the content was migrated to [Contentful][] while the content of blogs and knowledge centers were unified by merging the knowledge centers into the blogs of the same language.

## General Approach

Migrating data from Wordpress to Contentful required several steps:

1. **Export content from Wordpress**. The first step is to export the content exposed by the [Wordpress REST API][] into a JSON dump that could be transformed. This step requires extending the Wordpress REST API, through custom [plugins](./plugins), in order to expose data provided by third party plugins such as [Yoast SEO][], [Advanced Custom Fields][], [MultilingualPress][].
2. **Transform exported content into Contentful digestible format**. This second step is to transform the content exported into a format digestible by [contentful-import][]. Amongst the transformations performed we can list: `remap-id` (which transforms Wordpress post/category id to Contentful id), `convert-markup` (which converts the Wordpress content to Markdown), `prepare-assets` (which extracts assets urls used in the content), `remap-category` (which remap knowledge categories to blog categories), `remap-urls` (which remap Wordpress URLs to Contentful URLs) etc.
3. **Import transformed content to Contentful**. The last step uses the [contentful-import][] tool to import the transformed content to Contentful.

The migration is orchestrated with a *command line interface* provided by the [wordpress-exporter-cli](./packages/wordpress-exporter-cli) and the extensions of the Wordpress API are supported by the the following [plugins](./plugins). Please refer to the README files of those directories to access to more details.

## Repository Structure

This mono-repository is organized as follow:

* `plugins` contains the Wordpress plugins developed at Freeletics to expend the Wordpress API.
* `packages` contains the command line interface [wordpress-exporter-cli](./packages/wordpress-exporter-cli), and a sandbox packages used for early tests.

## Getting Started

This mono-repository uses `yarn` and `lerna`, to get started simply run:

```
$ yarn install
$ lerna bootstrap
```

**Note**: do not run `yarn install` anywhere else than in the root of the repository.

## Migrating Data From Wordpress To Contentful
Read [here][].

[here]: ./packages/wordpress-exporter-cli/README.md
[Contentful]: https://contentful.com
[Wordpress REST API]: https://developer.wordpress.com/docs/api/
[contentful-import]: https://github.com/contentful/contentful-import
[Yoast SEO]: https://wordpress.org/plugins/wordpress-seo/
[Advanced Custom Fields]: https://wordpress.org/plugins/advanced-custom-fields/
[MultilingualPress]: https://wordpress.org/plugins/multilingual-press/
