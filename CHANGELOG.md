# Changelog

All notable changes to this project will be documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Fast-mode eligibility for exactly `openai-codex/gpt-6-astra` in Maverobot's fork, preserving existing GPT-5 support and provider restrictions.

### Changed

- Astra activation reports the documented 2.5× Standard credit rate where available, without claiming a fixed speed multiplier. Requests still ask for Priority; backend acceptance is not guaranteed.
- Document fork installation and exact Astra eligibility using OpenAI's [models](https://developers.openai.com/codex/models) and [speed](https://developers.openai.com/codex/speed) documentation.

## [0.2.0] — 2026-07-30

### Changed

- Bare `/fast` now toggles and persists Fast mode; `/fast on`, `/fast off`, and `/fast status` remain available as explicit controls.

## [0.1.0] — 2026-07-29

### Added

- Correctness-first Codex Fast-mode request hook for GPT-5.4, GPT-5.5, and GPT-5.6 families.
- Explicit `/fast on | off | status` command and process-local `--fast` flag.
- Versioned, package-owned preference state with safe defaults, exclusive temporary files, atomic POSIX replacement, and a fail-safe Windows fallback.
- Eligible/inactive footer status and transparent speed, credit, conflict, and downgrade messaging.
- Strict TypeScript, Biome, Vitest coverage, Linux/Windows CI, production audit, and exact npm tarball allowlist checks.
- Public architecture, contribution, and security documentation.

### Security

- No runtime dependencies, provider replacement, independent network access, credential access, or request logging.
