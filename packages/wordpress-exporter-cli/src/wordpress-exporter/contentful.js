import { createClient } from 'contentful-management';

export const client = createClient({
  accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
});

export default client;
