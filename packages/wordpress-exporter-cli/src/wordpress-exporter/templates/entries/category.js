export default ({
  lang, id, categoryId, name, slug, description,
}) => JSON.parse(`{
  "sys": {
    "id": "${id}",
    "type": "Entry",
    "publishedVersion": 1,
    "contentType": {
      "sys": {
        "type": "Link",
        "linkType": "ContentType",
        "id": "category"
      }
    }
  },
  "fields": {
    "categoryId": {
      "${lang}": "${categoryId}"
    },
    "name": {
      "${lang}": "${name}"
    },
    "slug": {
      "${lang}": "${slug}"
    },
    "description": {
      "${lang}": "${description}"
    }
  }
}`);
