import { createClient } from 'contentful-management';
import spaceImport from 'contentful-import';
import spaceExport from 'contentful-export';

const CONTENTFUL_CLIENT = Symbol('CONTENTFUL_CLIENT');

export const CHUNK_SIZE = 10;

export function importToSpace(spaceId, {
  contentTypes = [],
  editorInterfaces = [],
  assets = [],
  entries = [],
} = {}) {
  return spaceImport({
    content: {
      contentTypes,
      editorInterfaces,
      assets,
      entries,
    },
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

export default function getClient() {
  if (!global[CONTENTFUL_CLIENT]) {
    global[CONTENTFUL_CLIENT] = createClient({
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
    });
  }

  return global[CONTENTFUL_CLIENT];
}
