# pi-codex-fast-mode

A correctness-first [Pi](https://github.com/earendil-works/pi) extension for requesting OpenAI Codex Fast mode—without changing reasoning effort, response verbosity, prompts, tools, or provider authentication.

> **Fast is a paid preference, not a guarantee.** The extension requests Priority processing from the Codex backend. OpenAI may reject or downgrade the requested tier.

## Why this extension?

Fast mode is a small request transformation with meaningful cost consequences. This package deliberately does one thing:

```json
{
  "service_tier": "priority"
}
```

It uses Pi's `before_provider_request` hook instead of replacing the `openai-codex` provider. It is disabled by default, scopes itself to eligible Codex models, persists only its own preference, and never forces low verbosity or changes `/effort`.

## Install

Once published:

```bash
pi install npm:pi-codex-fast-mode
```

For local development:

```bash
pi install ~/Dev/pi-codex-fast-mode
```

Restart Pi after installation. Do not install the local path and npm package at the same time.

## Use

```text
/fast on
/fast off
/fast status
```

A bare `/fast` reports status; it does not toggle an expensive feature accidentally.

For one Pi process without changing the saved preference:

```bash
pi --fast
```

When active on an eligible model, Pi's footer displays `⚡ fast`. If the saved preference is on while the selected model is unsupported, it displays `⚡ fast (inactive)` and leaves requests unchanged.

## Eligibility and cost

The extension currently activates only when:

- the provider is `openai-codex`; and
- the model ID belongs to the GPT-5.4, GPT-5.5, or GPT-5.6 family.

| Model family | Expected speed | Credit usage |
| --- | ---: | ---: |
| GPT-5.4 | about 1.5× | about 2× |
| GPT-5.5 | about 1.5× | about 2.5× |
| GPT-5.6 | about 1.5× | about 2.5× |

These values come from OpenAI's [Codex speed documentation](https://developers.openai.com/codex/speed) and can change. Fast mode is intended for ChatGPT subscription-backed Codex sessions. This package intentionally does not enable API-key Priority Processing for Pi's separate `openai` provider.

OpenAI's user-facing Codex configuration calls this tier `fast`; the Codex client maps it to the wire request value `priority`. See [`ServiceTier::request_value`](https://github.com/openai/codex/blob/main/codex-rs/protocol/src/config_types.rs).

## Persistence

`/fast on` and `/fast off` save a versioned preference at:

```text
<pi-agent-dir>/state/pi-codex-fast-mode.json
```

The default agent directory is `~/.pi/agent`. The extension uses Pi's configured agent directory, writes through a temporary file, and defaults safely to off if state is missing or invalid.

`pi --fast` is a session-only override and is never persisted.

## What it does not do

- It does not change reasoning effort or `/effort`.
- It does not change `text.verbosity`.
- It does not wrap or replace the `openai-codex` provider.
- It does not read or modify OAuth credentials.
- It does not log prompts, responses, request payloads, or headers.
- It does not claim that the backend honored the requested tier.

## Conflicts

Do not combine this package with another extension that registers `/fast` or changes `service_tier`. Pi extensions share provider-request hooks, so load order would determine the final value. If this extension encounters a pre-existing non-Priority tier, it replaces it and warns once for that session.

## Development

Requires Node.js 22.19 or newer.

```bash
npm ci --ignore-scripts
npm run release:check
```

The release check runs formatting/linting, strict TypeScript checking, unit and integration-style tests, a shipped-dependency audit, and an exact npm tarball allowlist check. Runtime code has no third-party dependencies; Pi supplies the peer API.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/design.md](docs/design.md) for the architecture and release contract.

## Security

Pi extensions execute with the same privileges as Pi. Review source before installation. This package's runtime filesystem access is limited to its own state file, and its provider hook adds one documented field to eligible requests.

Report vulnerabilities according to [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Sirui Zhang
