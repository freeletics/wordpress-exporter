export default ({
  lang,
  id,
  postId,
  title,
  slug,
  description,
  featuredImageId,
  tags,
  body,
  authorId,
  categoryId,
  publishedOn,
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
    "slug": {
      "${lang}": "${slug}"
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
    "author": {
      "${lang}": {
        "sys": {
          "type": "Link",
          "linkType": "Entry",
          "id": "${authorId}"
        }
      }
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
