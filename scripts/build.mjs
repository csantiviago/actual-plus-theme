#!/usr/bin/env node
// Gera actual.css (formato de tema do Actual Budget) e
// dist/actual-plus-override.css (mesmo tema com as fontes embutidas, para
// colar em Configurações → Temas → "Additional CSS overrides").
//
// Fonte da verdade: os tokens de web/app.css do Actual+. Mude aqui, rode
// `node scripts/build.mjs` e faça commit dos dois arquivos gerados.
//
//   node scripts/build.mjs          gera
//   node scripts/build.mjs --check  falha se os arquivos gerados estão velhos

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ─── Tokens do Actual+ (web/app.css) ─────────────────────────────────────
const ap = {
  bg: '#0f1420',
  surface: '#0c1120',
  surface2: '#161d2e',
  surface3: '#1a2338',
  border: '#1e293e',
  border2: '#263450',
  border3: '#314060',

  text: '#dde6f2',
  text2: '#a8b5c8',
  muted: '#899fbe',
  white: '#ffffff',

  navTxt: '#7392b8',
  navActive: '#c0d4f0',

  accent: '#6f8bfa',
  accentH: '#a7b7ff',

  green: '#22c55e',
  greenL: '#4ade80',
  amber: '#f59e0b',
  amberL: '#fbbf24',
  amberTxt: '#fcd34d',
  red: '#ef4444',
  redH: '#f87171',
  redTxt: '#fca5a5',

  // Paleta categórica (zonas) — validada para CVD no Actual+.
  segFixos: '#5b8bf7',
  segGuilt: '#c25fb5',
  segOther: '#8b6fc7',
  segInv: '#219e68',
  segRes: '#bd8226',
  teal: '#2dd4bf',
};

const font =
  "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// O validador de tema do Actual não aceita color-mix(); a tinta translúcida
