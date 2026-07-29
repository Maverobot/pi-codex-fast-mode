import { randomBytes } from "node:crypto";
import { type FileHandle, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";

export const FAST_STATE_VERSION = 1;
export const FAST_STATE_FILENAME = "pi-codex-fast-mode.json";

export interface FastState {
	version: typeof FAST_STATE_VERSION;
	enabled: boolean;
}

export interface LoadFastStateResult {
	state: FastState;
	path: string;
	warning?: string;
}

export interface SaveFastStateOptions {
	temporarySuffix?: () => string;
	maxTemporaryFileAttempts?: number;
}

const DEFAULT_TEMPORARY_FILE_ATTEMPTS = 8;

export function createDefaultFastState(): FastState {
	return { version: FAST_STATE_VERSION, enabled: false };
}

export function getFastStatePath(agentDir: string): string {
	return join(agentDir, "state", FAST_STATE_FILENAME);
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function isMissingFileError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "ENOENT"
	);
}

function isReplaceError(error: unknown): boolean {
	if (typeof error !== "object" || error === null || !("code" in error)) return false;
	const code = (error as { code?: unknown }).code;
	return code === "EEXIST" || code === "EPERM";
}

function parseFastState(value: unknown): FastState | undefined {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
	const candidate = value as Record<string, unknown>;
	if (candidate.version !== FAST_STATE_VERSION || typeof candidate.enabled !== "boolean") {
		return undefined;
	}
	return { version: FAST_STATE_VERSION, enabled: candidate.enabled };
}

export async function loadFastState(agentDir: string): Promise<LoadFastStateResult> {
	const path = getFastStatePath(agentDir);
	try {
		const contents = await readFile(path, "utf8");
		const state = parseFastState(JSON.parse(contents));
		if (state) return { state, path };
		return {
			state: createDefaultFastState(),
			path,
			warning: `Ignoring invalid Fast mode state at ${path}; defaulting to off.`,
		};
	} catch (error) {
		if (isMissingFileError(error)) return { state: createDefaultFastState(), path };
		return {
			state: createDefaultFastState(),
			path,
			warning: `Could not read Fast mode state at ${path}; defaulting to off: ${errorMessage(error)}`,
		};
	}
}

function defaultTemporarySuffix(): string {
	return `${process.pid}-${randomBytes(16).toString("hex")}`;
}

function isExistingPathError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "EEXIST"
	);
}

async function createTemporaryStateFile(
	path: string,
	contents: string,
	options: SaveFastStateOptions,
): Promise<string> {
	const createSuffix = options.temporarySuffix ?? defaultTemporarySuffix;
	const attempts = options.maxTemporaryFileAttempts ?? DEFAULT_TEMPORARY_FILE_ATTEMPTS;
	if (!Number.isInteger(attempts) || attempts < 1) {
		throw new Error("maxTemporaryFileAttempts must be a positive integer");
	}

	for (let attempt = 0; attempt < attempts; attempt += 1) {
		const suffix = createSuffix();
		if (!/^[a-zA-Z0-9_-]+$/.test(suffix)) {
			throw new Error("Temporary state suffix contains unsafe characters");
		}
		const temporaryPath = `${path}.${suffix}.tmp`;
		let handle: FileHandle;
		try {
			handle = await open(temporaryPath, "wx", 0o600);
		} catch (error) {
			if (isExistingPathError(error)) continue;
			throw error;
		}

		try {
			await handle.writeFile(contents, { encoding: "utf8" });
			await handle.sync();
			return temporaryPath;
		} catch (error) {
			await rm(temporaryPath, { force: true }).catch(() => undefined);
			throw error;
		} finally {
			await handle.close().catch(() => undefined);
		}
	}

	throw new Error(`Could not create an exclusive temporary state file after ${attempts} attempts`);
}

export async function saveFastState(
	agentDir: string,
	state: FastState,
	options: SaveFastStateOptions = {},
): Promise<string> {
	const path = getFastStatePath(agentDir);
	const directory = dirname(path);
	await mkdir(directory, { recursive: true, mode: 0o700 });

	const contents = `${JSON.stringify(state, null, 2)}\n`;
	let temporaryPath: string | undefined;

	try {
		temporaryPath = await createTemporaryStateFile(path, contents, options);
		try {
			await rename(temporaryPath, path);
		} catch (error) {
			// Windows cannot consistently replace an existing file with rename(). This
			// fail-safe fallback is not atomic: interruption leaves state absent (off).
			if (process.platform !== "win32" || !isReplaceError(error)) throw error;
			await rm(path, { force: true });
			await rename(temporaryPath, path);
		}
		return path;
	} finally {
		if (temporaryPath) await rm(temporaryPath, { force: true }).catch(() => undefined);
	}
}
