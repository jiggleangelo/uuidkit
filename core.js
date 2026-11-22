/* MIT · Original clean-room UUID and ULID byte operations. */
(function (root) {
  'use strict';
  const MAX_TIME = 281474976710655, MAX_INPUT = 131072, MAX_BATCH = 1000;
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  function timeFields(ms) {
    return { milliseconds: ms, utc: new Date(ms).toISOString(), myt: new Date(ms + 28800000).toISOString().replace(/Z$/, '+08:00') };
  }
  function variant(byte) {
    if ((byte & 128) === 0) return 'NCS';
    if ((byte & 192) === 128) return 'RFC 9562';
    if ((byte & 224) === 192) return 'Microsoft';
    return 'Reserved';
  }
  function inspect(input) {
    if (typeof input !== 'string' || input.length > 128) return { valid: false, error: 'Identifier must be text of at most 128 characters.' };
    const text = input.trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
      const hex = text.replace(/-/g, '').toLowerCase();
      const version = parseInt(hex[12], 16), kind = variant(parseInt(hex.slice(16, 18), 16));
      const valid = (version === 4 || version === 7) && kind === 'RFC 9562';
      const result = { type: 'UUID', canonical: text.toLowerCase(), valid, version, variant: kind, timestamp: null };
      if (version === 7 && kind === 'RFC 9562') result.timestamp = timeFields(parseInt(hex.slice(0, 12), 16));
      if (!valid) result.error = kind !== 'RFC 9562' ? 'UUID variant must be RFC 9562 (10xx).' : 'Supported UUID versions are 4 and 7 only.';
      return result;
    }
    if (text.length === 26) {
      const canonical = text.toUpperCase();
      if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(canonical)) return { type: 'ULID', valid: false, error: 'ULID requires Crockford Base32; I, L, O and U are excluded.' };
      if (alphabet.indexOf(canonical[0]) > 7) return { type: 'ULID', valid: false, error: 'ULID overflow: first character must be 0–7 (128 bits maximum).' };
      let ms = 0;
      for (const c of canonical.slice(0, 10)) ms = ms * 32 + alphabet.indexOf(c);
      return { type: 'ULID', valid: true, canonical, version: null, variant: null, timestamp: timeFields(ms) };
    }
    return { valid: false, error: 'Expected a hyphenated UUID v4/v7 or a 26-character ULID; no URN or braces.' };
  }
  function inspectBatch(input) {
    if (typeof input !== 'string' || input.length > MAX_INPUT) throw new Error('Input limit: 131072 characters.');
    const lines = input.split(/\r\n|\n/);
    if (lines.length > MAX_BATCH) throw new Error('Input limit: 1000 lines.');
    const entries = [];
    lines.forEach((s, i) => { if (s.trim()) entries.push({ line: i + 1, ...inspect(s) }); });
    return { count: entries.length, validCount: entries.filter(e => e.valid).length, valid: entries.length > 0 && entries.every(e => e.valid), entries };
  }
  function timestamp(ms) {
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > MAX_TIME) throw new Error('Timestamp must be an integer from 0 to 281474976710655 milliseconds.');
    return ms;
  }
  function randomBytes(size, cryptoSource) {
    if (!cryptoSource || typeof cryptoSource.getRandomValues !== 'function') throw new Error('Web Crypto getRandomValues is required; no insecure fallback.');
    const bytes = new Uint8Array(size);
    cryptoSource.getRandomValues(bytes);
    return bytes;
  }
  function generate(type, count, ms = Date.now(), cryptoSource = root.crypto) {
    if (!['v4', 'v7', 'ulid'].includes(type)) throw new Error('Choose v4, v7 or ulid.');
    if (!Number.isInteger(count) || count < 1 || count > MAX_BATCH) throw new Error('Batch count must be an integer from 1 to 1000.');
    if (type !== 'v4') timestamp(ms);
    const out = [];
    for (let n = 0; n < count; n++) {
      if (type === 'ulid') {
        let value = BigInt(ms);
        for (const b of randomBytes(10, cryptoSource)) value = (value << 8n) | BigInt(b);
        let text = '';
        for (let i = 0; i < 26; i++) { text = alphabet[Number(value & 31n)] + text; value >>= 5n; }
        out.push(text);
      } else {
        const bytes = randomBytes(16, cryptoSource);
        if (type === 'v7') {
          let t = ms;
          for (let i = 5; i >= 0; i--) { bytes[i] = t % 256; t = Math.floor(t / 256); }
        }
        bytes[6] = (bytes[6] & 15) | (type === 'v4' ? 64 : 112);
        bytes[8] = (bytes[8] & 63) | 128;
        const h = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        out.push(h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20));
      }
    }
    return out;
  }
  const api = Object.freeze({ inspect, inspectBatch, generate, MAX_TIME, MAX_INPUT, MAX_BATCH });
  if (typeof module === 'object' && module.exports) module.exports = { UUIDKit: api };
  else root.UUIDKit = api;
})(globalThis);
