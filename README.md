# VB Delivery

Cardápio digital multi-tenant com pedido direto no WhatsApp e no painel da loja — pizzarias, hamburguerias, açaí, mercados, petshops e afins.

## Onde isso se encaixa

VB Delivery é um app da **plataforma VB**, irmão do [vb-espaco](https://github.com/joserobertoleitejunior-a11y/vb-espaco) (VB Agenda — salões, barbearias, estúdios). Cada app tem repositório, layout e fluxo próprios; os dois compartilham o mesmo Supabase:

- `auth.users` — um login só pra todos os apps VB
- `vb_clientes_globais` — cliente identificado pelo telefone em toda a plataforma
- `vb_apps` — lista dos apps e a URL de cada um (a transição entre apps lê daqui)
- `delivery_*` — tabelas deste app

Um terceiro app (VB Orçamentos — quem vai até a casa do cliente fazer orçamento) está previsto no mesmo modelo.

## Páginas

| Rota | Arquivo | O que é |
|---|---|---|
| `/` | `index.html` + `home.js` | Catálogo das lojas pro cliente + vitrine pro lojista |
| `/:loja/:cidade` | `perfil.html` + `perfil.js` | Site da loja: cardápio, carrinho, checkout, acompanhar pedido |
| `/criar.html` | `criar.js` | Criação em 4 passos (conta, negócio, link, visual) |
| `/cadastro.html` | `cadastro.js` | Painel: Pedidos (Caixa), Cardápio, Loja, Resumo |

`_worker.js` faz o roteamento no Cloudflare Workers (mesmo esquema do vb-espaco).

## Templates

Estrutura única (`assets/css/base.css`) e cada template só troca tokens, fontes e ornamentos (`assets/tpl/<chave>.css`, registro em `assets/js/templates.js`):

- **Forno** — escuro e quente, brasas subindo, letreiro Bangers
- **Clássico** — cardápio impresso: papel creme, bordô, dourado, pontilhado nome→preço
- **Noir** — preto e dourado champanhe, título com brilho metálico
- **Vidro** — transparente: vidro fosco sobre aurora colorida em movimento
- **Feira** — claro, verde folha e limão, preço em etiqueta
- **Patinhas** — petshop, lilás e menta, patinhas no fundo
- **Neon** — letreiro neon piscando e grade retrô

A cor de destaque escolhida pelo dono calcula sozinha o contraste do texto. Prévia ao vivo de qualquer template: `/perfil.html?demo=<segmento>&tpl=<chave>`.

## Pedido

- O preço é **recalculado no banco** (`delivery_criar_pedido`) a partir dos IDs — o navegador não manda preço.
- Meio a meio cobra o sabor mais caro + borda; combo tem preço fixo; pedido mínimo vale só pra entrega.
- Loja fechada (manual ou pelo horário de Brasília, inclusive faixa que passa da meia-noite) não recebe pedido.
- Número curto por loja (#1, #2…), limite anti-spam por telefone.
- Depois de enviar: tela de sucesso com a mensagem pronta pro WhatsApp e "Meus pedidos" com andamento ao vivo.

## Painel

- **Pedidos (Caixa)**: chega sozinho com som/vibração, aceitar → saiu/pronto → concluir, cancelar, WhatsApp do cliente, abrir/fechar a loja na hora.
- **Impressora térmica**: Bluetooth (Web Bluetooth), app RawBT no Android (Bluetooth comum), cabo USB/serial (Web Serial) ou qualquer impressora pelo navegador; 58/80 mm; impressão automática.
- **Cardápio**: itens com foto (compressão + Storage `delivery-fotos/<uid>/…`), disponível/esgotado num toque, categorias com ordem, bordas, combos.
- **Loja**: link, compartilhar, QR Code, capa/logo, entrega, pagamento/Pix, horários, template + cor com prévia do site real.
- **Resumo**: hoje, 7/30/90 dias, ticket médio, gráfico por dia, mais vendidos.

## Publicar (Cloudflare)

1. Cloudflare → Workers & Pages → Create → conectar este repositório (o `wrangler.toml` já define o nome `vb-delivery`).
2. A URL fica `https://vb-delivery.<sua-conta>.workers.dev`.
3. Registrar a URL na plataforma pra aparecer nos outros apps:
   `update vb_apps set url = 'https://vb-delivery.<sua-conta>.workers.dev' where chave = 'delivery';`
4. Supabase → Authentication → URL Configuration: adicionar a URL nova em *Redirect URLs* (confirmação de e-mail e "esqueci a senha").
