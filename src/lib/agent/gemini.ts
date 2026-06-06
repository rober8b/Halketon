import { GoogleGenerativeAI } from '@google/generative-ai';

let _client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_client) {
    const apiKey = (process.env.GEMINI_API_KEY ?? '').replace(/^﻿/, '').trim();
    if (!apiKey) throw new Error('GEMINI_API_KEY no está configurada');
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
}

// Reintenta ante errores transitorios de Gemini (503 sobrecarga, 429 rate limit, 500).
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const transient = /\b(503|429|500)\b|overloaded|high demand|Service Unavailable|fetch failed/i.test(
        msg
      );
      if (!transient || i === attempts - 1) throw err;
      const delay = 800 * Math.pow(2, i); // 0.8s, 1.6s, 3.2s
      console.warn(`[gemini] intento ${i + 1} falló (${msg.slice(0, 80)}). Reintento en ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export async function generateText(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  });
}
