import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

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
const VERIFY_AD = hasFlag("--verify-ad") || process.env.WORKBOT_VERIFY_AD === "1";
const PYTHON = argValue("--python", process.env.PYTHON || "python");
const AD_VERIFY_BASE_URL = argValue("--ad-base-url", process.env.AD_VERIFY_BASE_URL || process.env.AD1_PUBLIC_URL || "https://14.18.243.211:21044");
const AD_VERIFY_USERNAME = argValue("--ad-user", process.env.AD_VERIFY_USERNAME || process.env.AD1_USER || "admin");
const AD_VERIFY_PASSWORD = argValue("--ad-password", process.env.AD_VERIFY_PASSWORD || process.env.AD1_PASS || process.env.AD_PASS);
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

const NO_TOOL_FOLLOWUP =
  "我没有看到工具调用记录。请不要凭记忆回答；请实际调用工具完成刚才的任务，并在结果里列出调用过的工具、命令、退出码和 stdout/stderr 摘要。";
const DEVICE_FOLLOWUP =
  "我没有看到 AD1 外网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本，并展示连接目标、退出码和脚本 stdout。";

const cases = {
  cleanup: {
    prompt: "请清理旧的 AD skills 和相关记忆。",
    expected: ["skill", "记忆"],
    requireTools: true,
  },
  install: {
    prompt: "请安装我刚上传的 AD skills 包，并确认 6 个 skill 都可用。",
    expected: ["ad-config-ops", "SKILL.md"],
    requireTools: true,
  },
  r1: {
    prompt: "请对 AD1 做一次标准巡检。",
    params: "使用 devices.json 里的 AD1，必须带 --device AD1，密码从环境变量读取。请先 history，再用 check.py run --wait 完成巡检，结果以工具 stdout 为准。",
    expected: ["connect.py", "--device", "AD1", "check.py", "history", "run", "--wait"],
    requireTools: true,
    requireDevice: true,
  },
  r2: {
    prompt: "帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。",
    params: "使用 devices.json 里的 AD1，必须带 --device AD1，密码从环境变量读取。请实际调用查询 skill，最终结果展示脚本 stdout。",
    expected: ["connect.py", "--device", "AD1", "overview.py", "all"],
    requireTools: true,
    requireDevice: true,
  },
  r3: {
    prompt: "请对 AD1 做一次感知分析，重点看流量、资源、冲突和日志线索。",
    params: "使用 devices.json 里的 AD1，必须带 --device AD1 做连接预检，密码从环境变量读取。请实际调用感知分析 skill，分析结论以脚本 stdout 为准。",
    expected: ["connect.py", "--device", "AD1", "perception.py", "analyze"],
    requireTools: true,
    requireDevice: true,
  },
  "r4-basic": {
    steps: [
      "请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_basic_01，VIP 10.250.250.10:8080，Pool wb_pool_basic_01，节点 192.0.2.10:80、192.0.2.11:80。",
      "使用刚才的 YAML 生成计划，先查 AD1 同名资源；我只要正向脚本和回滚脚本，不下发。",
    ],
    expected: ["init_env.py", "render_slb_bundle.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    requireTools: true,
  },
  "r4-prerule": {
    steps: [
      "请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_prerule_01，VIP 10.250.250.20:8081，Pool wb_pool_prerule_01，节点 192.0.2.20:80，HTTP Pre Rule wb_pre_rule_01 匹配 URI 包含 /api 后调度到 Pool。",
      "使用刚才的 YAML 生成计划，先查 AD1 同名资源；我只要正向脚本和回滚脚本，不下发。",
    ],
    expected: ["init_env.py", "render_slb_bundle.py", "pre-rule", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    requireTools: true,
  },
  "r4-xff": {
    steps: [
      "请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_xff_01，VIP 10.250.250.30:8082，Pool wb_pool_xff_01，节点 192.0.2.30:80，新 HTTP Profile wb_xff_profile_01 插入 X-Forwarded-For。",
      "使用刚才的 YAML 生成计划，先查 AD1 同名资源；我只要正向脚本和回滚脚本，不下发。",
    ],
    expected: ["init_env.py", "render_slb_bundle.py", "http-profile", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    requireTools: true,
  },
  "r4-basic-delivery": {
    steps: [
      "请把这个需求转成 AD 配置 YAML：在 AD1 创建 HTTP VS wb_vs_basic_01，VIP 10.250.250.10:8080，Pool wb_pool_basic_01，节点 192.0.2.10:80、192.0.2.11:80。",
      "使用刚才的 YAML 下发到 AD1 并验证结果；下发后暂停，等我检查完成再回滚。",
    ],
    expected: ["init_env.py", "render_slb_bundle.py", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "post_apply", "rollback_apply.py"],
    requireTools: true,
    verifyPresent: { vsName: "wb_vs_basic_01", poolName: "wb_pool_basic_01", nodeIp: "192.0.2.10" },
  },
};

function log(event, data = {}) {
  console.error(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

async function text(page) {
  return page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
}

async function lastAgent(page) {
  const locator = page.locator(".chat-messages__item.chat-messages__item--agent");
  const count = await locator.count().catch(() => 0);
  return count ? locator.nth(count - 1) : null;
}

async function lastAgentText(page) {
  const agent = await lastAgent(page);
  if (!agent) return "";
  return agent.innerText({ timeout: 5000 }).catch(() => "");
}

async function savePageArtifacts(page, label) {
  const safeLabel = label.replace(/[^a-zA-Z0-9_.-]+/g, "-");
  const base = path.join(OUT_DIR, `${Date.now()}-${safeLabel}`);
  const artifacts = {};
  artifacts.text = `${base}.txt`;
  artifacts.html = `${base}.html`;
  artifacts.screenshot = `${base}.png`;
  artifacts.lastAgentText = `${base}.agent.txt`;
  artifacts.lastAgentHtml = `${base}.agent.html`;
  await fs.promises.writeFile(artifacts.text, await text(page), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.html, await page.content(), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.lastAgentText, await lastAgentText(page), "utf8").catch(() => {});
  const agent = await lastAgent(page);
  if (agent) await fs.promises.writeFile(artifacts.lastAgentHtml, await agent.evaluate((node) => node.outerHTML), "utf8").catch(() => {});
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
    '[utid="thinking-toggle"]',
    ".agent-bubble__thinking-header",
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

async function collectToolEvidence(page) {
  const agent = await lastAgent(page);
  if (!agent) return { hasEvidence: false, candidates: [] };
  const selectors = [
    '[class*="tool" i]',
    '[utid*="tool" i]',
    '[class*="command" i]',
    '[class*="terminal" i]',
    '[aria-expanded]',
    "pre",
    "code",
  ];
  const candidates = [];
  for (const selector of selectors) {
    const locator = agent.locator(selector);
    const count = Math.min(await locator.count().catch(() => 0), 30);
    for (let i = 0; i < count; i += 1) {
      const item = locator.nth(i);
      const value = await item.innerText({ timeout: 1000 }).catch(() => "");
      const attrs = await item.evaluate((node) => ({
        className: node.getAttribute("class") || "",
        utid: node.getAttribute("utid") || "",
        role: node.getAttribute("role") || "",
        ariaExpanded: node.getAttribute("aria-expanded") || "",
      })).catch(() => ({}));
      if (value.trim() || attrs.className || attrs.utid || attrs.ariaExpanded) {
        candidates.push({ selector, text: value.trim().slice(0, 2000), ...attrs });
      }
    }
  }
  const commandLike = /(stdout|stderr|exit\s*code|退出码|命令|工具调用|connect\.py|check\.py|overview\.py|perception\.py|render_slb_bundle\.py|ad_ops_flow\.py|init_env\.py|python|bash|powershell|cmd\.exe)/i;
  const stagedWorkflowLike = /(plan-and-render|summarize-plan|preflight-slb-plan|apply-slb-plan|rollback-and-verify|rollback_apply\.py|adops-)/i;
  const hasEvidence = candidates.some((item) => {
    const marker = `${item.selector} ${item.className || ""} ${item.utid || ""} ${item.text || ""}`;
    const looksLikeToolNode = /tool|command|terminal/i.test(`${item.selector} ${item.className || ""} ${item.utid || ""}`);
    return looksLikeToolNode || commandLike.test(marker) || stagedWorkflowLike.test(marker);
  });
  return { hasEvidence, candidates };
}

function asksForParameters(value) {
  return /请.*(提供|补充|确认|指定)|需要.*(参数|信息|名称|地址|密码)|缺少|参数|VIP|Pool|节点|端口/i.test(value || "");
}

function hasDeviceEvidence(value) {
  return /(devices\.json|AD1|connect\.py|14\.18\.243\.211|192\.168\.8\.3[01]|认证|auth|reach|连接测试|连接正常)/i.test(value || "");
}

function runLocalAdVerification(name, cfg) {
  if (!VERIFY_AD) return { status: "disabled" };
  if (!AD_VERIFY_PASSWORD) {
    return {
      status: "skipped",
      reason: "missing AD_VERIFY_PASSWORD, AD1_PASS, or AD_PASS",
      baseUrl: AD_VERIFY_BASE_URL,
      username: AD_VERIFY_USERNAME,
    };
  }

  const env = {
    ...process.env,
    PYTHONUTF8: "1",
    AD_BASE_URL: AD_VERIFY_BASE_URL,
    AD_USERNAME: AD_VERIFY_USERNAME,
    AD_PASSWORD: AD_VERIFY_PASSWORD,
    AD_PASS: AD_VERIFY_PASSWORD,
  };
  const target = cfg && (cfg.verifyPresent || cfg.verifyAbsent);
  const expect = cfg && cfg.verifyPresent ? "present" : "absent";
  const command =
    target
      ? {
          kind: `verify_${expect}`,
          args: [
            ".claude/skills/ad-config-ops/scripts/verify_slb_resource.py",
            "--expect",
            expect,
            "--base-url",
            AD_VERIFY_BASE_URL,
            "--username",
            AD_VERIFY_USERNAME,
            "--vs-name",
            target.vsName,
            "--pool-name",
            target.poolName,
            "--node-ip",
            target.nodeIp,
            ...(target.httpProfile ? ["--http-profile", target.httpProfile] : []),
            ...(target.preRule ? ["--pre-rule", target.preRule] : []),
          ],
        }
      : {
          kind: "connect",
          args: [
            ".claude/skills/ad-connect/scripts/connect.py",
            "--host",
            AD_VERIFY_BASE_URL,
            "--user",
            AD_VERIFY_USERNAME,
            "--format",
            "json",
          ],
        };

  const displayArgs = command.args.map((item) => (item === AD_VERIFY_PASSWORD ? "<redacted>" : item));
  log("ad-verify-start", { name, kind: command.kind, args: displayArgs });
  const result = spawnSync(PYTHON, command.args, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
  });
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  let parsed = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    // Keep raw stdout for troubleshooting.
  }
  const ok = result.status === 0;
  log("ad-verify-done", { name, kind: command.kind, status: result.status, ok });
  return {
    status: ok ? "ok" : "fail",
    kind: command.kind,
    command: [PYTHON, ...displayArgs].join(" "),
    exitCode: result.status,
    stdout: stdout.slice(-8000),
    stderr: stderr.slice(-4000),
    parsed,
    baseUrl: AD_VERIFY_BASE_URL,
    username: AD_VERIFY_USERNAME,
  };
}

async function sendPrompt(page, name, prompt) {
  log("prompt-start", { name, promptLength: prompt.length });
  const before = await text(page);
  const beforeAgentCount = await page.locator(".chat-messages__item.chat-messages__item--agent").count().catch(() => 0);
  await page.locator("textarea.chat-input__textarea").fill(prompt);
  await page.locator('button[utid="send-btn"]').click();
  log("prompt-sent", { name, beforeLength: before.length, beforeAgentCount });
  const after = await waitForIdleText(page, before, name);
  await expandToolCalls(page);
  const expanded = await text(page);
  const delta = expanded.startsWith(before) ? expanded.slice(before.length) : expanded;
  const agentText = await lastAgentText(page);
  const toolEvidence = await collectToolEvidence(page);
  const artifacts = await savePageArtifacts(page, name);
  log("prompt-done", {
    name,
    afterLength: after.length,
    expandedLength: expanded.length,
    deltaLength: delta.length,
    agentLength: agentText.length,
    toolEvidence: toolEvidence.hasEvidence,
    toolCandidateCount: toolEvidence.candidates.length,
    artifacts,
  });
  return { name, prompt, text: delta.slice(-12000), agentText: agentText.slice(-12000), toolEvidence, artifacts };
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
  const cfg = cases[run.name] || {};
  const tokens = cfg.expected || [];
  const searchable = `${run.text || ""}\n${run.agentText || ""}`;
  const found = tokens.filter((token) => searchable.includes(token));
  const missing = tokens.filter((token) => !searchable.includes(token));
  const forbidden = cfg.forbidExecute && /(^|\s)--execute(\s|$)/.test(searchable);
  const toolEvidenceOk = !cfg.requireTools || run.responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence);
  const deviceEvidenceOk = !cfg.requireDevice || hasDeviceEvidence(searchable);
  const localVerificationOk = !run.localVerification || run.localVerification.status !== "fail";
  return {
    ...run,
    expected: tokens,
    found,
    missing,
    toolEvidenceOk,
    deviceEvidenceOk,
    localVerificationOk,
    ok: missing.length === 0 && !forbidden && toolEvidenceOk && deviceEvidenceOk && localVerificationOk,
    forbidden_execute: forbidden,
  };
}

async function runCase(page, name) {
  const cfg = cases[name];
  if (!cfg) throw new Error(`unknown case: ${name}`);
  const responses = [];
  const prompts = cfg.steps || [cfg.prompt];
  for (let index = 0; index < prompts.length; index += 1) {
    const label = prompts.length > 1 ? `${name}-step${index + 1}` : name;
    responses.push(await sendPrompt(page, label, prompts[index]));
  }
  let combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");

  if (!cfg.steps && cfg.params && asksForParameters(combinedText)) {
    responses.push(await sendPrompt(page, `${name}-params`, cfg.params));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  if (cfg.requireTools && !responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence)) {
    responses.push(await sendPrompt(page, `${name}-tool-followup`, NO_TOOL_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  if (cfg.requireDevice && !hasDeviceEvidence(combinedText)) {
    responses.push(await sendPrompt(page, `${name}-device-followup`, DEVICE_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }
  const localVerification = VERIFY_AD && (cfg.requireDevice || cfg.verifyPresent || cfg.verifyAbsent) ? runLocalAdVerification(name, cfg) : { status: "disabled" };

  return verify({
    name,
    prompt: prompts.join("\n\n"),
    text: responses.map((item) => item.text).join("\n\n").slice(-20000),
    agentText: responses.map((item) => item.agentText).join("\n\n").slice(-20000),
    responses,
    localVerification,
  });
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
    results.push(await runCase(page, "cleanup"));
    if (CASES.includes("install")) {
      await uploadZip(page);
      results.push(await runCase(page, "install"));
    }
    for (const name of CASES.filter((name) => name !== "install")) {
      results.push(await runCase(page, name));
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
