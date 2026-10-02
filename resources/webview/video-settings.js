/* Render host-owned values only; meanings and arithmetic belong to the core. */
(() => {
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  window.addEventListener('message', (event) => {
    const state = event.data;
    if (state?.type !== 'videoState') return;
    const t = (en, pt) => (state.pt ? pt : en);
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    $('video-title').textContent = t('Video Settings', 'Configurações de vídeo');
    $('video-note').textContent = t(
      'Saved values, including unsaved editor text. Use Open in editor to change raw values. Labels identify keys; game enum meanings are unverified. Unknown fields remain literal.',
      'Valores salvos, incluindo texto não salvo do editor. Use Abrir no editor para alterar valores literais. Rótulos identificam chaves; significados dos enums do jogo não foram verificados. Campos desconhecidos permanecem literais.',
    );
    const messages = {
      disconnected: t(
        'Connect Game Settings from Home first.',
        'Conecte as configurações do jogo pela Home.',
      ),
      loading: t('Reading video settings…', 'Lendo configurações de vídeo…'),
      missing: t(
        'cs2_video.txt was not found in this folder.',
        'cs2_video.txt não foi encontrado nesta pasta.',
      ),
      unavailable: t(
        'Folder or video file unavailable. Choose the folder again or refresh Home.',
        'Pasta ou arquivo indisponível. Escolha a pasta novamente ou atualize a Home.',
      ),
      invalid: t(
        'Incomplete or unsupported file. Derived values are omitted; review the raw text.',
        'Arquivo incompleto ou não suportado. Valores derivados foram omitidos; confira o texto original.',
      ),
      available: t('Saved video values available.', 'Valores de vídeo salvos disponíveis.'),
    };
    $('video-status').textContent = messages[state.status] || messages.unavailable;
    const resolution = state.video?.resolution,
      refresh = state.video?.refreshRate;
    $('video-summary').textContent = [
      resolution ? `${resolution.width} × ${resolution.height} · ${resolution.aspectRatio}` : '',
      refresh ? `${refresh.hz} Hz` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const head = document.createElement('tr');
    for (const label of [
      t('Setting', 'Configuração'),
      t('Key', 'Chave'),
      t('Raw value', 'Valor literal'),
    ]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      head.append(cell);
    }
    $('video-head').replaceChildren(head);
    const rows = (state.rows || []).map((field) => {
      const row = document.createElement('tr');
      for (const value of [field.label, field.key, field.value]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      }
      return row;
    });
    $('video-fields').replaceChildren(...rows);
    $('raw-video').textContent = t('View raw settings', 'Ver configurações originais');
    $('open-video').textContent = t('Open in editor', 'Abrir no editor');
    $('open-video').disabled = !state.connected || !['available', 'invalid'].includes(state.status);
    $('video-connect').textContent = t('Connect configuration', 'Conectar configuração');
    $('video-manual').textContent = t('Choose folder manually', 'Escolher pasta manualmente');
    $('video-connect').hidden = state.connected;
    $('video-manual').hidden = state.connected;
    $('video-refresh').textContent = t('Refresh', 'Atualizar');
    $('raw-video').disabled = !state.connected || !['available', 'invalid'].includes(state.status);
  });
  $('raw-video').addEventListener('click', () => vscode.postMessage({ type: 'rawVideo' }));
  for (const [id, type] of [
    ['open-video', 'openVideo'],
    ['video-connect', 'detectSettings'],
    ['video-manual', 'connectSettings'],
    ['video-refresh', 'refresh'],
  ])
    $(id).addEventListener('click', () => vscode.postMessage({ type }));
  vscode.postMessage({ type: 'ready' });
})();
