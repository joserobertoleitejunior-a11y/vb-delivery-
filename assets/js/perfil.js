/* VB Delivery — site público do estabelecimento (rota /:slug/:cidade).
   Fluxo "menu-first": cardápio aparece direto, sem tela de "agendar".
   Meio a meio cobra o valor da metade mais cara + borda (regra oficial,
   igual ao sistema real que inspirou este template). */
(function () {
  'use strict';

  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function formatarPreco(n) {
    return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ',');
  }
  function normalizarTelefone(v) {
    return String(v || '').replace(/\D/g, '');
  }

  var partes = window.location.pathname.split('/').filter(Boolean);
  var slug = partes[0];
  var cidade = partes[1];

  var estabelecimento = null;
  var cardapio = { categorias: [], itens: [], bordas: [], combos: [] };
  var carrinho = [];
  var CART_KEY = null;

  var $ = function (id) { return document.getElementById(id); };

  function mostrarEstado(nome) {
    ['estadoCarregando', 'estadoNaoEncontrado', 'estadoPronto'].forEach(function (id) {
      $(id).classList.toggle('oculto', id !== nome);
    });
  }

  async function iniciar() {
    if (!slug || !cidade || !window.db) { mostrarEstado('estadoNaoEncontrado'); return; }

    var resp = await window.db.rpc('delivery_buscar_estabelecimento', { p_slug: slug, p_cidade: cidade });
    if (resp.error || !resp.data) { mostrarEstado('estadoNaoEncontrado'); return; }
    estabelecimento = resp.data;
    CART_KEY = 'vbdelivery_carrinho_' + estabelecimento.id;

    if (estabelecimento.cor_destaque) {
      document.documentElement.style.setProperty('--terracotta', estabelecimento.cor_destaque);
    }
    window.db.rpc('delivery_registrar_acesso', { p_estabelecimento_id: estabelecimento.id });

    renderizarHero();

    var cResp = await window.db.rpc('delivery_cardapio_publico', { p_estabelecimento_id: estabelecimento.id });
    if (!cResp.error && cResp.data) cardapio = cResp.data;

    carregarCarrinhoSalvo();
    renderizarCardapio();
    renderizarCarrinho();
    ligarEventosGlobais();
    mostrarEstado('estadoPronto');
  }

  function renderizarHero() {
    document.title = estabelecimento.nome + ' · Peça agora';
    $('tbBrand').textContent = estabelecimento.nome;
    $('heroEyebrow').textContent = (estabelecimento.cidade ? capitalizar(estabelecimento.cidade) + ' · ' : '') + 'peça agora';
    $('heroTitulo').textContent = estabelecimento.nome;
    $('heroSub').textContent = 'Cardápio completo, meio a meio e combo — peça em poucos toques.';

    var infoHtml = '';
    if (estabelecimento.tempo_entrega_min) {
      infoHtml += '<span>⏱ ' + estabelecimento.tempo_entrega_min + '-' + (estabelecimento.tempo_entrega_max || estabelecimento.tempo_entrega_min) + ' min</span>';
    }
    if (estabelecimento.taxa_entrega != null) {
      infoHtml += '<span>🛵 ' + (Number(estabelecimento.taxa_entrega) === 0 ? 'Entrega grátis' : 'Taxa ' + formatarPreco(estabelecimento.taxa_entrega)) + '</span>';
    }
    if (estabelecimento.pedido_minimo) {
      infoHtml += '<span>Mín. ' + formatarPreco(estabelecimento.pedido_minimo) + '</span>';
    }
    $('heroInfo').innerHTML = infoHtml;
  }

  function capitalizar(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function agruparCardapio() {
    var categoriasComItem = cardapio.categorias.filter(function (c) {
      return cardapio.itens.some(function (i) { return i.categoria_id === c.id; });
    });
    var semCategoria = cardapio.itens.filter(function (i) {
      return !cardapio.categorias.some(function (c) { return c.id === i.categoria_id; });
    });
    var grupos = categoriasComItem.map(function (c) {
      return { id: c.id, nome: c.nome, lista: cardapio.itens.filter(function (i) { return i.categoria_id === c.id; }) };
    });
    if (semCategoria.length) grupos.push({ id: 'sem-categoria', nome: cardapio.categorias.length ? 'Outros' : null, lista: semCategoria });
    return grupos;
  }

  function renderizarCardapio() {
    var grupos = agruparCardapio();

    var navPills = $('navPills');
    var drawerLinks = $('drawerLinks');
    if (grupos.length > 1) {
      navPills.classList.remove('oculto');
      navPills.innerHTML = grupos.filter(function (g) { return g.nome; }).map(function (g) {
        return '<a href="#catg-' + g.id + '" class="nav-pill">' + escapeHtml(g.nome) + '</a>';
      }).join('');
    }
    drawerLinks.innerHTML = grupos.filter(function (g) { return g.nome; }).map(function (g) {
      return '<a href="#catg-' + g.id + '" class="drawer-link">' + escapeHtml(g.nome) + '</a>';
    }).join('');

    var html = grupos.map(function (g) {
      var titulo = g.nome ? '<p class="cardapio-categoria-titulo" id="catg-' + g.id + '">' + escapeHtml(g.nome) + '</p>' : '<div id="catg-' + g.id + '"></div>';
      var itensHtml = g.lista.map(renderItemCard).join('');
      return titulo + '<div class="item-lista" data-grupo="' + g.id + '">' + itensHtml + '</div>';
    }).join('');

    html += renderMeioAMeio();
    html += renderCombos();

    $('cardapioConteudo').innerHTML = html;
    ligarEventosCardapio();
  }

  function renderItemCard(item) {
    var foto = item.foto_url ? '<img class="item-foto" src="' + escapeHtml(item.foto_url) + '" alt="">' : '';
    return (
      '<div class="item-card" data-nome="' + escapeHtml((item.nome + ' ' + (item.descricao || '')).toLowerCase()) + '">' +
        foto +
        '<div class="item-corpo">' +
          '<p class="item-nome">' + escapeHtml(item.nome) + '</p>' +
          (item.descricao ? '<p class="item-desc">' + escapeHtml(item.descricao) + '</p>' : '') +
          '<div class="item-rodape">' +
            '<span class="item-preco">' + formatarPreco(item.preco) + '</span>' +
            '<button type="button" class="item-add" data-add-item="' + item.id + '">+</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderMeioAMeio() {
    var elegiveis = cardapio.itens.filter(function (i) { return i.permite_meio_a_meio; });
    if (elegiveis.length < 2) return '';
    var opcoes = elegiveis.map(function (i) { return '<option value="' + i.id + '">' + escapeHtml(i.nome) + ' — ' + formatarPreco(i.preco) + '</option>'; }).join('');
    var opcoesBorda = '<option value="">Sem borda</option>' + cardapio.bordas.map(function (b) {
      return '<option value="' + b.id + '">' + escapeHtml(b.nome) + ' (+' + formatarPreco(b.preco) + ')</option>';
    }).join('');
    return (
      '<div class="especial-card" id="blocoMeioAMeio">' +
        '<p class="especial-titulo">Monte seu meio a meio</p>' +
        '<div class="especial-linha">' +
          '<select class="field-select" id="meioA"><option value="">1ª metade</option>' + opcoes + '</select>' +
          '<select class="field-select" id="meioB"><option value="">2ª metade</option>' + opcoes + '</select>' +
        '</div>' +
        (cardapio.bordas.length ? '<div class="especial-linha"><select class="field-select" id="meioBorda">' + opcoesBorda + '</select></div>' : '') +
        '<div class="especial-total"><span>Total</span><strong id="meioTotal">R$ 0,00</strong></div>' +
        '<button type="button" class="btn-add-especial" id="addMeioBtn" style="margin-top:.6rem;width:100%;">Adicionar ao pedido</button>' +
      '</div>'
    );
  }

  function renderCombos() {
    if (!cardapio.combos.length) return '';
    return cardapio.combos.map(function (combo) {
      var permitidos = cardapio.itens.filter(function (i) { return (combo.itens_permitidos || []).indexOf(i.id) !== -1; });
      var opcoes = '<option value="">Escolher sabor</option>' + permitidos.map(function (i) {
        return '<option value="' + i.id + '">' + escapeHtml(i.nome) + '</option>';
      }).join('');
      var qtd = combo.qtd_sabores || 2;
      var selects = '';
      for (var n = 0; n < qtd; n++) {
        selects += '<select class="field-select combo-sabor" data-combo="' + combo.id + '" data-slot="' + n + '">' + opcoes + '</select>';
      }
      return (
        '<div class="especial-card" data-combo-card="' + combo.id + '">' +
          '<p class="especial-titulo">' + escapeHtml(combo.nome) + ' — ' + formatarPreco(combo.preco) + '</p>' +
          '<div class="especial-linha">' + selects + '</div>' +
          '<button type="button" class="btn-add-especial" data-add-combo="' + combo.id + '" style="width:100%;">Adicionar ao pedido</button>' +
        '</div>'
      );
    }).join('');
  }

  function ligarEventosCardapio() {
    document.querySelectorAll('[data-add-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = cardapio.itens.find(function (i) { return i.id === btn.getAttribute('data-add-item'); });
        if (!item) return;
        adicionarAoCarrinho({ chave: 'item-' + item.id, descricao: item.nome, preco: Number(item.preco) });
      });
    });

    var meioA = $('meioA'), meioB = $('meioB'), meioBorda = $('meioBorda'), meioTotal = $('meioTotal'), addMeioBtn = $('addMeioBtn');
    function recalcularMeio() {
      if (!meioA) return;
      var itA = cardapio.itens.find(function (i) { return i.id === meioA.value; });
      var itB = cardapio.itens.find(function (i) { return i.id === meioB.value; });
      var borda = meioBorda ? cardapio.bordas.find(function (b) { return b.id === meioBorda.value; }) : null;
      var total = itA && itB ? Math.max(Number(itA.preco), Number(itB.preco)) + (borda ? Number(borda.preco) : 0) : 0;
      meioTotal.textContent = formatarPreco(total);
    }
    if (meioA) { meioA.addEventListener('change', recalcularMeio); meioB.addEventListener('change', recalcularMeio); if (meioBorda) meioBorda.addEventListener('change', recalcularMeio); }
    if (addMeioBtn) addMeioBtn.addEventListener('click', function () {
      var itA = cardapio.itens.find(function (i) { return i.id === meioA.value; });
      var itB = cardapio.itens.find(function (i) { return i.id === meioB.value; });
      if (!itA || !itB) { alert('Escolha as duas metades.'); return; }
      if (itA.id === itB.id) { alert('Escolha dois sabores diferentes.'); return; }
      var borda = meioBorda ? cardapio.bordas.find(function (b) { return b.id === meioBorda.value; }) : null;
      var preco = Math.max(Number(itA.preco), Number(itB.preco)) + (borda ? Number(borda.preco) : 0);
      var descricao = 'Meio a meio: ' + itA.nome + ' / ' + itB.nome + (borda ? ' — borda ' + borda.nome : '');
      adicionarAoCarrinho({ chave: 'meio-' + itA.id + '-' + itB.id + '-' + (borda ? borda.id : 'sb') + '-' + Date.now(), descricao: descricao, preco: preco });
      meioA.value = ''; meioB.value = ''; if (meioBorda) meioBorda.value = ''; recalcularMeio();
    });

    document.querySelectorAll('[data-add-combo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var comboId = btn.getAttribute('data-add-combo');
        var combo = cardapio.combos.find(function (c) { return c.id === comboId; });
        var selects = document.querySelectorAll('.combo-sabor[data-combo="' + comboId + '"]');
        var sabores = Array.prototype.map.call(selects, function (s) { return s.value; });
        if (sabores.some(function (v) { return !v; })) { alert('Escolha todos os sabores do combo.'); return; }
        var unicos = sabores.filter(function (v, i) { return sabores.indexOf(v) === i; });
        if (unicos.length !== sabores.length) { alert('Escolha sabores diferentes.'); return; }
        var nomes = sabores.map(function (id) {
          var it = cardapio.itens.find(function (i) { return i.id === id; });
          return it ? it.nome : '?';
        });
        adicionarAoCarrinho({ chave: 'combo-' + comboId + '-' + Date.now(), descricao: combo.nome + ': ' + nomes.join(' + '), preco: Number(combo.preco) });
        selects.forEach(function (s) { s.value = ''; });
      });
    });
  }

  /* === Carrinho === */
  function carregarCarrinhoSalvo() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      carrinho = raw ? JSON.parse(raw) : [];
    } catch (e) { carrinho = []; }
  }
  function salvarCarrinho() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(carrinho)); } catch (e) {}
  }
  function adicionarAoCarrinho(entrada) {
    var existente = carrinho.find(function (c) { return c.chave === entrada.chave; });
    if (existente) existente.qtd += 1;
    else carrinho.push({ chave: entrada.chave, descricao: entrada.descricao, preco: entrada.preco, qtd: 1 });
    salvarCarrinho();
    renderizarCarrinho();
  }
  function removerDoCarrinho(chave) {
    carrinho = carrinho.filter(function (c) { return c.chave !== chave; });
    salvarCarrinho();
    renderizarCarrinho();
  }
  function totalCarrinho() {
    return carrinho.reduce(function (soma, c) { return soma + c.preco * c.qtd; }, 0);
  }
  function renderizarCarrinho() {
    var bar = $('cartBar');
    bar.classList.toggle('vazio', carrinho.length === 0);
    var qtdTotal = carrinho.reduce(function (s, c) { return s + c.qtd; }, 0);
    $('cartQtd').textContent = qtdTotal + (qtdTotal === 1 ? ' item' : ' itens');
    $('cartTotal').textContent = formatarPreco(totalCarrinho());
    $('cartDetalhe').innerHTML = carrinho.map(function (c) {
      return '<div class="cart-item"><span>' + c.qtd + '× ' + escapeHtml(c.descricao) + '</span><button type="button" class="cart-item-rm" data-rm="' + c.chave + '">remover</button></div>';
    }).join('');
    document.querySelectorAll('[data-rm]').forEach(function (btn) {
      btn.addEventListener('click', function () { removerDoCarrinho(btn.getAttribute('data-rm')); });
    });
  }

  function montarMensagemWhatsapp(nomeCliente) {
    var linhas = carrinho.map(function (c) { return c.qtd + 'x ' + c.descricao + ' — ' + formatarPreco(c.preco * c.qtd); });
    var msg = 'Pedido — ' + estabelecimento.nome + '%0A%0A' +
      encodeURIComponent(linhas.join('\n')) + '%0A%0A' +
      encodeURIComponent('Total: ' + formatarPreco(totalCarrinho())) + '%0A' +
      encodeURIComponent('Cliente: ' + nomeCliente);
    return 'https://wa.me/55' + normalizarTelefone(estabelecimento.telefone_whatsapp) + '?text=' + msg;
  }

  async function finalizarPedido() {
    if (!carrinho.length) return;
    var nome = window.prompt('Seu nome:');
    if (!nome) return;
    var telefone = window.prompt('Seu WhatsApp (com DDD):');
    if (!telefone || normalizarTelefone(telefone).length < 10) { alert('Informa um WhatsApp válido.'); return; }

    var itensPayload = carrinho.map(function (c) { return { descricao: c.descricao, preco: c.preco, qtd: c.qtd }; });
    var resp = await window.db.rpc('delivery_criar_pedido', {
      p_estabelecimento_id: estabelecimento.id,
      p_cliente_telefone: telefone,
      p_cliente_nome: nome,
      p_itens: itensPayload,
      p_total: totalCarrinho(),
      p_forma_entrega: 'entrega',
      p_endereco_entrega: null
    });
    if (resp.error) { alert('Não foi possível registrar o pedido, mas vamos te mandar pro WhatsApp mesmo assim.'); }

    window.open(montarMensagemWhatsapp(nome), '_blank');
    carrinho = [];
    salvarCarrinho();
    renderizarCarrinho();
  }

  function ligarEventosGlobais() {
    $('tbMenuBtn').addEventListener('click', function () { $('drawer').classList.add('aberto'); });
    $('drawerBackdrop').addEventListener('click', function () { $('drawer').classList.remove('aberto'); });
    document.querySelectorAll('.drawer-link, .nav-pill').forEach(function (a) {
      a.addEventListener('click', function () { $('drawer').classList.remove('aberto'); });
    });
    $('cartResumo').addEventListener('click', function () { $('cartBar').classList.toggle('expandido'); });
    $('cartCheckoutBtn').addEventListener('click', finalizarPedido);
    $('buscaBox').addEventListener('input', function () {
      var termo = this.value.trim().toLowerCase();
      document.querySelectorAll('.item-card').forEach(function (card) {
        card.classList.toggle('oculto', termo.length > 0 && card.getAttribute('data-nome').indexOf(termo) === -1);
      });
    });
  }

  iniciar();
})();
