import { mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	FAST_STATE_VERSION,
	getFastStatePath,
	loadFastState,
	saveFastState,
} from "../extensions/state.ts";

const temporaryDirectories: string[] = [];

async function temporaryAgentDir(): Promise<string> {
	const path = await mkdtemp(join(tmpdir(), "pi-codex-fast-mode-"));
	temporaryDirectories.push(path);
	return path;
}

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("Fast mode state", () => {
	it("defaults to off when no state exists", async () => {
		const agentDir = await temporaryAgentDir();
		const result = await loadFastState(agentDir);
		expect(result.state).toEqual({ version: FAST_STATE_VERSION, enabled: false });
		expect(result.warning).toBeUndefined();
	});

	it("persists and reloads a valid preference", async () => {
		const agentDir = await temporaryAgentDir();
		const path = await saveFastState(agentDir, {
			version: FAST_STATE_VERSION,
			enabled: true,
		});
		const result = await loadFastState(agentDir);

		expect(path).toBe(getFastStatePath(agentDir));
		expect(result.state.enabled).toBe(true);
		expect(JSON.parse(await readFile(path, "utf8"))).toEqual({
			version: FAST_STATE_VERSION,
			enabled: true,
		});
		expect((await readdir(dirname(path))).filter((name) => name.endsWith(".tmp"))).toEqual([]);
		if (process.platform !== "win32") {
			expect((await stat(path)).mode & 0o777).toBe(0o600);
		}
	});

	it("replaces an existing preference", async () => {
		const agentDir = await temporaryAgentDir();
		await saveFastState(agentDir, { version: FAST_STATE_VERSION, enabled: true });
		await saveFastState(agentDir, { version: FAST_STATE_VERSION, enabled: false });
		expect((await loadFastState(agentDir)).state.enabled).toBe(false);
	});

	it.skipIf(process.platform === "win32")(
		"does not follow a colliding temporary-file symlink",
		async () => {
			const agentDir = await temporaryAgentDir();
			const path = await saveFastState(agentDir, {
				version: FAST_STATE_VERSION,
				enabled: false,
			});
			const victimPath = join(agentDir, "victim.txt");
			const collisionPath = `${path}.collision.tmp`;
			await writeFile(victimPath, "unchanged\n", "utf8");
			await symlink(victimPath, collisionPath);

			await expect(
				saveFastState(
					agentDir,
					{ version: FAST_STATE_VERSION, enabled: true },
					{ temporarySuffix: () => "collision", maxTemporaryFileAttempts: 1 },
				),
			).rejects.toThrow("Could not create an exclusive temporary state file");
			expect(await readFile(victimPath, "utf8")).toBe("unchanged\n");
			expect((await loadFastState(agentDir)).state.enabled).toBe(false);
		},
	);

	it("defaults safely when the state file is malformed", async () => {
		const agentDir = await temporaryAgentDir();
		const path = getFastStatePath(agentDir);
		await saveFastState(agentDir, { version: FAST_STATE_VERSION, enabled: true });
		await writeFile(path, "not json\n", "utf8");

		const result = await loadFastState(agentDir);
		expect(result.state.enabled).toBe(false);
		expect(result.warning).toContain("defaulting to off");
	});

	it("rejects unknown state schema versions", async () => {
		const agentDir = await temporaryAgentDir();
		const path = getFastStatePath(agentDir);
		await saveFastState(agentDir, { version: FAST_STATE_VERSION, enabled: true });
		await writeFile(path, '{"version":2,"enabled":true}\n', "utf8");

		const result = await loadFastState(agentDir);
		expect(result.state.enabled).toBe(false);
		expect(result.warning).toContain("invalid Fast mode state");
	});
});