// do Actual+ (accent-bg, green-bg…) vira cor opaca misturada sobre a
// superfície onde ela aparece.
function mix(fg, bg, alpha) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(fg), p(bg)];
  return (
    '#' +
    a
      .map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)))
      .map(c => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

const rgba = (hex, alpha) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const accentSoft = mix(ap.accent, ap.surface2, 0.16); // linha selecionada
const accentMid = mix(ap.accent, ap.surface2, 0.3);
const accentStrong = mix(ap.accent, ap.surface2, 0.5);

// ─── Mapeamento para as variáveis do Actual ──────────────────────────────
// Ordem e agrupamento seguem packages/component-library/src/themes/dark.css.
const sections = [
  [
    'Tipografia',
    {
      'font-family': font,
    },
  ],
  [
    'Página',
    {
      pageBackground: ap.bg,
      pageBackgroundModalActive: ap.surface,
      pageBackgroundTopLeft: ap.surface2,
      pageBackgroundBottomRight: ap.surface,
      pageBackgroundLineTop: ap.accent,
      pageBackgroundLineMid: ap.surface,
      pageBackgroundLineBottom: ap.border3,
      pageText: ap.text,
      pageTextLight: ap.text2,
      pageTextSubdued: ap.muted,
      pageTextDark: '#eef3fa',
      pageTextPositive: ap.accentH,
      pageTextLink: ap.accent,
      pageTextLinkLight: ap.accentH,
    },
  ],
  [
    'Cards',
    {
      cardBackground: ap.surface2,
      cardBorder: ap.border2,
      cardShadow: '#070a12',
    },
  ],
  [
    'Tabelas',
    {
      tableBackground: ap.surface2,
      tableRowBackgroundAlternate: 'var(--color-tableBackground)',
      tableRowBackgroundHover: ap.surface3,
      tableText: ap.text,
      tableTextItemAdded: 'var(--color-tableText)',
      tableTextLight: 'var(--color-tableText)',
      tableTextSubdued: ap.muted,
      tableTextSelected: ap.text,
      tableTextHover: ap.text2,
      tableTextInactive: ap.muted,
      tableHeaderText: ap.text2,
      tableHeaderBackground: ap.surface3,
      tableBorder: ap.border,
      tableBorderSelected: ap.accent,
      tableBorderHover: ap.accentH,
      tableBorderSeparator: ap.border3,
      tableRowBackgroundHighlight: accentSoft,
      tableRowBackgroundHighlightText: ap.text,
      tableRowHeaderBackground: ap.surface3,
      tableRowHeaderText: ap.text,
    },
  ],
  [
    'Números (verde entra, vermelho sai — mesma semântica do Actual+)',
    {
      numberPositive: ap.greenL,
      numberNegative: ap.redH,
      numberNeutral: ap.muted,
      budgetNumberNegative: 'var(--color-numberNegative)',
      budgetNumberZero: 'var(--color-tableTextSubdued)',
      budgetNumberNeutral: 'var(--color-tableText)',
      budgetNumberPositive: 'var(--color-budgetNumberNeutral)',
      templateNumberFunded: 'var(--color-numberPositive)',
      templateNumberUnderFunded: ap.amberL,
      toBudgetPositive: 'var(--color-numberPositive)',
      toBudgetZero: 'var(--color-numberPositive)',
      toBudgetNegative: 'var(--color-budgetNumberNegative)',
    },
  ],
  [
    'Sidebar',
    {
      sidebarBackground: ap.surface,
      sidebarItemBackgroundPending: ap.amber,
      sidebarItemBackgroundPositive: ap.green,
      sidebarItemBackgroundFailed: ap.red,
      sidebarItemAccentSelected: ap.accent,
      sidebarItemBackgroundHover: rgba('#ffffff', 0.04),
      sidebarItemBackgroundSelected: rgba(ap.accent, 0.12),
      sidebarItemText: ap.navTxt,
      sidebarItemTextUpdated: 'var(--color-sidebarItemText)',
      sidebarItemTextSelected: ap.navActive,
      sidebarBudgetName: ap.text2,
      sidebarHeaderText: ap.text,
      sidebarTextSubdued: ap.muted,
      sidebarTextMuted: ap.navTxt,
      sidebarTextPositive: ap.greenL,
      sidebarTextFailed: ap.redH,
      sidebarBackgroundFailedSubtle: rgba(ap.red, 0.16),
      sidebarBorder: rgba('#ffffff', 0.07),
      sidebarControlBackground: ap.surface2,
      sidebarBrand: ap.accent,
    },
  ],
  [
    'Menus e autocomplete',
    {
      menuBackground: ap.surface3,
      menuItemBackground: ap.surface3,
      menuItemBackgroundHover: ap.border2,
      menuItemText: ap.text,
      menuItemTextHover: ap.white,
      menuItemTextSelected: ap.accentH,
      menuItemTextHeader: ap.muted,
      menuBorder: ap.border2,
      menuBorderHover: ap.accent,
      menuKeybindingText: ap.muted,
      menuAutoCompleteBackground: ap.surface2,
      menuAutoCompleteBackgroundHover: ap.border2,
      menuAutoCompleteText: ap.text,
      menuAutoCompleteTextHover: ap.accentH,
      menuAutoCompleteTextHeader: ap.muted,
      menuAutoCompleteItemText: 'var(--color-menuItemText)',
      menuAutoCompleteItemTextHover: ap.white,
    },
  ],
  [
    'Modais e mobile',
    {
      modalBackground: ap.surface2,
      modalBorder: ap.border2,
      mobileHeaderBackground: ap.surface,
      mobileHeaderText: ap.text,
      mobileHeaderTextSubdued: ap.text2,
      mobileHeaderTextHover: rgba('#ffffff', 0.08),
      mobilePageBackground: ap.bg,
      mobileNavBackground: ap.surface,
      mobileNavItem: ap.navTxt,
      mobileNavItemSelected: ap.accent,
      mobileAccountShadow: 'var(--color-cardShadow)',
      mobileAccountText: ap.accentH,
      mobileTransactionSelected: ap.accent,
      mobileViewTheme: 'var(--color-mobileHeaderBackground)',
      mobileConfigServerViewTheme: ap.surface,
    },
  ],
  [
    'Markdown',
    {
      markdownNormal: accentMid,
      markdownDark: accentStrong,
      markdownLight: accentSoft,
    },
  ],
  [
    'Botões',
    {
      buttonMenuText: ap.text2,
      buttonMenuTextHover: ap.text,
      buttonMenuBackground: 'transparent',
      buttonMenuBackgroundHover: rgba('#ffffff', 0.06),
      buttonMenuBorder: ap.border3,
      buttonMenuSelectedText: ap.bg,
      buttonMenuSelectedTextHover: ap.bg,
      buttonMenuSelectedBackground: ap.accent,
      buttonMenuSelectedBackgroundHover: ap.accentH,
      buttonMenuSelectedBorder: 'var(--color-buttonMenuSelectedBackground)',

      // Tinta escura sobre a marca: branco sobre --accent dá 3,1:1 (reprova
      // AA); --bg dá 5,9:1. Mesma regra do --btn-primary-fg do Actual+.
      buttonPrimaryText: ap.bg,
      buttonPrimaryTextHover: 'var(--color-buttonPrimaryText)',
      buttonPrimaryBackground: ap.accent,
      buttonPrimaryBackgroundHover: ap.accentH,
      buttonPrimaryBorder: 'var(--color-buttonPrimaryBackground)',
      buttonPrimaryShadow: rgba('#000000', 0.35),
      buttonPrimaryDisabledText: ap.navTxt,
      buttonPrimaryDisabledBackground: ap.border,
      buttonPrimaryDisabledBorder: 'var(--color-buttonPrimaryDisabledBackground)',

      buttonNormalText: ap.text,
      buttonNormalTextHover: ap.white,
      buttonNormalBackground: ap.surface3,
      buttonNormalBackgroundHover: ap.border2,
      buttonNormalBorder: ap.border3,
      buttonNormalShadow: rgba('#000000', 0.3),
      buttonNormalSelectedText: ap.bg,
      buttonNormalSelectedBackground: ap.accent,
      buttonNormalDisabledText: ap.navTxt,
      buttonNormalDisabledBackground: ap.surface2,
      buttonNormalDisabledBorder: ap.border2,

      buttonBareText: 'var(--color-pageText)',
      buttonBareTextHover: 'var(--color-pageText)',
      buttonBareDisabledText: 'var(--color-pageTextSubdued)',
      buttonBareBackground: 'transparent',
      buttonBareDisabledBackground: 'var(--color-buttonBareBackground)',
      buttonBareBackgroundHover: rgba('#ffffff', 0.06),
      buttonBareBackgroundActive: rgba('#ffffff', 0.1),
    },
  ],
  [
    'Calendário',
    {
      calendarText: ap.text,
      calendarBackground: ap.surface,
      calendarItemText: ap.text,
      calendarItemBackground: ap.surface2,
      calendarSelectedBackground: 'var(--color-buttonNormalSelectedBackground)',
      calendarCellBackground: ap.surface,
      datePickerRangeBackground: accentMid,
    },
  ],
  [
    'Avisos (sucesso, alerta, erro, agendado)',
    {
      noticeBackground: mix(ap.green, ap.surface2, 0.12),
      noticeBackgroundLight: mix(ap.green, ap.surface2, 0.06),
      noticeBackgroundDark: ap.green,
      noticeText: ap.greenL,
      noticeTextLight: ap.green,
      noticeTextDark: '#bbf7d0',
      noticeTextMenu: ap.greenL,
      noticeTextMenuHover: '#86efac',
      noticeBorder: mix(ap.green, ap.surface2, 0.3),

      warningBackground: mix(ap.amber, ap.surface2, 0.12),
      warningText: ap.amberTxt,
      warningTextLight: ap.amberL,
      warningTextDark: '#fef3c7',
      warningBorder: mix(ap.amber, ap.surface2, 0.45),

      errorBackground: mix(ap.red, ap.surface2, 0.12),
      errorText: ap.redTxt,
      errorTextDark: '#fecaca',
      errorTextDarker: 'var(--color-errorTextDark)',
      errorTextMenu: ap.redTxt,
      errorBorder: mix(ap.red, ap.surface2, 0.45),

      upcomingBackground: accentSoft,
      upcomingText: ap.accentH,
      upcomingBorder: 'var(--color-tableBorder)',
    },
  ],
  [
    'Formulários',
    {
      formLabelText: ap.text2,
      formLabelBackground: ap.surface3,
      formInputBackground: ap.surface2,
      formInputBackgroundSelected: ap.surface3,
      formInputBackgroundSelection: ap.accent,
      formInputBorder: ap.border2,
      formInputTextReadOnlySelection: ap.surface2,
      formInputBorderSelected: ap.accent,
      formInputText: ap.text,
      formInputTextSelected: ap.bg,
      formInputTextPlaceholder: ap.muted,
      formInputTextPlaceholderSelected: ap.text2,
      formInputTextSelection: ap.surface2,
      formInputShadowSelected: rgba(ap.accent, 0.35),
      formInputTextHighlight: ap.accent,

      checkboxText: 'var(--color-tableText)',
      checkboxBackgroundSelected: ap.accent,
      checkboxBorderSelected: ap.accent,
      checkboxShadowSelected: rgba(ap.accent, 0.35),
      checkboxToggleBackground: ap.border3,
      checkboxToggleBackgroundSelected: ap.accent,
      checkboxToggleDisabled: ap.border2,
    },
  ],
  [
    'Pills',
    {
      pillBackground: ap.surface3,
      pillBackgroundLight: ap.surface2,
      pillText: ap.text2,
      pillTextHighlighted: ap.accentH,
      pillBorder: ap.border2,
      pillBorderDark: 'var(--color-pillBorder)',
      pillBackgroundSelected: accentMid,
      pillTextSelected: ap.text,
      pillBorderSelected: ap.accent,
      pillTextSubdued: ap.muted,
    },
  ],
  [
    'Relatórios',
    {
      reportsRed: ap.redH,
      reportsBlue: ap.accent,
      reportsGreen: ap.greenL,
      reportsGray: ap.muted,
      reportsLabel: 'var(--color-pageText)',
      reportsInnerLabel: ap.bg,
      reportsNumberPositive: 'var(--color-numberPositive)',
      reportsNumberNegative: 'var(--color-numberNegative)',
      reportsNumberNeutral: 'var(--color-numberNeutral)',
      reportsChartFill: 'var(--color-reportsNumberPositive)',
    },
  ],
  [
    'Tags de nota',
    {
      noteTagBackground: accentMid,
      noteTagBackgroundHover: accentStrong,
      noteTagDefault: accentMid,
      noteTagText: ap.text,
    },
  ],
  [
    'Orçamento (mês corrente × outros)',
    {
      budgetOtherMonth: ap.bg,
      budgetCurrentMonth: 'var(--color-tableBackground)',
      budgetHeaderOtherMonth: ap.surface2,
      budgetHeaderCurrentMonth: 'var(--color-tableHeaderBackground)',
    },
  ],
  [
    'Barra de ações, tooltip, overlay',
    {
      floatingActionBarBackground: ap.surface3,
      floatingActionBarBorder: ap.border2,
      floatingActionBarText: ap.text,
      tooltipText: ap.text,
      tooltipBackground: ap.surface3,
      tooltipBorder: ap.border2,
      overlayBackground: rgba('#000000', 0.45),
    },
  ],
  [
    // Variáveis que o Actual acrescentou depois da 26.10.0 (conferido no
    // master em 26/10/2026). Na versão suportada elas são ignoradas; no master
    // fazem a tela de Configurações seguir a paleta em vez de cair no dark
    // embutido. Semântica espelha packages/component-library/src/themes/dark.css.
    'Configurações (só em versões posteriores à 26.10.0)',
    {
      settingsCardBackground: 'var(--color-tableBackground)',
      settingsCardBorder: 'var(--color-tableBorder)',
      settingsCardText: 'var(--color-tableText)',
      settingsCardTextSubdued: ap.muted,
      settingsNavItemText: 'var(--color-pageText)',
      settingsNavItemBackgroundHover: rgba(ap.text, 0.08),
      settingsNavItemAccentSelected: ap.accentH,
      settingsNavItemTextSelected: 'var(--color-settingsNavItemAccentSelected)',
      settingsNavItemBackgroundSelected: rgba(ap.accentH, 0.22),
    },
  ],
  [
    'Gráficos — paleta categórica das zonas do Actual+',
    {
      chartQual1: ap.segFixos,
      chartQual2: ap.segInv,
      chartQual3: ap.segRes,
      chartQual4: ap.segGuilt,
      chartQual5: ap.segOther,
      chartQual6: ap.teal,
      chartQual7: ap.redH,
      chartQual8: ap.amberL,
      chartQual9: ap.accentH,
    },
  ],
];

// ─── Saída ───────────────────────────────────────────────────────────────
const weights = [400, 500, 600, 700, 800];

// Faces reais para normal e italic: sem as itálicas o navegador sintetiza a
// inclinação (font-synthesis), que não tem os mesmos contornos nem métricas.
const styles = ['normal', 'italic'];
const fontFile = (style, w) =>
  `fonts/plus-jakarta-sans-${style === 'italic' ? 'italic-' : ''}${w}.woff2`;

function fontFaces(src) {
  return styles
    .flatMap(style => weights.map(w => [style, w]))
    .map(
      ([style, w]) => `@font-face {
  font-family: 'Plus Jakarta Sans';
  font-style: ${style};
  font-weight: ${w};
  font-display: swap;
  src: url('${src(style, w)}') format('woff2');
}`,
    )
    .join('\n');
}

function rootBlock() {
  const lines = [];
  for (const [title, vars] of sections) {
    if (lines.length) lines.push('');
    lines.push(`  /* ${title} */`);
    for (const [k, v] of Object.entries(vars)) {
      const name = k === 'font-family' ? '--font-family' : `--color-${k}`;
      lines.push(`  ${name}: ${v};`);
    }
  }
  return `:root {\n${lines.join('\n')}\n}\n`;
}

const header = `/*
 * Actual+ — tema para o Actual Budget
 * https://github.com/csantiviago/actual-plus-theme
 *
 * Paleta, tipografia (Plus Jakarta Sans) e semântica de cor do Actual+
 * (https://actualpl.us). Gerado por scripts/build.mjs — não edite à mão.
 */
`;

const themeCss =
  header + '\n' + fontFaces(fontFile) + '\n\n' + rootBlock();

const fontData = (style, w) =>
  'data:font/woff2;base64,' + readFileSync(join(root, fontFile(style, w))).toString('base64');

const overrideCss =
  header.replace(
    ' * Paleta',
    ' * Versão para colar em Configurações → Temas → "Additional CSS overrides"\n * (fontes embutidas). Paleta',
  ) +
  '\n' +
  fontFaces(fontData) +
  '\n\n' +
  rootBlock();

const outputs = {
  'actual.css': themeCss,
  'dist/actual-plus-override.css': overrideCss,
};

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [file, content] of Object.entries(outputs)) {
    let current = '';
    try {
      current = readFileSync(join(root, file), 'utf8');
    } catch {}
    if (current !== content) {
      console.error(`${file} está desatualizado — rode node scripts/build.mjs`);
      stale = true;
    }
  }
  process.exit(stale ? 1 : 0);
}

for (const [file, content] of Object.entries(outputs)) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content);
  console.log(`${file}  ${(Buffer.byteLength(content) / 1024).toFixed(1)} KB`);
}
