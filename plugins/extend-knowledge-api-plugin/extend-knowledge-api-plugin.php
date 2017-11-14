<?php
/*
  Plugin Name: Extend Knowledge API Plugin
  Description: Extends Wordpress Knowledge Rest API.
  See https://developer.wordpress.org/rest-api/extending-the-rest-api/ for more.
  Author: Romulus & Remus
  Version: 0.1
*/

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Hooks the plugin to WP admin panel
add_action('admin_menu', 'extend_knowledge_api_plugin_menu');

function extend_knowledge_api_plugin_menu() {
  add_plugins_page('Extend Knowledge API Page', 'Extend Knowledge API', 'manage_options', 'extend-knowledge-api-plugin', 'extend_knowledge_api');
}

// Hooks extend_knowledge_api function to rest_api_init event so that whenever an
// endpoint is called this function gets executed.
add_action('rest_api_init', 'extend_knowledge_api');

function extend_knowledge_api($post) {

  // Adds custom fields from ACF
  register_rest_field('post',
    'custom_fields_content',
    array(
      'get_callback' => function ($post) {
        $fl_post_body = "";
        // check if the flexible ontent field has rows of data
        // loop through the rows of data
        while ( have_rows('content') ) : the_row();
          if( get_row_layout() == 'headline' ):
            $fl_post_body .= include_as_string("/parts/modules/headline.php");
          elseif( get_row_layout() == 'text_big' ):
            $fl_post_body .= include_as_string("/parts/modules/text-big.php");
          elseif( get_row_layout() == 'text' ):
            $fl_post_body .= include_as_string("/parts/modules/text-block.php");
          elseif( get_row_layout() == 'text_only' ):
            $fl_post_body .= include_as_string("/parts/modules/text-only.php");
          elseif( get_row_layout() == 'blockquote' ):
            $fl_post_body .= include_as_string("/parts/modules/blockquote.php");
          elseif( get_row_layout() == 'image' ):
            $fl_post_body .= include_as_string("/parts/modules/image.php");
          elseif( get_row_layout() == 'figure' ):
            $fl_post_body .= include_as_string("/parts/modules/figure.php");
          elseif( get_row_layout() == 'video' ):
            $fl_post_body .= include_as_string("/parts/modules/video.php");
          elseif( get_row_layout() == 'include_as_string' ):
            $fl_post_body .= include_as_string("/parts/modules/include_as_string.php");
          elseif( get_row_layout() == 'image_left_text' ):
            $fl_post_body .= include_as_string("/parts/modules/textblock-image-left.php");
          elseif( get_row_layout() == 'image_right_text' ):
            $fl_post_body .= include_as_string("/parts/modules/textblock-image-right.php");
          elseif( get_row_layout() == 'definition_text' ):
            $fl_post_body .= include_as_string("/parts/modules/textblock-definition.php");
          elseif( get_row_layout() == 'content_point' ):
            $fl_post_body .= include_as_string("/parts/modules/content-point.php");
          elseif( get_row_layout() == 'solutions_list' ):
            $fl_post_body .= include_as_string("/parts/modules/solutions_list.php");
          elseif( get_row_layout() == 'table' ):
            $fl_post_body .= include_as_string("/parts/modules/table.php");
          elseif( get_row_layout() == 'annotation' ):
            $fl_post_body .= include_as_string("/parts/modules/annotation.php");
          endif;
        endwhile;

        return strlen($fl_post_body) >= strlen($post['content']['rendered']) ? $fl_post_body : $post['content']['rendered'];
      },
      'update_callback' => function () { },
      'schema' => null // as we don't need it in our case
    )
  );
}

function include_as_string($module_file) {
  ob_start();
  include get_template_directory() . $module_file;
  return ob_get_clean();
}
