export default ({
  lang, id, authorId, name,
}) => JSON.parse(`{
  "sys": {
    "id": "${id}",
    "type": "Entry",
    "publishedVersion": 1,
    "contentType": {
      "sys": {
        "type": "Link",
        "linkType": "ContentType",
        "id": "author"
      }
    }
  },
  "fields": {
    "authorId": {
      "${lang}": "${authorId}"
    },
    "name": {
      "${lang}": "${name}"
    }
  }
}`);
