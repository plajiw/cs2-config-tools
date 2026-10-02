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
    $('video-mode').textContent = t('Read-only', 'Somente leitura');
    $('video-note').textContent = t(
      'Inspect saved video values, including unsaved editor text.',
      'Confira os valores de vídeo salvos, incluindo texto não salvo do editor.',
    );
    $('video-scope-title').textContent = t('About these values', 'Sobre estes valores');
    $('video-scope').textContent = t(
      'Labels identify keys; game enum meanings are unverified. Unknown fields remain literal. Use Open in editor to change raw values manually.',
      'Rótulos identificam chaves; significados dos enums do jogo não foram verificados. Campos desconhecidos permanecem literais. Use Abrir no editor para alterar valores manualmente.',
    );
    $('video-values-title').textContent = t('Saved values', 'Valores salvos');
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
    $('video-summary').hidden = !$('video-summary').textContent;
    $('video-values').hidden = !(state.rows || []).length;
    const head = document.createElement('tr');
    for (const label of [t('Setting', 'Configuração'), t('Raw value', 'Valor literal')]) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = label;
      head.append(cell);
    }
    $('video-head').replaceChildren(head);
    const rows = (state.rows || []).map((field) => {
      const row = document.createElement('tr');
      const setting = document.createElement('td');
      const label = document.createElement('span');
      label.className = 'setting-label';
      label.textContent = field.label;
      const key = document.createElement('code');
      key.className = 'raw-key';
      key.textContent = field.key;
      setting.append(label, key);
      const value = document.createElement('td');
      value.className = 'raw-value';
      value.textContent = field.value;
      row.append(setting, value);
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
