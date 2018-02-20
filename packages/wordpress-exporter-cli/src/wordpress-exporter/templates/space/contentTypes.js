export default spaceId => JSON.parse(`
  [
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "${spaceId}"
          }
        },
        "id": "post",
        "type": "ContentType",
        "publishedVersion": 6
      },
      "displayField": "title",
      "name": "Post",
      "description": "",
      "fields": [
        {
          "id": "postId",
          "name": "ID",
          "type": "Symbol",
          "localized": false,
          "required": true,
          "validations": [
            {
              "unique": true
            }
          ],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "title",
          "name": "Title",
          "type": "Symbol",
          "localized": false,
          "required": true,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "description",
          "name": "Description",
          "type": "Symbol",
          "localized": false,
          "required": true,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "featuredImage",
          "name": "Featured Image",
          "type": "Link",
          "localized": false,
          "required": true,
          "validations": [
            {
              "linkMimetypeGroup": [
                "image"
              ]
            }
          ],
          "disabled": false,
          "omitted": false,
          "linkType": "Asset"
        },
        {
          "id": "tags",
          "name": "Tags",
          "type": "Array",
          "localized": false,
          "required": false,
          "validations": [],
          "disabled": false,
          "omitted": false,
          "items": {
            "type": "Symbol",
            "validations": []
          }
        },
        {
          "id": "body",
          "name": "Body",
          "type": "Text",
          "localized": false,
          "required": true,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "category",
          "name": "Category",
          "type": "Link",
          "localized": false,
          "required": true,
          "validations": [
            {
              "linkContentType": [
                "category"
              ]
            }
          ],
          "disabled": false,
          "omitted": false,
          "linkType": "Entry"
        }
      ]
    },
    {
      "sys": {
        "space": {
          "sys": {
            "type": "Link",
            "linkType": "Space",
            "id": "${spaceId}"
          }
        },
        "id": "category",
        "type": "ContentType",
        "publishedVersion": 1
      },
      "displayField": "name",
      "name": "Category",
      "description": "",
      "fields": [
        {
          "id": "categoryId",
          "name": "ID",
          "type": "Symbol",
          "localized": false,
          "required": true,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "name",
          "name": "Name",
          "type": "Symbol",
          "localized": false,
          "required": false,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "description",
          "name": "Description",
          "type": "Symbol",
          "localized": false,
          "required": false,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "featuredImage",
          "name": "Featured Image",
          "type": "Link",
          "localized": false,
          "required": false,
          "validations": [
            {
              "linkMimetypeGroup": [
                "image"
              ]
            }
          ],
          "disabled": false,
          "omitted": false,
          "linkType": "Asset"
        }
      ]
    }
  ]
`);
