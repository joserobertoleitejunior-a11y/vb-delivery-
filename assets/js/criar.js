/* VB Delivery — onboarding: login/cadastro (auth.users compartilhado com a
   plataforma VB) + criação do estabelecimento (delivery_estabelecimentos). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  function slugificar(v) {
    return String(v || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async function verificarSessao() {
    var { data } = await window.db.auth.getSession();
    if (data && data.session) mostrarWizard();
  }

  function mostrarWizard() {
    $('blocoAuth').classList.add('oculto');
    $('blocoWizard').classList.remove('oculto');
  }

  function ligarAuth() {
    $('entrarBtn').addEventListener('click', async function () {
      var email = $('authEmail').value.trim();
      var senha = $('authSenha').value;
      $('authMsg').textContent = 'Um instante…';
      var { error } = await window.db.auth.signInWithPassword({ email: email, password: senha });
      $('authMsg').textContent = error ? traduzirErro(error) : '';
      if (!error) mostrarWizard();
    });
    $('criarContaBtn').addEventListener('click', async function () {
      var email = $('authEmail').value.trim();
      var senha = $('authSenha').value;
      if (!email || senha.length < 6) { $('authMsg').textContent = 'Senha precisa ter 6+ caracteres.'; return; }
      $('authMsg').textContent = 'Criando sua conta…';
      var { error } = await window.db.auth.signUp({ email: email, password: senha });
      $('authMsg').textContent = error ? traduzirErro(error) : '';
      if (!error) mostrarWizard();
    });
  }

  function traduzirErro(error) {
    if (/already registered/i.test(error.message)) return 'Esse e-mail já tem conta — tenta entrar.';
    if (/invalid login/i.test(error.message)) return 'E-mail ou senha errados.';
    return error.message;
  }

  function ligarWizard() {
    $('wNome').addEventListener('input', function () {
      if (!$('wSlug').dataset.tocado) $('wSlug').value = slugificar(this.value);
    });
    $('wSlug').addEventListener('input', function () { this.dataset.tocado = '1'; });

    $('criarEstabBtn').addEventListener('click', async function () {
      var nome = $('wNome').value.trim();
      var slug = slugificar($('wSlug').value);
      var cidade = $('wCidade').value.trim();
      var segmento = $('wSegmento').value;
      var whats = $('wWhats').value.replace(/\D/g, '');

      if (!nome || !slug || !cidade || whats.length < 10) {
        $('wizardMsg').textContent = 'Preenche nome, endereço do site, cidade e um WhatsApp válido.';
        return;
      }
      $('wizardMsg').textContent = 'Criando…';
      var resp = await window.db.rpc('delivery_admin_criar_estabelecimento', {
        p_nome: nome, p_slug: slug, p_cidade: cidade, p_segmento: segmento, p_telefone_whatsapp: whats, p_template: 'forno'
      });
      if (resp.error) {
        $('wizardMsg').textContent = /duplicate|unique/i.test(resp.error.message) ? 'Já existe um site com esse endereço nessa cidade.' : resp.error.message;
        return;
      }
      window.location.href = 'cadastro.html';
    });
  }

  ligarAuth();
  ligarWizard();
  verificarSessao();
})();
