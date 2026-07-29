import { spawnSync } from "node:child_process";

const expectedFiles = [
	"CHANGELOG.md",
	"CONTRIBUTING.md",
	"LICENSE",
	"README.md",
	"SECURITY.md",
	"docs/design.md",
	"extensions/codex-fast.ts",
	"extensions/core.ts",
	"extensions/state.ts",
	"package.json",
].sort();

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCommand, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
	cwd: process.cwd(),
	encoding: "utf8",
});

if (result.error) throw result.error;
if (result.status !== 0) {
	process.stderr.write(result.stderr);
	process.exit(result.status ?? 1);
}

let reports;
try {
	reports = JSON.parse(result.stdout);
} catch (error) {
	const detail = error instanceof Error ? error.message : String(error);
	process.stderr.write(`npm pack returned invalid JSON: ${detail}\n`);
	process.exit(1);
}
if (!Array.isArray(reports) || reports.length !== 1 || !Array.isArray(reports[0]?.files)) {
	throw new Error("npm pack returned an unexpected report shape");
}

const actualFiles = reports[0].files.map((file) => file.path).sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
	process.stderr.write(
		`Tarball allowlist mismatch.\nExpected: ${JSON.stringify(expectedFiles, null, 2)}\nActual: ${JSON.stringify(actualFiles, null, 2)}\n`,
	);
	process.exit(1);
}

process.stdout.write(
	`${JSON.stringify(
		{
			name: reports[0].name,
			version: reports[0].version,
			filename: reports[0].filename,
			unpackedSize: reports[0].unpackedSize,
			files: actualFiles,
		},
		null,
		2,
	)}\n`,
);
