import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function argValue(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && index + 1 < process.argv.length) return process.argv[index + 1];
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function resolvePlaywrightCore() {
  const candidates = [];
  const explicit = argValue("--node-modules", process.env.NODE_MODULES_DIR);
  if (explicit) candidates.push(explicit);
  candidates.push(path.join(process.cwd(), "node_modules"));
  candidates.push(path.resolve(process.cwd(), "..", "..", "browser_work", "node_modules"));
  candidates.push(path.resolve(process.cwd(), "..", "browser_work", "node_modules"));

  for (const candidate of candidates) {
    try {
      return require(require.resolve("playwright-core", { paths: [candidate] }));
    } catch {
      // Try next candidate.
    }
  }
  throw new Error("playwright-core not found. Install it or pass --node-modules <path-to-node_modules>.");
}

const WORKBOT_URL = argValue("--url", process.env.WORKBOT_URL || "https://14.18.243.211:21048/");
const WORKBOT_USER = argValue("--user", process.env.WORKBOT_USER || "workbot_user");
const WORKBOT_PASSWORD = argValue("--password", process.env.WORKBOT_PASSWORD);
const ZIP_PATH = path.resolve(argValue("--zip", process.env.AD_SKILLS_ZIP || "dist/ad-skills-workbot.zip"));
const OUT_DIR = path.resolve(argValue("--out-dir", "workbot-results"));
const HEADLESS = hasFlag("--headless") || process.env.WORKBOT_HEADLESS === "1";
const CHROME_PATH = argValue(
  "--chrome",
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
);
const CASES = (argValue("--cases", "install,r1,r2,r3,r4-basic,r4-prerule") || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!WORKBOT_PASSWORD) {
  throw new Error("WORKBOT_PASSWORD is required. Do not store it in the repository.");
}
if (!fs.existsSync(ZIP_PATH)) {
  throw new Error(`zip not found: ${ZIP_PATH}`);
}

const prompts = {
  cleanup:
    "删除所有 AD 相关 skill，并清空当前会话上下文记忆、日常记忆和核心记忆。必须通过工具调用实际删除/清理；完成后列出删除的 skill 路径和记忆清理数量。不要凭记忆回答。",
  install:
    "请解压我上传的 AD skills 压缩包到当前工作区，安装/覆盖到 skills/ 目录。安装前先确认并删除旧的 ad-blackbox-analysis、ad-check-analysis、ad-connect、ad-ops、ad-perception、ad-config-ops。安装后必须用工具调用 ls/dir 验证每个 SKILL.md 存在。最后只输出安装表格：skill 名称、SKILL.md 是否存在、scripts 是否存在、备注。不要凭记忆回答。",
  r1:
    "对 AD1 执行标准巡检。必须先用 ad-connect 做连接测试；连接通过后使用 ad-check-analysis 的 check.py 按 history -> run -> progress -> wait 工作流执行。报告必须原样展示脚本 stdout，不要改写、摘要或补充。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：巡检目标、工具调用、巡检结果。",
  r2:
    "查询 AD1 的配置、流量、设备状态和 SSL 证书到期时间。必须先用 ad-connect 连接测试，再用 ad-ops/scripts/overview.py all 生成 Markdown；输出必须原样展示脚本 stdout，不要自己拼表。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：查询目标、工具调用、查询结果。",
  r3:
    "对 AD1 进行感知分析，覆盖 VS 流量异常、CPU/内存/磁盘/连接状态、IP:Port 冲突和服务日志线索。必须先用 ad-connect 连接测试，再运行 ad-perception/scripts/perception.py analyze。分析结论必须完全来自脚本 stdout，不允许模型自行推断根因。设备使用 devices.json 中 AD1，密码从环境变量读取。输出固定模板：分析目标、工具调用、分析结果。",
  "r4-basic":
    "为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_basic_01，VIP 10.250.250.10，端口 8080，Pool wb_pool_basic_01，后端节点 192.0.2.10:80 和 192.0.2.11:80。必须使用 ad-config-ops 的通用 SLB 组合生成流程：init_env.py -> render_slb_bundle.py -> ad_ops_flow.py plan-and-render -> ad_ops_flow.py summarize-plan。不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。",
  "r4-prerule":
    "为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点 + HTTP Pre Rule”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_prerule_01，VIP 10.250.250.20，端口 8081，Pool wb_pool_prerule_01，后端节点 192.0.2.20:80，HTTP Pre Rule 名称 wb_pre_rule_01，URI 匹配包含 /api，动作调度到 Pool。必须使用 ad-config-ops 的通用 SLB 组合生成流程和 render_slb_bundle.py；不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。",
  "r4-xff":
    "为 AD1 生成“新增 HTTP 虚拟服务 + Pool + 节点 + 插入 XFF”的配置脚本，只生成和预检，不下发。参数：VS 名称 wb_vs_xff_01，VIP 10.250.250.30，端口 8082，Pool wb_pool_xff_01，后端节点 192.0.2.30:80，HTTP Profile wb_xff_profile_01，Header X-Forwarded-For。必须使用 ad-config-ops 的通用 SLB 组合生成流程和 render_slb_bundle.py；不要手写 payload；不要执行 --execute。输出固定模板：目标、工具调用、生成产物、操作计划、下发状态。",
};

