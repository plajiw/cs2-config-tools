# CS2 Config Tools

Uma extensão comunitária para escrever, entender e organizar CFGs de Counter-Strike 2 no VS Code. O projeto é independente, com descrições em inglês e tradução para português brasileiro.

[Read in English](../README.md)

## O que a extensão oferece

- **Hub de configurações:** conecta uma pasta de CFGs, lista seus arquivos e reúne o mapa de binds e a verificação em uma tela inicial. Inclui detecção de pastas Steam e criação segura de CFGs vazias.
- **Verificação de comandos:** identifica nomes desconhecidos, aspas sem fechamento e valores fora dos tipos, opções ou intervalos documentados.
- **Health check de binds:** aponta binds repetidos ou substituídos, com links para o bind anterior e aliases locais envolvidos.
- **Mapa visual de binds:** permite consultar binds de teclado, mouse e numpad, ver suas ações e abrir a origem ou binds anteriores. Oferece navegação por teclado, mantém o foco durante atualizações e identifica resultados incertos.
- **Relatório de saúde da CFG:** reúne problemas de comandos e parâmetros, binds modelados e limites da análise no painel Output.
- **Documentação ao passar o mouse:** explica a finalidade do comando, o valor escrito na CFG, padrões e intervalos conhecidos e opções como cores do HUD.
- **Autocomplete e correções rápidas:** sugere comandos e valores conhecidos e permite selecionar correções para nomes próximos.
- **Formatação de CFGs:** organiza espaços, linhas vazias e separações de seções, preservando a ordem dos comandos e o conteúdo entre aspas.
- **Navegação:** leva até aliases locais ou arquivos citados em exec, encontra referências de aliases e mostra definições no outline.
- **Dicas opcionais de valores:** exibe significados revisados ao lado dos parâmetros, no idioma escolhido.

## Como começar

1. Instale o VSIX da pasta artifacts/ em **Extensões → ⋯ → Instalar do VSIX**.
2. Abra a CFG e selecione **CS2 CFG** no indicador de linguagem do editor.
3. Use Ctrl+Espaço para sugestões, passe o mouse para explicações e use **Formatar documento** para organizar o arquivo.

Para uma revisão geral, execute **CS2 Config: Verificar CFG** na Paleta de Comandos. Escolha inglês, pt-BR ou auto em **CS2 Config: Selecionar idioma das descrições**.

Para explorar os binds, execute **CS2 Config: Abrir mapa de binds** com uma CFG ativa. O mapa é somente leitura e acompanha a edição daquele arquivo.

O [guia de uso](user-guide.pt-BR.md) explica as configurações, a formatação ao salvar, o mapa e os avisos.

## Alcance atual

Os recursos funcionam offline. A análise cobre um arquivo por vez e informa resultados parciais diante de arquivos externos ou efeitos desconhecidos. As verificações do catálogo não confirmam compatibilidade com a build instalada. A extensão não executa CFGs nem altera a instalação do jogo.

Builders de configuração e análise entre arquivos estão planejados. Acompanhe o [plano de implementação](planning/implementation-plan.md).

## Comunidade

[Código-fonte no GitHub](https://github.com/plajiw/cs2-config-tools) · [Reportar um problema](https://github.com/plajiw/cs2-config-tools/issues)

Encontrou uma descrição confusa ou um comando ausente? Veja o [guia de contribuição](../CONTRIBUTING.md). O código usa licença MIT; dados importados mantêm a atribuição e os termos das fontes.
