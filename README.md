# VB Delivery

> **Arquivado — virou área do app único.** Delivery e Serviços agora moram dentro do [vb-espaco](https://github.com/joserobertoleitejunior-a11y/vb-espaco) (mesmo login, mesmo estabelecimento): loja em `/:slug/:cidade/pedir`, painel em `/painel-area.html`, troca de área pelo botão-cubo. Este repositório fica só como referência; não publicar.

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
| `/criar.html` | `criar.js` | Criação em 4 passos (conta, negócio, link, estilo + layout) |
| `/cadastro.html` | `cadastro.js` | Painel: Pedidos (Caixa), Cardápio, Loja, Resumo |

`_worker.js` faz o roteamento no Cloudflare Workers (mesmo esquema do vb-espaco).

## Visual do site da loja

Duas escolhas separadas, feitas no painel (aba Loja → Aparência) ou na criação:

**Estilo** — paleta e letra (`assets/js/templates.js` aplica os tokens; nada de degradê, brilho ou vidro):

- **Simples** — branco, letra do sistema e a cor da marca
- **Cantina** — papel de cardápio, Alegreya, vermelho de molho
- **Carvão** — escuro de chapa, Oswald em caixa alta, âmbar
- **Nanquim** — preto de tinta, Cormorant, vermelho de carimbo
- **Feira** — placa de hortifruti, verde folha, Barlow Condensed
- **Kraft** — papel kraft de padaria, Zilla Slab, terracota
- **Patinhas** — petshop, claro e redondo (Nunito), verde-água
- **Açaí** — roxo de açaí sobre creme, Fredoka
- **Asfalto** — borracharia: preto, amarelo de placa, faixa de sinalização

**Layout** — como o cardápio é montado (`html[data-layout]` no `base.css`):

- **Lista** — um embaixo do outro, foto pequena do lado
- **Grade** — dois por linha, foto em cima (três no computador)
- **Cardápio** — como o impresso da mesa: nome, pontilhado e preço, sem foto
- **Vitrine** — capa de ponta a ponta com o topo transparente, foto grande de cada item

Cada estilo tem um layout sugerido; a cor de destaque escolhida pelo dono calcula sozinha o contraste do texto. Prévia de qualquer combinação: `/perfil.html?demo=<segmento>&tpl=<estilo>&layout=<layout>`.

## Visual do app

Início, criação e painel usam o mesmo visual do VB Agenda (letra do sistema, fundo linho com a moldura clarinha, topo branco, cartão com borda fina, botão redondo, barra de baixo). Só a cor da marca muda: vermelho tijolo `#B23A28` no lugar do verde do Agenda. Fica em `assets/css/marca.css`.

## Pedido

- O preço é **recalculado no banco** (`delivery_criar_pedido`) a partir dos IDs — o navegador não manda preço.
- Meio a meio cobra o sabor mais caro + borda; combo tem preço fixo; pedido mínimo vale só pra entrega.
- Loja fechada (manual ou pelo horário de Brasília, inclusive faixa que passa da meia-noite) não recebe pedido.
- Número curto por loja (#1, #2…), limite anti-spam por telefone.
- Depois de enviar: tela de sucesso com a mensagem pronta pro WhatsApp e "Meus pedidos" com andamento ao vivo.

## Atendimento no local (borracharia)

Segmentos em `SEGMENTOS_SERVICO` (hoje: `borracharia`) usam o mesmo motor com outro vocabulário e fluxo de socorro:

- site: "Serviços", botão pulsando **"Pneu furou? Chamar agora"** (escolhe o problema → vai direto pro chamado), **"Venha até mim"** com localização GPS (endereço vira opcional), tipo de veículo + modelo/cor, preço 0 = **"a combinar"** (pneu novo, orçamento no local), "24 horas" quando o horário cobre o dia todo
- painel: aba **Chamados**, card com veículo, **Ver no mapa** e **Rota** (abre o GPS do celular), "Aceitar → Estou a caminho → Concluir", WhatsApp "estou a caminho", sem bordas/combos
- banco: `delivery_pedidos.localizacao_lat/lng` + `detalhes` (só `veiculo`, `modelo`, `precisao_m` — o resto é descartado)

Pra outro nicho de serviço no local (chaveiro, guincho, eletricista), é só incluir o segmento na constraint e em `SEGMENTOS_SERVICO`.

## Painel

- **Pedidos (Caixa)**: chega sozinho com som/vibração, aceitar → saiu/pronto → concluir, cancelar, WhatsApp do cliente, abrir/fechar a loja na hora.
- **Impressora térmica**: Bluetooth (Web Bluetooth), app RawBT no Android (Bluetooth comum), cabo USB/serial (Web Serial) ou qualquer impressora pelo navegador; 58/80 mm; impressão automática.
- **Cardápio**: itens com foto (compressão + Storage `delivery-fotos/<uid>/…`), disponível/esgotado num toque, categorias com ordem, bordas, combos.
- **Loja**: link, compartilhar, QR Code, capa/logo, entrega, pagamento/Pix, horários, estilo + layout + cor com prévia do site real.
- **Resumo**: hoje, 7/30/90 dias, ticket médio, gráfico por dia, mais vendidos.

## Publicar (Cloudflare)

1. Cloudflare → Workers & Pages → Create → conectar este repositório (o `wrangler.toml` já define o nome `vb-delivery`).
2. A URL fica `https://vb-delivery.<sua-conta>.workers.dev`.
3. Registrar a URL na plataforma pra aparecer nos outros apps:
   `update vb_apps set url = 'https://vb-delivery.<sua-conta>.workers.dev' where chave = 'delivery';`
4. Supabase → Authentication → URL Configuration: adicionar a URL nova em *Redirect URLs* (confirmação de e-mail e "esqueci a senha").
