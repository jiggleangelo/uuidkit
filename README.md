# uuidkit

Original MIT original, dependency-free, offline browser tool. Open index.html directly in a modern browser with BigInt and Web Crypto getRandomValues. No build, server, installation or network needed. Source is vanilla JS/HTML/CSS. No external resources, storage or telemetry. Use fictional identifiers; timestamps and IDs may disclose activity or correlate records.

Validate one identifier per line. UUID input requires the 8-4-4-4-12 hex shape; case is normalized to lowercase. UUID validation supports versions 4 and 7 with the RFC 9562 10xx variant only. Other canonical UUID shapes report their version/variant and valid=false, including nil/max IDs. This is deliberately not a general v1–v8 UUID validator. No braces, URNs or hyphenless input. UUID v4 has no timestamp; v7 extracts the unsigned 48-bit Unix millisecond field, without guessing creation time from randomness.

ULID requires exactly 26 Crockford Base32 characters, case-insensitive. I/L/O/U aliases are rejected. The first character must be 0–7 to fit 128 bits; the first ten characters encode a 48-bit Unix millisecond timestamp, with 80 random bits following. ULID version and variant are null because UUID fields do not apply. UTC is ISO text with Z; MYT uses the constant UTC+8 offset, including day/year rollover, with +08:00. Extended ISO years above 9999 retain the signed six-digit spelling. Timestamps are data, not authenticated event times.

Surrounding identifier whitespace is trimmed. Blank lines are ignored. Validation keeps original line numbers; invalid entries carry diagnostics. An empty batch is not valid. Limits: 131072 UTF-16 units and 1000 physical LF/CRLF lines including blanks. Each identifier is limited to 128 UTF-16 units. Per-entry failures retain valid entries; input limits reject the entire report.

Generate 1–1000 UUID v4, UUID v7 or ULID values. All random bits come directly from Web Crypto getRandomValues; no Math.random or insecure fallback. Missing/failed crypto fails closed. v4 sets its version and RFC variant bits. v7 sets its 48-bit timestamp, version, variant and 74 random bits. ULID combines a 48-bit timestamp and 80 random bits. Optional epoch milliseconds must be an integer in 0–281474976710655; blank uses device time. A batch shares one timestamp; v4 ignores that field. There is no state, clock rollback handling, same-millisecond monotonic ordering, distributed coordination or absolute uniqueness promise. These identifiers are not authentication tokens.

Every edit invalidates prior output and disables copies. Generated identifiers and JSON reports can be copied. Clipboard failure selects text for manual copying. Late clipboard resolution cannot restore stale output or overwrite current status. Clear discards page references, without claiming physical memory erasure. Data is neither saved nor transmitted. Reports include canonical valid IDs.

Run the tests with `node --test` in this folder (Node 22 or later); they need no network.


## Run, test and fork

Open `index.html` beside the supplied JavaScript and CSS files, or use any static server. Run the tests with `node --test` in this folder (Node 22 or later); they need no network. Fork the MIT source and retain its license.

[Tool page](https://manykiln.com/tools/uuidkit/) · [Source code](https://github.com/jiggleangelo/uuidkit) · [Join the list](https://join.manykiln.com/?from=uuidkit) · [Privacy](https://manykiln.com/privacy)
