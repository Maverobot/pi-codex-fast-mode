# Security Policy

## Supported versions

Before the first public release, security fixes are made on `main`. After release, the latest minor version will receive security updates.

## Reporting a vulnerability

Please use GitHub's private security-advisory flow for `SI-RUI-ZHANG/pi-codex-fast-mode`. Do not disclose exploitable details in a public issue.

Include the affected version, impact, reproduction steps, and a minimal redacted proof. Never submit OAuth tokens, API keys, full provider payloads, private prompts, responses, session transcripts, or account identifiers.

## Runtime scope

The extension:

- runs with Pi's process privileges;
- receives the final provider payload through `before_provider_request`;
- adds `service_tier: "priority"` only for eligible requests;
- reads and writes only its namespaced state file; and
- makes no independent network calls.

A change that expands filesystem, network, credential, subprocess, or logging access is security-sensitive and requires explicit documentation and review.
