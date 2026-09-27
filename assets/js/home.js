/* VB Delivery — início: catálogo das lojas (mesma montagem do Agenda). */
(function () {
  'use strict';

  var U = window.VB;
  var T = window.VBTemplates;
  var $ = function (id) { return document.getElementById(id); };
  var esc = U.escapeHtml;

  var lojas = [];
  var segmentoAtivo = '';

  // chips fixos, como no Agenda; "lanches" junta hamburgueria e lanchonete
  var FILTROS = [
    ['', 'Tudo'],
    ['pizzaria', 'Pizzaria'],
    ['lanches', 'Lanches'],
    ['acaiteria', 'Açaí'],
    ['japonesa', 'Japonesa'],
    ['marmitaria', 'Marmita'],
    ['mercado', 'Mercado'],
    ['petshop', 'Petshop'],
    ['borracharia', 'Borracharia']
  ];
  function casaFiltro(seg) {
    if (!segmentoAtivo) return true;
    if (segmentoAtivo === 'lanches') return seg === 'hamburgueria' || seg === 'lanchonete';
    return seg === segmentoAtivo;
  }

  function corDaLoja(l) {
    return l.cor_destaque || T.obter(l.template).t.accent;
  }

  function cardLoja(l, i) {
    var cor = corDaLoja(l);
    var capa = l.foto_capa_url
      ? 'background-image:url(&quot;' + esc(encodeURI(l.foto_capa_url)) + '&quot;)'
      : 'background:' + cor;
    var logo = l.foto_perfil_url
      ? '<span class="loja-logo" style="background-image:url(&quot;' + esc(encodeURI(l.foto_perfil_url)) + '&quot;)"></span>'
      : '<span class="loja-logo" style="background:' + cor + '">' + esc(l.nome.charAt(0).toUpperCase()) + '</span>';
    var tags = ['<span class="loja-tag ' + (l.aberto_agora ? 'aberta' : 'fechada') + '">' + (l.aberto_agora ? 'Aberta' : 'Fechada') + '</span>',
      '<span class="loja-tag">' + esc(U.SEGMENTOS[l.segmento] || 'Delivery') + '</span>'];
    if (l.aceita_entrega && l.tempo_entrega_min) tags.push('<span class="loja-tag">' + l.tempo_entrega_min + (l.tempo_entrega_max ? '–' + l.tempo_entrega_max : '') + ' min</span>');
    if (l.aceita_entrega && Number(l.taxa_entrega || 0) === 0) tags.push('<span class="loja-tag">Entrega grátis</span>');
    return '<a class="loja-card" href="/' + encodeURIComponent(l.slug) + '/' + encodeURIComponent(l.cidade) + '" style="animation-delay:' + Math.min(i, 8) * 40 + 'ms">' +
      '<div class="loja-capa" style="' + capa + '"></div>' +
      '<div class="loja-corpo">' + logo +
        '<span class="loja-info"><strong>' + esc(l.nome) + '</strong><span class="loja-tags">' + tags.join('') + '</span></span>' +
        '<span class="loja-seta" aria-hidden="true">→</span>' +
      '</div></a>';
  }

  function filtrar() {
    var termo = U.slugificar($('busca').value).replace(/-/g, ' ');
    var lista = lojas.filter(function (l) {
      if (!casaFiltro(l.segmento)) return false;
      if (!termo) return true;
      var alvo = U.slugificar(l.nome + ' ' + (U.SEGMENTOS[l.segmento] || '') + ' ' + l.cidade + ' ' + (l.descricao || '')).replace(/-/g, ' ');
      return alvo.indexOf(termo) !== -1;
    });
    $('contagem').textContent = lista.length > 1 ? lista.length + ' lojas' : '';
    if (!lista.length) {
      $('lojas').innerHTML = '<p class="lojas-vazio">' + (lojas.length ? 'Nenhuma loja encontrada.' : 'Nenhuma loja por aqui ainda.') + '</p>';
      $('ctaLojista').querySelector('.catalogo-cta-titulo').textContent = lojas.length ? 'Tem um delivery?' : 'Mais lojas chegando em breve';
      return;
    }
    $('lojas').innerHTML = lista.map(cardLoja).join('');
  }

  function renderizarFiltros() {
    $('segmentos').innerHTML = FILTROS.map(function (f) {
      return '<button type="button" class="chip' + (f[0] === segmentoAtivo ? ' is-ativo' : '') + '" data-seg="' + f[0] + '" aria-pressed="' + (f[0] === segmentoAtivo) + '">' + f[1] + '</button>';
    }).join('');
  }

  async function carregar() {
    if (!window.db) { lojas = []; filtrar(); return; }
    var r = await window.db.rpc('delivery_catalogo_publico', { p_segmento: null, p_busca: null });
    lojas = (r && r.data) || [];
    filtrar();
  }

  function acompanhar() {
    var lista = U.lerLocal('vbdelivery_meus_pedidos', []);
    var recente = lista.find(function (p) { return Date.now() - p.ts < 12 * 3600 * 1000; });
    if (!recente) return;
    $('acompanhar').innerHTML = '<a class="h-acompanhar" href="/' + encodeURIComponent(recente.slug) + '/' + encodeURIComponent(recente.cidade) + '?pedidos=1">' +
      U.ICONES.pedidos + '<span>Seu pedido #' + recente.numero + ' na ' + esc(recente.loja) + '</span><b>Acompanhar</b></a>';
  }

  async function plataforma() {
    if (!window.db) return;
    var r = await window.db.rpc('vb_apps_publico');
    var apps = (r && r.data) || [];
    var agenda = apps.find(function (a) { return a.chave === 'agenda' && a.url; });
    if (agenda) {
      $('plataforma').innerHTML = '<div class="plat-card"><div><strong>Tem salão, barbearia ou estúdio?</strong><span>O ' + esc(agenda.nome) + ' faz o agendamento online — com o mesmo login.</span></div>' +
        '<a class="btn mini" href="' + esc(agenda.url.replace(/\/+$/, '') + '/') + '">Conhecer o ' + esc(agenda.nome) + '</a></div>';
      $('plataforma').classList.remove('oculto');
    }
    $('rodapeApps').innerHTML = apps.filter(function (a) { return a.url && a.ativo; }).map(function (a) {
      return '<a href="' + esc(a.url.replace(/\/+$/, '') + '/') + '">' + esc(a.nome) + '</a>';
    }).join(' · ');
  }

  function iniciar() {
    $('iconeBusca').outerHTML = U.ICONES.busca;
    renderizarFiltros();
    var t;
    $('busca').addEventListener('input', function () { clearTimeout(t); t = setTimeout(filtrar, 90); });
    $('segmentos').addEventListener('click', function (e) {
      var b = e.target.closest('[data-seg]');
      if (!b) return;
      segmentoAtivo = b.getAttribute('data-seg');
      renderizarFiltros();
      filtrar();
    });
    acompanhar();
    carregar();
    plataforma();
  }

  iniciar();
})();
