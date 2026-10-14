// node --test test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { limparLegenda, validarFonte, gerarNovidades, paginaRelacionada, slugDe } from '../ferramentas/novidades.mjs';

const BASE = 'https://zuwdgyvbuaocbzckhhlm.supabase.co/storage/v1/object/public/posts-instagram/rp_resistencias/';
const LEGENDA = `Resistência Forno Turbo: Qualidade e Durabilidade para sua Padaria

Seu pão quentinho todas as horas! A resistência Forno Turbo da Casa RP é específica para fornos de padaria.

Solicite seu orçamento agora mesmo.

WhatsApp: (21) 96598-7979
Shopee: shopee.com.br/shop/340178083
R. Visconde do Uruguai, 264 - Centro, Niterói RJ
Seg-Sex 8h30-17h30 | Sab 8h30-12h

#ResistênciaFornoTurbo #Padaria #NiteróiRJ`;
const item = (extra = {}) => ({ arquivo: 'feed-13-05-15h.jpeg', data: '2026-05-17', legenda: LEGENDA, imagem: `${BASE}biblioteca/feed-13-05-15h.jpeg`, ...extra });
const fotoFalsa = async () => new Response(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), { headers: { 'content-type': 'image/jpeg' } });

test('legenda vira título + parágrafos, sem hashtag e sem bloco de contato', () => {
  const c = limparLegenda(LEGENDA);
  assert.equal(c.titulo, 'Resistência Forno Turbo: Qualidade e Durabilidade para sua Padaria');
  const texto = c.paragrafos.join(' ');
  assert.match(texto, /pão quentinho/);
  assert.doesNotMatch(texto, /#|Shopee|WhatsApp|Visconde|Seg-Sex/);
});

test('fonte: nome simples, data válida e sem legenda do restaurante', () => {
  const ok = validarFonte({ itens: [
    item(),
    item({ arquivo: '../../index.jpg' }),
    item({ imagem: 'https://evil.example/x.jpg' }),
    item({ legenda: 'Quando a comida caseira chega... Toca do Coelho' }),
    item({ data: '17/05/2026' }),
    item({ arquivo: 'video.mp4' }),
  ] });
  // A de outro host é aceita, mas a foto vem do NOSSO bucket (endereço remontado pelo nome).
  assert.equal(ok.length, 2);
  assert.ok(ok.every((i) => i.imagem.startsWith(`${BASE}biblioteca/`)));
  assert.deepEqual(validarFonte(null), []);
  assert.deepEqual(validarFonte({ itens: 'x' }), []);
});

test('cada post aponta para a página do produto certo', () => {
  assert.equal(paginaRelacionada('Resistência Forno Turbo').slug, 'resistencia-forno-industrial');
  assert.equal(paginaRelacionada('Resistência Bella Ducha 4T Lorenzetti').slug, 'resistencia-chuveiro-lorenzetti');
  assert.equal(paginaRelacionada('Deus te dando uma nova chance! Bom dia'), null);
});

test('gera página, foto local, índice; rodar de novo não duplica', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const r1 = await gerarNovidades({ itens: [item(), item({ arquivo: 'bomdia.jpeg', legenda: 'Deus te dando uma nova chance! Bom dia a todos' })] }, { raiz, baixar: fotoFalsa });
  assert.deepEqual(r1, { fonte: 2, paginas: 1, novas: 1, semFoto: 0, adiadas: 0 });
  const slug = slugDe(item(), limparLegenda(LEGENDA).titulo);
  const html = readFileSync(join(raiz, 'novidades', slug, 'index.html'), 'utf8');
  assert.match(html, /href="\/resistencia-forno-industrial\/"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.casarpresistencias\.com\.br\/novidades\//);
  assert.ok(existsSync(join(raiz, 'novidades', slug, 'foto.jpg')));
  assert.match(readFileSync(join(raiz, 'novidades', 'index.html'), 'utf8'), new RegExp(slug));
  const r2 = await gerarNovidades({ itens: [item()] }, { raiz, baixar: async () => { throw new Error('não deveria baixar de novo'); } });
  assert.equal(r2.novas, 0);
  assert.equal(readdirSync(join(raiz, 'novidades')).filter((n) => n !== 'index.html').length, 1);
});

test('legenda maliciosa é escapada (sem script no HTML)', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const mal = `Resistência forno <script>alert(1)</script>\n\nTexto "aspas" <img src=x onerror=alert(2)> sobre fornos`;
  await gerarNovidades({ itens: [item({ legenda: mal })] }, { raiz, baixar: fotoFalsa });
  const dir = readdirSync(join(raiz, 'novidades')).find((n) => n !== 'index.html');
  const html = readFileSync(join(raiz, 'novidades', dir, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<script>alert|<img src=x/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];
  assert.doesNotMatch(ld, /<\/script/i);
  assert.ok(JSON.parse(ld).headline.includes('<script>'));
});

test('arquivo que não é imagem não vira página; fonte vazia não apaga o índice', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const html = async () => new Response('<html>', { headers: { 'content-type': 'text/html' } });
  const r = await gerarNovidades({ itens: [item()] }, { raiz, baixar: html });
  assert.deepEqual(r, { fonte: 1, paginas: 0, novas: 0, semFoto: 1, adiadas: 0 });
  await gerarNovidades({ itens: [item()] }, { raiz, baixar: fotoFalsa });
  const antes = readFileSync(join(raiz, 'novidades', 'index.html'), 'utf8');
  await gerarNovidades({ itens: [] }, { raiz, baixar: fotoFalsa });
  assert.equal(readFileSync(join(raiz, 'novidades', 'index.html'), 'utf8'), antes);
});

