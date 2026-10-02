/* Shared documentation blocks, literal DOM rendering. */
(() => {
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  const node = (tag, text) => {
    const element = document.createElement(tag);
    element.textContent = text;
    return element;
  };
  window.addEventListener('message', (event) => {
    const state = event.data;
    if (state?.type !== 'command') return;
    const t = (en, pt) => (state.pt ? pt : en);
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    $('explorer-title').textContent = t('Command Explorer', 'Explorador de comandos');
    $('explorer-note').textContent = t(
      'Search the shared command catalog. Reviewed meanings, original help and sources remain distinct.',
      'Busque no catálogo compartilhado. Significados revisados, ajuda original e fontes permanecem separados.',
    );
    $('search').textContent = t('Search commands', 'Buscar comandos');
    $('copy').textContent = t('Copy command name', 'Copiar nome do comando');
    $('copy').disabled = !state.name;
    $('command-name').textContent =
      state.name ||
      t(
        'Select a command to read its documentation.',
        'Selecione um comando para ler a documentação.',
      );
    const blocks = state.blocks.map((block) => {
      if (block.kind === 'heading') return node('h3', block.text);
      if (block.kind === 'text') return node('p', block.text);
      if (block.kind === 'code') return node('code', block.text);
      if (block.kind === 'field') return node('p', block.label + ': ' + block.value);
      if (block.kind === 'link') {
        if (!/^https:\/\//.test(block.url)) return node('p', block.label);
        const link = node('a', block.label);
        link.href = block.url;
        return link;
      }
      const table = document.createElement('table');
      const head = document.createElement('tr');
      for (const label of block.headings) {
        const cell = node('th', label);
        cell.scope = 'col';
        head.append(cell);
      }
      table.append(head);
      for (const item of block.rows) {
        const row = document.createElement('tr');
        row.append(node('td', item.value), node('td', item.meaning));
        table.append(row);
      }
      return table;
    });
    $('command-doc').replaceChildren(...blocks);
  });
  $('search').addEventListener('click', () => vscode.postMessage({ type: 'search' }));
  $('copy').addEventListener('click', () => vscode.postMessage({ type: 'copy' }));
  vscode.postMessage({ type: 'ready' });
})();
