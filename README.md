# VB Delivery

Cardápio digital multi-tenant + pedido direto pelo WhatsApp, para pizzarias, petshops, mercados e afins.

## Onde isso se encaixa

VB Delivery é um **nicho da plataforma VB**, irmão do [vb-espaco](https://github.com/joserobertoleitejunior-a11y/vb-espaco) (agendamento — salões, barbearias, estética automotiva). Cada nicho é seu próprio produto/repositório, com layout e fluxo pensados pra sua realidade — aqui não existe agenda nem profissional, existe **cardápio, carrinho e pedido**. Um terceiro nicho (orçamento a domicílio — eletricista, pedreiro, jardineiro etc.) está planejado como produto separado, seguindo o mesmo modelo.

Os três produtos são divulgados juntos: "tudo em um só", do comerciante ao cliente final.

## O que é compartilhado com o resto da plataforma

Mesmo projeto Supabase do vb-espaco (`oeracgvnuomcaydmizzj`), só que com tabelas próprias:

- `auth.users` — login do dono do estabelecimento (e-mail/senha), único pra toda a plataforma.
- `vb_clientes_globais` — identidade do cliente por telefone, única pra toda a plataforma. Base para o futuro perfil social de cliente (seguir, avaliar, etc.) valer nos três nichos.
- `delivery_*` — tudo que é específico do Delivery (estabelecimentos, cardápio, pedidos). Não tem relação com as tabelas `tenant_*` do vb-espaco.

O "motor" (wizard de criação, painel do dono, site público multi-tenant por `/:slug/:cidade`) foi **reimplementado do zero** aqui, não copiado — mesma filosofia usada pra recriar a Pizza em Dobro dentro da plataforma: mesma ideia, código novo, pensado pro fluxo real de delivery.

## Estrutura

```
criar.html + assets/js/criar.js       → login/cadastro do dono + wizard de criação do estabelecimento
cadastro.html + assets/js/cadastro.js → painel do dono: Cardápio (categorias/itens/bordas) + Pedidos (Caixa)
perfil.html + assets/js/perfil.js     → site público do estabelecimento, rota /:slug/:cidade
assets/css/styles.css                 → template "Forno" (v1) — tema escuro/quente
```

## Layout do site público (por quê é diferente do vb-espaco)

Segue a arquitetura de informação real de um app de pedido — não é um reskin do hero-com-foto de salão:

`topbar compacto (hamburger + nome + status) → drawer lateral → hero com nome grande → pílulas de categoria fixas (sticky) → busca → cardápio direto embaixo → carrinho flutuante no rodapé`

Meio a meio cobra o valor da metade mais cara + borda (regra padrão do setor). Combos têm preço fixo por sabores escolhidos.

## Pedido: cai no Caixa E no WhatsApp

Ao finalizar, o pedido é gravado em `delivery_pedidos` (aparece na aba Pedidos do painel do dono, com status novo → preparando → saiu para entrega → concluído) **e** abre o WhatsApp com o resumo — as duas coisas, não uma ou outra.

## Status (v1 — primeira fatia funcional)

Feito: schema completo, wizard de criação, site público (cardápio + meio a meio + combo + carrinho + checkout), painel com CRUD de categorias/itens/bordas e fila de pedidos.

Ainda não: CRUD de combos no painel (a tabela e a renderização pública já existem, falta a UI de criação), tela de "meus estabelecimentos" pra dono com mais de um, sistema de templates (por enquanto só "Forno"), impressora térmica (bluetooth/USB) no painel, página institucional/sobre, catálogo/homepage geral do VB Delivery.
