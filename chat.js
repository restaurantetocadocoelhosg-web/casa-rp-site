/* Chat de dúvidas rápidas — Casa RP Resistências
   Responde na hora com dados oficiais; pedido de contato vira cadastro + aviso
   no WhatsApp do representante (via webhook n8n). */
(function () {
  'use strict';

  const CFG = {
    nome: 'Casa RP Resistências',
    saudacao: 'Olá! 🔧 Sou o assistente da Casa RP. Posso responder na hora — ou, se preferir, um representante te chama no WhatsApp. É só tocar num botão!',
    corTopo: 'linear-gradient(135deg,#16294d,#081124)',
    corAcento: '#d4941e',
    whatsapp: '5521965987979',
    leadWebhook: 'https://n8n-production-806f.up.railway.app/webhook/casa-rp-lead-site',
    chips: ['Horários', 'Endereço', 'Orçamento', 'Sob medida', 'Entrega', '📞 Quero que me chamem'],
    semResposta: 'Essa é com nossos especialistas! Chama no WhatsApp ou toca em "📞 Quero que me chamem" que um representante te retorna. 👇',
    base: [
      { k: ['horario', 'hora', 'abre', 'fecha', 'funciona', 'aberto', 'sabado', 'domingo'],
        r: 'Nossos horários:\n• Seg a sex: 8h30 às 17h30\n• Sábado: 8h30 às 12h\n• Domingo: fechado 🕗' },
      { k: ['endereco', 'onde', 'fica', 'local', 'chegar', 'loja', 'rua', 'mapa', 'niteroi'],
        r: 'Estamos na R. Visconde do Uruguai, 264 — Centro, Niterói/RJ. 📍',
        link: ['Abrir no Google Maps', 'https://www.google.com/maps/search/?api=1&query=Casa%20RP%20Resist%C3%AAncias%2C%20R.%20Visconde%20do%20Uruguai%20264%2C%20Niter%C3%B3i'] },
      { k: ['orcamento', 'preco', 'valor', 'custa', 'quanto', 'cotacao'],
        r: 'Orçamento é rápido: manda a descrição da peça, as medidas, a voltagem/potência — ou simplesmente uma FOTO da resistência — no nosso WhatsApp (21) 96598-7979. Atendimento personalizado! 📋' },
      { k: ['sob medida', 'medida', 'fabrica', 'fabricacao', 'personalizada', 'especial'],
        r: 'Sim! Além das peças novas de linha, FABRICAMOS resistências sob medida a partir das especificações do seu equipamento (medidas, voltagem e potência). Manda uma foto da peça que a gente resolve! 🏭' },
      { k: ['entrega', 'envio', 'frete', 'enviam', 'correio', 'sedex', 'chega'],
        r: 'Entrega rápida para Rio de Janeiro, Niterói e São Gonçalo — e ENVIAMOS PARA TODO O BRASIL! 🚚 Você também pode retirar na loja, no Centro de Niterói.' },
      { k: ['chuveiro', 'ducha', 'lorenzetti', 'fame', 'corona', 'hydra', 'banho'],
        r: 'Trabalhamos com a linha de reposição para chuveiros Lorenzetti (Loren Shower, Bella Ducha), FAME e Corona/Hydra — sempre peças novas, 127V e 220V. 🚿' },
      { k: ['instala', 'instalar', 'como troca', 'trocar', 'ajuda'],
        r: 'Oferecemos atendimento especializado para orientar você na instalação correta da sua resistência. Chama que a gente resolve! 🔧' },
      { k: ['nota fiscal', 'nota', 'nf', 'cnpj', 'empresa'],
        r: 'Sim, emitimos nota fiscal! CNPJ 40.037.362/0001-71 — Casa RP Resistências. 🧾' },
      { k: ['forno', 'fritadeira', 'banho-maria', 'banho maria', 'cafeteira', 'autoclave', 'sauna', 'boiler', 'estufa', 'extrusora', 'mica', 'imersao', 'tubular', 'fio', 'secadora', 'industrial', 'padaria', 'resistencia para'],
        r: 'Temos resistências para fornos industriais e comerciais, fritadeiras, banho-maria, cafeteiras, autoclaves, secadoras hospitalares, imersão/boilers, tubulares, mica, fio resistência, sauna seca e mais — novas ou sob medida. Me diz o equipamento no WhatsApp com foto/medidas que fazemos o orçamento! ⚡' },
      { k: ['telefone', 'ligar', 'fixo', 'contato', 'numero'],
        r: 'Nossos contatos:\n• WhatsApp (orçamentos): (21) 96598-7979\n• Telefone fixo: (21) 2620-8167\n• E-mail: casarpresistenciaseletrica@hotmail.com 📞' },
      { k: ['pagamento', 'cartao', 'pix', 'parcela', 'aceita'],
        r: 'Formas de pagamento e condições você combina direto com nossa equipe no orçamento — chama no WhatsApp (21) 96598-7979! 💳' }
    ]
  };

  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function responder(texto) {
    const t = norm(texto);
    let melhor = null, pts = 0;
    for (const item of CFG.base) {
      const hits = item.k.filter(k => t.includes(norm(k))).length;
      if (hits > pts) { pts = hits; melhor = item; }
    }
    return melhor;
  }

  const css = `
  .rpchat-btn{position:fixed;right:18px;bottom:18px;z-index:9998;width:58px;height:58px;border-radius:999px;border:none;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 12px 28px rgba(0,0,0,.4);cursor:pointer;transition:transform .18s}
  .rpchat-btn:hover{transform:translateY(-3px) scale(1.04)}
  .rpchat-btn svg{width:30px;height:30px}
  .rpchat-hint{position:fixed;right:84px;bottom:30px;z-index:9998;background:#fff;color:#222;font:600 12px/1.3 Inter,system-ui,sans-serif;padding:8px 12px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:rpchat-pop .4s ease}
  .rpchat-hint:after{content:"";position:absolute;right:-6px;top:50%;transform:translateY(-50%);border:6px solid transparent;border-left-color:#fff;border-right:none}
  @keyframes rpchat-pop{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
  .rpchat-panel{position:fixed;right:18px;bottom:88px;z-index:9999;width:min(370px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 110px));display:none;flex-direction:column;background:#f7f9fd;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5);font-family:Inter,system-ui,sans-serif}
  .rpchat-panel.aberto{display:flex}
  .rpchat-head{padding:14px 16px;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .rpchat-head b{font-size:15px}
  .rpchat-head small{display:block;font-weight:400;font-size:11px;opacity:.85}
  .rpchat-x{background:rgba(255,255,255,.15);border:none;color:#fff;width:30px;height:30px;border-radius:99px;cursor:pointer;font-size:15px;line-height:1}
  .rpchat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,#eef2f9,#f7f9fd)}
  .rpchat-m{max-width:85%;padding:10px 13px;border-radius:15px;font-size:13.5px;line-height:1.45;white-space:pre-line;animation:rpchat-pop .25s ease}
  .rpchat-m.bot{background:#fff;color:#1d2735;border:1px solid rgba(14,27,51,.12);border-bottom-left-radius:5px;align-self:flex-start;box-shadow:0 2px 8px rgba(0,0,0,.05)}
  .rpchat-m.eu{background:#dcf8c6;color:#1c2b17;border-bottom-right-radius:5px;align-self:flex-end}
  .rpchat-m a.rpchat-link{display:inline-block;margin-top:8px;font-weight:700;font-size:12.5px;text-decoration:none;padding:8px 12px;border-radius:10px;color:#fff}
  .rpchat-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#f7f9fd}
  .rpchat-chip{border-radius:99px;padding:7px 12px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer;background:#fff;transition:.15s}
  .rpchat-in{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.08);background:#fff}
  .rpchat-in input{flex:1;border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px 12px;font:400 13.5px Inter,system-ui,sans-serif;outline:none}
  .rpchat-send{border:none;border-radius:12px;width:42px;color:#fff;cursor:pointer;font-size:16px}
  .rpchat-wa{display:flex;align-items:center;justify-content:center;gap:8px;margin:6px 14px 12px;padding:11px;border-radius:12px;background:#25d366;color:#063a1e;font:800 13px Inter,system-ui,sans-serif;text-decoration:none}
  @media (max-width:480px){.rpchat-panel{right:8px;bottom:80px}}
  `;

  function init() {
    const style = document.createElement('style');
    style.textContent = css +
      `.rpchat-head{background:${CFG.corTopo}}` +
      `.rpchat-chip{border:1px solid ${CFG.corAcento};color:#5b3d05}` +
      `.rpchat-chip:hover{background:${CFG.corAcento};color:#fff}` +
      `.rpchat-send{background:${CFG.corAcento}}` +
      `.rpchat-m a.rpchat-link{background:${CFG.corAcento}}`;
    document.head.appendChild(style);

    const antigo = document.querySelector('.wpp-float');
    if (antigo) antigo.remove();

    const btn = document.createElement('button');
    btn.className = 'rpchat-btn';
    btn.setAttribute('aria-label', 'Abrir chat de dúvidas');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';

    const hint = document.createElement('div');
    hint.className = 'rpchat-hint';
    hint.textContent = 'Dúvidas? Orçamento? Fala comigo! ⚡';

    const panel = document.createElement('div');
    panel.className = 'rpchat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat de dúvidas rápidas');
    panel.innerHTML =
      `<div class="rpchat-head"><div><b>${CFG.nome}</b><small>respostas na hora · sem espera</small></div><button class="rpchat-x" aria-label="Fechar chat">✕</button></div>` +
      `<div class="rpchat-msgs"></div>` +
      `<div class="rpchat-chips">${CFG.chips.map(c => `<button class="rpchat-chip">${c}</button>`).join('')}</div>` +
      `<a class="rpchat-wa" target="_blank" rel="noopener">💬 Falar agora no WhatsApp</a>` +
      `<div class="rpchat-in"><input type="text" placeholder="Escreva sua pergunta..." aria-label="Sua pergunta" maxlength="300" /><button class="rpchat-send" aria-label="Enviar">➤</button></div>`;

    document.body.appendChild(btn);
    document.body.appendChild(hint);
    document.body.appendChild(panel);

    const msgs = panel.querySelector('.rpchat-msgs');
    const input = panel.querySelector('input');
    const waBtn = panel.querySelector('.rpchat-wa');
    let ultimaPergunta = '';
    // fluxo do representante: null | 'nome' | 'telefone' | 'duvida' | 'enviando'
    let lead = { etapa: null, nome: '', telefone: '', duvida: '' };

    function setWa() {
      const txt = ultimaPergunta
        ? `Olá! Vim pelo site da Casa RP e tenho uma dúvida: ${ultimaPergunta}`
        : 'Olá! Vim pelo site da Casa RP e quero um orçamento.';
      waBtn.href = `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(txt)}`;
    }

    function add(texto, quem, link) {
      const el = document.createElement('div');
      el.className = `rpchat-m ${quem}`;
      el.textContent = texto;
      if (link) {
        const a = document.createElement('a');
        a.className = 'rpchat-link';
        a.href = link[1]; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = link[0] + ' ↗';
        el.appendChild(document.createElement('br'));
        el.appendChild(a);
      }
      msgs.appendChild(el);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function iniciarLead() {
      lead = { etapa: 'nome', nome: '', telefone: '', duvida: '' };
      add('Fechado! Um representante da Casa RP vai te chamar no WhatsApp. 📞\n\nPra começar: qual é o seu nome?', 'bot');
      input.placeholder = 'Seu nome...';
      input.focus();
    }

    async function enviarLead() {
      lead.etapa = 'enviando';
      add('Registrando seu pedido... ⏳', 'bot');
      try {
        const r = await fetch(CFG.leadWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: lead.nome, telefone: lead.telefone, duvida: lead.duvida })
        });
        const d = await r.json();
        if (d && d.ok) {
          add(`Prontinho, ${lead.nome.split(' ')[0]}! ✅\nSeu pedido foi registrado e o representante da Casa RP já foi avisado — em breve ele te chama no WhatsApp que você informou.\n\nHorário de atendimento: seg–sex 8h30–17h30, sáb 8h30–12h.`, 'bot');
        } else {
          throw new Error((d && d.erro) || 'falha');
        }
      } catch (e) {
        add('Ops, não consegui registrar agora. 😕 Mas sem problema: chama direto no nosso WhatsApp que o atendimento te responde!', 'bot');
      }
      lead = { etapa: null, nome: '', telefone: '', duvida: '' };
      input.placeholder = 'Escreva sua pergunta...';
    }

    function tratarLead(texto) {
      if (lead.etapa === 'nome') {
        if (texto.trim().length < 2) { add('Me diz seu nome, por favor. 🙂', 'bot'); return; }
        lead.nome = texto.trim().slice(0, 80);
        lead.etapa = 'telefone';
        add(`Prazer, ${lead.nome.split(' ')[0]}! Agora me passa o seu WhatsApp com DDD (ex.: 21 99999-9999):`, 'bot');
        input.placeholder = 'Seu WhatsApp com DDD...';
        return;
      }
      if (lead.etapa === 'telefone') {
        const dig = texto.replace(/\D/g, '');
        if (dig.length < 10 || dig.length > 13) { add('Hmm, esse número não parece completo. Manda com DDD, ex.: 21 99999-9999 📱', 'bot'); return; }
        lead.telefone = dig;
        lead.etapa = 'duvida';
        add('Anotado! E qual é a sua dúvida ou o que você precisa? (ex.: "orçamento de resistência para forno industrial")', 'bot');
        input.placeholder = 'Sua dúvida...';
        return;
      }
      if (lead.etapa === 'duvida') {
        lead.duvida = texto.trim().slice(0, 500);
        enviarLead();
      }
    }

    function perguntar(texto) {
      if (!texto.trim() || lead.etapa === 'enviando') return;
      add(texto, 'eu');
      if (lead.etapa) { tratarLead(texto); return; }
      if (norm(texto).includes('quero que me chamem') || norm(texto).includes('me liguem') || norm(texto).includes('representante')) { iniciarLead(); return; }
      ultimaPergunta = texto; setWa();
      const resp = responder(texto);
      setTimeout(() => {
        if (resp) add(resp.r, 'bot', resp.link || null);
        else add(CFG.semResposta, 'bot');
      }, 350);
    }

    btn.addEventListener('click', () => {
      panel.classList.toggle('aberto');
      hint.remove();
      if (panel.classList.contains('aberto') && !msgs.children.length) {
        add(CFG.saudacao, 'bot'); setWa();
      }
      if (panel.classList.contains('aberto')) input.focus();
    });
    panel.querySelector('.rpchat-x').addEventListener('click', () => panel.classList.remove('aberto'));
    panel.querySelectorAll('.rpchat-chip').forEach(c => c.addEventListener('click', () => perguntar(c.textContent)));
    panel.querySelector('.rpchat-send').addEventListener('click', () => { perguntar(input.value); input.value = ''; });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { perguntar(input.value); input.value = ''; } });

    setTimeout(() => hint.remove(), 9000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
