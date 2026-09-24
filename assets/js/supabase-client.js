/* Cliente Supabase compartilhado com o resto da plataforma VB (mesmo projeto
   do vb-espaco): auth.users e vb_clientes_globais são únicos pra toda a
   plataforma, o VB Delivery só acrescenta suas próprias tabelas (prefixo
   delivery_*). Chave pública (anon), protegida por RLS + funções RPC. */
(function (global) {
  var SUPABASE_URL = 'https://oeracgvnuomcaydmizzj.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_KB-UG2jA0BS6o61VoFwZKA_ZpYm-LQp';

  if (typeof global.supabase === 'undefined' || !global.supabase.createClient) {
    console.error('Supabase JS não carregou (CDN bloqueado ou offline).');
    global.db = null;
    return;
  }

  global.db = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
})(window);
