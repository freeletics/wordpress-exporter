export default ({
  lang, id, postId, title, description, featuredImageId, tags, body, categoryId, publishedOn,
}) => JSON.parse(`{
  "sys": {
    "id": "${id}",
    "type": "Entry",
    "publishedVersion": 1,
    "contentType": {
      "sys": {
        "type": "Link",
        "linkType": "ContentType",
        "id": "post"
      }
    }
  },
  "fields": {
    "postId": {
      "${lang}": "${postId}"
    },
    "title": {
      "${lang}": "${title}"
    },
    "description": {
      "${lang}": "${description}"
    },
    "featuredImage": {
      "${lang}": {
        "sys": {
          "type": "Link",
          "linkType": "Asset",
          "id": "${featuredImageId}"
        }
      }
    },
    "tags": {
      "${lang}": ${tags.length ? `["${tags.join('","')}"]` : '[]'}
    },
    "body": {
      "${lang}": ${JSON.stringify(body)}
    },
    "category": {
      "${lang}": {
        "sys": {
          "type": "Link",
          "linkType": "Entry",
          "id": "${categoryId}"
        }
      }
    },
    "publishedOn": {
      "${lang}": "${publishedOn}"
    }
  }
}`);
