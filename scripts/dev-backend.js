// Servidor local do backend para desenvolvimento, sem wrangler nem dependências:
// roda o mesmo Worker (backend/src/index.js) em Node.
//
//   npm run dev:backend            # http://localhost:8787/api/v1/providers/status
//
// Para ligar a busca no site local, adicione temporariamente ao <head> do index.html:
//   <meta name="traveling-api" content="http://localhost:8787/api/v1">
// (não commitar a meta apontando para localhost). Rode o site com npm run dev: só
// ele libera localhost:8787 na Content-Security-Policy.
//
// Variáveis: PORT (padrão 8787), ALLOWED_ORIGINS (padrão: servidores locais comuns),
// FLIGHT_PROVIDERS/HOTEL_PROVIDERS (padrão "mock"), DUFFEL_TOKEN (só se usar "duffel"),
// TRAVELPAYOUTS_TOKEN (preços vistos recentemente em /flights/cheapest).
import { createServer } from 'node:http';
import { createApp } from '../backend/src/index.js';

const port = Number(process.env.PORT ?? 8787);
const env = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? 'http://localhost:8765,http://127.0.0.1:8765,http://localhost:5500,http://127.0.0.1:5500',
  FLIGHT_PROVIDERS: process.env.FLIGHT_PROVIDERS ?? 'mock',
  HOTEL_PROVIDERS: process.env.HOTEL_PROVIDERS ?? 'mock',
  RATE_PER_MINUTE: process.env.RATE_PER_MINUTE ?? '30',
  ...(process.env.DUFFEL_TOKEN ? { DUFFEL_TOKEN: process.env.DUFFEL_TOKEN } : {}),
  ...(process.env.TRAVELPAYOUTS_TOKEN ? { TRAVELPAYOUTS_TOKEN: process.env.TRAVELPAYOUTS_TOKEN } : {})
};
const app = createApp();

createServer(async (incoming, outgoing) => {
  const chunks = [];
  for await (const chunk of incoming) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const request = new Request(`http://localhost:${port}${incoming.url}`, {
    method: incoming.method,
    headers: { ...incoming.headers, 'cf-connecting-ip': incoming.socket.remoteAddress ?? '127.0.0.1' },
    ...(body.length && !['GET', 'HEAD'].includes(incoming.method) ? { body } : {})
  });
  const response = await app.fetch(request, env);
  outgoing.writeHead(response.status, Object.fromEntries(response.headers));
  outgoing.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.log(`Backend local em http://localhost:${port}/api/v1 (fornecedores: voos ${env.FLIGHT_PROVIDERS}, hotéis ${env.HOTEL_PROVIDERS})`));
