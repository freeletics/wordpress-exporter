<?php
/*
  Plugin Name: Extend Blog API Plugin
  Description: Extends Wordpress Blog Rest API.
  See https://developer.wordpress.org/rest-api/extending-the-rest-api/ for more.
  Author: Romulus & Remus
  Version: 0.5
*/

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Hooks the plugin to WP admin panel
add_action('admin_menu', 'extend_blog_api_plugin_menu');

function extend_blog_api_plugin_menu() {
  add_plugins_page('Extend Blog API Page', 'Extend Blog API', 'manage_options', 'extend-blog-api-plugin', 'extend_blog_api');
}

// Hooks extend_blog_api function to rest_api_init event so that whenever an
// endpoint is called this function gets executed.
add_action('rest_api_init', 'extend_blog_api');

function extend_blog_api($post) {
  // Adds image_landscape property
  register_rest_field('post',
    'image_landscape',
    array(
      'get_callback' => function ($post) {
        return wp_get_attachment_image_src(
          get_field("image_landscape", $post['id']),
          'full' // Gets the original size of image
        );
      },
      // We will not use update_callback in this plugin
      // as we only want to fetch data.
      'update_callback' => function () { },
      'schema' => null // as we don't need it in our case
    )
  );

  // Adds Yoasty SEO meta data
  register_rest_field('post',
    'yoast_meta',
    array(
      'get_callback' => function ($post) {
        return array(
          'description'  => get_post_meta( $post['id'], '_yoast_wpseo_metadesc', true ),
          'keywords'  => get_post_meta( $post['id'], '_yoast_wpseo_focuskw', true ),
        );
      },
      'update_callback' => function () { },
      'schema' => null // as we don't need it in our case
    )
  );

  // Adds languages relationships
  register_rest_field('post',
    'mlp_translations',
    array(
      'get_callback' => function ($post) {
        $mlp_linked_posts = mlp_get_linked_elements($post['id']);
        $mlp_translations = array();

        foreach ( $mlp_linked_posts as $lang_id => $translation_post_id ) {
          array_push($mlp_translations, array(
            // Convert blog_id (integer) to string (e.g. 'en', 'de')
            'lang' => mlp_get_blog_language($lang_id),
            // WP Post ID
            'post_id' => $translation_post_id
          ));
        }

        return $mlp_translations;
      },
      'update_callback' => function () { },
      'schema' => null // as we don't need it in our case
    )
  );
}
