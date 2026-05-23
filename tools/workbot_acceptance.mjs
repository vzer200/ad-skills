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
const R4_YAML_PATH = path.resolve(argValue("--r4-yaml", process.env.WORKBOT_R4_YAML || "test/fixtures/workbot/r4-slb-full.yml"));
const OUT_DIR = path.resolve(argValue("--out-dir", "workbot-results"));
const HEADLESS = hasFlag("--headless") || process.env.WORKBOT_HEADLESS === "1";
const VERIFY_AD = hasFlag("--verify-ad") || process.env.WORKBOT_VERIFY_AD === "1";
const PYTHON = argValue("--python", process.env.PYTHON || "python");
const AD_VERIFY_BASE_URL = argValue("--ad-base-url", process.env.AD_VERIFY_BASE_URL || process.env.AD1_PUBLIC_URL || "https://14.18.243.211:21044");
const AD_VERIFY_USERNAME = argValue("--ad-user", process.env.AD_VERIFY_USERNAME || process.env.AD1_USER || "admin");
const AD_VERIFY_PASSWORD = argValue("--ad-password", process.env.AD_VERIFY_PASSWORD || process.env.AD1_PASS || process.env.AD_PASS || process.env.AD_PASSWORD);
const IDLE_AFTER_STOP_MS = Number(argValue("--idle-after-stop-ms", process.env.WORKBOT_IDLE_AFTER_STOP_MS || "2000"));
const WAIT_POLL_MS = Number(argValue("--wait-poll-ms", process.env.WORKBOT_WAIT_POLL_MS || "1000"));
const CHROME_PATH = argValue(
  "--chrome",
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
);
const FIXED_CASES = [
  "install",
  "r1",
  "r1-full",
  "r1-security",
  "r1-all",
  "r1-all-full",
  "r1-all-security",
  "r2",
  "r2-vs",
  "r2-vs-all",
  "r2-node",
  "r2-pool",
  "r2-cert",
  "r2-traffic",
  "r2-status",
  "r2-hardware",
  "r3",
  "r3-traffic",
  "r3-state",
  "r3-conflict",
  "r3-logs",
  "r4-script",
  "r4-delivery",
].join(",");
const EXTENDED_CASES = [
  "install",
  "r2-short",
  "r2-vs-alt",
  "r2-vs-all-short",
  "r2-pool-node",
  "r2-cert-alt",
  "r2-resource-alt",
  "r3-short",
  "r3-abnormal",
  "r3-resource-short",
  "r3-conflict-port",
  "r4-vs-pool-script",
  "r4-audit-script",
].join(",");
const CASE_SUITES = {
  fixed: FIXED_CASES,
  extended: EXTENDED_CASES,
  all: Array.from(new Set(`${FIXED_CASES},${EXTENDED_CASES}`.split(","))).join(","),
};
const CASE_SUITE = argValue("--case-suite", process.env.WORKBOT_CASE_SUITE || "fixed");
if (!CASE_SUITES[CASE_SUITE]) {
  throw new Error(`unknown case suite: ${CASE_SUITE}. Expected one of: ${Object.keys(CASE_SUITES).join(", ")}`);
}
const CASES = (
  argValue(
    "--cases",
    process.env.WORKBOT_CASES || CASE_SUITES[CASE_SUITE],
  ) || ""
)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!WORKBOT_PASSWORD) {
  throw new Error("WORKBOT_PASSWORD is required. Do not store it in the repository.");
}
if (!fs.existsSync(ZIP_PATH)) {
  throw new Error(`zip not found: ${ZIP_PATH}`);
}
if (CASES.some((name) => name.startsWith("r4-")) && !fs.existsSync(R4_YAML_PATH)) {
  throw new Error(`R4 YAML fixture not found: ${R4_YAML_PATH}`);
}

const NO_TOOL_FOLLOWUP =
  "我没有看到工具调用记录。为什么没有调用工具？请说明原因，然后不要凭记忆回答，立即实际调用工具完成刚才的任务，并列出工具、命令、退出码和 stdout/stderr 摘要。";
const DEVICE_FOLLOWUP =
  "我没有看到 AD1 外网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本，并展示连接目标、退出码和脚本 stdout。";
const COMMAND_FOLLOWUP =
  "我看到你有工具调用，但工具命令里缺少必须执行的脚本：{missing}。不要只在正文里提到它们，请立即在工具里实际执行包含这些脚本的命令，并列出命令、退出码和 stdout/stderr 摘要。";

