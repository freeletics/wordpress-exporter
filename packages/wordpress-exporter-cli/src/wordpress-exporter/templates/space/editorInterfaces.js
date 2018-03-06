export default spaceId => JSON.parse(`
  [
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "space": {
          "sys": {
            "id": "${spaceId}",
            "type": "Link",
            "linkType": "Space"
          }
        },
        "contentType": {
          "sys": {
            "id": "post",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "slug",
           "widgetId": "slugEditor"
        },
        {
          "fieldId": "publishedOn",
          "settings": {
            "ampm": "24",
            "format": "dateonly"
          },
          "widgetId": "datePicker"
        }
      ]
    },
    {
      "sys": {
        "id": "default",
        "type": "EditorInterface",
        "space": {
          "sys": {
            "id": "${spaceId}",
            "type": "Link",
            "linkType": "Space"
          }
        },
        "contentType": {
          "sys": {
            "id": "category",
            "type": "Link",
            "linkType": "ContentType"
          }
        }
      },
      "controls": [
        {
          "fieldId": "slug",
           "widgetId": "slugEditor"
        }
      ]
    }
  ]
`);
