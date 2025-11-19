import OpenAI from 'openai';

// WARNING: This client must NOT be imported or used in client components.
// It uses process.env.OPENAI_API_KEY which should never be exposed to the browser.
// Only use this in server components, server actions, and API routes.

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey,
});




