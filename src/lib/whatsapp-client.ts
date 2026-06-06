import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';

let _whatsappClient: WhatsAppClient | null = null;

// Limpia BOM (U+FEFF) y espacios: las env vars cargadas por el CLI de Vercel en
// Windows quedan con BOM al inicio, lo que rompe headers/credenciales.
export function cleanEnv(value: string | undefined): string {
  return (value ?? '').replace(/^﻿/, '').trim();
}

export function getWhatsAppClient(): WhatsAppClient {
  if (!_whatsappClient) {
    const kapsoApiKey = cleanEnv(process.env.KAPSO_API_KEY);
    if (!kapsoApiKey) {
      throw new Error('KAPSO_API_KEY environment variable is not set');
    }
    _whatsappClient = new WhatsAppClient({
      baseUrl: cleanEnv(process.env.WHATSAPP_API_URL) || 'https://api.kapso.ai/meta/whatsapp',
      kapsoApiKey,
      graphVersion: 'v24.0'
    });
  }
  return _whatsappClient;
}

// Lazy getter for backwards compatibility
export const whatsappClient = new Proxy({} as WhatsAppClient, {
  get(_, prop) {
    return getWhatsAppClient()[prop as keyof WhatsAppClient];
  }
});

export const PHONE_NUMBER_ID = cleanEnv(process.env.PHONE_NUMBER_ID);
