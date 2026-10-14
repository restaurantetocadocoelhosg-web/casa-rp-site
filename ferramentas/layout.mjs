// Moldura comum das páginas geradas (cabeçalho, rodapé, WhatsApp, chat).
// Usado por gerar-paginas.mjs (linhas de produto) e novidades.mjs (posts do robô).
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://www.casarpresistencias.com.br';
export const WPP = '5521965987979';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export const semTags = (s) => String(s).replace(/<[^>]+>/g, '');
export const wpp = (texto) => `https://wa.me/${WPP}?text=${encodeURIComponent(texto)}`;
// JSON-LD dentro de <script>: "<" escapado impede fechar a tag com "</script>".
const json = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
export const hojeSP = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

// Ícone do WhatsApp copiado da home (fonte única).
const SVG_WPP = readFileSync(join(RAIZ, 'index.html'), 'utf8').match(/<svg viewBox="0 0 32 32"[\s\S]*?<\/svg>/)[0];
const ICONE = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Crect%20x='15'%20y='15'%20width='70'%20height='70'%20rx='12'%20transform='rotate(45%2050%2050)'%20fill='%23f5b800'/%3E%3Ctext%20x='50'%20y='64'%20font-size='38'%20text-anchor='middle'%20font-family='Arial%20Black'%20font-weight='900'%20fill='%230e1b33'%3ERP%3C/text%3E%3C/svg%3E";

/** Página completa. `corpo` é HTML já escapado; o resto é escapado aqui. */
export function documento({ titulo, descricao, url, imagem, ld = [], msg, corpo, tipoOg = 'website' }) {
  const linkWpp = esc(wpp(msg));
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(titulo)} | Casa RP</title>
  <meta name="description" content="${esc(descricao)}" />
  <link rel="canonical" href="${esc(url)}" />
  <meta name="theme-color" content="#0e1b33" />
  <link rel="icon" href="${ICONE}" />
  <meta property="og:type" content="${tipoOg}" />
  <meta property="og:title" content="${esc(titulo)}" />
  <meta property="og:description" content="${esc(descricao)}" />
  <meta property="og:image" content="${esc(imagem)}" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:locale" content="pt_BR" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
${ld.map((o) => `  <script type="application/ld+json">\n${json(o)}\n  </script>`).join('\n')}
</head>
<body>

<header class="topo">
  <div class="wrap topo-in">
    <a class="marca" href="/" aria-label="Casa RP Resistências — início">
      <span class="losango" aria-hidden="true"><span>RP</span></span>
      <span class="marca-txt"><strong>CASA RP</strong><small>Resistências</small></span>
    </a>
    <nav class="menu" aria-label="Navegação principal">
      <a href="/#linhas">Linhas</a>
      <a href="/resistencia-chuveiro-lorenzetti/">Chuveiros</a>
      <a href="/novidades/">Novidades</a>
      <a href="/#contato">Contato</a>
      <a class="destaque" href="${linkWpp}" target="_blank" rel="noopener">Orçamento</a>
    </nav>
  </div>
</header>

<main>
${corpo}
</main>

<footer>
  <div class="wrap foot-grid">
    <div>
      <h3>◆ Casa RP Resistências</h3>
      <p class="muted" style="margin:0.4rem 0 0">Soluções que aquecem.<br />R. Visconde do Uruguai, 264 — Centro, Niterói · RJ<br />CNPJ 40.037.362/0001-71</p>
    </div>
    <div>
      <h3>Atendimento</h3>
      <ul>
        <li><a href="https://wa.me/${WPP}" target="_blank" rel="noopener">WhatsApp (21) 96598-7979</a></li>
        <li><a href="tel:+552126208167">(21) 2620-8167</a></li>
        <li><a href="mailto:casarpresistenciaseletrica@hotmail.com">E-mail</a></li>
      </ul>
    </div>
    <div>
      <h3>Siga a Casa RP</h3>
      <ul>
        <li><a href="https://www.instagram.com/rp_resistencias" target="_blank" rel="noopener">Instagram @rp_resistencias</a></li>
        <li><a href="/novidades/">Novidades</a></li>
      </ul>
    </div>
  </div>
  <p class="wrap copy">© 2026 Casa RP Resistências — Niterói, RJ.</p>
</footer>

<a class="wpp-float" href="${linkWpp}" target="_blank" rel="noopener" aria-label="Fazer orçamento pelo WhatsApp">
  <span class="sr-only">Fazer orçamento pelo WhatsApp</span>
  ${SVG_WPP}
</a>

<script src="/chat.js" defer></script>
</body>
</html>
`;
}

/** Sitemap com a home, as linhas e as novidades que existirem no disco. */
export function sitemap(enderecos) {
  const hoje = hojeSP();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${enderecos.map((u) => `  <url>\n    <loc>${SITE}/${u}</loc>\n    <lastmod>${hoje}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
}
