// Gera uma página por linha de produto (/<slug>/index.html) + sitemap.xml.
// Uso: node ferramentas/gerar-paginas.mjs   (roda na raiz do repo)
// As páginas são geradas: para mudar texto, edite ferramentas/paginas.mjs e rode de novo.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINAS } from './paginas.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.casarpresistencias.com.br';
const WPP = '5521965987979';
const HOJE = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = (s) => String(s).replace(/<[^>]+>/g, '');
const wpp = (texto) => `https://wa.me/${WPP}?text=${encodeURIComponent(texto)}`;
// Ícone do WhatsApp copiado da home (fonte única).
const SVG_WPP = readFileSync(join(RAIZ, 'index.html'), 'utf8').match(/<svg viewBox="0 0 32 32"[\s\S]*?<\/svg>/)[0];
const json = (obj) => JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');

function pagina(p) {
  const url = `${SITE}/${p.slug}/`;
  const msg = `Olá! Vim pelo site e quero orçamento de resistência para ${p.curto.toUpperCase()}.`;
  const outras = PAGINAS.filter((o) => o.slug !== p.slug);
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Service',
      name: semTags(p.h1), serviceType: p.nome, description: p.descricao, url,
      image: `${SITE}/img/${p.img}`,
      provider: { '@id': `${SITE}/#loja` },
      areaServed: ['Niterói', 'São Gonçalo', 'Rio de Janeiro', 'Brasil'],
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: p.nome, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(p.titulo)} | Casa RP</title>
  <meta name="description" content="${esc(p.descricao)}" />
  <link rel="canonical" href="${url}" />
  <meta name="theme-color" content="#0e1b33" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20100%20100'%3E%3Crect%20x='15'%20y='15'%20width='70'%20height='70'%20rx='12'%20transform='rotate(45%2050%2050)'%20fill='%23f5b800'/%3E%3Ctext%20x='50'%20y='64'%20font-size='38'%20text-anchor='middle'%20font-family='Arial%20Black'%20font-weight='900'%20fill='%230e1b33'%3ERP%3C/text%3E%3C/svg%3E" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(p.titulo)}" />
  <meta property="og:description" content="${esc(p.descricao)}" />
  <meta property="og:image" content="${SITE}/img/${p.img}" />
  <meta property="og:url" content="${url}" />
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
      <a href="/#entrega">Entrega</a>
      <a href="/#contato">Contato</a>
      <a class="destaque" href="${esc(wpp(msg))}" target="_blank" rel="noopener">Orçamento</a>
    </nav>
  </div>
</header>

<main>
  <nav class="wrap migalha" aria-label="Você está em"><a href="/">Início</a> › <a href="/#linhas">Linhas</a> › <span>${esc(p.nome)}</span></nav>

  <section class="hero" aria-labelledby="titulo">
    <div class="wrap hero-grid">
      <div>
        <p class="slogan">— Casa RP Resistências · Niterói (RJ) —</p>
        <h1 id="titulo">${p.h1}</h1>
        <p class="lead">${esc(p.intro)}</p>
        <div class="hero-selos">
          <span class="selo">🏭 Fabricação própria</span>
          <span class="selo">📏 Sob medida</span>
          <span class="selo">🚚 Entrega no RJ e envio para todo o Brasil</span>
        </div>
        <div class="acoes">
          <a class="btn btn-ouro" href="${esc(wpp(msg))}" target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
          <a class="btn btn-borda" href="#como-pedir">Como pedir</a>
        </div>
      </div>
      <div class="hero-foto">
        <img src="/img/${p.img}" alt="${esc(p.alt)}" width="${p.w}" height="${p.h}" fetchpriority="high" />
      </div>
    </div>
  </section>

  <section aria-labelledby="titulo-uso">
    <div class="wrap split">
      <div>
        <p class="eyebrow">Onde usamos</p>
        <h2 id="titulo-uso">Para quais <em>equipamentos</em></h2>
        <div class="risco" aria-hidden="true"></div>
        <ul class="lista-check">
${p.aplicacoes.map((a) => `          <li>${esc(a)}</li>`).join('\n')}
        </ul>
      </div>
      <div>
        <p class="eyebrow">Sinais de que queimou</p>
        <h2 id="titulo-sinais">Quando <em>trocar</em></h2>
        <div class="risco" aria-hidden="true"></div>
        <ul class="lista-check">