test('emoji no limite do título não quebra a rodada', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const titulo = 'Resistência de forno ' + 'x'.repeat(38) + '🔥🔥 padaria';
  const r = await gerarNovidades({ itens: [item({ legenda: `${titulo}\n\nTexto sobre forno turbo.` })] }, { raiz, baixar: fotoFalsa });
  assert.equal(r.paginas, 1);
});

test('limpeza: mantém "Segurança"/"Sabores", tira "Seg-Sex" e "Sab 8h30"', () => {
  const c = limparLegenda('Resistência para forno turbo\n\nSegurança em primeiro lugar.\nSabores de padaria.\nSeg-Sex 8h30-17h30 | Sab 8h30-12h\nSab 8h30-12h');
  assert.deepEqual(c.paragrafos, ['Segurança em primeiro lugar.', 'Sabores de padaria.']);
});

test('legenda mudou: reaproveita a mesma página (URL não muda, sem órfã)', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  await gerarNovidades({ itens: [item()] }, { raiz, baixar: fotoFalsa });
  await gerarNovidades({ itens: [item({ legenda: 'Forno turbo: título novo\n\nOutro texto do forno.' })] }, { raiz, baixar: fotoFalsa });
  const pastas = readdirSync(join(raiz, 'novidades')).filter((n) => n !== 'index.html');
  assert.equal(pastas.length, 1);
  assert.match(readFileSync(join(raiz, 'novidades', pastas[0], 'index.html'), 'utf8'), /título novo/);
});

test('foto falhou (erro de rede): não cria pasta vazia e não derruba os outros', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  let n = 0;
  const baixar = async () => { if (n++ === 0) throw new Error('timeout'); return fotoFalsa(); };
  const r = await gerarNovidades({ itens: [item(), item({ arquivo: 'outro.jpeg', legenda: 'Resistência para sauna seca\n\nTexto da sauna.' })] }, { raiz, baixar });
  assert.deepEqual(r, { fonte: 2, paginas: 1, novas: 1, semFoto: 1, adiadas: 0 });
  const pastas = readdirSync(join(raiz, 'novidades')).filter((x) => x !== 'index.html');
  assert.equal(pastas.length, 1);
  assert.ok(existsSync(join(raiz, 'novidades', pastas[0], 'index.html')));
});

test('foto: endereço é remontado do nome (../ e outro bucket nunca são baixados)', () => {
  const [ok] = validarFonte({ itens: [item({ imagem: `${BASE}../../../documentos/segredo.jpg` })] });
  assert.equal(ok.imagem, `${BASE}biblioteca/feed-13-05-15h.jpeg`);
  assert.equal(validarFonte({ itens: [item({ arquivo: 'a..b.jpg' }), item({ arquivo: '.oculto.jpg' })] }).length, 0);
});

test('arquivo com content-type de imagem mas sem assinatura de imagem é recusado', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const falso = async () => new Response('<svg onload=alert(1)>', { headers: { 'content-type': 'image/jpeg' } });
  const r = await gerarNovidades({ itens: [item()] }, { raiz, baixar: falso });
  assert.equal(r.paginas, 0);
});

test('fonte adulterada com 100 posts: só 20 páginas novas por dia', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const itens = Array.from({ length: 100 }, (_, i) => item({ arquivo: `p${i}.jpeg`, legenda: `Resistência para forno ${i}\n\nTexto.` }));
  const r = await gerarNovidades({ itens }, { raiz, baixar: fotoFalsa });
  assert.equal(r.novas, 20);
  assert.equal(r.adiadas, 80);
});

test('título: sem maiúsculas gritando, marcas certas, sem cortar palavra', async () => {
  const { arrumarTitulo } = await import('../ferramentas/novidades.mjs');
  assert.equal(arrumarTitulo('RESISTÊNCIA BELLA DUCHA 4T: A SOLUÇÃO PERFEITA PARA SEU CHUVEIRO'), 'Resistência Bella Ducha 4T: a solução perfeita para seu chuveiro');
  assert.equal(arrumarTitulo('Resistência Tubular U: a solução prática que sua manutenção e reposição precisava. Compatível com diversos equipamentos industriais'), 'Resistência Tubular U: a solução prática que sua manutenção e reposição precisava');
  const longo = arrumarTitulo('Resistências para secadoras hospitalares: eficiência térmica garantida e peças sob medida para sua lavanderia hospitalar');
  assert.ok(longo.endsWith('medida…') && Array.from(longo).length <= 91);
});

test('acendedor vira novidade, mas sem botão para página de forno', async () => {
  const raiz = mkdtempSync(join(tmpdir(), 'nov-'));
  const r = await gerarNovidades({ itens: [item({ legenda: 'Acendedor Elétrico Casa RP: praticidade no churrasco\n\nAcende carvão sem álcool, ideal para forno de pizza também.' })] }, { raiz, baixar: fotoFalsa });
  assert.equal(r.paginas, 1);
  const dir = readdirSync(join(raiz, 'novidades')).find((n) => n !== 'index.html');
  assert.doesNotMatch(readFileSync(join(raiz, 'novidades', dir, 'index.html'), 'utf8'), /btn-borda" href="\/resistencia/);
});
