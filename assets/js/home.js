/* VB Delivery — homepage: catálogo das lojas pro cliente + vitrine pro lojista. */
(function () {
  'use strict';

  var U = window.VB;
  var T = window.VBTemplates;
  var $ = function (id) { return document.getElementById(id); };
  var esc = U.escapeHtml;

  var lojas = [];
  var segmentoAtivo = null;

  function cardLoja(l, i) {
    var t = T.obter(l.template);
    var cor = l.cor_destaque || t.cor;
    var capa = l.foto_capa_url
      ? 'background-image:url(&quot;' + esc(encodeURI(l.foto_capa_url)) + '&quot;)'
      : 'background:radial-gradient(circle at 20% 20%, ' + cor + ', ' + t.fundo + ' 75%)';
    var logo = l.foto_perfil_url
      ? '<span class="loja-logo" style="background-image:url(&quot;' + esc(encodeURI(l.foto_perfil_url)) + '&quot;)"></span>'
      : '<span class="loja-logo" style="background:' + cor + '">' + esc(l.nome.charAt(0).toUpperCase()) + '</span>';
    var meta = [];
    if (l.aceita_entrega && l.tempo_entrega_min) meta.push(U.ICONES.relogio + l.tempo_entrega_min + (l.tempo_entrega_max ? '–' + l.tempo_entrega_max : '') + ' min');
    if (l.aceita_entrega) meta.push(U.ICONES.moto + (Number(l.taxa_entrega || 0) === 0 ? 'Entrega grátis' : U.preco(l.taxa_entrega)));
    else if (l.aceita_retirada) meta.push(U.ICONES.loja + 'Retirada');
    return '<a class="loja-card" href="/' + encodeURIComponent(l.slug) + '/' + encodeURIComponent(l.cidade) + '" style="animation-delay:' + Math.min(i, 8) * 45 + 'ms">' +
      '<div class="loja-capa" style="' + capa + '"><span class="loja-status' + (l.aberto_agora ? '' : ' fechada') + '">' + (l.aberto_agora ? 'Aberta' : 'Fechada') + '</span></div>' +
      '<div class="loja-corpo">' + logo + '<div class="loja-info"><strong>' + esc(l.nome) + '</strong>' +
      '<small>' + esc(U.SEGMENTOS[l.segmento] || 'Delivery') + ' · ' + esc(U.cidadeLegivel(l.cidade)) + '</small>' +
      (meta.length ? '<div class="loja-meta">' + meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>' : '') +
      '</div></div></a>';
  }

  function filtrar() {
    var termo = U.slugificar($('busca').value).replace(/-/g, ' ');
    var lista = lojas.filter(function (l) {
      if (segmentoAtivo && l.segmento !== segmentoAtivo) return false;
      if (!termo) return true;
      var alvo = U.slugificar(l.nome + ' ' + (U.SEGMENTOS[l.segmento] || '') + ' ' + l.cidade + ' ' + (l.descricao || '')).replace(/-/g, ' ');
      return alvo.indexOf(termo) !== -1;
    });
    $('contagem').textContent = lista.length ? lista.length + (lista.length === 1 ? ' loja' : ' lojas') : '';
    if (!lista.length) {
      $('lojas').innerHTML = '<div class="h-vazio">' + (lojas.length
        ? '<strong>Nada encontrado</strong>Tenta outra busca ou outro filtro.'
        : '<strong>As primeiras lojas estão chegando</strong>Tem um delivery? Seja o primeiro da sua cidade aqui.<div style="margin-top:1rem"><a class="btn" href="/criar.html">Criar meu delivery</a></div>') + '</div>';
      return;
    }
    $('lojas').innerHTML = lista.map(cardLoja).join('');
  }

  function renderizarSegmentos() {
    var presentes = [];
    lojas.forEach(function (l) { if (presentes.indexOf(l.segmento) === -1) presentes.push(l.segmento); });
    if (presentes.length < 2) { $('segmentos').innerHTML = ''; return; }
    $('segmentos').innerHTML = '<button type="button" class="nav-pill ativo" data-seg="">Todos</button>' +
      presentes.map(function (s) { return '<button type="button" class="nav-pill" data-seg="' + s + '">' + esc(U.SEGMENTOS[s] || s) + '</button>'; }).join('');
  }

  async function carregar() {
    if (!window.db) { lojas = []; filtrar(); return; }
    var r = await window.db.rpc('delivery_catalogo_publico', { p_segmento: null, p_busca: null });
    lojas = (r && r.data) || [];
    renderizarSegmentos();
    filtrar();
  }

  function acompanhar() {
    var lista = U.lerLocal('vbdelivery_meus_pedidos', []);
    var recente = lista.find(function (p) { return Date.now() - p.ts < 12 * 3600 * 1000; });
    if (!recente) return;
    $('acompanhar').innerHTML = '<div style="padding:0 5vw"><a class="h-acompanhar" href="/' + encodeURIComponent(recente.slug) + '/' + encodeURIComponent(recente.cidade) + '?pedidos=1">' +
      U.ICONES.pedidos + '<span>Seu pedido #' + recente.numero + ' na ' + esc(recente.loja) + '</span><b>Acompanhar</b></a></div>';
  }

  function vitrine() {
    var beneficios = [
      [U.ICONES.moeda, 'Sem comissão', 'Você não paga porcentagem por pedido.'],
      [U.ICONES.whats, 'Pedido no WhatsApp', 'E no painel, com som quando chega.'],
      [U.ICONES.impressora, 'Imprime na térmica', 'Bluetooth, cabo ou qualquer impressora.'],
      [U.ICONES.metade, 'Meio a meio e combo', 'Borda, observação, troco e Pix.']
    ];
    $('beneficios').innerHTML = beneficios.map(function (b) {
      return '<div class="beneficio">' + b[0] + '<strong>' + b[1] + '</strong><span>' + b[2] + '</span></div>';
    }).join('');
    var exemplos = [['forno', 'pizzaria'], ['asfalto', 'borracharia'], ['classico', 'pizzaria'], ['neon', 'hamburgueria'], ['vidro', 'acaiteria'], ['feira', 'mercado'], ['patinhas', 'petshop'], ['noir', 'japonesa']];
    $('vitrine').innerHTML = exemplos.map(function (e) {
      var t = T.obter(e[0]);
      return '<div class="vitrine-item"><div class="vitrine-tela"><iframe loading="lazy" tabindex="-1" title="Template ' + esc(t.nome) + '" src="/perfil.html?demo=' + e[1] + '&tpl=' + e[0] + '&mini=1"></iframe></div><small>' + esc(t.nome) + '</small></div>';
    }).join('');
  }

  async function plataforma() {
    if (!window.db) return;
    var r = await window.db.rpc('vb_apps_publico');
    var apps = (r && r.data) || [];
    var agenda = apps.find(function (a) { return a.chave === 'agenda' && a.url; });
    if (agenda) {
      $('plataforma').innerHTML = '<div class="plat-card"><div><strong>Tem salão, barbearia ou estúdio?</strong><span>' + esc(agenda.descricao || '') + ' — com o mesmo login.</span></div>' +
        '<a class="btn mini" href="' + esc(agenda.url.replace(/\/+$/, '') + '/') + '">Conhecer o ' + esc(agenda.nome) + '</a></div>';
      $('plataforma').classList.remove('oculto');
    }
    $('rodapeApps').innerHTML = apps.filter(function (a) { return a.url && a.ativo; }).map(function (a) {
      return '<a href="' + esc(a.url.replace(/\/+$/, '') + '/') + '">' + esc(a.nome) + '</a>';
    }).join(' · ');
  }

  function iniciar() {
    $('iconeBusca').outerHTML = U.ICONES.busca;
    var t;
    $('busca').addEventListener('input', function () { clearTimeout(t); t = setTimeout(filtrar, 90); });
    $('segmentos').addEventListener('click', function (e) {
      var b = e.target.closest('[data-seg]');
      if (!b) return;
      segmentoAtivo = b.getAttribute('data-seg') || null;
      document.querySelectorAll('#segmentos .nav-pill').forEach(function (x) { x.classList.toggle('ativo', x === b); });
      filtrar();
    });
    window.addEventListener('scroll', function () { $('topo').classList.toggle('rolou', window.scrollY > 8); }, { passive: true });
    acompanhar();
    vitrine();
    carregar();
    plataforma();
  }

  iniciar();
})();