const cases = {
  cleanup: {
    prompt: "清理旧 AD skills 和记忆。必须先出现真实工具调用：shell 查删 skills/ad-*，cron_list 查任务，memory_export/memory_purge 清记忆，再用 shell 和 memory_export 验证；没有工具调用就回答失败，不要编执行表。",
    expected: ["skill", "记忆"],
    requireTools: true,
  },
  install: {
    prompt: "请安装我刚上传的 AD skills 包，并确认 6 个 skill 都可用。",
    expected: ["ad-config-ops", "SKILL.md"],
    requireTools: true,
  },
  r1: {
    steps: [
      "请对 AD1 做一次巡检。",
      "标准巡检",
      "强制",
    ],
    expected: ["AD1", "标准巡检"],
    requireTools: true,
    requireDevice: true,
  },
  "r1-full": {
    steps: [
      "请对 AD1 做一次巡检。",
      "全量巡检",
      "强制",
    ],
    expected: ["AD1", "全量巡检"],
    requireTools: true,
    requireDevice: true,
  },
  "r1-security": {
    steps: [
      "请对 AD1 做一次巡检。",
      "安全巡检",
      "强制",
    ],
    expected: ["AD1", "安全巡检"],
    requireTools: true,
    requireDevice: true,
  },
  "r1-all": {
    steps: [
      "请对 AD 所有设备做一次巡检。",
      "标准巡检",
      "强制",
    ],
    expected: ["devices.json", "标准巡检"],
    requireTools: true,
    requireDevice: true,
  },
  "r1-all-full": {
    steps: [
      "请对 AD 所有设备做一次巡检。",
      "全量巡检",
      "强制",
    ],
    expected: ["devices.json", "全量巡检"],
    requireTools: true,
    requireDevice: true,
  },
  "r1-all-security": {
    steps: [
      "请对 AD 所有设备做一次巡检。",
      "安全巡检",
      "强制",
    ],
    expected: ["devices.json", "安全巡检"],
    requireTools: true,
    requireDevice: true,
  },
  r2: {
    prompt: "帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。",
    expected: ["connect.py", "AD1", "overview.py", "all"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-short": {
    prompt: "AD1 现在啥情况？",
    expected: ["connect.py", "AD1", "overview.py", "all"],
    commandExpected: ["connect.py", "overview.py", "all"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-vs": {
    prompt: "帮我查一下 AD1 的虚拟服务配置。",
    expected: ["connect.py", "AD1", "overview.py", "vs"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-vs-alt": {
    prompt: "看下 AD1 上有哪些 VS。",
    expected: ["connect.py", "AD1", "overview.py", "vs"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-vs-all": {
    prompt: "帮我查一下所有 AD 设备的虚拟服务配置。",
    expected: ["connect.py", "devices.json", "overview.py", "vs"],
    commandExpected: ["connect.py", "overview.py", "--devices"],
    commandForbidden: ["--device AD1", "--device AD2"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-vs-all-short": {
    prompt: "所有 AD 的虚拟服务配置看下。",
    expected: ["connect.py", "devices.json", "overview.py", "vs"],
    commandExpected: ["connect.py", "overview.py", "--devices"],
    commandForbidden: ["--device AD1", "--device AD2"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-node": {
    prompt: "帮我查一下 AD1 的节点配置。",
    expected: ["connect.py", "AD1", "overview.py", "pool"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-pool": {
    prompt: "帮我查一下 AD1 的节点池配置。",
    expected: ["connect.py", "AD1", "overview.py", "pool"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-pool-node": {
    prompt: "AD1 节点池和节点发我。",
    expected: ["connect.py", "AD1", "overview.py", "pool"],
    commandExpected: ["connect.py", "overview.py", "pool"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-cert": {
    prompt: "帮我查一下 AD1 的 SSL 证书到期时间。",
    expected: ["connect.py", "AD1", "overview.py", "cert"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-cert-alt": {
    prompt: "AD1 证书有没有快过期？",
    expected: ["connect.py", "AD1", "overview.py", "cert"],
    commandExpected: ["connect.py", "overview.py", "cert"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-traffic": {
    prompt: "帮我查一下 AD1 的流量情况。",
    expected: ["connect.py", "AD1", "overview.py", "traffic"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-status": {
    prompt: "帮我查一下 AD1 的设备状态。",
    expected: ["connect.py", "AD1", "overview.py", "hardware"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-resource-alt": {
    prompt: "AD1 设备资源状态查一下。",
    expected: ["connect.py", "AD1", "overview.py", "hardware"],
    commandExpected: ["connect.py", "overview.py", "hardware"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-ha": {
    prompt: "帮我查一下 AD1 的 HA 状态。",
    expected: ["connect.py", "AD1", "overview.py", "ha"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-hardware": {
    prompt: "帮我查一下 AD1 的硬件状态。",
    expected: ["connect.py", "AD1", "overview.py", "hardware"],
    requireTools: true,
    requireDevice: true,
  },
  r3: {
    prompt: "请对 AD1 做一次感知分析，重点看流量、资源、冲突和日志线索。",
    expected: ["connect.py", "AD1", "perception.py", "analyze"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-short": {
    prompt: "AD1 做个感知分析。",
    expected: ["connect.py", "AD1", "perception.py", "analyze"],
    commandExpected: ["connect.py", "perception.py", "analyze"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-abnormal": {
    prompt: "AD1 有没有异常？",
    expected: ["connect.py", "AD1", "perception.py", "analyze"],
    commandExpected: ["connect.py", "perception.py", "analyze"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-traffic": {
    prompt: "帮我分析一下 AD1 的流量异常。",
    expected: ["connect.py", "AD1", "perception.py", "traffic"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-state": {
    prompt: "帮我分析一下 AD1 的设备资源状态异常。",
    expected: ["connect.py", "AD1", "perception.py", "state"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-resource-short": {
    prompt: "AD1 CPU/内存/磁盘看下。",
    expected: ["connect.py", "AD1", "perception.py", "state"],
    commandExpected: ["connect.py", "perception.py", "state"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-conflict": {
    prompt: "帮我分析一下 AD1 有没有地址冲突。",
    expected: ["connect.py", "AD1", "perception.py", "conflict"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-conflict-port": {
    prompt: "AD1 有没有地址端口冲突？",
    expected: ["connect.py", "AD1", "perception.py", "conflict"],
    commandExpected: ["connect.py", "perception.py", "conflict"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-logs": {
    prompt: "帮我看一下 AD1 的服务日志线索。",
    expected: ["connect.py", "AD1", "perception.py", "logs"],
    requireTools: true,
    requireDevice: true,
  },
  "r4-script": {
    steps: [
      "帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
  },
  "r4-vs-pool-script": {
    steps: [
      "帮我建个 VS，挂已有 Pool。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
  },
  "r4-audit-script": {
    steps: [
      "这份 VS 配置会不会撞现网？",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "只审不下发。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
  },
  "r4-delivery": {
    steps: [
      "帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "真实下发。",
      "需要回滚。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "post_apply", "rollback-and-verify", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
    verifyAbsent: { vsName: "wb_vs_workbot_flow_01", poolName: "wb_pool_workbot_flow_01", nodeIp: "192.0.2.51" },
  },
  "r4-basic": {
    steps: [
      "帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    requireTools: true,
  },
  "r4-basic-delivery": {
    steps: [
      "帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "真实下发。",
      "需要回滚。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "post_apply", "rollback-and-verify", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
    verifyAbsent: { vsName: "wb_vs_workbot_flow_01", poolName: "wb_pool_workbot_flow_01", nodeIp: "192.0.2.51" },
  },
};

cases["r4-prerule"] = cases["r4-script"];
cases["r4-xff"] = cases["r4-script"];

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

async function waitForIdleText(page, beforeText, label, maxMs = 600000) {
  const start = Date.now();
  let last = beforeText;
  let lastChanged = Date.now();
  let stopHiddenSince = null;
  let lastLog = 0;
  while (Date.now() - start < maxMs) {
    await page.waitForTimeout(WAIT_POLL_MS);
    const current = await text(page);
    if (current !== last) {
      last = current;
      lastChanged = Date.now();
    }
    const stopVisible = await page.locator('button[utid="stop-btn"]').isVisible().catch(() => false);
    const sendVisible = await page.locator('button[utid="send-btn"]').isVisible().catch(() => false);
    const sendEnabled = sendVisible && await page.locator('button[utid="send-btn"]').isEnabled().catch(() => false);
    const elapsedMs = Date.now() - start;
    if (current !== beforeText && !stopVisible) {
      if (stopHiddenSince === null) stopHiddenSince = Date.now();
    } else {
      stopHiddenSince = null;
    }
    if (elapsedMs - lastLog > 30000) {
      log("wait", { label, elapsedMs, textLength: current.length, sendVisible, sendEnabled, stopVisible, idleAfterStopMs: IDLE_AFTER_STOP_MS });
      lastLog = elapsedMs;
    }
    if (current !== beforeText && !stopVisible && stopHiddenSince !== null && Date.now() - stopHiddenSince > IDLE_AFTER_STOP_MS) {
      log("wait-stable", { label, elapsedMs, textLength: current.length, sendVisible, sendEnabled, stopVisible });
      return current;
    }
    if (current !== beforeText && sendEnabled && !stopVisible && Date.now() - lastChanged > IDLE_AFTER_STOP_MS) return current;
  }
  log("wait-timeout", { label, maxMs });
  return text(page);
}

async function expandToolCalls(page) {
  const agent = await lastAgent(page);
  const root = agent || page;
  const openToggle = async (selector, blockSelector, contentSelector) => {
    const locator = root.locator(selector);
    const count = Math.min(await locator.count().catch(() => 0), 20);
    for (let i = 0; i < count; i += 1) {
      const toggle = locator.nth(i);
      const isClosed = await toggle.evaluate((node, args) => {
        const { blockSelector, contentSelector } = args;
        const block = node.closest(blockSelector);
        const content = block && block.querySelector(contentSelector);
        const style = content ? window.getComputedStyle(content) : null;
        const hidden = !content || style.display === "none" || style.visibility === "hidden";
        const arrowDown = Boolean(node.querySelector('[class*="arrow-down"], [class*="down"]'));
        return hidden || arrowDown;
      }, { blockSelector, contentSelector }).catch(() => true);
      if (isClosed) await toggle.click({ timeout: 1000 }).catch(() => {});
    }
  };
  await openToggle('[utid="thinking-toggle"]', ".agent-bubble__thinking-block", ".agent-bubble__thinking-content");
  await openToggle('[utid="tools-toggle"]', ".agent-bubble__tools-block", ".agent-bubble__tools-content");
  const fallbackSelectors = [
    'button:has-text("工具")',
    'button:has-text("调用")',
    '[role="button"]:has-text("工具")',
    '[role="button"]:has-text("调用")',
    '.ant-collapse-header',
  ];
  for (const selector of fallbackSelectors) {
    const locator = root.locator(selector);
    const count = Math.min(await locator.count().catch(() => 0), 10);
    for (let i = 0; i < count; i += 1) {
      await locator.nth(i).click({ timeout: 1000 }).catch(() => {});
    }
  }
  await page.waitForTimeout(300);
  const toolHeaders = root.locator('[utid="tool-call-toggle"], .tool-call-card__header, .tool-call-header');
  const count = Math.min(await toolHeaders.count().catch(() => 0), 60);
  for (let i = 0; i < count; i += 1) {
    const header = toolHeaders.nth(i);
    const isClosed = await header.evaluate((node) => {
      const card = node.closest(".tool-call-card") || node.parentElement;
      const hasRenderedDetail = Boolean(
        card && card.querySelector('pre, code, textarea, [class*="content" i], [class*="body" i], [class*="result" i]'),
      );
      const arrowDown = Boolean(node.querySelector('[class*="arrow-down"], [class*="down"]'));
      return !hasRenderedDetail || arrowDown;
    }).catch(() => true);
    if (isClosed) await header.click({ timeout: 1000 }).catch(() => {});
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

function extractToolCommands(responses) {
  const commands = [];
  const commandPattern = /"command"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const response of responses || []) {
    for (const candidate of (response.toolEvidence && response.toolEvidence.candidates) || []) {
      const text = candidate.text || "";
      for (const match of text.matchAll(commandPattern)) {
        try {
          commands.push(JSON.parse(`"${match[1]}"`));
        } catch {
          commands.push(match[1]);
        }
      }
    }
  }
  return Array.from(new Set(commands));
}

function commandExpectedFor(name, cfg) {
  if (cfg.commandExpected) return cfg.commandExpected;
  if (name.startsWith("r1")) return ["connect.py", "check.py", "history", "run", "progress", "wait"];
  if (name.startsWith("r2")) return ["connect.py", "overview.py"];
  if (name.startsWith("r3")) return ["connect.py", "perception.py"];
  return [];
}

function templateExpectedFor(name, cfg) {
  if (cfg.templateExpected) return cfg.templateExpected;
  if (name.startsWith("r1")) return ["巡检结论", "巡检过程", "分类统计", "重点异常", "原始报告"];
  if (name.startsWith("r2")) return ["查询结论", "查询范围", "查询结果", "覆盖说明"];
  if (name.startsWith("r3")) return ["感知结论", "分析结果", "结论边界"];
  if (name.startsWith("r4")) return ["配置结论", "执行摘要", "生成产物", "安全确认", "下一步"];
  return [];
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
  const visibleDelta = after.startsWith(before) ? after.slice(before.length) : after;
  const visibleAgentText = await lastAgentText(page);
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
    visibleDeltaLength: visibleDelta.length,
    visibleAgentLength: visibleAgentText.length,
    agentLength: agentText.length,
    toolEvidence: toolEvidence.hasEvidence,
    toolCandidateCount: toolEvidence.candidates.length,
    artifacts,
  });
  return {
    name,
    prompt,
    text: delta.slice(-12000),
    agentText: agentText.slice(-12000),
    visibleText: visibleDelta.slice(-12000),
    visibleAgentText: visibleAgentText.slice(-12000),
    toolEvidence,
    artifacts,
  };
}

async function uploadFile(page, filePath, name = "upload") {
  log("upload-start", { name, file: filePath });
  const input = page.locator('input[type="file"].hidden-input');
  if (!(await input.count())) throw new Error("upload file input not found");
  await input.setInputFiles(filePath);
  await page.waitForTimeout(2000);
  const artifacts = await savePageArtifacts(page, name);
  log("upload-done", { name, artifacts });
  return { name, upload: filePath, text: "", agentText: "", visibleText: "", visibleAgentText: "", toolEvidence: { hasEvidence: false, candidates: [] }, artifacts };
}

async function uploadZip(page) {
  return uploadFile(page, ZIP_PATH, "skill-zip");
}

function verify(run) {
  const cfg = cases[run.name] || {};
  const tokens = cfg.expected || [];
  const toolCommands = extractToolCommands(run.responses);
  const toolCommandText = toolCommands.join("\n");
  const toolCandidateText = (run.responses || [])
    .flatMap((item) => (item.toolEvidence && item.toolEvidence.candidates) || [])
    .map((item) => item.text || "")
    .join("\n");
  const visibleText = `${run.visibleText || ""}\n${run.visibleAgentText || ""}`;
  const expandedText = `${run.text || ""}\n${run.agentText || ""}`;
  const searchable = `${visibleText}\n${expandedText}\n${toolCommandText}\n${toolCandidateText}`;
  const found = tokens.filter((token) => searchable.includes(token));
  const missing = tokens.filter((token) => !searchable.includes(token));
  const templateExpected = templateExpectedFor(run.name, cfg);
  const templateFound = templateExpected.filter((token) => visibleText.includes(token));
  const templateMissing = templateExpected.filter((token) => !visibleText.includes(token));
  const commandExpected = commandExpectedFor(run.name, cfg);
  const commandFound = commandExpected.filter((token) => toolCommandText.includes(token));
  const commandMissing = commandExpected.filter((token) => !toolCommandText.includes(token));
  const commandForbidden = cfg.commandForbidden || [];
  const commandForbiddenFound = commandForbidden.filter((token) => toolCommandText.includes(token));
  const visibleForbidden = cfg.visibleForbidden || (/^r[1-4]/.test(run.name) ? [
    "工具调用",
    "退出码",
    "stdout",
    "stderr",
    "connect.py",
    "check.py",
    "overview.py",
    "perception.py",
    "init_env.py",
    "ad_ops_flow.py",
    "render_slb_bundle.py",
    "plan-and-render",
    "summarize-plan",
    "preflight-slb-plan",
    "apply-slb-plan",
    "rollback-and-verify",
  ] : []);
  const visibleForbiddenFound = visibleForbidden.filter((token) => visibleText.includes(token));
  const forbidden = cfg.forbidExecute && /(^|\s)--execute(\s|$)/.test(searchable);
  const toolEvidenceOk = !cfg.requireTools || run.responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence);
  const deviceEvidenceOk = !cfg.requireDevice || hasDeviceEvidence(searchable);
  const localVerificationOk = !run.localVerification || run.localVerification.status !== "fail";
  const cleanToolTriggerOk = !cfg.requireTools || !run.toolFollowupUsed;
  const cleanCommandTriggerOk = !cfg.requireTools || !run.commandFollowupUsed;
  return {
    ...run,
    expected: tokens,
    found,
    missing,
    templateExpected,
    templateFound,
    templateMissing,
    commandExpected,
    commandFound,
    commandMissing,
    commandForbidden,
    commandForbiddenFound,
    visibleForbidden,
    visibleForbiddenFound,
    toolCommands,
    toolEvidenceOk,
    cleanToolTriggerOk,
    cleanCommandTriggerOk,
    deviceEvidenceOk,
    localVerificationOk,
    toolFollowupUsed: Boolean(run.toolFollowupUsed),
    commandFollowupUsed: Boolean(run.commandFollowupUsed),
    deviceFollowupUsed: Boolean(run.deviceFollowupUsed),
    ok: missing.length === 0 && templateMissing.length === 0 && commandMissing.length === 0 && commandForbiddenFound.length === 0 && visibleForbiddenFound.length === 0 && !forbidden && toolEvidenceOk && cleanToolTriggerOk && cleanCommandTriggerOk && deviceEvidenceOk && localVerificationOk,
    forbidden_execute: forbidden,
  };
}

async function runCase(page, name) {
  const cfg = cases[name];
  if (!cfg) throw new Error(`unknown case: ${name}`);
  const responses = [];
  let toolFollowupUsed = false;
  let commandFollowupUsed = false;
  let deviceFollowupUsed = false;
  const prompts = cfg.steps || [cfg.prompt];
  for (let index = 0; index < prompts.length; index += 1) {
    const step = prompts[index];
    const label = prompts.length > 1 ? `${name}-step${index + 1}` : name;
    if (typeof step === "string") {
      responses.push(await sendPrompt(page, label, step));
    } else if (step && step.upload) {
      responses.push(await uploadFile(page, step.upload, step.name || label));
    } else {
      throw new Error(`unsupported step for ${name}: ${JSON.stringify(step)}`);
    }
  }
  let combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");

  if (!cfg.steps && cfg.params && asksForParameters(combinedText)) {
    responses.push(await sendPrompt(page, `${name}-params`, cfg.params));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  if (cfg.requireTools && !responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence)) {
    toolFollowupUsed = true;
    responses.push(await sendPrompt(page, `${name}-tool-followup`, NO_TOOL_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  const commandExpected = commandExpectedFor(name, cfg);
  if (cfg.requireTools && commandExpected.length) {
    const commandText = extractToolCommands(responses).join("\n");
    const commandMissing = commandExpected.filter((token) => !commandText.includes(token));
    if (commandMissing.length) {
      commandFollowupUsed = true;
      responses.push(await sendPrompt(page, `${name}-command-followup`, COMMAND_FOLLOWUP.replace("{missing}", commandMissing.join(", "))));
      combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
    }
  }

  if (cfg.requireDevice && !hasDeviceEvidence(combinedText)) {
    deviceFollowupUsed = true;
    responses.push(await sendPrompt(page, `${name}-device-followup`, DEVICE_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }
  const localVerification = VERIFY_AD && (cfg.requireDevice || cfg.verifyPresent || cfg.verifyAbsent) ? runLocalAdVerification(name, cfg) : { status: "disabled" };

  return verify({
    name,
    prompt: prompts.map((item) => (typeof item === "string" ? item : `[upload] ${item.upload}`)).join("\n\n"),
    text: responses.map((item) => item.text).join("\n\n").slice(-20000),
    agentText: responses.map((item) => item.agentText).join("\n\n").slice(-20000),
    visibleText: responses.map((item) => item.visibleText ?? item.text).join("\n\n").slice(-20000),
    visibleAgentText: responses.map((item) => item.visibleAgentText ?? item.agentText).join("\n\n").slice(-20000),
    responses,
    localVerification,
    toolFollowupUsed,
    commandFollowupUsed,
    deviceFollowupUsed,
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
    log("main-start", { caseSuite: CASE_SUITE, cases: CASES, zip: ZIP_PATH, outDir: OUT_DIR });
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
      caseSuite: CASE_SUITE,
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
