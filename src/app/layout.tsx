import type { Metadata, Viewport } from "next";
import "./globals.css";

const themeInitScript = `
try {
  const allowedModes = { light: true, dark: true, system: true };
  const storedMode = window.localStorage.getItem('mode');
  const legacyTheme = window.localStorage.getItem('whatsapp-cloud-inbox-theme');
  const forcedModeAttr = document.documentElement.getAttribute('data-force-mode');
  const forcedMode = forcedModeAttr === 'light' || forcedModeAttr === 'dark' ? forcedModeAttr : null;
  const legacyMode = legacyTheme === 'kapso' ? 'dark' : legacyTheme === 'normal' ? 'light' : null;
  // El inbox del agente siempre arranca en light, sin importar lo que tenga el storage.
  const isInbox = window.location.pathname === '/inbox' || window.location.pathname.startsWith('/inbox/');
  const mode = forcedMode || (isInbox ? 'light' : (allowedModes[storedMode] ? storedMode : legacyMode || 'dark'));
  const resolvedMode = !forcedMode && mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  window.localStorage.setItem('theme', 'default');
  window.localStorage.setItem('mode', mode);
  window.localStorage.removeItem('whatsapp-cloud-inbox-theme');

  document.documentElement.dataset.theme = 'default';
  document.documentElement.dataset.mode = resolvedMode;
  document.documentElement.style.colorScheme = resolvedMode;
  document.documentElement.style.backgroundColor = resolvedMode === 'dark' ? 'hsl(20 14.3% 4.1%)' : 'hsl(0 0% 100%)';

  if (resolvedMode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch {
  document.documentElement.dataset.theme = 'default';
  document.documentElement.dataset.mode = 'dark';
  document.documentElement.classList.add('dark');
}
`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Refinance — Campañas de donación que viven en WhatsApp",
  description:
    "Plataforma para ONGs argentinas: agente IA en WhatsApp, kit viral generado, fondos en escrow on-chain con liberación por hitos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
