#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { loadConfig, saveConfig, clearConfig, DEFAULT_API } from "./config.js";
import { register, whoami, getResume, putResume, patchSection, getSchema, listVariants, getVariant, putVariant, deleteVariant, getResumeText } from "./api.js";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const VERSION = pkg.version;
const VARIANT_FLAG = "--variant=";

function printVariantReminder(apiBase: string, handle: string | undefined) {
  if (!handle) return;
  console.log("");
  console.log("Tip — create tailored variants for each audience:");
  console.log("");
  console.log("  • Company variant  → share via");
  console.log(`    ${apiBase}/${handle}?company=openai`);
  console.log("  • Role variant     → share via");
  console.log(`    ${apiBase}/${handle}?role=designer`);
  console.log("  • Language variant → share via");
  console.log(`    ${apiBase}/${handle}?lang=en`);
  console.log("");
  console.log(`Use 'cv-pro set-variant <key> [file]' to store a tailored version.`);
  console.log(`See ${apiBase}/llms.txt for the full variant workflow.`);
}

const HELP = `
cv-pro — your resume as a living site  (cv.ha7ch.com)

USAGE
  cv-pro <command> [options]

COMMANDS
  register <handle>           Claim a handle and get a token (no browser needed)
  login <token>               Save an existing personal access token
  logout                      Remove saved credentials
  whoami                      Show authenticated handle
  schema                      Show resume schema (section names + field shapes)
  get [--variant=<key>]       Print current resume (or one variant) as JSON
  export [--txt|--json]       Save resume as plain text (default) or JSON
          [--variant=<key>] [-o <file>]
  update [file]               Replace entire resume from a JSON file (or stdin)
  update-section <section>    Update one section from JSON file (or stdin)
  variants                    List all stored variants with links
  get-variant <key>           Print variant JSON
  set-variant <key> [file]    Create/update a variant from file or stdin
  delete-variant <key>        Delete a variant
  open [--json] [--variant=<key>]  Open resume page in browser

SECTIONS
  header, personalInfo, experience, education,
  projectsRecent, projectsDetailed, skills, contact

  Run 'cv-pro schema' for the full field-level structure.

EXAMPLES
  cv-pro register lawted
  cv-pro whoami
  cv-pro get
  cv-pro get --variant=openai
  cv-pro export -o resume.txt
  cv-pro export --json --variant=openai -o resume_openai.json
  cv-pro update resume.json
  cv-pro update-section experience experience.json
  echo '{"name":"Lawted"}' | cv-pro update-section header
  cv-pro set-variant openai resume_openai.json
  cv-pro variants
  cv-pro open --variant=openai

ENV
  CV_TOKEN   token (overrides saved config)
  CV_HANDLE  handle (required when using CV_TOKEN)
  CV_API     API base URL (default: https://cv.ha7ch.com)
`.trim();

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === "--help" || cmd === "help" || cmd === "-h") {
    console.log(HELP);
    return;
  }

  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION);
    return;
  }

  // register
  if (cmd === "register") {
    const handle = args[1]?.toLowerCase().trim();
    if (!handle) die("Usage: cv-pro register <handle>");
    process.stdout.write(`Registering @${handle}… `);
    const apiBase = process.env.CV_API ?? DEFAULT_API;
    const result = await register(handle, apiBase);
    console.log("✓");
    saveConfig({ token: result.token, handle: result.handle, apiBase });
    console.log(`Logged in as @${result.handle}`);
    console.log(`Page: ${apiBase}/${result.handle}`);
    console.log(`JSON: ${apiBase}/${result.handle}.json   (public, AI-readable)`);
    return;
  }

  // login
  if (cmd === "login") {
    const token = args[1]?.trim();
    if (!token) {
      die("Usage: cv-pro login <token>\nGet a token at cv.ha7ch.com");
    }
    if (!token.startsWith("cv_pat_")) {
      die("Token must start with cv_pat_");
    }

    // verify token by calling whoami
    const cfg = { token, apiBase: DEFAULT_API };
    process.stdout.write("Verifying token… ");
    const result = await whoami(cfg);
    if (!result.ok) {
      if (result.reason === "no-resume") {
        die("\nToken valid, but no resume on file. Run: cv-pro register <handle>");
      }
      if (result.reason === "unauthorized") die("\nInvalid token.");
      die("\nServer error. Try again.");
    }
    console.log(`✓\nLogged in as @${result.username}`);
    saveConfig({ token, handle: result.username, apiBase: DEFAULT_API });
    return;
  }

  // logout
  if (cmd === "logout") {
    clearConfig();
    console.log("Logged out.");
    return;
  }

  // schema — public, no auth needed
  if (cmd === "schema") {
    const apiBase = loadConfig()?.apiBase ?? process.env.CV_API ?? DEFAULT_API;
    const wantJson = args.slice(1).includes("--json");
    const result = await getSchema(apiBase);
    console.log(wantJson ? JSON.stringify(result.json, null, 2) : result.text);
    return;
  }

  // commands that need auth
  const config = loadConfig();
  if (!config?.token) {
    die("Not logged in. Run: cv-pro login <token>\nGet a token at cv.ha7ch.com");
  }

  if (cmd === "whoami") {
    let handle = config.handle;
    if (!handle) {
      const result = await whoami(config);
      if (!result.ok) {
        if (result.reason === "unauthorized") die("Invalid token.");
        if (result.reason === "no-resume") {
          die("Token valid, but no resume on file. Run: cv-pro register <handle>");
        }
        die("Server unreachable.");
      }
      handle = result.username;
    }
    console.log(`@${handle}`);
    console.log(`Page: ${config.apiBase}/${handle}`);
    console.log(`JSON: ${config.apiBase}/${handle}.json   (public, AI-readable)`);
    return;
  }

  if (cmd === "get") {
    const variantArg = args.find((arg) => arg.startsWith(VARIANT_FLAG));
    const variantKey = variantArg?.slice(VARIANT_FLAG.length);
    const data = variantKey ? await getVariant(config, variantKey) : await getResume(config);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === "export") {
    const rest = args.slice(1);
    const wantJson = rest.includes("--json");
    const variantArg = rest.find((arg) => arg.startsWith(VARIANT_FLAG));
    const variantKey = variantArg?.slice(VARIANT_FLAG.length);
    const outIdx = rest.findIndex((arg) => arg === "-o" || arg === "--out");
    const outFile = outIdx >= 0 ? rest[outIdx + 1] : undefined;
    if (outIdx >= 0 && !outFile) {
      die("Usage: cv-pro export [--txt|--json] [--variant=<key>] [-o <file>]");
    }
    const handle = await resolveHandle(config);

    let content: string;
    if (wantJson) {
      const data = variantKey ? await getVariant(config, variantKey) : await getResume(config);
      content = JSON.stringify(data, null, 2) + "\n";
    } else {
      content = await getResumeText(config.apiBase, handle, variantKey);
    }

    if (outFile) {
      writeFileSync(outFile, content);
      console.log(`Saved ${outFile}`);
    } else {
      process.stdout.write(content);
    }
    return;
  }

  if (cmd === "update") {
    const data = readJsonArg(args[1], "resume data");
    process.stdout.write("Updating resume… ");
    const saved = await putResume(config, data);
    const handle = await resolveHandle(config, saved.username);
    console.log(`✓\nView at ${config.apiBase}/${handle}`);
    printVariantReminder(config.apiBase, handle);
    return;
  }

  if (cmd === "update-section") {
    const section = args[1];
    if (!section) die("Usage: cv-pro update-section <section> [file]");
    const value = readJsonArg(args[2], `section '${section}'`);
    process.stdout.write(`Updating ${section}… `);
    const saved = await patchSection(config, section, value);
    const handle = await resolveHandle(config, saved.username);
    console.log(`✓\nView at ${config.apiBase}/${handle}`);
    if (section === "experience" || section === "projectsRecent" || section === "projectsDetailed") {
      printVariantReminder(config.apiBase, handle);
    }
    return;
  }

  if (cmd === "open") {
    const wantJson = args.slice(1).includes("--json");
    const variantArg = args.slice(1).find((arg) => arg.startsWith(VARIANT_FLAG));
    const variantKey = variantArg?.slice(VARIANT_FLAG.length);

    let url: string;
    if (variantKey) {
      url = `${config.apiBase}/${config.handle}?company=${variantKey}`;
    } else if (wantJson) {
      url = `${config.apiBase}/${config.handle}.json`;
    } else {
      url = `${config.apiBase}/${config.handle}`;
    }
    const { execSync } = await import("node:child_process");
    const opener =
      process.platform === "darwin" ? "open" :
      process.platform === "win32" ? "start" : "xdg-open";
    execSync(`${opener} "${url}"`);
    console.log(url);
    return;
  }

  if (cmd === "variants") {
    const variants = await listVariants(config);
    if (variants.length === 0) {
      console.log("No variants yet. Use 'cv-pro set-variant <key> [file]' to create one.");
      return;
    }
    console.log("Stored variants:\n");
    for (const { audience, updatedAt } of variants) {
      const date = updatedAt.slice(0, 10);
      console.log(`  ${audience.padEnd(16)} updated ${date}`);
      console.log(`    ?company=${audience}  →  ${config.apiBase}/${config.handle}?company=${audience}`);
      console.log(`    ?role=${audience}     →  ${config.apiBase}/${config.handle}?role=${audience}`);
      console.log(`    ?lang=${audience}     →  ${config.apiBase}/${config.handle}?lang=${audience}`);
      console.log("");
    }
    return;
  }

  if (cmd === "get-variant") {
    const key = args[1];
    if (!key) die("Usage: cv-pro get-variant <key>");
    const data = await getVariant(config, key);
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (cmd === "set-variant") {
    const key = args[1];
    if (!key) die("Usage: cv-pro set-variant <key> [file]");
    const data = readJsonArg(args[2], `variant '${key}'`);
    process.stdout.write(`Saving variant '${key}'… `);
    const saved = await putVariant(config, key, data);
    const handle = await resolveHandle(config, saved.username);
    console.log(`✓`);
    console.log(`View at ${config.apiBase}/${handle}?company=${key}`);
    console.log(`(Also works with ?role=${key} or ?lang=${key})`);
    return;
  }

  if (cmd === "delete-variant") {
    const key = args[1];
    if (!key) die("Usage: cv-pro delete-variant <key>");
    process.stdout.write(`Deleting variant '${key}'… `);
    await deleteVariant(config, key);
    console.log("✓");
    return;
  }

  die(`Unknown command: ${cmd}\nRun 'cv-pro help' to see available commands.`);
}

async function resolveHandle(
  cfg: { token: string; apiBase: string; handle?: string },
  fromResponse?: string,
): Promise<string> {
  if (cfg.handle) return cfg.handle;
  if (fromResponse) return fromResponse;
  const result = await whoami(cfg);
  if (result.ok) return result.username;
  die("Could not determine handle. Set CV_HANDLE or run 'cv-pro login <token>'.");
}

function readJsonArg(filePath: string | undefined, label: string): unknown {
  if (filePath) {
    try {
      return JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      die(`Could not read ${label} from file: ${filePath}`);
    }
  }
  // try stdin, but only if it's actually piped — otherwise readFileSync("/dev/stdin")
  // blocks the terminal forever waiting for input
  if (process.stdin.isTTY) {
    die(`Provide ${label} as a file path or pipe JSON via stdin.`);
  }
  try {
    const stdin = readFileSync("/dev/stdin", "utf8").trim();
    if (stdin) return JSON.parse(stdin);
  } catch {}
  die(`Provide ${label} as a file path or pipe JSON via stdin.`);
}

function die(msg: string): never {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
