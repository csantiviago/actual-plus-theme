# Fontes

Plus Jakarta Sans, de Tokotype — licença SIL Open Font License 1.1 ([`OFL.txt`](OFL.txt),
copyright "2020 The Plus Jakarta Sans Project Authors").

| Arquivos | Estilo | Origem |
| --- | --- | --- |
| `plus-jakarta-sans-{400,500,600,700,800}.woff2` | normal | já existentes no tema |
| `plus-jakarta-sans-italic-{400,500,600,700,800}.woff2` | italic | `ofl/plusjakartasans/PlusJakartaSans-Italic[wght].ttf` do repositório [google/fonts](https://github.com/google/fonts/tree/8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5/ofl/plusjakartasans) |

- Commit do google/fonts: `8b0a1d0f5983c89bc2b93f1b5fb55f9e252744b5` (26/10/2026, ramo `main`).
- Fonte de design: [tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans), commit
  `18d1cd2f7ea10481919d2f05c1f7064b7307fc26` (conforme `METADATA.pb` do google/fonts).
- SHA-256 do TTF variável baixado: `9529eb888668b6a3c6dd75b6341a2fc5263fb6c9e788822e6117c29dd9e8b115`.
- Os WOFF2 itálicos são instâncias estáticas (eixo `wght` fixado em 400/500/600/700/800),
  recortadas para Latin, Latin-1, Latin Estendido-A e pontuação comum.
  Reprodução: `npm install && node scripts/make-italic-fonts.mjs 'PlusJakartaSans-Italic[wght].ttf'`.
  Os binários do WOFF2 dependem da versão do `subset-font`/HarfBuzz; a verificação do tema é o conteúdo
  dos arquivos commitados (os testes conferem os dados embutidos no `dist`), não a reprodução bit a bit.
