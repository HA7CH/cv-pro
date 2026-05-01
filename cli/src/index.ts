#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { loadConfig, saveConfig, clearConfig, DEFAULT_API } from "./config.js";
import { register, whoami, getResume, putResume, patchSection } from "./api.js";

const VERSION = "0.2.4";

const HELP = `
aicv — AI-native resume CLI  (ai-cv.ha7ch.com)

USAGE
  ai-cv <command> [options]

COMMANDS
  register <handle>           Claim a handle and get a token (no browser needed)
  login <token>               Save an existing personal access token
  logout                      Remove saved credentials
  whoami                      Show authenticated handle
  get                         Print current resume as JSON
  update [file]               Replace entire resume from a JSON file (or stdin)
  update-section <section>    Update one section from JSON file (or stdin)
  open                        Open your live resume page in the browser

SECTIONS
  header, personalInfo, experience, education,
  projectsRecent, projectsDetailed, skills, contact

EXAMPLES
  ai-cv register lawted
  ai-cv whoami
  ai-cv get
  ai-cv update resume.json
  ai-cv update-section experience experience.json
  echo '{"name":"Lawted"}' | cv update-section header

ENV
  CV_TOKEN   token (overrides saved config)
  CV_HANDLE  handle (required when using CV_TOKEN)
  CV_API     API base URL (default: https://ai-cv.ha7ch.com)
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
    if (!handle) die("Usage: ai-cv register <handle>");
    process.stdout.write(`Registering @${handle}… `);
    const apiBase = process.env.CV_API ?? DEFAULT_API;
    const result = await register(handle, apiBase);
    console.log("✓");
    saveConfig({ token: result.token, handle: result.handle, apiBase });
    console.log(`Logged in as @${result.handle}`);
    console.log(`Page: ${apiBase}/${result.handle}`);
    return;
  }

  // login
  if (cmd === "login") {
    const token = args[1];
    if (!token) {
      die("Usage: cv login <token>\nGet a token at ai-cv.ha7ch.com");
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
        die("\nToken valid, but no resume on file. Run: ai-cv register <handle>");
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

  // commands that need auth
  const config = loadConfig();
  if (!config?.token) {
    die("Not logged in. Run: ai-cv login <token>\nGet a token at ai-cv.ha7ch.com");
  }

  if (cmd === "whoami") {
    let handle = config.handle;
    if (!handle) {
      const result = await whoami(config);
      if (!result.ok) {
        if (result.reason === "unauthorized") die("Invalid token.");
        if (result.reason === "no-resume") {
          die("Token valid, but no resume on file. Run: ai-cv register <handle>");
        }
        die("Server unreachable.");
      }
      handle = result.username;
    }
    console.log(`@${handle}`);
    console.log(`Page: ${config.apiBase}/${handle}`);
    return;
  }

  if (cmd === "get") {
    const resume = await getResume(config);
    console.log(JSON.stringify(resume, null, 2));
    return;
  }

  if (cmd === "update") {
    const data = readJsonArg(args[1], "resume data");
    process.stdout.write("Updating resume… ");
    await putResume(config, data);
    console.log(`✓\nView at ${config.apiBase}/${config.handle}`);
    return;
  }

  if (cmd === "update-section") {
    const section = args[1];
    if (!section) die("Usage: cv update-section <section> [file]");
    const value = readJsonArg(args[2], `section '${section}'`);
    process.stdout.write(`Updating ${section}… `);
    await patchSection(config, section, value);
    console.log(`✓\nView at ${config.apiBase}/${config.handle}`);
    return;
  }

  if (cmd === "open") {
    const { execSync } = await import("node:child_process");
    const url = `${config.apiBase}/${config.handle}`;
    const opener =
      process.platform === "darwin" ? "open" :
      process.platform === "win32" ? "start" : "xdg-open";
    execSync(`${opener} "${url}"`);
    console.log(url);
    return;
  }

  die(`Unknown command: ${cmd}\nRun 'ai-cv help' to see available commands.`);
}

function readJsonArg(filePath: string | undefined, label: string): unknown {
  if (filePath) {
    try {
      return JSON.parse(readFileSync(filePath, "utf8"));
    } catch {
      die(`Could not read ${label} from file: ${filePath}`);
    }
  }
  // try stdin
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
