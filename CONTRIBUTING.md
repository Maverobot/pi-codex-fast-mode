# Contributing

Thank you for improving `pi-codex-fast-mode`.

## Requirements

- Node.js 22.19 or newer
- npm
- A current `@earendil-works/pi-coding-agent` installation for manual acceptance testing

## Setup

```bash
git clone https://github.com/SI-RUI-ZHANG/pi-codex-fast-mode.git
cd pi-codex-fast-mode
npm ci --ignore-scripts
npm run release:check
```

For manual Pi testing:

```bash
pi install "$PWD"
```

Do not install the local package and the npm release simultaneously; duplicate extension discovery can register the same command and hook twice.

## Development rules

- Keep runtime code dependency-free unless a dependency is demonstrably safer than local code.
- Use `before_provider_request`; do not replace the provider.
- Never modify verbosity, reasoning effort, prompts, tools, or authentication.
- Never log or persist prompts, payloads, responses, headers, tokens, or account data.
- Back eligibility and pricing changes with an OpenAI source or documentation link.
- Preserve the distinction between *requesting* Fast mode and the backend honoring it.
- Add tests for every business-rule change.

## Checks

```bash
npm run lint
npm run check
npm test
npm run audit:shipped
npm run pack:check
npm run release:check
```

The full development tree currently inherits a development-only advisory through Pi's published dependency shrinkwrap. `npm audit --omit=dev` is the shipped-package gate because this extension has no runtime dependencies and Pi is a host peer, not bundled tarball content.

## Pull requests

Please include:

1. the user-visible behavior being changed;
2. source links for provider/model/cost claims;
3. tests;
4. documentation and changelog updates when applicable; and
5. redacted acceptance evidence for provider-facing changes.

Do not include private prompts, session transcripts, OAuth material, API keys, or account identifiers in issues, tests, screenshots, or benchmarks.

## Benchmarks

Performance measurements are welcome but must state model, sample size, prompt class, ordering method, time-to-first-token definition, total duration, token counts, and whether the served tier was observable. Never generalize a small local sample into a guaranteed speedup.
