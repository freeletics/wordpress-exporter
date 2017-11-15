import { createClient } from 'contentful-management';
import spaceImport from 'contentful-import';
import spaceExport from 'contentful-export';

export const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

export function importToSpace(spaceId, { entries = [], contentTypes = [], assets = [] } = {}) {
  return spaceImport({
    content: { entries, contentTypes, assets },
    spaceId,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  });
}

export function exportFromSpace(spaceId, exportDir, {
  skipContentModel = false,
  skipContent = false,
  skipRoles = false,
  skipWebhooks = false,
  saveFile = false,
} = {}) {
  return spaceExport({
    spaceId,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    exportDir,
    skipContentModel,
    skipContent,
    skipRoles,
    skipWebhooks,
    saveFile,
  });
}

export default client;
