/* MIT */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let revision = 0;
  function invalidate(message = 'Inputs changed. Run again.') {
    revision++;
    $('output').hidden = true;
    $('report').textContent = ''; $('generated').textContent = '';
    $('copy-report').disabled = true; $('copy-generated').disabled = true;
    $('status').textContent = message;
  }
  function render(report, output, message) {
    $('report').textContent = JSON.stringify(report, null, 2);
    $('generated').textContent = output;
    $('copy-report').disabled = false; $('copy-generated').disabled = output.length === 0;
    $('output').hidden = false; $('status').textContent = message;
  }
  for (const [button, target] of [['copy-report', 'report'], ['copy-generated', 'generated']]) {
    $(button).addEventListener('click', async () => {
      const rev = revision, text = $(target).textContent;
      if (!text) return;
      try { await navigator.clipboard.writeText(text); if (rev === revision) $('status').textContent = 'Copied.'; }
      catch {
        if (rev !== revision) return;
        const range = document.createRange(); range.selectNodeContents($(target));
        const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
        $(target).focus(); $('status').textContent = 'Clipboard unavailable. Text selected; copy manually.';
      }
    });
  }
  for (const id of ['input', 'kind', 'count', 'timestamp']) {
    $(id).addEventListener('input', () => invalidate());
    $(id).addEventListener('change', () => invalidate());
  }
  $('run').addEventListener('click', () => {
    invalidate('Validating locally…');
    try { const r = UUIDKit.inspectBatch($('input').value); render(r, r.entries.filter(e => e.valid).map(e => e.canonical).join('\n'), r.validCount + ' of ' + r.count + ' valid in the supported formats. Timestamp is embedded data, not proof of creation time.'); }
    catch (e) { $('status').textContent = e.message; }
  });
  $('generate').addEventListener('click', () => {
    invalidate('Generating locally…');
    try {
      const kind = $('kind').value, rawTime = $('timestamp').value.trim(), rawCount = $('count').value;
      if (!/^[0-9]+$/.test(rawCount)) throw new Error('Count must be an integer from 1 to 1000.');
      if (kind !== 'v4' && rawTime && !/^[0-9]+$/.test(rawTime)) throw new Error('Timestamp must be nonnegative integer milliseconds.');
      const ids = UUIDKit.generate(kind, Number(rawCount), rawTime ? Number(rawTime) : Date.now());
      render(UUIDKit.inspectBatch(ids.join('\n')), ids.join('\n'), ids.length + ' generated with Web Crypto. No monotonic ordering or uniqueness guarantee.');
    } catch (e) { $('status').textContent = e.message; }
  });
  $('example').addEventListener('click', () => {
    $('input').value = '550e8400-e29b-41d4-a716-446655440000\n017f22e2-79b0-7cc3-98c4-dc0c0c07398f\n01ARZ3NDEKTSV4RRFFQ69G5FAV\nnot-an-id';
    invalidate('Fictional examples loaded. Validate to inspect.');
  });
  $('clear').addEventListener('click', () => { $('input').value = ''; $('kind').value = 'v4'; $('count').value = '10'; $('timestamp').value = ''; invalidate('Cleared. No input is retained.'); });
})();
