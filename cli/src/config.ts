import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const CONFIG_DIR = join(homedir(), ".cv");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface Config {
  token: string;
  handle?: string;
  apiBase: string;
}

export const DEFAULT_API = "https://cv.ha7ch.com";

export function loadConfig(): Config | null {
  const envToken = process.env.CV_TOKEN;
  if (envToken) {
    return {
      token: envToken,
      handle: process.env.CV_HANDLE,
      apiBase: process.env.CV_API ?? DEFAULT_API,
    };
  }
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf8")) as Config;
  } catch {
    return null;
  }
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) writeFileSync(CONFIG_FILE, "{}", "utf8");
}
