export default ({
  lang, id, categoryId, name, description,
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
    "id": {
      "${lang}": "${categoryId}"
    },
    "name": {
      "${lang}": "${name}"
    },
    "description": {
      "${lang}": "${description}"
    }
  }
}`);
