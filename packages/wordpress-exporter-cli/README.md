# Wordpress Exporter CLI

## Get Started

To build the package simply run:

```
$ yarn run build
```

To watch for changes and rebuild simply run:

```
$ yarn run watch
```

To run the CLI in development mode, simply run:

```
$ ./bin/wordpress-exporter.js --help
```

Note: Globally installing the package will make the CLI easier to access, meaning you will be able to access it like:

```
$ wordpress-exporter --help
```

## Proceed to Migration

### Creating a Workspace

Migrations are performed one language at a time. Each migration is performed in a *workspace*. To create a workspace for the English language migration simply do:

```
$ wordpress-exporter init --lang="en"
```

Note: by default the workspace is created in a `data` folder, to change this behavior simply use `--dir="some/path"`.

### Managing Spaces

Each migration is done toward a Contentful space, therefore a space must be created for each migration. Since we are merging `blog` and `knowledge` sites, into one space, you must provide which site is the reference: meaning which site will receive the content of the other one. To manage space associated to a migration simply use the `space` command:

* create a space for the English language, using `blog` as a reference:
  ```
  $ wordpress-exporter space create --lang="en" --site="blog"
  ```
* delete the space for the English language using `blog` as a reference:
  ```
  $ wordpress-exporter space create --lang="en" --site="blog"
  ```

### Exporting Content from Wordpress

Once the a workspace and a space has been created for your migration it is time to export the content from Wordpress. Each site must be exported independently:

```
$ wordpress-exporter export --lang="en" --site="blog"
$ wordpress-exporter export --lang="en" --site="knowledge"
```

This will export all categories and posts for all sites.

### Preparing and Importing Assets

Once the Wordpress content is imported we can proceed to the assets import. This step will import all used assets in both the `blog` and `knowledge` sites. Assets not used, meaning not referenced in any posts, will be discarded. To proceed, we need first to prepare the assets:

```
$ wordpress-exporter prepare assets --lang="en"
```

then import them:

```
$ wordpress-exporter import assets --lang="en"
```

This steps might take quite some time as it imports every assets one by one, and for each asset: upload to Contentful the assets definition, upload the asset file in Contentful, run some validation and publish it. Once all assets have been imported the script retrieves the new Contentful assets urls so they can be used to remap all assets referenced in our entries during the next step.

### Preparing and Importing Entries

The last step in the migration is to import all entries. A lot of operations are done in that step including: merging categories, cleaning titles/descriptions, transforming content to markdown, remapping ids, remapping urls, etc.

:warning: To proceed with that step you need to make sure you have a `settings.json` properly configured. See the [Configure Settings.json](#configure-settingsjson) section.

To proceed, we need first to prepare the entries:

```
$ wordpress-exporter prepare entries --lang="en"
```

then import them:

```
$ wordpress-exporter import entries --lang="en"
```

This steps might take quite some time as it imports every entries one by one, and for each entry: upload it to Contentful, run some validation and publish it.
The script will also generate a `csv` file needed by OPS to produce the nginx redirections needed to ensure continuity of service between the old sites and the new ones. This file can be found under `/data/en/export/rewrite.csv` (where data is the workspace provided by `--dir` option).

## Configure Settings.json

The `settings.json` is used by the `wordpress-exporter` to access some information required during the preparation of the entries such as: selecting the source language, remapping ids, merging categories, ignoring posts, etc.

A working example this settings is provided below, note that the `prepare.exclude` part is only configured for English only:

```json
{
  "source": {
    "lang": "en"
  },
  "prepare": {
    "spaces": {
      "codes": {
        "en": "1",
        "fr": "2",
        "de": "3",
        "es": "4",
        "pt": "5",
        "it": "6",
        "tr": "7"
      }
    },
    "exclude": {
      "categories": {
        "blog": {
          "en": [1],
          "fr": [],
          "de": [],
          "es": [],
          "pt": [],
          "it": [],
          "tr": []
        },
        "knowledge": {
          "en": [1, 8],
          "fr": [],
          "de": [],
          "es": [],
          "pt": [],
          "it": [],
          "tr": []
        }
      }
    },
    "remap": {
      "categories": {
        "6": "19",
        "7": "330",
        "333": "472",
        "334": "471"
      }
    }
  }
}
```

* `source.lang`: provides the source language, in the case of all our migrations it is English.
* `prepare.spaces`: provides the space code used in the remapping of entries ids. This settings should not be changed as already configured properly.
* `prepare.exclude`: provides the list of categories to be excluded. All categories and posts linked to those categories will be ignored by the prepare step and therefore not be imported in Contentful. This settings is used to ignore the `Uncategorized` and the `CoachKnows` categories for instance.
* `prepare.remap`: provides the remapping of `knowledge` categories to `blog` categories. This settings should not be changed as already configured properly.