${p.sinais.map((s) => `          <li>${esc(s)}</li>`).join('\n')}
        </ul>
      </div>
    </div>
  </section>

  <section id="como-pedir" aria-labelledby="titulo-passos">
    <div class="wrap">
      <p class="eyebrow">Simples assim</p>
      <h2 id="titulo-passos">Como pedir sua <em>resistência</em></h2>
      <div class="risco" aria-hidden="true"></div>
      <div class="passos">
        <div class="passo">
          <h3>Mande uma foto</h3>
          <p>No WhatsApp (21) 96598-7979: foto da peça antiga, medidas, <strong>voltagem</strong> e <strong>potência</strong> (W). Não sabe? A foto já ajuda.</p>
        </div>
        <div class="passo">
          <h3>Receba o orçamento</h3>
          <p>Peça de linha ou fabricação <strong>sob medida</strong>, com o prazo informado na hora.</p>
        </div>
        <div class="passo">
          <h3>Retire ou receba</h3>
          <p>Retirada no Centro de Niterói, entrega rápida no Rio, Niterói e São Gonçalo ou envio para todo o Brasil, com <strong>nota fiscal</strong>.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="duvidas" aria-labelledby="titulo-faq">
    <div class="wrap">
      <p class="eyebrow" style="text-align:center">Perguntas frequentes</p>
      <h2 id="titulo-faq" style="text-align:center">Dúvidas sobre <em>${esc(p.curto.toLowerCase())}</em></h2>
      <div class="faq">
${p.faq.map(([q, a]) => `        <details>\n          <summary>${esc(q)}</summary>\n          <div class="resp"><p>${esc(a)}</p></div>\n        </details>`).join('\n')}
      </div>
    </div>
  </section>

  <section aria-labelledby="titulo-outras">
    <div class="wrap">
      <p class="eyebrow">Catálogo</p>
      <h2 id="titulo-outras">Outras <em>linhas</em> de resistências</h2>
      <div class="risco" aria-hidden="true"></div>
      <ul class="outras-linhas">
${outras.map((o) => `        <li><a href="/${o.slug}/">${esc(o.ancora || `Resistência para ${o.curto.toLowerCase()}`)}</a></li>`).join('\n')}
      </ul>
    </div>
  </section>

  <section class="cta-final">
    <div class="wrap">
      <p class="eyebrow">Casa RP Resistências</p>
      <h2>Precisa da resistência<br /><em>para hoje?</em></h2>
      <p class="muted" style="max-width:34rem;margin:0 auto 1.8rem">R. Visconde do Uruguai, 264 — Centro, Niterói. Seg a sex 8h30–17h30 · Sáb 8h30–12h.</p>
      <div class="acoes">
        <a class="btn btn-wpp" href="${esc(wpp(msg))}" target="_blank" rel="noopener">Chamar no WhatsApp</a>
        <a class="btn btn-borda" href="tel:+552126208167">Ligar (21) 2620-8167</a>
      </div>
    </div>
  </section>
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
        <li><a href="https://linktr.ee/rp_resistencias" target="_blank" rel="noopener">Todos os links</a></li>
      </ul>
    </div>
  </div>
  <p class="wrap copy">© 2026 Casa RP Resistências — Niterói, RJ.</p>
</footer>

<a class="wpp-float" href="${esc(wpp(msg))}" target="_blank" rel="noopener" aria-label="Fazer orçamento pelo WhatsApp">
  <span class="sr-only">Fazer orçamento pelo WhatsApp</span>
  ${SVG_WPP}
</a>

<script src="/chat.js" defer></script>
</body>
</html>
`;
}

function sitemap(slugsExtras = []) {
  const urls = ['', ...PAGINAS.map((p) => `${p.slug}/`), ...slugsExtras];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${SITE}/${u}</loc>\n    <lastmod>${HOJE}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;
}

for (const p of PAGINAS) {
  const pasta = join(RAIZ, p.slug);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'index.html'), pagina(p));
}
// Novidades publicadas pelo robô (se existirem) também entram no sitemap.
const nov = join(RAIZ, 'novidades');
const extras = existsSync(nov) ? readdirSync(nov, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `novidades/${d.name}/`) : [];
writeFileSync(join(RAIZ, 'sitemap.xml'), sitemap(extras));
console.log(`${PAGINAS.length} páginas + sitemap (${PAGINAS.length + 1 + extras.length} endereços) gerados em ${HOJE}`);
