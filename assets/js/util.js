/* Utilitários compartilhados do VB Delivery (site público, painel, catálogo). */
(function (global) {
  'use strict';

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function preco(n) {
    return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

  function formatarTelefone(v) {
    var d = soDigitos(v);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return v || '';
  }

  // máscara enquanto digita: (15) 99999-9999
  function mascaraTelefone(input) {
    input.addEventListener('input', function () {
      var d = soDigitos(input.value).slice(0, 11);
      var out = d;
      if (d.length > 2) out = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length > 7) out = '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length === 11 ? 7 : 6) + '-' + d.slice(d.length === 11 ? 7 : 6);
      input.value = out;
    });
  }

  function slugificar(v) {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // "sao-miguel-arcanjo" -> "São Miguel Arcanjo" (sem acento, mas legível)
  function cidadeLegivel(slug) {
    return String(slug || '').split('-').map(function (p) {
      return p.length <= 2 && p !== 'sp' ? p : p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' ');
  }

  var SEGMENTOS = {
    pizzaria: 'Pizzaria', hamburgueria: 'Hamburgueria', lanchonete: 'Lanchonete', restaurante: 'Restaurante',
    japonesa: 'Comida japonesa', marmitaria: 'Marmitaria', acaiteria: 'Açaiteria', sorveteria: 'Sorveteria',
    doceria: 'Doceria', padaria: 'Padaria', mercado: 'Mercado', adega: 'Adega / bebidas', petshop: 'Petshop', outro: 'Delivery'
  };

  var DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  var PAGAMENTOS = { pix: 'Pix', cartao: 'Cartão na entrega', dinheiro: 'Dinheiro' };

  // data/hora "agora" em Brasília, independente do fuso do aparelho
  function agoraBrasilia() {
    var partes = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var mapa = {};
    partes.forEach(function (p) { mapa[p.type] = p.value; });
    var dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(mapa.weekday);
    var h = parseInt(mapa.hour, 10) % 24;
    return { dow: dow, minutos: h * 60 + parseInt(mapa.minute, 10) };
  }

  function paraMinutos(hhmm) {
    var p = String(hhmm || '0:0').split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
  }

  // Mesma regra da função delivery_loja_aberta do banco
  function lojaAberta(estab) {
    if (!estab) return false;
    if (estab.status_manual === 'aberto') return true;
    if (estab.status_manual === 'fechado') return false;
    var h = estab.horarios || {};
    if (!Object.keys(h).length) return true;
    var agora = agoraBrasilia();
    var hoje = h[String(agora.dow)] || [];
    for (var i = 0; i < hoje.length; i++) {
      var a = paraMinutos(hoje[i][0]), f = paraMinutos(hoje[i][1]);
      if (f > a) { if (agora.minutos >= a && agora.minutos < f) return true; }
      else if (agora.minutos >= a) return true;
    }
    var ontem = h[String((agora.dow + 6) % 7)] || [];
    for (var j = 0; j < ontem.length; j++) {
      var a2 = paraMinutos(ontem[j][0]), f2 = paraMinutos(ontem[j][1]);
      if (f2 <= a2 && agora.minutos < f2) return true;
    }
    return false;
  }

  // "Abre hoje às 18:00" / "Abre amanhã às 11:00" / "Abre sexta às 18:00"
  function proximaAbertura(estab) {
    if (!estab || estab.status_manual === 'fechado') return null;
    var h = estab.horarios || {};
    if (!Object.keys(h).length) return null;
    var agora = agoraBrasilia();
    for (var add = 0; add < 8; add++) {
      var dia = (agora.dow + add) % 7;
      var faixas = (h[String(dia)] || []).slice().sort(function (x, y) { return paraMinutos(x[0]) - paraMinutos(y[0]); });
      for (var i = 0; i < faixas.length; i++) {
        if (add === 0 && paraMinutos(faixas[i][0]) <= agora.minutos) continue;
        var quando = add === 0 ? 'hoje' : add === 1 ? 'amanhã' : DIAS[dia].toLowerCase();
        return 'Abre ' + quando + ' às ' + faixas[i][0];
      }
    }
    return null;
  }

  function descreverHorarioDia(faixas) {
    if (!faixas || !faixas.length) return 'Fechado';
    return faixas.map(function (f) { return f[0] + ' – ' + f[1]; }).join(', ');
  }

  var ICONES = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12.5 9.5 18 20 6.5"/></svg>',
    x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    voltar: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 5 8 12 15 19"/></svg>',
    busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
    moto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h6l3-6h-4l-2-4H8"/><path d="M14 7h3l1.5 4"/></svg>',
    sacola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    loja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v10h16V10"/><path d="M3 10l2-6h14l2 6"/><path d="M10 20v-6h4v6"/></svg>',
    moeda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.8 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.5 0-2.6-.6-3.1-1.6"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></svg>',
    combo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12"/><path d="M3 12h18"/><path d="M7.5 8C6 8 5 7 5 5.8S6 4 7.2 4c2 0 4.8 4 4.8 4s2.8-4 4.8-4C18 4 19 4.6 19 5.8S18 8 16.5 8"/></svg>',
    metade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" fill-opacity=".35"/></svg>',
    whats: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2z"/></svg>',
    lixo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 7 20 7"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><circle cx="12" cy="7.6" r=".6" fill="currentColor"/></svg>',
    pedidos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>',
    local: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".8" fill="currentColor"/></svg>',
    impressora: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7"/></svg>'
  };

  function toast(texto, ms) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.add('mostra');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('mostra'); }, ms || 2000);
  }

  function lerLocal(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; } catch (e) { return padrao; }
  }
  function gravarLocal(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
  }

  // mensagem de erro do Postgres (raise exception) já vem em português
  function mensagemErro(err, padrao) {
    if (!err) return padrao || 'Algo deu errado.';
    var m = err.message || String(err);
    if (/Failed to fetch|NetworkError|network/i.test(m)) return 'Sem conexão — confere a internet e tenta de novo.';
    if (/duplicate key|unique/i.test(m)) return 'Esse endereço de site já está em uso nessa cidade.';
    return m;
  }

  global.VB = {
    escapeHtml: escapeHtml, preco: preco, soDigitos: soDigitos, formatarTelefone: formatarTelefone,
    mascaraTelefone: mascaraTelefone, slugificar: slugificar, cidadeLegivel: cidadeLegivel,
    SEGMENTOS: SEGMENTOS, DIAS: DIAS, PAGAMENTOS: PAGAMENTOS,
    lojaAberta: lojaAberta, proximaAbertura: proximaAbertura, descreverHorarioDia: descreverHorarioDia,
    ICONES: ICONES, toast: toast, lerLocal: lerLocal, gravarLocal: gravarLocal, mensagemErro: mensagemErro
  };
})(window);
