Wordpress Exporter
==================

This repository contains the migration code used to migrate data from the Freeletics Wordpress sites to [Contentful][].

## General Approach

Migrating data from Wordpress to Contentful requires several steps:

1. Export the data, exposed by the [Wordpress REST API][], in a JSON dump compatible with the [contentful-import][] tool. This step requires extending the Wordpress REST API with custom [plugins](./plugins) in order to expose data provided by third party plugins (e.g. [Yoast SEO][], [Advanced Custom Fields][], [MultilingualPress][])
2. Transform the data, using transformers. This step will vary in function of the site being imported. Transformers includes: `id-remap`, `convert-markup`, `prepare-assets`, etc.
3. Import the data, using [contentful-import][] tool.

## Repository Structure

This mono-repository is organised as follow:

* `plugins` contains the Wordpress plugins to install in order to expend the Wordpress API.
* `packages` contains the various packages used to perform the `export`, and `transform` steps.

## Getting Started

This mono-repository uses `yarn` and `lerna`, to get started simply run:

```
$ yarn install
$ lerna bootstrap
```

**Note**: do not run `yarn install` anywhere else than in the root of the repository.

[Contentful]: https://contentful.com
[Wordpress REST API]: https://developer.wordpress.com/docs/api/
[contentful-import]: https://github.com/contentful/contentful-import
[Yoast SEO]: https://wordpress.org/plugins/wordpress-seo/
[Advanced Custom Fields]: https://wordpress.org/plugins/advanced-custom-fields/
[MultilingualPress]: https://wordpress.org/plugins/multilingual-press/
