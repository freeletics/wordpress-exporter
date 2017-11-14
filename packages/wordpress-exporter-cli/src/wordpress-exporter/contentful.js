import { createClient } from 'contentful-management';
import spaceImport from 'contentful-import';

export const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

export function importToSpace(spaceId, { entries = [], contentTypes = [], assets = [] } = {}) {
  spaceImport({
    content: { entries, contentTypes, assets },
    spaceId,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  });
}

export default client;
