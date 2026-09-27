/* VB Delivery — assistente de criação em 4 passos:
   1. conta (mesmo login de toda a plataforma VB)
   2. negócio (nome, segmento, cidade, WhatsApp)
   3. endereço do site
   4. visual: estilo (paleta/letra) + layout do cardápio, com prévia ao vivo */
(function () {
  'use strict';

  var U = window.VB;
  var T = window.VBTemplates;
  var db = window.db;
  var $ = function (id) { return document.getElementById(id); };
  var esc = U.escapeHtml;

  var SEGS_RAPIDOS = ['pizzaria', 'hamburgueria', 'lanchonete', 'restaurante', 'japonesa', 'marmitaria', 'acaiteria', 'doceria', 'padaria', 'mercado', 'adega', 'petshop', 'borracharia'];

  var passo = 0;
  var sessao = null;
  var modoConta = 'criar';
  var dados = { nome: '', segmento: 'pizzaria', cidade: 'Itapetininga', whats: '', slug: '', slugTocado: false, template: null, layout: null };
  var TITULOS = ['Sua conta', 'Seu negócio', 'Endereço do site', 'Visual do site'];

  function progresso() {
    $('passoRotulo').textContent = 'Passo ' + (passo + 1) + ' de 4: ' + TITULOS[passo];
    $('passoBarra').style.width = ((passo + 1) / 4 * 100) + '%';
  }

  function render() {
    progresso();
    var fn = [passoConta, passoNegocio, passoEndereco, passoVisual][passo];
    fn();
    window.scrollTo(0, 0);
  }

  function rodape(html) { $('rodape').innerHTML = html; }
  function msg(id, texto, tipo) { var el = $(id); if (el) { el.textContent = texto; el.className = 'p-msg ' + (tipo || ''); } }

  /* ---------- 1. conta ---------- */
  function passoConta() {
    var criar = modoConta === 'criar';
    $('passo').innerHTML = '<div class="cw-card">' +
      '<h1>' + (criar ? 'Crie sua conta' : 'Entre na sua conta') + '</h1>' +
      '<p class="cw-intro">' + (criar ? 'Grátis pra começar. É a mesma conta do VB Agenda e dos outros apps VB.' : 'Use o mesmo e-mail do VB Agenda, se já tiver.') + '</p>' +
      '<form id="formConta" novalidate>' +
      '<div class="campo"><label for="cEmail">E-mail</label><input type="email" id="cEmail" autocomplete="email"></div>' +
      '<div class="campo"><label for="cSenha">Senha</label><input type="password" id="cSenha" autocomplete="' + (criar ? 'new-password' : 'current-password') + '" minlength="6"></div>' +
      '<p class="p-msg" id="contaMsg"></p></form>' +
      '<p class="p-login-alternar"><button type="button" class="link-acao" id="alternarConta">' + (criar ? 'Já tenho conta — entrar' : 'Não tenho conta — criar') + '</button></p></div>';
    rodape('<button type="button" class="btn cheio" id="contaBtn">' + (criar ? 'Criar conta e continuar' : 'Entrar e continuar') + '</button>');
    $('alternarConta').addEventListener('click', function () { modoConta = criar ? 'entrar' : 'criar'; render(); });
    $('formConta').addEventListener('submit', function (e) { e.preventDefault(); $('contaBtn').click(); });
    $('contaBtn').addEventListener('click', async function () {
      var email = $('cEmail').value.trim(), senha = $('cSenha').value;
      if (!/^\S+@\S+\.\S+$/.test(email)) return msg('contaMsg', 'Digite um e-mail válido.', 'erro');
      if (senha.length < 6) return msg('contaMsg', 'A senha precisa ter pelo menos 6 caracteres.', 'erro');
      this.disabled = true;
      msg('contaMsg', 'Um instante…');
      var r = criar
        ? await db.auth.signUp({ email: email, password: senha, options: { emailRedirectTo: location.origin + '/criar.html' } })
        : await db.auth.signInWithPassword({ email: email, password: senha });
      this.disabled = false;
      if (r.error) {
        var m = r.error.message || '';
        if (/already registered/i.test(m)) { modoConta = 'entrar'; render(); msg('contaMsg', 'Esse e-mail já tem conta — digite a senha pra entrar.', 'erro'); $('cEmail').value = email; return; }
        return msg('contaMsg', /invalid login|invalid credentials/i.test(m) ? 'E-mail ou senha não conferem.' : U.mensagemErro(r.error), 'erro');
      }
      var s = await db.auth.getSession();
      sessao = s.data && s.data.session;
      if (!sessao) return msg('contaMsg', 'Conta criada! Confirme pelo link que mandamos no seu e-mail e volte aqui.', 'ok');
      passo = 1; render();
    });
  }

  /* ---------- 2. negócio ---------- */
  function passoNegocio() {
    $('passo').innerHTML = '<div class="cw-card">' +
      '<h1>Seu negócio</h1><p class="cw-intro">O básico pra montar sua página.</p>' +
      '<div class="campo"><label for="nNome">Nome do estabelecimento</label><input id="nNome" maxlength="80" value="' + esc(dados.nome) + '" placeholder="Ex.: Pizza em Dobro"></div>' +
      '<p class="cw-rotulo">O que você vende?</p>' +
      '<div class="segs">' + SEGS_RAPIDOS.map(function (s) {
        return '<button type="button" class="seg-op' + (dados.segmento === s ? ' ativo' : '') + '" data-seg="' + s + '">' + esc(U.SEGMENTOS[s].replace(' / bebidas', '').replace('Comida japonesa', 'Japonesa')) + '</button>';
      }).join('') + '</div>' +
      '<div class="linha-campos"><div class="campo"><label for="nCidade">Cidade</label><input id="nCidade" maxlength="60" value="' + esc(dados.cidade) + '"></div>' +
      '<div class="campo"><label for="nWhats">WhatsApp dos pedidos</label><input id="nWhats" type="tel" inputmode="numeric" value="' + esc(dados.whats) + '" placeholder="(15) 99999-9999"></div></div>' +
      '<p class="p-msg" id="negMsg"></p></div>';
    U.mascaraTelefone($('nWhats'));
    rodape('<button type="button" class="btn sec" id="voltarBtn">Voltar</button><button type="button" class="btn cheio" id="negBtn">Continuar</button>');
    document.querySelectorAll('[data-seg]').forEach(function (b) {
      b.addEventListener('click', function () {
        dados.segmento = b.getAttribute('data-seg');
        document.querySelectorAll('[data-seg]').forEach(function (x) { x.classList.toggle('ativo', x === b); });
      });
    });
    $('voltarBtn').addEventListener('click', function () { if (sessao) { location.href = '/cadastro.html'; } else { passo = 0; render(); } });
    $('negBtn').addEventListener('click', function () {
      dados.nome = $('nNome').value.trim();
      dados.cidade = $('nCidade').value.trim();
      dados.whats = $('nWhats').value;
      if (dados.nome.length < 2) return msg('negMsg', 'Qual o nome do seu negócio?', 'erro');
      if (U.slugificar(dados.cidade).length < 2) return msg('negMsg', 'Informe a cidade.', 'erro');
      if (U.soDigitos(dados.whats).length < 10) return msg('negMsg', 'WhatsApp com DDD, ex.: (15) 99999-9999.', 'erro');
      if (!dados.slugTocado) dados.slug = U.slugificar(dados.nome);
      if (!dados.template) dados.template = T.sugeridoPara(dados.segmento);
      passo = 2; render();
    });
  }

  /* ---------- 3. endereço ---------- */
  function passoEndereco() {
    var cidadeSlug = U.slugificar(dados.cidade);
    $('passo').innerHTML = '<div class="cw-card">' +
      '<h1>Endereço do seu site</h1><p class="cw-intro">É o link que você vai mandar pros clientes. Dá pra mudar depois.</p>' +
      '<div class="campo"><label for="eSlug">Nome no link</label><input id="eSlug" maxlength="60" value="' + esc(dados.slug) + '" autocapitalize="off" autocomplete="off" spellcheck="false"></div>' +
      '<div class="url-previa" id="urlPrevia"></div><p class="p-msg" id="endMsg"></p></div>';
    var atualizar = function () {
      var s = U.slugificar($('eSlug').value);
      $('urlPrevia').innerHTML = esc(location.host) + '/<b>' + esc(s || 'sua-loja') + '</b>/' + esc(cidadeSlug);
    };
    $('eSlug').addEventListener('input', function () { dados.slugTocado = true; atualizar(); });
    atualizar();
    rodape('<button type="button" class="btn sec" id="voltarBtn">Voltar</button><button type="button" class="btn cheio" id="endBtn">Continuar</button>');
    $('voltarBtn').addEventListener('click', function () { dados.slug = $('eSlug').value; passo = 1; render(); });
    $('endBtn').addEventListener('click', function () {
      dados.slug = U.slugificar($('eSlug').value);
      if (dados.slug.length < 2) return msg('endMsg', 'Escolha um nome pro link.', 'erro');
      passo = 3; render();
    });
  }

  /* ---------- 4. visual ---------- */
  function layoutEscolhido() { return dados.layout || T.obter(dados.template).layout; }

  function srcPrevia(tpl) {
    var seg = VBDemo.segmentos.indexOf(dados.segmento) !== -1 ? dados.segmento : 'pizzaria';
    return '/perfil.html?demo=' + seg + '&tpl=' + tpl + '&layout=' + layoutEscolhido() + '&mini=1';
  }

  function passoVisual() {
    var sugerido = T.sugeridoPara(dados.segmento);
    $('passo').innerHTML = '<div class="cw-card">' +
      '<h1>Visual do site</h1><p class="cw-intro">Escolha o estilo e o jeito que o cardápio aparece. A prévia usa um cardápio de exemplo — e dá pra trocar tudo depois no painel.</p>' +
      '<p class="cw-rotulo">Estilo</p>' +
      '<div class="tpl-grade" id="grade">' + T.lista.map(function (t) {
        return '<button type="button" class="tpl-card' + (t.chave === dados.template ? ' ativo' : '') + '" data-tpl="' + t.chave + '">' +
          '<div class="tpl-janela"><iframe loading="lazy" tabindex="-1" title="Prévia ' + esc(t.nome) + '" src="' + srcPrevia(t.chave) + '"></iframe></div>' +
          '<div class="tpl-rotulo"><strong>' + esc(t.nome) + (t.chave === sugerido ? ' <em>sugerido</em>' : '') + '</strong><small>' + esc(t.descricao) + '</small></div></button>';
      }).join('') + '</div>' +
      '<p class="cw-rotulo">Como o cardápio aparece</p>' +
      '<div class="layouts" id="layouts">' + opcoesLayout() + '</div>' +
      '<p class="p-msg" id="visMsg"></p></div>';
    ajustar();
    $('grade').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tpl]');
      if (!b) return;
      dados.template = b.getAttribute('data-tpl');
      document.querySelectorAll('[data-tpl]').forEach(function (x) { x.classList.toggle('ativo', x === b); });
      if (!dados.layout) atualizarLayouts();
    });
    $('layouts').addEventListener('click', function (e) {
      var b = e.target.closest('[data-layout]');
      if (!b) return;
      dados.layout = b.getAttribute('data-layout');
      atualizarLayouts();
      document.querySelectorAll('#grade iframe').forEach(function (f) { f.src = srcPrevia(f.closest('[data-tpl]').getAttribute('data-tpl')); });
    });
    rodape('<button type="button" class="btn sec" id="voltarBtn">Voltar</button><button type="button" class="btn cheio" id="criarBtn">Criar meu delivery</button>');
    $('voltarBtn').addEventListener('click', function () { passo = 2; render(); });
    $('criarBtn').addEventListener('click', criar);
  }

  function opcoesLayout() {
    var atual = layoutEscolhido();
    return T.layouts.map(function (l) {
      return '<button type="button" class="layout-op' + (l.chave === atual ? ' ativo' : '') + '" data-layout="' + l.chave + '">' +
        T.desenhoLayout(l.chave) + '<span><strong>' + esc(l.nome) + '</strong><small>' + esc(l.descricao) + '</small></span></button>';
    }).join('');
  }
  function atualizarLayouts() { $('layouts').innerHTML = opcoesLayout(); }

  function ajustar() {
    document.querySelectorAll('.tpl-janela').forEach(function (j) {
      var f = j.querySelector('iframe');
      var escala = j.clientWidth / 390;
      if (escala > 0) { f.style.transform = 'scale(' + escala + ')'; f.style.height = Math.ceil(j.clientHeight / escala) + 'px'; }
    });
  }
  window.addEventListener('resize', ajustar);

  async function criar() {
    var btn = $('criarBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin"></span>Criando…';
    var r = await db.rpc('delivery_admin_criar_estabelecimento', {
      p_nome: dados.nome, p_slug: dados.slug, p_cidade: U.slugificar(dados.cidade), p_segmento: dados.segmento,
      p_telefone_whatsapp: U.soDigitos(dados.whats), p_template: dados.template || T.sugeridoPara(dados.segmento),
      p_layout: dados.layout
    });
    if (r.error) {
      btn.disabled = false;
      btn.textContent = 'Criar meu delivery';
      var m = U.mensagemErro(r.error);
      if (/endereço de site já está em uso/i.test(m)) { passo = 2; render(); msg('endMsg', 'Esse link já existe nessa cidade — escolha outro nome.', 'erro'); return; }
      return msg('visMsg', m, 'erro');
    }
    try { localStorage.setItem('vbdelivery_loja_atual', r.data.id); } catch (e) {}
    location.href = '/cadastro.html?nova=1#cardapio';
  }

  async function iniciar() {
    if (!db) { $('passo').innerHTML = '<div class="cw-card"><p class="cw-intro">Sem conexão com o servidor.</p></div>'; return; }
    var s = await db.auth.getSession();
    sessao = s.data && s.data.session;
    passo = sessao ? 1 : 0;
    render();
  }

  iniciar();
})();
