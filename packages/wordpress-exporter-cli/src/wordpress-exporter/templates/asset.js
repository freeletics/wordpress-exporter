import URL from 'url';
import path from 'path';

export default ({
  lang, id, url,
}) => {
  const { pathname } = URL.parse(url);
  const filetype = path.extname(pathname).substr(1);
  const filename = path.basename(pathname);
  const contentType = `image/${filetype === 'jpg' ? 'jpeg' : filetype}`;

  // Note: such title should be extracted from Wordpress, however in our
  // case such title was never set by Content Manager, therefore in Wordpress
  // they are generated based on the filename. To avoid useless queries to
  // Wordpress we extract the title ourselve based on the filename.
  const title = path.basename(filename, filetype)
    .replace(/[-_.]/gi, ' ')
    .replace(/ +(?= )/g, '').trim();

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
                "contentType": "${contentType}"
            }
        }
    }
  }`);
};
