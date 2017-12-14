# Plugins

Exporting content from Wordpress is achieved by using the REST API. One major issue is that most of the Wordpress plugins do not expose their own data through this REST API e.g. in our case [Yoast SEO][] information, [MultilingualPress][] relationships, [Advanced Custom Fields][].

It is however possible to [extend Wordpress REST API][] in order to expose such data. Ironically, this requires to write plugins :tada:

## Extend Blog API Plugin

This plugin extends Wordpress REST API to expose additional information for each `post` of the `blog` sites:

* [Advanced Custom Fields][] property `image_landscape`, this property was used as Featured Image in our Wordpress setup,
* [Yoast SEO][] information such as `description` (used in meta data but also social sharing) and `focus keywords` (used in meta data),
* [MultilingualPress][] relationships linking posts and categories from different languages together.

## Extend Knowledge API Plugin

This plugin extends Wordpress REST API to expose additional information for each `post` of the `knowledge` sites:

* [Advanced Custom Fields][] field `content` and its nested fields. Those fields were used to create flexible content in Freeletics knowledge centers.

*Note*: the knowledge sites were also using the `extebd-blog-api-plugin` plugins, so properties exposed for the blogs were also exposed for the knowledge centers.

[node-wpapi]: https://github.com/WP-API/node-wpapi
[extend Wordpress REST API]: https://developer.wordpress.org/rest-api/extending-the-rest-api/
[Yoast SEO]: https://wordpress.org/plugins/wordpress-seo/
[Advanced Custom Fields]: https://wordpress.org/plugins/advanced-custom-fields/
[MultilingualPress]: https://wordpress.org/plugins/multilingual-press/
