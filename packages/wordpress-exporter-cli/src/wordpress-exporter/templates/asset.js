export default ({
  lang, id, url, filename,
}) => {
  const title = filename.match(/([a-zA-Z0-9-_]+)\./gi).toString()
    .replace(/[-_.]/gi, ' ').trim();
  const filetype = filename.match(/(png|gif|jpg|jpeg)/gi).toString();

  return JSON.parse(`
  {
    "sys": {
        "id": "${id}",
        "type": "Asset",
        "publishedVersion": 1
    },
    "fields": {
        "title": {
            "${lang}": "${title}"
        },
        "file": {
            "${lang}": {
                "url": "${url}",
                "fileName": "${filename}",
                "contentType": "image/${filetype === 'jpg' ? 'jpeg' : filetype}"
            }
        }
    }
  }`);
};
