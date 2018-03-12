export default ({
  lang, id, tagId, name, slug,
}) => JSON.parse(`{
  "sys": {
    "id": "${id}",
    "type": "Entry",
    "publishedVersion": 1,
    "contentType": {
      "sys": {
        "type": "Link",
        "linkType": "ContentType",
        "id": "tag"
      }
    }
  },
  "fields": {
    "tagId": {
      "${lang}": "${tagId}"
    },
    "name": {
      "${lang}": "${name}"
    },
    "slug": {
      "${lang}": "${slug}"
    }
  }
}`);
