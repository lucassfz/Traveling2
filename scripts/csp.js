// Content-Security-Policy de todas as páginas do site, num lugar só.
//
// O GitHub Pages não deixa configurar cabeçalhos, então a política vai numa
// <meta http-equiv> logo depois do <meta charset>. Scripts inline são liberados
// pelo sha256 do conteúdo (nada de 'unsafe-inline'), e o hash muda a cada
// edição: as páginas geradas recebem a política pelo build:pages; as escritas
// à mão (index.html, parceiros.html, privacidade.html) pelo npm run build:csp.
// validate-page.js reprova qualquer página com a política fora de dia.
import { createHash } from 'node:crypto';

// Mesma política para todas as páginas: o que o globo (index.html) precisa
// cobre o que as páginas estáticas usam.
export const CSP_DIRECTIVES = Object.freeze({
  'default-src': ["'self'"],
  // Só a versão fixada do three.js: a jsDelivr serve qualquer pacote do npm, e liberar
  // o domínio inteiro deixaria carregar código de terceiros por ele.
  'script-src': ["'self'", 'https://cdn.jsdelivr.net/npm/three@0.160.1/', 'https://static.cloudflareinsights.com'],
  // <style> e style="" nas páginas e no app; CSS não executa código.
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  // commons.wikimedia.org/wiki/Special:FilePath redireciona para thumb.wikimedia.org
  // (miniaturas); a CSP vale para cada endereço da cadeia de redirecionamento.
  'img-src': ["'self'", 'data:', 'blob:', 'https://flagcdn.com', 'https://commons.wikimedia.org', 'https://upload.wikimedia.org', 'https://thumb.wikimedia.org'],
  'connect-src': ["'self'", 'https://cdn.jsdelivr.net/npm/', 'https://olinda.bcb.gov.br', 'https://traveling-api.travelingorgsenac.workers.dev', 'https://cloudflareinsights.com'],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
  'frame-src': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"]
});

export const HAND_WRITTEN_PAGES = ['index.html', 'parceiros.html', 'privacidade.html'];

const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
const META = /<meta\s+http-equiv="Content-Security-Policy"\s+content="[^"]*">/;
const CHARSET = /^([ \t]*)<meta charset="UTF-8">\r?\n/m;

/** Scripts inline que o navegador executa (ignora src= e dados JSON-LD). */
export function inlineScripts(html) {
  return [...html.matchAll(SCRIPT)]
    .filter(([, attributes = '']) => !/\ssrc=/.test(attributes) && !/type="application\/ld\+json"/.test(attributes))
    .map(match => ({ attributes: (match[1] ?? '').trim(), content: match[2], index: match.index }));
}

export function scriptHash(content) {
  return `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
}

export function cspFor(html) {
  const hashes = [...new Set(inlineScripts(html).map(script => scriptHash(script.content)))];
  return Object.entries(CSP_DIRECTIVES)
    .map(([name, values]) => [name, ...values, ...(name === 'script-src' ? hashes : [])].join(' '))
    .join('; ');
}

/** A página com a política em dia (troca a existente ou insere após o charset). */
export function withCsp(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${cspFor(html)}">`;
  if (META.test(html)) return html.replace(META, meta);
  const charset = CHARSET.exec(html);
  if (!charset) throw new Error('página sem <meta charset="UTF-8"> para ancorar a CSP');
  return html.replace(CHARSET, `${charset[0]}${charset[1]}${meta}\n`);
}
