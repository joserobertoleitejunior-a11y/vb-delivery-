/* VB Delivery — painel do dono: Cardápio (categorias/itens/bordas) + Pedidos
   (o "Caixa" do VB Delivery — pedidos feitos pelo site caem aqui na hora). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var estab = null;
  var categorias = [];
  var itens = [];
  var bordas = [];

  function formatarPreco(n) { return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ','); }
  function escapeHtml(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  async function iniciar() {
    var { data } = await window.db.auth.getSession();
    if (!data || !data.session) { $('semSessao').classList.remove('oculto'); return; }

    var resp = await window.db.rpc('delivery_admin_meus_estabelecimentos');
    if (resp.error || !resp.data || !resp.data.length) { $('semEstab').classList.remove('oculto'); return; }
    estab = resp.data[0];

    $('tbBrand').textContent = estab.nome;
    $('painel').classList.remove('oculto');

    ligarAbas();
    ligarSair();
    await carregarCardapio();
    ligarFormsCardapio();
  }

  function ligarSair() {
    $('sairBtn').addEventListener('click', async function () {
      await window.db.auth.signOut();
      window.location.href = 'criar.html';
    });
  }

  function ligarAbas() {
    document.querySelectorAll('.aba-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.aba-btn').forEach(function (b) { b.classList.remove('ativa'); });
        btn.classList.add('ativa');
        var aba = btn.getAttribute('data-aba');
        $('abaCardapio').classList.toggle('oculto', aba !== 'cardapio');
        $('abaPedidos').classList.toggle('oculto', aba !== 'pedidos');
        if (aba === 'pedidos') carregarPedidos();
      });
    });
  }

  /* === Cardápio === */
  async function carregarCardapio() {
    var [rc, ri, rb] = await Promise.all([
      window.db.rpc('delivery_admin_listar_categorias', { p_estabelecimento_id: estab.id }),
      window.db.rpc('delivery_admin_listar_itens', { p_estabelecimento_id: estab.id }),
      window.db.rpc('delivery_admin_listar_bordas', { p_estabelecimento_id: estab.id })
    ]);
    categorias = rc.data || [];
    itens = ri.data || [];
    bordas = rb.data || [];
    renderizarCategorias();
    renderizarSelectCategorias();
    renderizarItens();
    renderizarBordas();
  }

  function renderizarCategorias() {
    $('listaCategorias').innerHTML = categorias.map(function (c) {
      return '<div class="linha-crud"><span>' + escapeHtml(c.nome) + '</span><button type="button" class="rm" data-rm-categoria="' + c.id + '">remover</button></div>';
    }).join('') || '<p class="hero-sub" style="text-align:left;">Nenhuma categoria ainda.</p>';
    document.querySelectorAll('[data-rm-categoria]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Remover categoria? Os itens ficam sem categoria.')) return;
        await window.db.rpc('delivery_admin_remover_categoria', { p_id: btn.getAttribute('data-rm-categoria'), p_estabelecimento_id: estab.id });
        carregarCardapio();
      });
    });
  }

  function renderizarSelectCategorias() {
    $('itemCategoria').innerHTML = '<option value="">Sem categoria</option>' + categorias.map(function (c) {
      return '<option value="' + c.id + '">' + escapeHtml(c.nome) + '</option>';
    }).join('');
  }

  function renderizarItens() {
    $('listaItens').innerHTML = itens.map(function (i) {
      return (
        '<div class="linha-crud">' +
          '<span>' + escapeHtml(i.nome) + ' — ' + formatarPreco(i.preco) + (i.ativo ? '' : ' <em style="opacity:.6">(inativo)</em>') + '</span>' +
          '<span><button type="button" data-editar-item="' + i.id + '">editar</button> <button type="button" class="rm" data-rm-item="' + i.id + '">remover</button></span>' +
        '</div>'
      );
    }).join('') || '<p class="hero-sub" style="text-align:left;">Nenhum item ainda.</p>';

    document.querySelectorAll('[data-rm-item]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Remover item?')) return;
        await window.db.rpc('delivery_admin_remover_item', { p_id: btn.getAttribute('data-rm-item'), p_estabelecimento_id: estab.id });
        carregarCardapio();
      });
    });
    document.querySelectorAll('[data-editar-item]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = itens.find(function (i) { return i.id === btn.getAttribute('data-editar-item'); });
        if (!item) return;
        $('itemFormTitulo').textContent = 'Editando: ' + item.nome;
        $('itemId').value = item.id;
        $('itemNome').value = item.nome;
        $('itemDescricao').value = item.descricao || '';
        $('itemPreco').value = item.preco;
        $('itemFoto').value = item.foto_url || '';
        $('itemCategoria').value = item.categoria_id || '';
        $('itemMeioAMeio').checked = !!item.permite_meio_a_meio;
        $('itemAtivo').checked = !!item.ativo;
        window.scrollTo({ top: $('itemFormTitulo').offsetTop - 80, behavior: 'smooth' });
      });
    });
  }

  function renderizarBordas() {
    $('listaBordas').innerHTML = bordas.map(function (b) {
      return '<div class="linha-crud"><span>' + escapeHtml(b.nome) + ' — +' + formatarPreco(b.preco) + '</span><button type="button" class="rm" data-rm-borda="' + b.id + '">remover</button></div>';
    }).join('') || '<p class="hero-sub" style="text-align:left;">Nenhuma borda ainda.</p>';
    document.querySelectorAll('[data-rm-borda]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!confirm('Remover borda?')) return;
        await window.db.rpc('delivery_admin_remover_borda', { p_id: btn.getAttribute('data-rm-borda'), p_estabelecimento_id: estab.id });
        carregarCardapio();
      });
    });
  }

  function ligarFormsCardapio() {
    $('catAddBtn').addEventListener('click', async function () {
      var nome = $('catNome').value.trim();
      if (!nome) return;
      await window.db.rpc('delivery_admin_salvar_categoria', { p_id: null, p_estabelecimento_id: estab.id, p_nome: nome, p_ordem: categorias.length });
      $('catNome').value = '';
      carregarCardapio();
    });

    $('itemSalvarBtn').addEventListener('click', async function () {
      var nome = $('itemNome').value.trim();
      var preco = parseFloat($('itemPreco').value);
      if (!nome || isNaN(preco)) { alert('Preenche nome e preço.'); return; }
      var id = $('itemId').value || null;
      await window.db.rpc('delivery_admin_salvar_item', {
        p_id: id, p_estabelecimento_id: estab.id,
        p_categoria_id: $('itemCategoria').value || null,
        p_nome: nome, p_descricao: $('itemDescricao').value.trim() || null,
        p_preco: preco, p_foto_url: $('itemFoto').value.trim() || null,
        p_permite_meio_a_meio: $('itemMeioAMeio').checked, p_ativo: $('itemAtivo').checked,
        p_ordem: itens.length
      });
      limparFormItem();
      carregarCardapio();
    });

    $('bordaAddBtn').addEventListener('click', async function () {
      var nome = $('bordaNome').value.trim();
      var preco = parseFloat($('bordaPreco').value) || 0;
      if (!nome) return;
      await window.db.rpc('delivery_admin_salvar_borda', { p_id: null, p_estabelecimento_id: estab.id, p_nome: nome, p_preco: preco, p_ativo: true, p_ordem: bordas.length });
      $('bordaNome').value = ''; $('bordaPreco').value = '';
      carregarCardapio();
    });
  }

  function limparFormItem() {
    $('itemFormTitulo').textContent = 'Novo item';
    $('itemId').value = '';
    $('itemNome').value = ''; $('itemDescricao').value = ''; $('itemPreco').value = ''; $('itemFoto').value = '';
    $('itemCategoria').value = ''; $('itemMeioAMeio').checked = false; $('itemAtivo').checked = true;
  }

  /* === Pedidos (Caixa) === */
  var STATUS_LABEL = { novo: 'Novo', preparando: 'Preparando', saiu_entrega: 'Saiu p/ entrega', concluido: 'Concluído', cancelado: 'Cancelado' };
  var PROXIMO_STATUS = { novo: 'preparando', preparando: 'saiu_entrega', saiu_entrega: 'concluido' };

  async function carregarPedidos() {
    var resp = await window.db.rpc('delivery_admin_listar_pedidos', { p_estabelecimento_id: estab.id, p_status: null });
    var pedidos = resp.data || [];
    $('listaPedidos').innerHTML = pedidos.map(function (p) {
      var itensTxt = (p.itens || []).map(function (i) { return i.qtd + 'x ' + i.descricao; }).join(', ');
      var proximo = PROXIMO_STATUS[p.status];
      return (
        '<div class="linha-crud" style="flex-direction:column;align-items:stretch;gap:.4rem;">' +
          '<div style="display:flex;justify-content:space-between;"><strong>' + escapeHtml(p.cliente_nome) + '</strong><span class="status-badge">' + STATUS_LABEL[p.status] + '</span></div>' +
          '<span style="color:var(--ink-soft);font-size:.78rem;">' + escapeHtml(itensTxt) + '</span>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<strong>' + formatarPreco(p.total) + '</strong>' +
            (proximo ? '<button type="button" data-avancar="' + p.id + '" data-proximo="' + proximo + '" style="color:var(--terracotta);">marcar ' + STATUS_LABEL[proximo].toLowerCase() + '</button>' : '') +
          '</div>' +
        '</div>'
      );
    }).join('') || '<p class="hero-sub" style="text-align:left;">Nenhum pedido ainda.</p>';

    document.querySelectorAll('[data-avancar]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await window.db.rpc('delivery_admin_atualizar_status_pedido', { p_id: btn.getAttribute('data-avancar'), p_estabelecimento_id: estab.id, p_status: btn.getAttribute('data-proximo') });
        carregarPedidos();
      });
    });
  }

  iniciar();
})();
