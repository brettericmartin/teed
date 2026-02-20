import { GoogleGenerativeAI } from '@google/generative-ai';

// WARNING: This client must NOT be imported or used in client components.
// It uses process.env.GEMINI_API_KEY which should never be exposed to the browser.
// Only use this in server components, server actions, and API routes.

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Missing GEMINI_API_KEY environment variable - Gemini features will be unavailable');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiFlash = genAI?.getGenerativeModel({ model: 'gemini-2.5-flash' }) ?? null;
