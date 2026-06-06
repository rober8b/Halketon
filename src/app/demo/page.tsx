'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'bot' | 'user'; text: string };

const GREETING =
  '¡Hola! Soy el asistente de *En Masa Social* 🌱\n\n' +
  'Te ayudo a crear tu campaña de donación en menos de 5 minutos, sin necesidad de equipo técnico.\n\n' +
  'Primero contame: ¿cuál es el nombre de tu organización y cómo te llamás?';

// Guión sugerido para el pitch de 2 minutos. Cada chip manda el mensaje al agente.
const SCRIPT: string[] = [
  'Fundación Manos Abiertas / María González',
  'En nuestro barrio hay 80 chicos que van a la escuela sin desayunar. Queremos abrir un comedor para darles desayuno y merienda todos los días.',
  '800000\n30/09/2026',
  '200000: Compramos heladera, cocina y utensilios\n500000: Cubrimos 3 meses de alimentos\n800000: Comedor funcionando todo el año para 80 chicos',
  'sí, dale',
];

// Convierte *negrita* de WhatsApp a <strong> y respeta saltos de línea.
function renderText(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i} className="block">
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        part.startsWith('*') && part.endsWith('*') ? (
          <strong key={j}>{part.slice(1, -1)}</strong>
        ) : (
          <span key={j}>{part}</span>
        )
      )}
    </span>
  ));
}

function extractCampaignPath(text: string): string | null {
  const match = text.match(/\/c\/[a-z0-9-]+/i);
  return match ? match[0] : null;
}

export default function DemoChatPage() {
  const [phone] = useState(() => `549demo${Date.now()}`);
  const [messages, setMessages] = useState<Msg[]>([{ role: 'bot', text: GREETING }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await fetch('/api/test-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? 'Sin respuesta del agente.';
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: '😕 No pude conectar con el agente.' }]);
    } finally {
      setLoading(false);
    }
  }

  function sendNextScripted() {
    const next = SCRIPT[step];
    if (!next) return;
    setStep((s) => s + 1);
    void send(next);
  }

  const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
  const campaignPath = lastBot ? extractCampaignPath(lastBot.text) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b141a] p-4">
      <div className="flex h-[680px] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#0b141a] shadow-2xl ring-1 ring-white/10">
        {/* Header estilo WhatsApp */}
        <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4A90E2] text-lg font-bold text-white">
            🌱
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">En Masa Social</p>
            <p className="text-xs text-emerald-400">en línea</p>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-medium text-white/70">
            DEMO
          </span>
        </div>

        {/* Mensajes */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-2 overflow-y-auto bg-[#0b141a] px-3 py-4"
          style={{
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed shadow ${
                  m.role === 'user'
                    ? 'rounded-br-none bg-[#005c4b] text-white'
                    : 'rounded-bl-none bg-[#202c33] text-gray-100'
                }`}
              >
                {renderText(m.text)}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-lg rounded-bl-none bg-[#202c33] px-3 py-2 text-sm text-gray-400">
                escribiendo…
              </div>
            </div>
          )}

          {campaignPath && !loading && (
            <div className="flex justify-start pt-1">
              <a
                href={campaignPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#4A90E2] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-500"
              >
                🔗 Ver campaña publicada
              </a>
            </div>
          )}
        </div>

        {/* Chips del guión */}
        {step < SCRIPT.length && (
          <div className="bg-[#111b21] px-3 py-2">
            <button
              onClick={sendNextScripted}
              disabled={loading}
              className="w-full truncate rounded-full bg-white/10 px-4 py-2 text-left text-xs text-white/80 transition hover:bg-white/20 disabled:opacity-50"
            >
              ▶ Enviar paso {step + 1}/{SCRIPT.length}: “{SCRIPT[step].split('\n')[0].slice(0, 38)}…”
            </button>
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 bg-[#202c33] px-3 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí un mensaje"
            className="flex-1 rounded-full bg-[#2a3942] px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4A90E2] text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
