/* Estilos e layouts do site da loja (VB Delivery).

   Duas escolhas independentes do dono:
   - ESTILO  = paleta + tipografia (tokens CSS aplicados no :root)
   - LAYOUT  = como o cardápio é montado (data-layout no <html>)

   Paletas tiradas de coisa real (papel de cardápio, kraft de padaria,
   placa de borracharia, lousa de hortifruti), sem degradê e sem brilho.
   Estrutura e componentes ficam em assets/css/base.css. */
(function (global) {
  'use strict';

  var SISTEMA = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  var LAYOUTS = [
    { chave: 'lista', nome: 'Lista', descricao: 'Um item embaixo do outro, foto pequena do lado. O jeito mais rápido de pedir.' },
    { chave: 'grade', nome: 'Grade', descricao: 'Dois por linha, com a foto em cima. Bom pra quem tem foto de tudo.' },
    { chave: 'cardapio', nome: 'Cardápio', descricao: 'Como o cardápio impresso da mesa: nome, pontilhado e preço. Sem foto.' },
    { chave: 'vitrine', nome: 'Vitrine', descricao: 'Foto grande de cada prato e capa de ponta a ponta.' }
  ];

  var LISTA = [
    {
      chave: 'simples', nome: 'Simples', escuro: false, layout: 'lista',
      descricao: 'Branco, letra do sistema e a cor da sua marca. Combina com tudo.',
      fontes: null,
      t: { bg: '#ffffff', surface: '#ffffff', surface2: '#f4f3f0', line: '#e7e5e0', ink: '#1d1c1a', soft: '#5f5d58', faint: '#9b9892',
           accent: '#c2412d', onAccent: '#ffffff', price: '#1d1c1a',
           body: SISTEMA, display: SISTEMA, dw: 800, dt: 'none', ds: '-0.015em', radius: '12px', radiusSm: '8px' },
      ideal: ['lanchonete', 'restaurante', 'marmitaria', 'adega']
    },
    {
      chave: 'cantina', nome: 'Cantina', escuro: false, layout: 'cardapio',
      descricao: 'Papel de cardápio, letra de livro e vermelho de molho.',
      fontes: 'family=Alegreya:ital,wght@0,500;0,700;1,500;1,700&family=Alegreya+Sans:wght@400;500;700',
      t: { bg: '#f4ede1', surface: '#fbf7ef', surface2: '#ece3d3', line: '#ddd0bb', ink: '#2b211b', soft: '#6b5a4c', faint: '#9c8b7b',
           accent: '#9b2d20', onAccent: '#ffffff', price: '#2b211b',
           body: '"Alegreya Sans", ' + SISTEMA, display: 'Alegreya, Georgia, serif', dw: 700, dt: 'none', ds: '0', radius: '6px', radiusSm: '4px' },
      ideal: ['pizzaria', 'restaurante', 'padaria']
    },
    {
      chave: 'carvao', nome: 'Carvão', escuro: true, layout: 'lista',
      descricao: 'Escuro de chapa quente, título em caixa alta e âmbar.',
      fontes: 'family=Oswald:wght@500;600&family=Barlow:wght@400;500;600;700',
      t: { bg: '#161412', surface: '#201d1a', surface2: '#2a2622', line: '#34302b', ink: '#f1ebe3', soft: '#b3a99d', faint: '#7f766c',
           accent: '#e39a3b', onAccent: '#1b1206', price: '#f1ebe3',
           body: 'Barlow, ' + SISTEMA, display: 'Oswald, "Arial Narrow", sans-serif', dw: 600, dt: 'uppercase', ds: '0.01em', radius: '8px', radiusSm: '6px' },
      ideal: ['hamburgueria', 'pizzaria', 'lanchonete']
    },
    {
      chave: 'nanquim', nome: 'Nanquim', escuro: true, layout: 'vitrine',
      descricao: 'Preto de tinta, serifa fina e um vermelho de carimbo.',
      fontes: 'family=Cormorant+Garamond:wght@500;600;700',
      t: { bg: '#111111', surface: '#1a1a1a', surface2: '#232323', line: '#2d2d2d', ink: '#ece8e1', soft: '#a8a39a', faint: '#706c66',
           accent: '#c8402f', onAccent: '#ffffff', price: '#ece8e1',
           body: SISTEMA, display: '"Cormorant Garamond", Georgia, serif', dw: 600, dt: 'none', ds: '0.01em', radius: '4px', radiusSm: '3px' },
      ideal: ['japonesa', 'adega', 'restaurante']
    },
    {
      chave: 'feira', nome: 'Feira', escuro: false, layout: 'grade',
      descricao: 'Placa de hortifruti: verde folha e letra condensada.',
      fontes: 'family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700',
      t: { bg: '#f6f3ea', surface: '#fffdf7', surface2: '#ece7d8', line: '#ddd6c3', ink: '#1f2a1d', soft: '#5b6555', faint: '#949a8c',
           accent: '#2f6a35', onAccent: '#ffffff', price: '#1f2a1d',
           body: 'Barlow, ' + SISTEMA, display: '"Barlow Condensed", "Arial Narrow", sans-serif', dw: 700, dt: 'uppercase', ds: '0.01em', radius: '10px', radiusSm: '6px' },
      ideal: ['mercado', 'marmitaria']
    },
    {
      chave: 'kraft', nome: 'Kraft', escuro: false, layout: 'lista',
      descricao: 'Saquinho de padaria: papel kraft, letra com serifa e terracota.',
      fontes: 'family=Zilla+Slab:wght@500;700',
      t: { bg: '#ebe1cd', surface: '#f4eddf', surface2: '#e1d4bb', line: '#cfbf9f', ink: '#3a2a1c', soft: '#6e5a45', faint: '#9a8670',
           accent: '#a4492a', onAccent: '#ffffff', price: '#3a2a1c',
           body: SISTEMA, display: '"Zilla Slab", Georgia, serif', dw: 700, dt: 'none', ds: '0', radius: '6px', radiusSm: '4px' },
      ideal: ['padaria', 'doceria', 'marmitaria']
    },
    {
      chave: 'patinhas', nome: 'Patinhas', escuro: false, layout: 'grade',
      descricao: 'Claro e redondinho, verde-água de clínica e letra amigável.',
      fontes: 'family=Nunito:wght@400;600;700;800',
      t: { bg: '#fbfaf7', surface: '#ffffff', surface2: '#f0eee8', line: '#e5e2da', ink: '#22313f', soft: '#5a6672', faint: '#97a0a8',
           accent: '#1f7a6d', onAccent: '#ffffff', price: '#22313f',
           body: 'Nunito, ' + SISTEMA, display: 'Nunito, ' + SISTEMA, dw: 800, dt: 'none', ds: '-0.01em', radius: '14px', radiusSm: '10px' },
      ideal: ['petshop']
    },
    {
      chave: 'acai', nome: 'Açaí', escuro: false, layout: 'grade',
      descricao: 'Roxo de açaí de verdade sobre creme, letra arredondada.',
      fontes: 'family=Fredoka:wght@500;600',
      t: { bg: '#fbf8f4', surface: '#ffffff', surface2: '#f1ebe6', line: '#e6ddd6', ink: '#2a1830', soft: '#6a5870', faint: '#a397a6',
           accent: '#5a1f66', onAccent: '#ffffff', price: '#2a1830',
           body: SISTEMA, display: 'Fredoka, ' + SISTEMA, dw: 600, dt: 'none', ds: '0', radius: '14px', radiusSm: '10px' },
      ideal: ['acaiteria', 'sorveteria', 'doceria']
    },
    {
      chave: 'asfalto', nome: 'Asfalto', escuro: true, layout: 'lista',
      descricao: 'Placa de borracharia: preto, amarelo e letra de estrada.',
      fontes: 'family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600;700',
      t: { bg: '#1b1c1e', surface: '#232427', surface2: '#2c2d31', line: '#37393d', ink: '#f1f1ec', soft: '#b2b3ad', faint: '#7c7e7a',
           accent: '#f2c200', onAccent: '#161616', price: '#f1f1ec',
           body: 'Barlow, ' + SISTEMA, display: '"Barlow Condensed", "Arial Narrow", sans-serif', dw: 700, dt: 'uppercase', ds: '0.01em', radius: '6px', radiusSm: '4px' },
      ideal: ['borracharia']
    }
  ];

  // chaves antigas (antes da troca de estilos) continuam abrindo algo parecido
  var LEGADO = { forno: 'carvao', classico: 'cantina', noir: 'nanquim', vidro: 'acai', neon: 'carvao' };

  function obter(chave) {
    chave = LEGADO[chave] || chave;
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].chave === chave) return LISTA[i];
    return LISTA[0];
  }

  function layoutValido(chave) {
    for (var i = 0; i < LAYOUTS.length; i++) if (LAYOUTS[i].chave === chave) return chave;
    return null;
  }

  function sugeridoPara(segmento) {
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].ideal.indexOf(segmento) !== -1) return LISTA[i].chave;
    return 'simples';
  }

  function hexParaRgb(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }

  // luminância relativa (WCAG) pra decidir texto claro/escuro em cima da cor
  function luminancia(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  function garantirLink(id, href) {
    var el = document.getElementById(id);
    if (!href) { if (el) el.remove(); return null; }
    if (!el) {
      el = document.createElement('link');
      el.id = id;
      el.rel = 'stylesheet';
      document.head.appendChild(el);
    }
    if (el.getAttribute('href') !== href) el.setAttribute('href', href);
    return el;
  }

  function definirTokens(t) {
    var r = document.documentElement.style;
    var mapa = {
      '--bg': t.bg, '--surface': t.surface, '--surface-2': t.surface2, '--line': t.line,
      '--ink': t.ink, '--ink-soft': t.soft, '--ink-faint': t.faint, '--price': t.price,
      '--font-body': t.body, '--font-display': t.display,
      '--display-weight': String(t.dw), '--display-transform': t.dt, '--display-spacing': t.ds,
      '--radius': t.radius, '--radius-sm': t.radiusSm
    };
    for (var k in mapa) r.setProperty(k, mapa[k]);
  }

  // cor de destaque: a do estilo, ou a que o dono escolheu
  function aplicarCor(cor, base) {
    var raiz = document.documentElement.style;
    var t = base || obter(document.documentElement.getAttribute('data-tpl')).t;
    var propria = !!hexParaRgb(cor);
    var usada = propria ? cor : t.accent;
    var rgb = hexParaRgb(usada);
    raiz.setProperty('--accent', usada);
    raiz.setProperty('--accent-rgb', rgb.join(', '));
    raiz.setProperty('--on-accent', propria ? (luminancia(rgb) > 0.45 ? '#161616' : '#ffffff') : t.onAccent);
  }

  // aplica estilo + layout + cor no documento atual
  function aplicar(chave, cor, layout) {
    var e = obter(chave);
    garantirLink('tplFontes', e.fontes ? 'https://fonts.googleapis.com/css2?' + e.fontes + '&display=swap' : null);
    definirTokens(e.t);
    var raiz = document.documentElement;
    raiz.setAttribute('data-tpl', e.chave);
    raiz.setAttribute('data-layout', layoutValido(layout) || e.layout);
    raiz.classList.toggle('escuro', e.escuro);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = e.t.bg;
    aplicarCor(cor, e.t);
    return e;
  }

  // rabisco de cada layout (pro seletor): traço fino, sem cor
  function desenhoLayout(chave) {
    var d = {
      lista: '<path d="M8 12h26M8 17h18M8 22h10"/><rect x="42" y="10" width="14" height="14" rx="2"/>' +
             '<path d="M8 34h26M8 39h18M8 44h10"/><rect x="42" y="32" width="14" height="14" rx="2"/>' +
             '<path d="M8 56h26M8 61h18M8 66h10"/><rect x="42" y="54" width="14" height="14" rx="2"/>',
      grade: '<rect x="7" y="8" width="21" height="21" rx="2"/><path d="M7 34h16M7 39h10"/>' +
             '<rect x="35" y="8" width="21" height="21" rx="2"/><path d="M35 34h16M35 39h10"/>' +
             '<rect x="7" y="47" width="21" height="21" rx="2"/><rect x="35" y="47" width="21" height="21" rx="2"/>',
      cardapio: '<path d="M20 11h24"/><path d="M8 24h14M50 24h6" /><path d="M24 24h24" stroke-dasharray="1.5 2.5"/><path d="M8 29h22"/>' +
                '<path d="M8 40h18M50 40h6"/><path d="M28 40h20" stroke-dasharray="1.5 2.5"/><path d="M8 45h26"/>' +
                '<path d="M8 56h12M50 56h6"/><path d="M22 56h26" stroke-dasharray="1.5 2.5"/><path d="M8 61h20"/>',
      vitrine: '<rect x="7" y="7" width="50" height="30" rx="2"/><path d="M7 43h30M50 43h7M7 48h20"/><rect x="7" y="55" width="50" height="16" rx="2"/>'
    }[chave] || '';
    return '<svg viewBox="0 0 64 78" width="48" height="58" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' + d + '</svg>';
  }

  global.VBTemplates = {
    lista: LISTA, layouts: LAYOUTS, obter: obter, layoutValido: layoutValido, desenhoLayout: desenhoLayout,
    aplicar: aplicar, aplicarCor: aplicarCor, sugeridoPara: sugeridoPara, hexParaRgb: hexParaRgb
  };
})(window);
