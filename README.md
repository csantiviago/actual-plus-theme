# Actual+ — tema para o Actual Budget

Tema escuro para o [Actual Budget](https://actualbudget.org) com a paleta, a tipografia e a
semântica de cor do [Actual+](https://actualpl.us): fundo azul-noite, acento cobalto-índigo,
**Plus Jakarta Sans** e a mesma regra de dinheiro (verde entra, vermelho sai).

![Orçamento com o tema Actual+](screenshots/budget.png)

| Transações | Relatórios |
| --- | --- |
| ![Conta](screenshots/account.png) | ![Relatórios](screenshots/reports.png) |

Testado no Actual **26.10.0**. Cobre as 237 variáveis `--color-*` dos temas embutidos e passa no
validador oficial de temas do Actual (o CI confere toda semana).

## Instalar

O Actual só instala pelo repositório os temas que estão no catálogo oficial. Até este entrar
lá, o caminho é colar o CSS:

1. Abra [`dist/actual-plus-override.css`](dist/actual-plus-override.css) e copie tudo
   ([raw](https://raw.githubusercontent.com/csantiviago/actual-plus-theme/main/dist/actual-plus-override.css)).
   As fontes já vão embutidas nele.
2. No Actual: **Settings → Themes**, escolha **Dark** (ou **System default**, que usa o tema
   escuro à noite).
3. No seletor de tema escuro, escolha **Custom theme**.
4. Em **Additional CSS overrides**, cole o CSS e clique em **Apply**.

Para desfazer: apague o texto da caixa e clique em **Apply**.

> O override vale para qualquer tema, inclusive o Light. Como o Actual+ só tem paleta escura,
> use com o tema escuro — no Light você terá um Light com cara de Dark.

### Pelo catálogo

Quando o tema estiver no catálogo: **Settings → Themes → Custom theme** e clique em
**Actual+**. A entrada proposta para `customThemeCatalog.json` é:

```json
{
  "name": "Actual+",
  "repo": "csantiviago/actual-plus-theme",
  "colors": ["#0f1420", "#161d2e", "#6f8bfa", "#dde6f2", "#4ade80", "#f87171"],
  "mode": "dark"
}
```

## O que muda

| Papel | Actual+ | Variáveis do Actual |
| --- | --- | --- |
| Fundo | `#0f1420` | `pageBackground`, `mobilePageBackground` |
| Superfície (cards, tabelas, modais) | `#161d2e` | `tableBackground`, `cardBackground`, `modalBackground` |
| Superfície elevada | `#1a2338` | `tableHeaderBackground`, `menuBackground`, `tooltipBackground` |
| Sidebar | `#0c1120` | `sidebarBackground`, `mobileNavBackground` |
| Bordas | `#1e293e` / `#263450` / `#314060` | `tableBorder`, `menuBorder`, `buttonNormalBorder` |
| Texto | `#dde6f2` / `#a8b5c8` / `#899fbe` | `pageText`, `pageTextLight`, `pageTextSubdued` |
| Acento | `#6f8bfa` (hover `#a7b7ff`) | `buttonPrimaryBackground`, `pageTextLink`, seleções |
| Entrou / saiu | `#4ade80` / `#f87171` | `numberPositive`, `numberNegative` |
| Alerta | `#fbbf24` | `warning*`, `templateNumberUnderFunded` |
| Gráficos | paleta das zonas (Fixos, Investimentos, Reserva, Gasto livre…) | `chartQual1`–`chartQual9` |
| Fonte | Plus Jakarta Sans 400–800 | `--font-family` |

Botão primário usa tinta escura sobre o acento, como no Actual+: branco sobre `#6f8bfa` dá
3,1:1 e reprova AA; `#0f1420` dá 5,9:1.

## Desenvolver

Os tokens moram em [`scripts/build.mjs`](scripts/build.mjs). `actual.css` e
`dist/actual-plus-override.css` são gerados — não edite à mão.

```sh
node scripts/build.mjs      # gera actual.css e dist/actual-plus-override.css
node scripts/validate.mjs   # roda o validador do Actual (baixado do master) e confere cobertura
```

`validate.mjs` precisa de Node ≥ 22.18. Para validar contra outra versão do Actual:
`ACTUAL_REF=v26.10.0 node scripts/validate.mjs`.

Para testar mudanças sem publicar, cole o `dist/actual-plus-override.css` gerado no Actual
como descrito acima.

## Licença

Tema: MIT. Fonte Plus Jakarta Sans: SIL Open Font License 1.1 ([`fonts/OFL.txt`](fonts/OFL.txt)).
Não é um projeto oficial do Actual Budget.
