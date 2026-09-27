/* Registro dos templates do VB Delivery + aplicação no documento.
   Todo template usa a MESMA estrutura (base.css) e só troca tokens,
   fontes e ornamentos (assets/tpl/<chave>.css). */
(function (global) {
  'use strict';

  var VERSAO_CSS = 3;

  var LISTA = [
    {
      chave: 'forno', nome: 'Forno', escuro: true,
      descricao: 'Escuro e quente, letreiro com brilho de brasa.',
      fontes: 'family=Bangers&family=Jost:wght@400;500;600;700',
      cor: '#ff7a3d', fundo: '#150a06', tinta: '#fbece2',
      ideal: ['pizzaria', 'hamburgueria', 'lanchonete']
    },
    {
      chave: 'classico', nome: 'Clássico', escuro: false,
      descricao: 'Cardápio impresso: papel creme, bordô e dourado.',
      fontes: 'family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Jost:wght@400;500;600;700',
      cor: '#8c1c2b', fundo: '#f6efe2', tinta: '#2b1a14',
      ideal: ['restaurante', 'padaria', 'doceria', 'pizzaria']
    },
    {
      chave: 'noir', nome: 'Noir', escuro: true,
      descricao: 'Preto profundo e dourado champanhe, alto padrão.',
      fontes: 'family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700;800',
      cor: '#d4af6a', fundo: '#0a0a0b', tinta: '#f2ede3',
      ideal: ['japonesa', 'restaurante', 'adega']
    },
    {
      chave: 'vidro', nome: 'Vidro', escuro: true,
      descricao: 'Transparente: vidro fosco sobre uma aurora colorida.',
      fontes: 'family=Outfit:wght@300;400;500;600;700;800',
      cor: '#67e8f9', fundo: '#0c0e22', tinta: '#ffffff',
      ideal: ['acaiteria', 'sorveteria', 'doceria', 'adega']
    },
    {
      chave: 'feira', nome: 'Feira', escuro: false,
      descricao: 'Fresco e claro, verde folha e amarelo limão.',
      fontes: 'family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800',
      cor: '#2f9e44', fundo: '#f3f8ec', tinta: '#1d3316',
      ideal: ['mercado', 'acaiteria', 'marmitaria', 'padaria']
    },
    {
      chave: 'patinhas', nome: 'Patinhas', escuro: false,
      descricao: 'Divertido e arredondado, lilás e menta.',
      fontes: 'family=Fredoka:wght@400;500;600;700',
      cor: '#7c5cff', fundo: '#faf6ff', tinta: '#2c2142',
      ideal: ['petshop', 'doceria', 'sorveteria']
    },
    {
      chave: 'neon', nome: 'Neon', escuro: true,
      descricao: 'Letreiro neon piscando e grade retrô.',
      fontes: 'family=Bungee&family=Space+Grotesk:wght@400;500;600;700',
      cor: '#ff2e88', fundo: '#07060d', tinta: '#f5f1ff',
      ideal: ['hamburgueria', 'lanchonete', 'adega']
    },
    {
      chave: 'asfalto', nome: 'Asfalto', escuro: true,
      descricao: 'Asfalto e amarelo de sinalização, faixa zebrada.',
      fontes: 'family=Bebas+Neue&family=Barlow:wght@400;500;600;700',
      cor: '#ffc400', fundo: '#15171a', tinta: '#f4f4f1',
      ideal: ['borracharia']
    }
  ];

  function obter(chave) {
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].chave === chave) return LISTA[i];
    return LISTA[0];
  }

  function sugeridoPara(segmento) {
    for (var i = 0; i < LISTA.length; i++) if (LISTA[i].ideal.indexOf(segmento) !== -1) return LISTA[i].chave;
    return 'forno';
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

  function escurecer(rgb, fator) {
    return '#' + rgb.map(function (v) { return ('0' + Math.round(v * fator).toString(16)).slice(-2); }).join('');
  }

  function garantirLink(id, href) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('link');
      el.id = id;
      el.rel = 'stylesheet';
      document.head.appendChild(el);
    }
    if (el.getAttribute('href') !== href) el.setAttribute('href', href);
    return el;
  }

  function aplicarCor(cor) {
    var raiz = document.documentElement.style;
    var rgb = hexParaRgb(cor);
    if (!rgb) {
      ['--accent', '--accent-2', '--accent-rgb', '--on-accent'].forEach(function (p) { raiz.removeProperty(p); });
      return;
    }
    raiz.setProperty('--accent', cor);
    raiz.setProperty('--accent-2', escurecer(rgb, 0.82));
    raiz.setProperty('--accent-rgb', rgb.join(', '));
    raiz.setProperty('--on-accent', luminancia(rgb) > 0.45 ? '#141414' : '#ffffff');
  }

  // aplica template + cor de destaque no documento atual
  function aplicar(chave, cor) {
    var t = obter(chave);
    garantirLink('tplFontes', 'https://fonts.googleapis.com/css2?' + t.fontes + '&display=swap');
    garantirLink('tplCss', '/assets/tpl/' + t.chave + '.css?v=' + VERSAO_CSS);
    document.documentElement.setAttribute('data-tpl', t.chave);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = t.fundo;
    aplicarCor(cor);
    return t;
  }

  global.VBTemplates = { lista: LISTA, obter: obter, aplicar: aplicar, aplicarCor: aplicarCor, sugeridoPara: sugeridoPara, hexParaRgb: hexParaRgb };
})(window);
