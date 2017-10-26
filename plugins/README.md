# Plugins

Exporting content from Wordpress can be achieved by using the REST API. One major issue is that most of Wordpress plugins do not expose their own data through this API (in our case: Yoast SEO, MultilingualPress relationships, Advanced Custom Fields, etc.).

It is however possible to [extend Wordpress REST API][] in order to expose such data. Ironically, this requires to write a plugin :tada:

## Extend Blog API Plugin

This plugin extends Wordpress REST API to expose additional information for each `post` of the `Blog` sites:

* `image_landscape`, an Advanced Custom Field, property which was used as a Featured Image in our Wordpress setup,
* Yoast SEO information (i.e description and focus keywords),
* MultilingualPress relationships.

[node-wpapi]: https://github.com/WP-API/node-wpapi
[extend Wordpress REST API]: https://developer.wordpress.org/rest-api/extending-the-rest-api/