const expected = {
  cleanup: ["skill", "清空"],
  install: ["ad-config-ops", "SKILL.md"],
  r1: ["connect.py", "check.py", "history", "run", "progress", "wait"],
  r2: ["connect.py", "overview.py", "all"],
  r3: ["connect.py", "perception.py", "analyze"],
  "r4-basic": ["init_env.py", "render_slb_bundle.py", "plan-and-render", "summarize-plan"],
  "r4-prerule": ["init_env.py", "render_slb_bundle.py", "pre-rule", "plan-and-render", "summarize-plan"],
  "r4-xff": ["init_env.py", "render_slb_bundle.py", "http-profile", "plan-and-render", "summarize-plan"],
};

function log(event, data = {}) {
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function text(page) {
  return page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
}

async function savePageArtifacts(page, label) {
  const safeLabel = label.replace(/[^a-zA-Z0-9_.-]+/g, "-");
  const base = path.join(OUT_DIR, `${Date.now()}-${safeLabel}`);
  const artifacts = {};
  artifacts.text = `${base}.txt`;
  artifacts.html = `${base}.html`;
  artifacts.screenshot = `${base}.png`;
  await fs.promises.writeFile(artifacts.text, await text(page), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.html, await page.content(), "utf8").catch(() => {});
  await page.screenshot({ path: artifacts.screenshot, fullPage: true }).catch(() => {});
  return artifacts;
}

async function waitForConversation(page) {
  await page.locator("textarea.chat-input__textarea").waitFor({ state: "visible", timeout: 30000 });
}

async function loginIfNeeded(page) {
  await page.goto(WORKBOT_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  if (await page.locator("textarea.chat-input__textarea").count()) return;

  const inputs = page.locator("input");
  const count = await inputs.count();
  if (count < 2) throw new Error("login form not found");
  await inputs.nth(0).fill(WORKBOT_USER);
  await inputs.nth(1).fill(WORKBOT_PASSWORD);
  const agreement = page.locator('input[type="checkbox"]').first();
  if ((await agreement.count()) && !(await agreement.isChecked().catch(() => false))) {
    await agreement.check({ force: true });
  }
  const loginButton = page.locator("button").filter({ hasText: /登录|Login|Sign in/i });
  if (await loginButton.count()) await loginButton.first().click();
  else await inputs.nth(1).press("Enter");
  await waitForConversation(page);
}

async function waitForIdleText(page, beforeText, label, maxMs = 300000) {
  const start = Date.now();
  let last = beforeText;
  let lastChanged = Date.now();
  let lastLog = 0;
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(3000);
    const current = await text(page);
    if (current !== last) {
      last = current;
      lastChanged = Date.now();
    }
    const sendEnabled = await page.locator('button[utid="send-btn"]').isEnabled().catch(() => false);
    const elapsedMs = Date.now() - start;
    if (elapsedMs - lastLog > 30000) {
      log("wait", { label, elapsedMs, textLength: current.length, sendEnabled });
      lastLog = elapsedMs;
    }
    if (current !== beforeText && Date.now() - lastChanged > 20000) {
      log("wait-stable", { label, elapsedMs, textLength: current.length, sendEnabled });
      return current;
    }
    if (sendEnabled && Date.now() - lastChanged > 12000) return current;
  }
  log("wait-timeout", { label, maxMs });
  return text(page);
}

async function expandToolCalls(page) {
  const selectors = [
    'button:has-text("工具")',
    'button:has-text("调用")',
    '[role="button"]:has-text("工具")',
    '[role="button"]:has-text("调用")',
    '.ant-collapse-header',
    '.tool-call',
    '.tool-call-header',
  ];
  for (const selector of selectors) {
    const locator = page.locator(selector);
    const count = Math.min(await locator.count().catch(() => 0), 20);
    for (let i = 0; i < count; i += 1) {
      await locator.nth(i).click({ timeout: 1000 }).catch(() => {});
    }
  }
  await page.waitForTimeout(1000);
}

async function sendPrompt(page, name, prompt) {
  log("prompt-start", { name, promptLength: prompt.length });
  const before = await text(page);
  await page.locator("textarea.chat-input__textarea").fill(prompt);
  await page.locator('button[utid="send-btn"]').click();
  log("prompt-sent", { name, beforeLength: before.length });
  const after = await waitForIdleText(page, before, name);
  await expandToolCalls(page);
  const expanded = await text(page);
  const delta = expanded.startsWith(before) ? expanded.slice(before.length) : expanded;
  const artifacts = await savePageArtifacts(page, name);
  log("prompt-done", { name, afterLength: after.length, expandedLength: expanded.length, deltaLength: delta.length, artifacts });
  return { name, prompt, text: delta.slice(-12000), artifacts };
}

async function uploadZip(page) {
  log("upload-start", { zip: ZIP_PATH });
  const input = page.locator('input[type="file"].hidden-input');
  if (!(await input.count())) throw new Error("upload file input not found");
  await input.setInputFiles(ZIP_PATH);
  await page.waitForTimeout(2000);
  log("upload-done");
}

function verify(run) {
  const tokens = expected[run.name] || [];
  const found = tokens.filter((token) => run.text.includes(token));
  const missing = tokens.filter((token) => !run.text.includes(token));
  const forbidden = run.name.startsWith("r4") && run.text.includes("--execute");
  return { ...run, expected: tokens, found, missing, ok: missing.length === 0 && !forbidden, forbidden_execute: forbidden };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  const debug = {};
  let failure = null;
  let browser = null;
  let page = null;
  try {
    log("main-start", { cases: CASES, zip: ZIP_PATH, outDir: OUT_DIR });
    log("resolve-playwright-start");
    const { chromium } = resolvePlaywrightCore();
    log("resolve-playwright-done");
    log("browser-launch-start", { headless: HEADLESS, chrome: fs.existsSync(CHROME_PATH) ? CHROME_PATH : "bundled" });
    browser = await chromium.launch({
      headless: HEADLESS,
      executablePath: fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined,
      args: ["--ignore-certificate-errors", "--no-sandbox"],
    });
    log("browser-launch-done");
    page = await browser.newPage({ ignoreHTTPSErrors: true });
    log("page-new-done");
    log("login-start", { url: WORKBOT_URL, headless: HEADLESS });
    await loginIfNeeded(page);
    log("login-done", { currentUrl: page.url() });
    results.push(verify(await sendPrompt(page, "cleanup", prompts.cleanup)));
    if (CASES.includes("install")) {
      await uploadZip(page);
      results.push(verify(await sendPrompt(page, "install", prompts.install)));
    }
    for (const name of CASES.filter((name) => name !== "install")) {
      if (!prompts[name]) throw new Error(`unknown case: ${name}`);
      results.push(verify(await sendPrompt(page, name, prompts[name])));
    }
  } catch (error) {
    failure = error;
    debug.error = error && error.stack ? error.stack : String(error);
    if (page) debug.artifacts = await savePageArtifacts(page, "failure");
    log("failure", { message: error && error.message ? error.message : String(error), artifacts: debug.artifacts });
  } finally {
    if (page) {
      debug.finalUrl = page.url();
      debug.finalTitle = await page.title().catch(() => "");
    }
    const report = {
      ok: !failure && results.every((item) => item.ok),
      url: WORKBOT_URL,
      zip: ZIP_PATH,
      cases: CASES,
      results,
      debug,
      created_at: new Date().toISOString(),
    };
    const reportPath = path.join(OUT_DIR, `workbot-acceptance-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(JSON.stringify({ ok: report.ok, report: reportPath }, null, 2));
    if (browser) await browser.close();
  }
  if (failure) process.exitCode = 1;
}

await main();
