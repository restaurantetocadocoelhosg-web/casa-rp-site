// Gera uma página por linha de produto (/<slug>/index.html) + sitemap.xml.
// Uso: node ferramentas/gerar-paginas.mjs   (roda na raiz do repo)
// As páginas são geradas: para mudar texto, edite ferramentas/paginas.mjs e rode de novo.
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PAGINAS } from './paginas.mjs';
import { RAIZ, SITE, esc, semTags, wpp, documento, sitemap, hojeSP } from './layout.mjs';

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
  const corpo = `  <nav class="wrap migalha" aria-label="Você está em"><a href="/">Início</a> › <a href="/#linhas">Linhas</a> › <span>${esc(p.nome)}</span></nav>

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
`;
  return documento({ titulo: p.titulo, descricao: p.descricao, url, imagem: `${SITE}/img/${p.img}`, ld, msg, corpo });
}

for (const p of PAGINAS) {
  const pasta = join(RAIZ, p.slug);
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, 'index.html'), pagina(p));
}
// Novidades publicadas pelo robô (se existirem) também entram no sitemap.
const nov = join(RAIZ, 'novidades');
const extras = existsSync(nov) ? readdirSync(nov, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(nov, d.name, 'index.html'))).map((d) => `novidades/${d.name}/`).sort() : [];
const enderecos = ['', ...PAGINAS.map((p) => `${p.slug}/`), ...(extras.length ? ['novidades/', ...extras] : [])];
writeFileSync(join(RAIZ, 'sitemap.xml'), sitemap(enderecos));
console.log(`${PAGINAS.length} páginas + sitemap (${enderecos.length} endereços) gerados em ${hojeSP()}`);
