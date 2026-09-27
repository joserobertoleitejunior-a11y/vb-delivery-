// Rotas do VB Delivery no Cloudflare Workers:
//   /                  → index.html (catálogo)
//   /:loja/:cidade     → perfil.html (site da loja), mantendo a URL original
// Qualquer caminho com extensão (.js, .css, .png…) vai direto pros arquivos.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const partes = url.pathname.split('/').filter(Boolean);
    const ultimo = partes[partes.length - 1] || '';

    if (partes.length === 0) return servirComo(request, env, '/index.html');
    if (partes.length === 2 && partes[0] !== 'assets' && !ultimo.includes('.')) {
      return servirComo(request, env, '/perfil.html');
    }
    return env.ASSETS.fetch(request);
  }
};

async function servirComo(request, env, caminho) {
  const url = new URL(request.url);
  return env.ASSETS.fetch(new Request(new URL(caminho, url.origin).toString(), request));
}
