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
const WORKBOT_USER = argValue("--user", process.env.WORKBOT_USER);
const WORKBOT_PASSWORD = argValue("--password", process.env.WORKBOT_PASSWORD);
const ZIP_PATH = path.resolve(argValue("--zip", process.env.AD_SKILLS_ZIP || "dist/ad-skills-workbot.zip"));
const R4_YAML_PATH = path.resolve(argValue("--r4-yaml", process.env.WORKBOT_R4_YAML || "test/fixtures/workbot/r4-slb-full.yml"));
const OUT_DIR = path.resolve(argValue("--out-dir", "workbot-results"));
const HEADLESS = hasFlag("--headless") || process.env.WORKBOT_HEADLESS === "1";
const VERIFY_AD = hasFlag("--verify-ad") || process.env.WORKBOT_VERIFY_AD === "1";
const PYTHON = argValue("--python", process.env.PYTHON || "python");
const AD_VERIFY_BASE_URL = argValue("--ad-base-url", process.env.AD_VERIFY_BASE_URL || process.env.AD1_PUBLIC_URL || "https://14.18.243.211:21044");
const AD_VERIFY_USERNAME = argValue("--ad-user", process.env.AD_VERIFY_USERNAME || process.env.AD1_USER || "admin");
const AD_VERIFY_PASSWORD = argValue("--ad-password", process.env.AD_VERIFY_PASSWORD || process.env.AD1_PASS || process.env.AD_PASS || process.env.AD_PASSWORD || devicePasswordForName("AD1"));
const WORKBOT_FORBIDDEN_DEVICE_HOSTS = (argValue(
  "--forbidden-workbot-device-hosts",
  process.env.WORKBOT_FORBIDDEN_DEVICE_HOSTS || "14.18.243.211:21044,14.18.243.211:21039",
) || "")
  .split(/[,\s]+/)
  .map((item) => item.trim())
  .filter(Boolean);
const IDLE_AFTER_STOP_MS = Number(argValue("--idle-after-stop-ms", process.env.WORKBOT_IDLE_AFTER_STOP_MS || "2000"));
const WAIT_POLL_MS = Number(argValue("--wait-poll-ms", process.env.WORKBOT_WAIT_POLL_MS || "1000"));
const PROMPT_TRANSIENT_RETRIES = Number(argValue("--prompt-transient-retries", process.env.WORKBOT_PROMPT_TRANSIENT_RETRIES || "2"));
const FRESH_AGENT = hasFlag("--fresh-agent") || process.env.WORKBOT_FRESH_AGENT === "1";
const FRESH_AGENT_PREFIX = argValue("--fresh-agent-prefix", process.env.WORKBOT_FRESH_AGENT_PREFIX || "AD验收临时");
const MAX_DIGITAL_EMPLOYEES = Number(argValue("--max-digital-employees", process.env.WORKBOT_MAX_DIGITAL_EMPLOYEES || "5"));
const WORKBOT_API_BASE = argValue("--api-base", process.env.WORKBOT_API_BASE || "/workbot/api/v1");
const CHROME_PATH = argValue(
  "--chrome",
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe",
);
let ACTIVE_AGENT_NAME = "";
const FIXED_CASES = [
  "install",
  "r1",
  "r1-full",
  "r1-security",
  "r1-all",
  "r1-all-full",
  "r1-all-security",
  "r2",
  "r2-config",
  "r2-config-all",
  "r2-vs",
  "r2-vs-all",
  "r2-node",
  "r2-pool",
  "r2-pool-all",
  "r2-cert",
  "r2-cert-all",
  "r2-traffic",
  "r2-traffic-all",
  "r2-status",
  "r2-status-all",
  "r2-hardware",
  "r2-hardware-all",
  "r3-traffic-vs",
  "r3-logs",
  "r3-logs-5d",
  "r4-script",
  "r4-vs-pool-node-script",
  "r4-pool-profile-script",
  "r4-pool-prerule-script",
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
  "r3-traffic",
  "r3-conflict",
  "r3-conflict-port",
  "r4-vs-pool-script",
  "r4-audit-script",
].join(",");
const R4_CASES = [
  "install",
  "r4-script",
  "r4-vs-pool-node-script",
  "r4-pool-profile-script",
  "r4-pool-prerule-script",
  "r4-delivery",
].join(",");
const R2R4_CASES = [
  "install",
  "r2r4-interaction",
].join(",");
const CASE_SUITES = {
  fixed: FIXED_CASES,
  extended: EXTENDED_CASES,
  r4: R4_CASES,
  r2r4: R2R4_CASES,
  all: Array.from(new Set(`${FIXED_CASES},${EXTENDED_CASES},${R4_CASES},${R2R4_CASES}`.split(","))).join(","),
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

if (!WORKBOT_USER) {
  throw new Error("WORKBOT_USER is required. Do not store it in the repository.");
}
if (!WORKBOT_PASSWORD) {
  throw new Error("WORKBOT_PASSWORD is required. Do not store it in the repository.");
}
if (!fs.existsSync(ZIP_PATH)) {
  throw new Error(`zip not found: ${ZIP_PATH}`);
}
if (CASES.some((name) => name.startsWith("r4-")) && !fs.existsSync(R4_YAML_PATH)) {
  throw new Error(`R4 YAML fixture not found: ${R4_YAML_PATH}`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function devicePasswordForName(name) {
  try {
    const data = JSON.parse(fs.readFileSync(path.resolve("devices.json"), "utf8"));
    const device = (data.devices || []).find((item) => item && item.name === name);
    return device && typeof device.password === "string" ? device.password : "";
  } catch {
    return "";
  }
}

function devicePasswordsFromFile() {
  const values = [];
  for (const file of [path.resolve("devices.json")]) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const device of data.devices || []) {
        if (device && typeof device.password === "string") values.push(device.password);
      }
    } catch {
      // Best-effort redaction; packaging validation handles malformed device files.
    }
  }
  return values;
}

const SENSITIVE_VALUES = Array.from(new Set([
  WORKBOT_PASSWORD,
  AD_VERIFY_PASSWORD,
  process.env.AD1_PASS,
  process.env.AD2_PASS,
  process.env.AD_PASS,
  process.env.AD_PASSWORD,
  process.env.WORKBOT_PASSWORD,
  ...devicePasswordsFromFile(),
].filter((item) => item && String(item).length >= 4).map(String)));

function redactSensitive(value) {
  let text = String(value ?? "");
  for (const secret of SENSITIVE_VALUES) {
    text = text.replace(new RegExp(escapeRegExp(secret), "g"), "[REDACTED_SECRET]");
  }
  text = text.replace(
    /["']?\b(?:password|passwd|pwd|authorization|cookie|secret|api[_-]?token|access[_-]?token|auth[_-]?token)\b["']?\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,}<]+)/gi,
    "[REDACTED_CREDENTIAL_FIELD]",
  );
  text = text.replace(
    /(--(?:password|passwd|pwd|token)\b(?:=|\s+))(?:"[^"]*"|'[^']*'|[^\s"']+)/gi,
    "[REDACTED_CREDENTIAL_ARG]",
  );
  return text;
}

function redactToolEvidence(toolEvidence) {
  if (!toolEvidence) return toolEvidence;
  return {
    ...toolEvidence,
    candidates: (toolEvidence.candidates || []).map((candidate) => ({
      ...candidate,
      text: redactSensitive(candidate.text || ""),
    })),
  };
}

function isTransientProviderError(value) {
  const text = String(value || "");
  return [
    /Provider error/i,
    /Internal Server Error/i,
    /network error/i,
    /HTTP\s*(?:status\s*)?5\d\d/i,
    /(?:status|code|error code|response code|status code|状态码|错误码)[：:\s=]*5\d\d/i,
    /\u7f51\u7edc\u9519\u8bef/i,
    /\u9519\u8befid/i,
  ].some((pattern) => pattern.test(text));
}

function parseRateLimitProviderError(value) {
  const text = String(value || "");
  if (!/(?:Provider error:\s*)?429 Too Many Requests|Too Many Requests|\u4f7f\u7528\u4e0a\u9650|\u9650\u989d/.test(text)) return null;
  const resetMatch = text.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s*\u91cd\u7f6e/);
  return {
    resetAt: resetMatch ? resetMatch[1] : "",
  };
}

class WorkBotRateLimitError extends Error {
  constructor(rateLimit, response) {
    super(`WorkBot rate limit reached${rateLimit.resetAt ? `; resetAt=${rateLimit.resetAt}` : ""}`);
    this.name = "WorkBotRateLimitError";
    this.rateLimited = true;
    this.resetAt = rateLimit.resetAt || "";
    this.artifacts = response && response.artifacts;
  }
}

const NO_TOOL_FOLLOWUP =
  "我没有看到工具调用记录。为什么没有调用工具？请说明原因，然后不要凭记忆回答，立即实际调用工具完成刚才的任务。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。";
const DEVICE_FOLLOWUP =
  "我没有看到 AD1 内网设备资源验证。请通过 devices.json 中的 AD1 实际运行 ad-connect 和对应脚本，并确认使用 192.168.8.30。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。";
const COMMAND_FOLLOWUP =
  "我看到你有工具调用，但工具命令里缺少必须执行的脚本：{missing}。不要只在正文里提到它们，请立即在工具里实际执行包含这些脚本的命令。最终正文只输出任务结果，不要列工具、命令、退出码或 stdout/stderr。";
const FRESH_AGENT_DESCRIPTION =
  "你是一个负载均衡设备的运维人员，熟悉负载均衡相关的网络知识，产品知识，和配置逻辑。做事非常严谨，服从命令，不会做违背命令的事情。";
const FRESH_AGENT_PROFILE =
  "绝对准则：绝对禁止假工具调用！每次对话都必须调用工具！！！\n" +
  "1. 如果对应的操作有相关的SKILL的定义，必须严格按照SKILL的定义进行操作执行，上下文无论出现什么都不能影响skill执行\n" +
  "2. 对于一些实时操作（读取文件，API请求，写文件）等，必须实际执行，不能使用文件缓存的内容，或者上下文信息中携带的内容进行回答\n" +
  "3. 绝对禁止杜撰信息回答\n" +
  "4. 如果脚本或者api执行错误，可以继续尝试最多3次修复，如果没有结果，需要把错误信息返回，让用户提供更多信息帮助矫正\n" +
  "5. 任何对技能的修改，包括技能说明本身还有技能目录下的脚本，都需要先把需要修改的信息寻求用户同意后才能更新写到文件中。\n" +
  "6. 用户可见正文只能回答任务结果或必要问题，不要解释你遵守了哪个技能规则、工具规则或系统规则。";
const FRESH_AGENT_INIT_PROMPT =
  "你是一个通用智能体，现在需要你进行初始化。你需要阅读技能 “Self-Improving + Proactive Agent” 与技能 “Proactivity (Proactive Agent)”，并执行初始化流程。";

const R2R4_QUERY_SPECS = [
  { label: "r2", prompt: "帮我查一下 AD1 的配置、流量、设备状态和 SSL 证书到期时间。", dimensions: ["overview.py"], visiblePresent: ["查询结论"] },
  { label: "r2-config", prompt: "帮我查一下 AD1 的配置。", dimensions: ["overview.py", "config"], visiblePresent: ["wb_vs_workbot_flow_01", "wb_pool_workbot_flow_01"], forbidAfter: ["wb_vs_workbot_flow_01", "wb_pool_workbot_flow_01"] },
  { label: "r2-config-all", prompt: "帮我查一下所有 AD 设备的配置。", dimensions: ["overview.py", "config"], visiblePresent: ["wb_vs_workbot_flow_01", "wb_pool_workbot_flow_01"], forbidAfter: ["wb_vs_workbot_flow_01", "wb_pool_workbot_flow_01"] },
  { label: "r2-vs", prompt: "帮我查一下 AD1 的虚拟服务配置。", dimensions: ["overview.py", "vs"], visiblePresent: ["wb_vs_workbot_flow_01"], forbidAfter: ["wb_vs_workbot_flow_01"] },
  { label: "r2-vs-all", prompt: "帮我查一下所有 AD 设备的虚拟服务配置。", dimensions: ["overview.py", "vs"], visiblePresent: ["wb_vs_workbot_flow_01"], forbidAfter: ["wb_vs_workbot_flow_01"] },
  { label: "r2-node", prompt: "帮我查一下 AD1 的节点配置。", dimensions: ["overview.py", "node"], visiblePresent: ["查询结论"] },
  { label: "r2-pool", prompt: "帮我查一下 AD1 的节点池配置。", dimensions: ["overview.py", "pool"], visiblePresent: ["wb_pool_workbot_flow_01"], forbidAfter: ["wb_pool_workbot_flow_01"] },
  { label: "r2-pool-all", prompt: "帮我查一下所有 AD 设备的节点池配置。", dimensions: ["overview.py", "pool"], visiblePresent: ["wb_pool_workbot_flow_01"], forbidAfter: ["wb_pool_workbot_flow_01"] },
  { label: "r2-cert", prompt: "帮我查一下 AD1 的 SSL 证书到期时间。", dimensions: ["overview.py", "cert"], visiblePresent: ["查询结论"] },
  { label: "r2-cert-all", prompt: "帮我查一下所有 AD 设备的 SSL 证书到期时间。", dimensions: ["overview.py", "cert"], visiblePresent: ["查询结论"] },
  { label: "r2-traffic", prompt: "帮我查一下 AD1 的流量情况。", dimensions: ["overview.py", "traffic"], visiblePresent: ["查询结论"] },
  { label: "r2-traffic-all", prompt: "帮我查一下所有 AD 设备的流量情况。", dimensions: ["overview.py", "traffic"], visiblePresent: ["查询结论"] },
  { label: "r2-status", prompt: "帮我查一下 AD1 的设备状态。", dimensions: ["overview.py", "hardware"], visiblePresent: ["查询结论"] },
  { label: "r2-status-all", prompt: "帮我查一下所有 AD 设备的设备状态。", dimensions: ["overview.py", "hardware"], visiblePresent: ["查询结论"] },
  { label: "r2-hardware", prompt: "帮我查一下 AD1 的硬件状态。", dimensions: ["overview.py", "hardware"], visiblePresent: ["查询结论"] },
  { label: "r2-hardware-all", prompt: "帮我查一下所有 AD 设备的硬件状态。", dimensions: ["overview.py", "hardware"], visiblePresent: ["查询结论"] },
];

const cases = {
  cleanup: {
    prompt: "清理旧 AD skills 和记忆。必须先出现真实工具调用：shell 查删 skills/ad-*，cron_list 查任务，memory_export/memory_purge 清记忆，再用 shell 和 memory_export 验证；最终正文只回答清理完成，不要列工具、命令、退出码或 stdout/stderr。",
    expected: ["skill", "记忆"],
    requireTools: true,
  },
  install: {
    prompt: "请安装我刚上传的 AD skills 包，并确认 5 个 skill 都可用。",
    expected: ["ad-check-analysis", "ad-config-ops", "ad-connect", "ad-ops", "ad-perception", "SKILL.md"],
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
    requireToolsEachStep: true,
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
    requireToolsEachStep: true,
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
    requireToolsEachStep: true,
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
    requireToolsEachStep: true,
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
    requireToolsEachStep: true,
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
    requireToolsEachStep: true,
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
    expected: ["connect.py", "AD1", "overview.py", "config"],
    commandExpected: ["connect.py", "overview.py", "config"],
    visibleForbidden: ["设备状态", "硬件状态", "流量状态", "当前连接数", "新建速率", "吞吐量", "CPU 使用率", "内存使用率"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-config": {
    prompt: "帮我查一下 AD1 的配置。",
    expected: ["connect.py", "AD1", "overview.py", "config"],
    commandExpected: ["connect.py", "overview.py", "config"],
    visibleForbidden: ["设备状态", "硬件状态", "流量状态", "当前连接数", "新建速率", "吞吐量", "CPU 使用率", "内存使用率"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-config-all": {
    prompt: "帮我查一下所有 AD 设备的配置。",
    expected: ["connect.py", "devices.json", "overview.py", "config"],
    commandExpected: ["connect.py", "overview.py", "--devices", "config"],
    commandForbidden: ["--device AD1", "--device AD2"],
    visibleForbidden: ["设备状态", "硬件状态", "流量状态", "当前连接数", "新建速率", "吞吐量", "CPU 使用率", "内存使用率"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-vs": {
    prompt: "帮我查一下 AD1 的虚拟服务配置。",
    expected: ["connect.py", "AD1", "overview.py", "vs"],
    visibleForbidden: ["流量状态", "当前连接数", "新建速率", "吞吐量", "Connections", "Rate"],
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
    visibleForbidden: ["流量状态", "当前连接数", "新建速率", "吞吐量", "Connections", "Rate"],
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
    expected: ["connect.py", "AD1", "overview.py", "node"],
    commandExpected: ["connect.py", "overview.py", "node"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-pool": {
    prompt: "帮我查一下 AD1 的节点池配置。",
    expected: ["connect.py", "AD1", "overview.py", "pool"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-pool-all": {
    prompt: "帮我查一下所有 AD 设备的节点池配置。",
    expected: ["connect.py", "devices.json", "overview.py", "pool"],
    commandExpected: ["connect.py", "overview.py", "--devices", "pool"],
    commandForbidden: ["--device AD1", "--device AD2"],
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
  "r2-cert-all": {
    prompt: "帮我查一下所有 AD 设备的 SSL 证书到期时间。",
    expected: ["connect.py", "devices.json", "overview.py", "cert"],
    commandExpected: ["connect.py", "overview.py", "--devices", "cert"],
    commandForbidden: ["--device AD1", "--device AD2"],
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
  "r2-traffic-all": {
    prompt: "帮我查一下所有 AD 设备的流量情况。",
    expected: ["connect.py", "devices.json", "overview.py", "traffic"],
    commandExpected: ["connect.py", "overview.py", "--devices", "traffic"],
    commandForbidden: ["--device AD1", "--device AD2"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-status": {
    prompt: "帮我查一下 AD1 的设备状态。",
    expected: ["connect.py", "AD1", "overview.py", "hardware"],
    requireTools: true,
    requireDevice: true,
  },
  "r2-status-all": {
    prompt: "帮我查一下所有 AD 设备的设备状态。",
    expected: ["connect.py", "devices.json", "overview.py", "hardware"],
    commandExpected: ["connect.py", "overview.py", "--devices", "hardware"],
    commandForbidden: ["--device AD1", "--device AD2"],
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
  "r2-hardware-all": {
    prompt: "帮我查一下所有 AD 设备的硬件状态。",
    expected: ["connect.py", "devices.json", "overview.py", "hardware"],
    commandExpected: ["connect.py", "overview.py", "--devices", "hardware"],
    commandForbidden: ["--device AD1", "--device AD2"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-traffic": {
    prompt: "对 AD1 设备的流量趋势进行分析。",
    expected: ["connect.py", "AD1", "perception.py", "traffic"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-traffic-vs": {
    prompt: "对 AD2 设备的 test 虚拟服务进行流量趋势分析。",
    expected: ["connect.py", "AD2", "collector.py", "collect", "perception.py", "traffic", "test"],
    commandExpected: ["connect.py", "collector.py", "collect", "--collect-only", "perception.py", "traffic", "--vs", "test", "--require-db"],
    visibleForbidden: ["| 风险 |", "ℹ️ 轻微", "⚠️ 明显", "❌ 严重", "大幅偏离", "连接数约为基线", "三项核心指标", "显著下降", "降至 0", "当前值为 0", "小结", "↓", "general_throughput"],
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
    prompt: "对 AD1 设备的日志进行分析。",
    expected: ["connect.py", "AD1", "perception.py", "logs", "ALERT", "ERROR", "ALARM"],
    commandExpected: ["connect.py", "perception.py", "logs", "--limit", "20", "--levels", "ALERT,ERROR", "--modules", "ALARM"],
    requireTools: true,
    requireDevice: true,
  },
  "r3-logs-5d": {
    prompt: "对 AD1 设备近 5 天的日志进行分析。",
    expected: ["connect.py", "AD1", "perception.py", "logs", "5", "ALERT", "ERROR", "ALARM"],
    commandExpected: ["connect.py", "perception.py", "logs", "--days", "5", "--limit", "20", "--levels", "ALERT,ERROR", "--modules", "ALARM"],
    requireTools: true,
    requireDevice: true,
  },
  "r4-script": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["AD1", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
  },
  "r4-pool-profile-script": {
    steps: [
      "在 AD1 上帮我创建一个 HTTP 虚拟服务，引用节点池和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "不需要下发。",
    ],
    expected: ["AD1", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
  },
  "r4-vs-pool-node-script": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，创建节点池并添加节点。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["AD1", "节点池", "节点", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    visibleForbidden: ["操作计划", "计划摘要", "执行摘要", "安全确认", "adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"],
    requireTools: true,
  },
  "r4-pool-prerule-script": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池和前置策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "先不下发。",
    ],
    expected: ["AD1", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    visibleForbidden: ["操作计划", "计划摘要", "执行摘要", "安全确认", "adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"],
    requireTools: true,
  },
  "r4-vs-pool-script": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，挂节点池。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["AD1", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify"],
    visibleForbidden: ["操作计划", "计划摘要", "执行摘要", "安全确认", "adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"],
    requireTools: true,
  },
  "r4-audit-script": {
    steps: [
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "在 AD1 上检查这份 VS 配置会不会撞现网。",
    ],
    expected: ["AD1", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan"],
    commandForbidden: ["apply-slb-plan", "rollback-and-verify", "verify_slb_resource.py"],
    visibleForbidden: ["操作计划", "计划摘要", "执行摘要", "安全确认", "adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"],
    requireTools: true,
  },
  "r4-delivery": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "真实下发。",
      { adVerify: "present", name: "r4-ad-present" },
      "是。",
    ],
    expected: ["AD1", "init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "post_apply", "rollback-and-verify", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "rollback-and-verify"],
    visibleForbidden: ["操作计划", "计划摘要", "执行摘要", "安全确认", "adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"],
    requireTools: true,
    verifyAbsent: {
      vsName: "wb_vs_workbot_flow_01",
      poolName: "wb_pool_workbot_flow_01",
      nodeIp: "192.0.2.51",
      httpProfile: "wb_http_profile_workbot_01",
      preRule: "wb_pre_rule_workbot_01",
    },
  },
  "r4-basic": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "直接给出脚本。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply.py", "rollback_apply.py"],
    requireTools: true,
  },
  "r4-basic-delivery": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "真实下发。",
      { adVerify: "present", name: "r4-ad-present" },
      "需要回滚。",
    ],
    expected: ["init_env.py", "adops-bundle.yml", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "post_apply", "rollback-and-verify", "rollback_apply.py"],
    commandExpected: ["init_env.py", "ad_ops_flow.py", "plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "rollback-and-verify"],
    requireTools: true,
    verifyAbsent: {
      vsName: "wb_vs_workbot_flow_01",
      poolName: "wb_pool_workbot_flow_01",
      nodeIp: "192.0.2.51",
      httpProfile: "wb_http_profile_workbot_01",
      preRule: "wb_pre_rule_workbot_01",
    },
  },
  "r2r4-interaction": {
    steps: [
      "在 AD1 上帮我创建虚拟服务，引用节点池、前置策略和 http 优化策略。",
      { upload: R4_YAML_PATH, name: "r4-yaml" },
      "我写完了 YAML。",
      "真实下发。",
      { adVerify: "present", name: "r2r4-ad-present" },
      ...R2R4_QUERY_SPECS.map((item) => item.prompt),
      "是。",
      { adVerify: "absent", name: "r2r4-ad-absent" },
      ...R2R4_QUERY_SPECS.map((item) => item.prompt),
    ],
    expected: ["apply-slb-plan", "rollback-and-verify", "overview.py", "wb_vs_workbot_flow_01", "wb_pool_workbot_flow_01"],
    commandExpected: ["ad_ops_flow.py", "apply-slb-plan", "overview.py", "rollback-and-verify"],
    visibleForbidden: ["工具调用", "退出码", "stdout", "stderr"],
    requireTools: true,
    verifyAbsent: {
      vsName: "wb_vs_workbot_flow_01",
      poolName: "wb_pool_workbot_flow_01",
      nodeIp: "192.0.2.51",
      httpProfile: "wb_http_profile_workbot_01",
      preRule: "wb_pre_rule_workbot_01",
    },
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

async function lastAgentAnswerText(page) {
  const agent = await lastAgent(page);
  if (!agent) return "";
  const body = agent.locator(".agent-bubble__content-body.markdown-body").last();
  if (await body.count().catch(() => 0)) {
    return body.innerText({ timeout: 5000 }).catch(() => "");
  }
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
  artifacts.lastAgentAnswerText = `${base}.answer.txt`;
  artifacts.lastAgentHtml = `${base}.agent.html`;
  await fs.promises.writeFile(artifacts.text, redactSensitive(await text(page)), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.html, redactSensitive(await page.content()), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.lastAgentText, redactSensitive(await lastAgentText(page)), "utf8").catch(() => {});
  await fs.promises.writeFile(artifacts.lastAgentAnswerText, redactSensitive(await lastAgentAnswerText(page)), "utf8").catch(() => {});
  const agent = await lastAgent(page);
  if (agent) await fs.promises.writeFile(artifacts.lastAgentHtml, redactSensitive(await agent.evaluate((node) => node.outerHTML)), "utf8").catch(() => {});
  await page.screenshot({ path: artifacts.screenshot, fullPage: true }).catch(() => {});
  return artifacts;
}

async function waitForConversation(page) {
  await page.locator("textarea.chat-input__textarea").waitFor({ state: "visible", timeout: 30000 });
}

async function activeAgentName(page) {
  return page.locator('li.user-item--active .user-item__name').innerText({ timeout: 1000 }).catch(() => "");
}

async function ensureActiveAgent(page, reason = "ensure-active-agent") {
  if (!ACTIVE_AGENT_NAME) return false;
  const active = await activeAgentName(page);
  if (active.includes(ACTIVE_AGENT_NAME)) return false;
  log("fresh-agent-reselect", { reason, expected: ACTIVE_AGENT_NAME, active });
  await selectAgentByName(page, ACTIVE_AGENT_NAME);
  return true;
}

async function ensureConversation(page, reason = "ensure-conversation") {
  if (await page.locator("textarea.chat-input__textarea").count().catch(() => 0)) {
    await ensureActiveAgent(page, reason);
    return;
  }
  const conversationUrl = new URL("/workbot/#/conversation", WORKBOT_URL).toString();
  log("conversation-restore", { reason, currentUrl: page.url() });
  await page.goto(conversationUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForConversation(page);
  await page.waitForTimeout(1000);
  await ensureActiveAgent(page, reason);
}

async function waitForLoginOrConversation(page, timeoutMs = 45000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await page.locator("textarea.chat-input__textarea").count()) return "conversation";
    const userInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    if ((await userInput.count()) && (await passwordInput.count())) return "login";
    await page.waitForTimeout(500);
  }
  return "timeout";
}

async function loginIfNeeded(page) {
  await page.goto(WORKBOT_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  let state = await waitForLoginOrConversation(page);
  if (state === "timeout") {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    state = await waitForLoginOrConversation(page, 30000);
  }
  if (await page.locator("textarea.chat-input__textarea").count()) return;

  const userInput = page.locator('input[name="username"], input[type="text"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  if (!(await userInput.count()) || !(await passwordInput.count())) throw new Error("login form not found");
  await userInput.fill(WORKBOT_USER);
  await passwordInput.fill(WORKBOT_PASSWORD);
  const agreement = page.locator('input[type="checkbox"]').first();
  if ((await agreement.count()) && !(await agreement.isChecked().catch(() => false))) {
    await agreement.click({ force: true });
  }
  const loginButton = page.locator("button").filter({ hasText: /登录|Login|Sign in/i });
  if (await loginButton.count()) await loginButton.first().click();
  else await passwordInput.press("Enter");
  await waitForConversation(page);
}

function apiEndpoint(endpoint) {
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  if (endpoint.startsWith("/api/v1/")) {
    return `${WORKBOT_API_BASE.replace(/\/$/, "")}${endpoint.slice("/api/v1".length)}`;
  }
  if (endpoint.startsWith("/")) return `${WORKBOT_API_BASE.replace(/\/$/, "")}${endpoint}`;
  return `${WORKBOT_API_BASE.replace(/\/$/, "")}/${endpoint}`;
}

async function apiJson(page, endpoint, options = {}) {
  const resolvedEndpoint = apiEndpoint(endpoint);
  const result = await page.evaluate(async ({ endpoint, options }) => {
    const request = { credentials: "include", ...options };
    request.headers = { ...(options.headers || {}) };
    if (request.body !== undefined && typeof request.body !== "string") {
      request.body = JSON.stringify(request.body);
      request.headers["content-type"] = request.headers["content-type"] || "application/json";
    }
    const response = await fetch(endpoint, request);
    const raw = await response.text();
    let data = raw;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      // Keep raw text for diagnostics.
    }
    return { ok: response.ok, status: response.status, statusText: response.statusText, data, raw: raw.slice(0, 2000) };
  }, { endpoint: resolvedEndpoint, options });
  if (!result.ok) {
    throw new Error(`WorkBot API ${resolvedEndpoint} failed: HTTP ${result.status} ${result.statusText} ${result.raw || ""}`.trim());
  }
  return result.data;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["data", "records", "list", "items", "rows"]) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested;
    if (nested && typeof nested === "object") {
      const inner = normalizeList(nested);
      if (inner.length) return inner;
    }
  }
  return [];
}

function agentId(agent) {
  return agent && (agent.id || agent.agent_id || agent.agentId || agent.uuid);
}

function agentName(agent) {
  return agent && (agent.name || agent.agent_name || agent.agentName || "");
}

function findDeepValue(value, keys, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return "";
  seen.add(value);
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key]) return value[key];
  }
  for (const nested of Object.values(value)) {
    const found = findDeepValue(nested, keys, seen);
    if (found) return found;
  }
  return "";
}

async function listAgents(page, instanceId) {
  const query = instanceId ? `?page_size=0&instance_id=${encodeURIComponent(instanceId)}` : "?page_size=0";
  return normalizeList(await apiJson(page, `/agents${query}`));
}

async function getInstanceId(page, agents = []) {
  const fromAgents = findDeepValue({ agents }, ["instance_id", "instanceId"]);
  if (fromAgents) return fromAgents;

  const fromApi = await apiJson(page, "/instances/my").then((data) => findDeepValue(data, ["instance_id", "instanceId", "id"])).catch(() => "");
  if (fromApi) return fromApi;

  const fromStorage = await page.evaluate(() => {
    const keys = ["instance_id", "instanceId"];
    const scanValue = (value, seen = new Set()) => {
      if (!value || typeof value !== "object" || seen.has(value)) return "";
      seen.add(value);
      for (const key of keys) {
        if (typeof value[key] === "string" && value[key]) return value[key];
      }
      for (const nested of Object.values(value)) {
        const found = scanValue(nested, seen);
        if (found) return found;
      }
      return "";
    };
    const scanStorage = (storage) => {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        const raw = storage.getItem(key);
        if (!raw) continue;
        try {
          const found = scanValue(JSON.parse(raw));
          if (found) return found;
        } catch {
          // Ignore non-JSON storage values.
        }
      }
      return "";
    };
    return scanStorage(sessionStorage) || scanStorage(localStorage);
  });
  if (fromStorage) return fromStorage;
  throw new Error("unable to resolve WorkBot instance_id for fresh agent creation");
}

async function deleteOldFreshAgents(page) {
  const instanceId = await getInstanceId(page);
  const agents = await listAgents(page, instanceId);
  const oldAgents = agents.filter((agent) => agentName(agent).startsWith(FRESH_AGENT_PREFIX));
  for (const agent of oldAgents) {
    const id = agentId(agent);
    if (!id) continue;
    await apiJson(page, `/api/v1/agents/${id}`, { method: "DELETE" }).catch((error) => {
      log("fresh-agent-delete-failed", { id, name: agentName(agent), message: error.message });
    });
  }
  const remaining = await listAgents(page, instanceId);
  if (remaining.length >= MAX_DIGITAL_EMPLOYEES) {
    throw new Error(
      `digital employee count is ${remaining.length}/${MAX_DIGITAL_EMPLOYEES} after deleting old ${FRESH_AGENT_PREFIX} agents; refusing to delete non-test employees automatically`,
    );
  }
  return { agents: remaining, instanceId, deleted: oldAgents.map((agent) => ({ id: agentId(agent), name: agentName(agent) })) };
}

async function createFreshAgent(page, agents, instanceId) {
  instanceId = instanceId || await getInstanceId(page, agents);
  const name = `${FRESH_AGENT_PREFIX}-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const created = await apiJson(page, "/agents", {
    method: "POST",
    body: {
      name,
      type: "worker",
      description: FRESH_AGENT_DESCRIPTION,
      profile: FRESH_AGENT_PROFILE,
      instance_id: instanceId,
    },
  });
  const payload = created && created.data && typeof created.data === "object" ? created.data : created;
  return { id: agentId(payload), name, raw: payload, instanceId };
}

async function verifyFreshAgent(page, freshAgent) {
  if (!freshAgent.id) return { status: "skipped", reason: "created response did not include id" };
  const loaded = await apiJson(page, `/agents/${freshAgent.id}`);
  const payload = loaded && loaded.data && typeof loaded.data === "object" ? loaded.data : loaded;
  const description = payload.description || "";
  const profile = payload.profile || "";
  const descriptionOk = description.includes("负载均衡设备的运维人员");
  const profileOk = profile.includes("绝对禁止假工具调用") && profile.includes("每次对话都必须调用工具");
  if (!descriptionOk || !profileOk) {
    throw new Error(`fresh agent profile verification failed: descriptionOk=${descriptionOk}, profileOk=${profileOk}`);
  }
  return { status: "ok", descriptionLength: description.length, profileLength: profile.length };
}

async function selectAgentByName(page, name) {
  const conversationUrl = new URL("/workbot/#/conversation", WORKBOT_URL).toString();
  await page.goto(conversationUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  const deadline = Date.now() + 180000;
  let lastState = "";
  while (Date.now() < deadline) {
    const item = page.locator('li[utid="user-item"]').filter({ hasText: name }).first();
    if (await item.count().catch(() => 0)) {
      await item.click({ timeout: 10000 }).catch(() => {});
      const state = await page.evaluate((agentName) => {
        const activeName = document.querySelector('li.user-item--active .user-item__name')?.textContent || "";
        const body = document.body?.innerText || "";
        const textarea = document.querySelector("textarea.chat-input__textarea");
        return {
          active: activeName.includes(agentName),
          ready: Boolean(textarea) && !body.includes("正在部署中") && !body.includes("请稍后再试"),
          bodyTail: body.slice(-200),
        };
      }, name).catch(() => ({ active: false, ready: false, bodyTail: "" }));
      lastState = JSON.stringify(state);
      if (state.active && state.ready) {
        await waitForConversation(page);
        return;
      }
    }
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  throw new Error(`fresh agent not ready in conversation list: ${name}; lastState=${lastState}`);
}

async function ensureFreshAgent(page) {
  log("fresh-agent-start", { prefix: FRESH_AGENT_PREFIX, maxDigitalEmployees: MAX_DIGITAL_EMPLOYEES });
  const { agents, instanceId, deleted } = await deleteOldFreshAgents(page);
  const created = await createFreshAgent(page, agents, instanceId);
  created.verification = await verifyFreshAgent(page, created);
  await selectAgentByName(page, created.name);
  ACTIVE_AGENT_NAME = created.name;
  log("fresh-agent-ready", { id: created.id, name: created.name, deleted: deleted.length });
  return { ...created, deleted };
}

async function initializeFreshAgent(page) {
  const response = await sendPrompt(page, "fresh-agent-init", FRESH_AGENT_INIT_PROMPT);
  if (!response.toolEvidence.hasEvidence) {
    throw new Error("fresh agent initialization did not show tool-call evidence");
  }
  return {
    prompt: FRESH_AGENT_INIT_PROMPT,
    visibleText: response.visibleText,
    artifacts: response.artifacts,
    toolCandidateCount: response.toolEvidence.candidates.length,
  };
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
  for (let pass = 0; pass < 5; pass += 1) {
    const clicked = await root.evaluate((node) => {
      let total = 0;
      const headers = Array.from(node.querySelectorAll('[utid="tool-call-toggle"], .tool-call-card__header, .tool-call-header'));
      for (const header of headers) {
        const card = header.closest(".tool-call-card") || header.parentElement;
        const arrowClass = header.querySelector('[class*="arrow"]')?.getAttribute("class") || "";
        const detail = card && card.querySelector(".tool-call-card__detail");
        const closed = !detail || /arrow-down|down/i.test(arrowClass);
        if (!closed) continue;
        header.scrollIntoView({ block: "center", inline: "nearest" });
        header.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        total += 1;
      }
      return total;
    }).catch(() => 0);
    if (!clicked) break;
    await page.waitForTimeout(700);
  }
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
  return /connect\.py/i.test(value || "") && /(devices\.json|192\.168\.8\.3[01]|认证|auth|reach|连接测试|连接正常)/i.test(value || "");
}

function extractToolCommands(responses, options = {}) {
  const includeAgentText = options.includeAgentText !== false;
  const includePageText = options.includePageText !== false;
  const commands = [];
  const commandPattern = /"command"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const parseText = (text) => {
    for (const match of String(text || "").matchAll(commandPattern)) {
      try {
        commands.push(JSON.parse(`"${match[1]}"`));
      } catch {
        commands.push(match[1]);
      }
    }
  };
  for (const response of responses || []) {
    for (const candidate of (response.toolEvidence && response.toolEvidence.candidates) || []) {
      parseText(candidate.text || "");
    }
    if (includeAgentText) parseText(response.agentText || "");
    if (includePageText) parseText(response.text || "");
  }
  return Array.from(new Set(commands));
}

function extractStepToolCommands(response) {
  // response.text is a page-level delta in WorkBot and can include commands from
  // earlier turns. Step gates must only inspect current message tool evidence.
  return extractToolCommands([response], { includePageText: false });
}

function textOfResponse(response) {
  return [
    response && response.visibleText,
    response && response.visibleAgentText,
    response && response.text,
    response && response.agentText,
  ].filter(Boolean).join("\n");
}

function joinUniqueTexts(...items) {
  const seen = new Set();
  const parts = [];
  for (const item of items) {
    const text = String(item || "").trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    parts.push(text);
  }
  return parts.join("\n");
}

function responseEvidenceText(response) {
  return [
    response && response.visibleText,
    response && response.visibleAgentText,
    response && response.text,
    response && response.agentText,
    ...(((response && response.toolEvidence && response.toolEvidence.candidates) || []).map((item) => item.text || "")),
  ].filter(Boolean).join("\n");
}

function hasGeneratedArtifactEvidence(response, names) {
  const evidence = responseEvidenceText(response);
  return names.every((name) => {
    const escaped = escapeRegExp(name);
    return new RegExp(
      [
        `${escaped}[^\\n]{0,200}(?:exists|generated|已生成|写入|路径|path|outputs|ad_ops_workdir|产物)`,
        `(?:exists|generated|已生成|写入|路径|path|outputs|ad_ops_workdir|产物|apply_script|rollback_script|bundle|cp\\s+)[^\\n]{0,200}${escaped}`,
      ].join("|"),
      "i",
    ).test(evidence);
  });
}

function stepRuleViolationsFor(name, cfg, responses) {
  if (name.startsWith("r2r4") && cfg.steps) {
    const violations = [];
    const promptResponses = responses.filter((item) => !item.upload && !item.localVerification);
    const responseVisible = (item) => joinUniqueTexts(item && item.visibleText, item && item.visibleAgentText);
    const responseCommands = (item) => extractStepToolCommands(item || {}).join("\n");
    const expectCommand = (label, item, token) => {
      if (!responseCommands(item).includes(token)) violations.push(`r2r4 ${label} missing command token: ${token}`);
    };
    const expectVisible = (label, item, token) => {
      if (!responseVisible(item).includes(token)) violations.push(`r2r4 ${label} missing visible token: ${token}`);
    };
    const forbidVisible = (label, item, token) => {
      if (responseVisible(item).includes(token)) violations.push(`r2r4 ${label} leaked forbidden visible token: ${token}`);
    };

    const stageA = promptResponses[0] || {};
    const yamlDone = promptResponses[1] || {};
    const delivery = promptResponses[2] || {};
    const beforeStart = 3;
    const rollbackIndex = beforeStart + R2R4_QUERY_SPECS.length;
    const rollback = promptResponses[rollbackIndex] || {};
    const afterStart = rollbackIndex + 1;

    for (const token of ["配置结论", "产出物", "下一步"]) {
      expectVisible("stageA", stageA, token);
      expectVisible("yaml-complete", yamlDone, token);
      expectVisible("delivery", delivery, token);
      expectVisible("rollback", rollback, token);
    }
    for (const token of ["plan-and-render", "summarize-plan", "preflight-slb-plan"]) {
      expectCommand("yaml-complete", yamlDone, token);
    }
    expectCommand("delivery", delivery, "apply-slb-plan");
    expectCommand("rollback", rollback, "rollback-and-verify");

    const presentCheck = responses.find((item) => item.localVerification && item.localVerification.kind === "verify_present");
    const absentCheck = responses.find((item) => item.localVerification && item.localVerification.kind === "verify_absent");
    if (!presentCheck || presentCheck.localVerification.status !== "ok") {
      violations.push("r2r4 local AD present verification did not pass after delivery");
    }
    if (!absentCheck || absentCheck.localVerification.status !== "ok") {
      violations.push("r2r4 local AD absent verification did not pass after rollback");
    }

    for (const [index, spec] of R2R4_QUERY_SPECS.entries()) {
      const label = `before-${spec.label}`;
      const item = promptResponses[beforeStart + index] || {};
      for (const dimension of spec.dimensions || ["overview.py"]) expectCommand(label, item, dimension);
      const tokens = spec.visiblePresent || ["查询结论"];
      for (const token of tokens) expectVisible(label, item, token);
      if (responseCommands(item).includes("ad_ops_flow.py")) {
        violations.push(`r2r4 ${label} reran config workflow during R2 query`);
      }
    }

    for (const [index, spec] of R2R4_QUERY_SPECS.entries()) {
      const label = `after-${spec.label}`;
      const item = promptResponses[afterStart + index] || {};
      for (const dimension of spec.dimensions || ["overview.py"]) expectCommand(label, item, dimension);
      for (const token of spec.forbidAfter || []) forbidVisible(label, item, token);
      if (responseCommands(item).includes("ad_ops_flow.py")) {
        violations.push(`r2r4 ${label} reran config workflow after rollback`);
      }
    }
    return violations;
  }

  if (name === "r4-audit-script") {
    const violations = [];
    const promptResponses = responses.filter((item) => !item.upload && !item.localVerification);
    const audit = promptResponses[0] || {};
    const auditVisible = `${audit.visibleText || ""}\n${audit.visibleAgentText || ""}`;
    const auditCommands = extractStepToolCommands(audit).join("\n");
    const compactTemplateRequired = ["配置结论", "产出物", "下一步"];
    const verboseTemplateForbidden = ["操作计划", "计划摘要", "执行摘要", "安全确认"];
    const internalArtifactForbidden = ["adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"];

    for (const token of compactTemplateRequired) {
      if (!auditVisible.includes(token)) violations.push(`r4 audit missing compact heading: ${token}`);
    }
    for (const token of [...verboseTemplateForbidden, ...internalArtifactForbidden]) {
      if (auditVisible.includes(token)) violations.push(`r4 audit leaked verbose/internal content: ${token}`);
    }
    if (!auditVisible.includes("AD1")) violations.push("r4 audit did not keep target device AD1 visible");
    if (!/(撞现网|冲突|预检|同名|无冲突|待新建|复用|未下发)/.test(auditVisible)) {
      violations.push("r4 audit did not explain collision/preflight result");
    }
    if (!/(YAML|yaml|adops-bundle)/.test(auditVisible)) {
      violations.push("r4 audit did not list or reference YAML artifact");
    }
    for (const token of ["plan-and-render", "summarize-plan", "preflight-slb-plan"]) {
      if (!auditCommands.includes(token)) violations.push(`r4 audit missing command token: ${token}`);
    }
    for (const token of ["apply-slb-plan", "rollback-and-verify", "verify_slb_resource.py"]) {
      if (auditCommands.includes(token)) violations.push(`r4 audit executed forbidden command: ${token}`);
    }
    return violations;
  }

  if (name.startsWith("r4") && cfg.steps) {
    const violations = [];
    const promptResponses = responses.filter((item) => !item.upload && !item.localVerification);
    const stageA = promptResponses[0] || {};
    const yamlDone = promptResponses[1] || {};
    const choice = promptResponses[2] || {};
    const rollback = promptResponses[3] || {};
    const stageAVisible = `${stageA.visibleText || ""}\n${stageA.visibleAgentText || ""}`;
    const yamlDoneVisible = `${yamlDone.visibleText || ""}\n${yamlDone.visibleAgentText || ""}`;
    const choiceVisible = `${choice.visibleText || ""}\n${choice.visibleAgentText || ""}`;
    const rollbackVisible = `${rollback.visibleText || ""}\n${rollback.visibleAgentText || ""}`;
    const stageACommands = extractStepToolCommands(stageA).join("\n");
    const yamlDoneCommands = extractStepToolCommands(yamlDone).join("\n");
    const choiceCommands = extractStepToolCommands(choice).join("\n");
    const rollbackCommands = extractStepToolCommands(rollback).join("\n");
    const stageAInitIndex = stageACommands.indexOf("init_env.py");
    const stageARenderIndexes = ["render_slb_bundle.py", "render_bundle_template.py"]
      .map((token) => stageACommands.indexOf(token))
      .filter((index) => index >= 0);
    const stageAFirstRenderIndex = stageARenderIndexes.length ? Math.min(...stageARenderIndexes) : -1;
    const prematureStageACommands = ["plan-and-render", "summarize-plan", "preflight-slb-plan", "apply-slb-plan", "rollback-and-verify"];
    const compactTemplateRequired = ["配置结论", "产出物", "下一步"];
    const verboseTemplateForbidden = ["操作计划", "计划摘要", "执行摘要", "安全确认"];
    const internalArtifactForbidden = ["adops-batch.json", "adops-effective-plan.json", "adops-post-apply.json", "adops-post-rollback.json", "adops-rollback-compare.json"];

    const assertCompactTemplate = (label, text) => {
      for (const token of compactTemplateRequired) {
        if (!text.includes(token)) violations.push(`r4 ${label} missing compact heading: ${token}`);
      }
      for (const token of [...verboseTemplateForbidden, ...internalArtifactForbidden]) {
        if (text.includes(token)) violations.push(`r4 ${label} leaked verbose/internal content: ${token}`);
      }
    };

    if (!stageAVisible.includes("AD1")) violations.push("r4 stageA did not keep target device AD1 visible");
    if (!/YAML|yaml|adops-bundle/.test(stageAVisible)) violations.push("r4 stageA did not produce or point to a YAML artifact");
    if (stageAInitIndex < 0) violations.push("r4 stageA did not run init_env.py before rendering YAML");
    if (!stageACommands.includes("--confirm-clean")) violations.push("r4 stageA did not clean residual artifacts with --confirm-clean");
    if (stageAInitIndex >= 0 && stageAFirstRenderIndex >= 0 && stageAInitIndex > stageAFirstRenderIndex) {
      violations.push("r4 stageA cleaned residual artifacts after YAML rendering");
    }
    assertCompactTemplate("stageA", stageAVisible);
    if (!hasGeneratedArtifactEvidence(stageA, ["adops-bundle.yml"])) {
      violations.push("r4 stageA has no tool/page evidence that YAML artifact was generated");
    }
    if (stageAVisible.includes("apply.py") || stageAVisible.includes("rollback_apply.py")) {
      violations.push("r4 stageA showed scripts before YAML was completed");
    }
    for (const token of prematureStageACommands) {
      if (stageACommands.includes(token)) violations.push(`r4 stageA executed premature command: ${token}`);
    }

    for (const token of ["plan-and-render", "summarize-plan", "preflight-slb-plan"]) {
      if (!yamlDoneCommands.includes(token)) violations.push(`r4 yaml-complete step missing command token: ${token}`);
    }
    for (const token of ["apply-slb-plan", "rollback-and-verify"]) {
      if (yamlDoneCommands.includes(token)) violations.push(`r4 yaml-complete step executed too early: ${token}`);
    }
    if (!/(同名|预检|复用|待新建|无冲突|无同名)/.test(yamlDoneVisible)) {
      violations.push("r4 yaml-complete step did not explain same-name/reference preflight result");
    }
    assertCompactTemplate("yaml-complete", yamlDoneVisible);
    if (!yamlDoneVisible.includes("adops-bundle.yml") || !yamlDoneVisible.includes("apply.py") || !yamlDoneVisible.includes("rollback_apply.py")) {
      violations.push("r4 yaml-complete step did not list all three deliverables: adops-bundle.yml, apply.py, rollback_apply.py");
    }
    if (!hasGeneratedArtifactEvidence(yamlDone, ["adops-bundle.yml", "apply.py", "rollback_apply.py"])) {
      violations.push("r4 yaml-complete step has no tool/page evidence that all three deliverables were generated");
    }
    if (!/(真实下发|直接给出脚本|不需要下发|先不下发|脚本)/.test(yamlDoneVisible)) {
      violations.push("r4 yaml-complete step did not ask the user to choose delivery or script-only mode");
    }

    const isDelivery = Boolean(cfg.verifyAbsent || cfg.verifyPresent);
    if (isDelivery) {
      if (!choiceCommands.includes("apply-slb-plan")) violations.push("r4 delivery step missing apply-slb-plan");
      if (choiceCommands.includes("rollback-and-verify")) violations.push("r4 delivery step rolled back before user confirmation");
      assertCompactTemplate("delivery", choiceVisible);
      if (!choiceVisible.includes("adops-bundle.yml") || !choiceVisible.includes("apply.py") || !choiceVisible.includes("rollback_apply.py")) {
        violations.push("r4 delivery step did not list all three deliverables");
      }
      if (!hasGeneratedArtifactEvidence(choice, ["adops-bundle.yml", "apply.py", "rollback_apply.py"])) {
        violations.push("r4 delivery step has no tool/page evidence that all three deliverables were generated");
      }
      if (!/(检查|验证|回滚)/.test(choiceVisible)) violations.push("r4 delivery step did not pause for manual inspection/rollback confirmation");
      const presentCheck = responses.find((item) => item.localVerification && item.localVerification.kind === "verify_present");
      if (presentCheck && presentCheck.localVerification.status === "fail") {
        violations.push("r4 local AD present verification failed after delivery");
      }
      if (!rollbackCommands.includes("rollback-and-verify")) violations.push("r4 rollback step missing rollback-and-verify");
      assertCompactTemplate("rollback", rollbackVisible);
      if (!rollbackVisible.includes("adops-bundle.yml") || !rollbackVisible.includes("apply.py") || !rollbackVisible.includes("rollback_apply.py")) {
        violations.push("r4 rollback step did not list all three deliverables");
      }
      if (!hasGeneratedArtifactEvidence(rollback, ["adops-bundle.yml", "apply.py", "rollback_apply.py"])) {
        violations.push("r4 rollback step has no tool/page evidence that all three deliverables were generated");
      }
      if (!/回滚/.test(rollbackVisible)) violations.push("r4 rollback step did not report rollback");
    } else {
      for (const token of ["apply-slb-plan", "rollback-and-verify"]) {
        if (choiceCommands.includes(token)) violations.push(`r4 script-only step executed forbidden command: ${token}`);
      }
      assertCompactTemplate("script-only", choiceVisible);
      if (!choiceVisible.includes("adops-bundle.yml") || !choiceVisible.includes("apply.py") || !choiceVisible.includes("rollback_apply.py")) {
        violations.push("r4 script-only step did not provide all three deliverables");
      }
      if (!hasGeneratedArtifactEvidence(choice, ["adops-bundle.yml", "apply.py", "rollback_apply.py"])) {
        violations.push("r4 script-only step has no tool/page evidence that all three deliverables were generated");
      }
      if (!/(使用|执行|运行)/.test(choiceVisible)) {
        violations.push("r4 script-only step did not explain how to use scripts");
      }
    }
    return violations;
  }

  if (!name.startsWith("r1") || !cfg.steps) return [];
  const violations = [];
  const step1 = responses[0] || {};
  const step2 = responses[1] || {};
  const step3 = responses[2] || {};
  const scene = (cfg.expected || []).find((token) => /巡检$/.test(token)) || "";
  const step1ForbiddenCommands = [
    "ad-connect/scripts/connect.py",
    "ad-perception/scripts/perception.py",
    "ad-ops/scripts/overview.py",
    "check.py history",
    "check.py run",
    "check.py progress",
    "check.py wait",
  ];
  const step2RequiredCommands = ["connect.py", "check.py", "history"];
  const step2ForbiddenCommands = [
    "ad-perception/scripts/perception.py",
    "ad-ops/scripts/overview.py",
    "check.py run",
    "check.py progress",
    "check.py wait",
  ];
  const earlyForbiddenVisible = ["巡检结论", "感知结论", "查询结论"];

  const step1Visible = `${step1.visibleText || ""}\n${step1.visibleAgentText || ""}`;
  const step1Commands = extractStepToolCommands(step1).join("\n");
  if (!/标准巡检/.test(step1Visible) || !/全量巡检/.test(step1Visible) || !/安全巡检/.test(step1Visible)) {
    violations.push("r1 step1 did not ask the user to choose 标准巡检/全量巡检/安全巡检");
  }
  for (const token of earlyForbiddenVisible) {
    if (step1Visible.includes(token)) violations.push(`r1 step1 produced premature ${token}`);
  }
  for (const token of step1ForbiddenCommands) {
    if (step1Commands.includes(token)) violations.push(`r1 step1 executed premature command: ${token}`);
  }
  if (/perception\.py/.test(step1Commands) || step1Visible.includes("感知结论")) {
    violations.push("r1 step1 routed inspection prompt to ad-perception");
  }

  const step2Visible = `${step2.visibleText || ""}\n${step2.visibleAgentText || ""}`;
  const step2Commands = extractStepToolCommands(step2).join("\n");
  if (!/(强制|继续|覆盖)/.test(step2Visible)) {
    violations.push("r1 step2 did not ask whether to force/continue");
  }
  if (!/历史/.test(step2Visible)) {
    violations.push("r1 step2 did not tell the user history was checked before force confirmation");
  }
  for (const token of earlyForbiddenVisible) {
    if (step2Visible.includes(token)) violations.push(`r1 step2 produced premature ${token}`);
  }
  for (const token of step2RequiredCommands) {
    if (!step2Commands.includes(token)) violations.push(`r1 step2 missing pre-confirmation command token: ${token}`);
  }
  for (const token of step2ForbiddenCommands) {
    if (step2Commands.includes(token)) violations.push(`r1 step2 executed before force confirmation: ${token}`);
  }

  const step3Visible = `${step3.visibleText || ""}\n${step3.visibleAgentText || ""}`;
  const step3Commands = extractStepToolCommands(step3).join("\n");
  const requiredFinalCommands = ["check.py", "run", "progress", "wait"];
  for (const token of requiredFinalCommands) {
    if (!step3Commands.includes(token)) violations.push(`r1 step3 missing command token: ${token}`);
  }
  for (const token of ["perception.py", "overview.py", "2>&1"]) {
    if (step3Commands.includes(token)) violations.push(`r1 step3 used forbidden command token: ${token}`);
  }
  if (!step3Visible.includes("巡检结论")) {
    violations.push("r1 step3 did not produce 巡检结论 report");
  }
  if (scene && !step3Visible.includes(scene)) {
    violations.push(`r1 step3 report did not contain expected scene: ${scene}`);
  }
  return violations;
}

function responseVisibleText(item) {
  return joinUniqueTexts(item && item.visibleText, item && item.visibleAgentText);
}

function responseCommandText(item) {
  return extractStepToolCommands(item || {}).join("\n");
}

function r2r4QueryViolations(label, item, spec, phase) {
  const violations = [];
  const commands = responseCommandText(item);
  const visible = responseVisibleText(item);
  for (const dimension of spec.dimensions || ["overview.py"]) {
    if (!commands.includes(dimension)) violations.push(`r2r4 ${label} missing command token: ${dimension}`);
  }
  const visibleRequired = phase === "after" ? spec.afterVisiblePresent || ["查询结论"] : spec.visiblePresent || ["查询结论"];
  for (const token of visibleRequired) {
    if (!visible.includes(token)) violations.push(`r2r4 ${label} missing visible token: ${token}`);
  }
  for (const token of phase === "after" ? spec.forbidAfter || [] : []) {
    if (visible.includes(token)) violations.push(`r2r4 ${label} leaked forbidden visible token: ${token}`);
  }
  if (commands.includes("ad_ops_flow.py")) {
    violations.push(`r2r4 ${label} reran config workflow ${phase === "after" ? "after rollback" : "during R2 query"}`);
  }
  return violations;
}

function failFastStepViolationsFor(name, cfg, responses) {
  if (!(name.startsWith("r2r4") && cfg.steps)) return [];
  const promptResponses = responses.filter((item) => !item.upload && !item.localVerification);
  const promptIndex = promptResponses.length - 1;
  if (promptIndex < 0) return [];
  const beforeStart = 3;
  const rollbackIndex = beforeStart + R2R4_QUERY_SPECS.length;
  const afterStart = rollbackIndex + 1;

  if (promptIndex >= beforeStart && promptIndex < rollbackIndex) {
    const spec = R2R4_QUERY_SPECS[promptIndex - beforeStart];
    return r2r4QueryViolations(`before-${spec.label}`, promptResponses[promptIndex], spec, "before");
  }
  if (promptIndex >= afterStart && promptIndex < afterStart + R2R4_QUERY_SPECS.length) {
    const spec = R2R4_QUERY_SPECS[promptIndex - afterStart];
    return r2r4QueryViolations(`after-${spec.label}`, promptResponses[promptIndex], spec, "after");
  }
  return [];
}

function r2r4NeedsRollbackAfterFailFast(name, responses) {
  if (!name.startsWith("r2r4")) return false;
  const hasPresent = responses.some((item) => item.localVerification && item.localVerification.kind === "verify_present" && item.localVerification.status === "ok");
  const hasAbsent = responses.some((item) => item.localVerification && item.localVerification.kind === "verify_absent" && item.localVerification.status === "ok");
  return hasPresent && !hasAbsent;
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
  if (name.startsWith("r1-all")) return ["巡检结论", "设备概览", "全局共性问题"];
  if (name.startsWith("r1")) return ["巡检结论", "分类统计", "设备基本信息", "检查项明细", "优化建议", "健康评分"];
  if (name.startsWith("r2")) return ["查询结论", "查询范围", "查询结果"];
  if (name.startsWith("r3")) return ["感知结论", "分析结果", "结论边界"];
  if (name.startsWith("r4")) return ["配置结论", "产出物", "下一步"];
  return [];
}

function runLocalAdVerification(name, cfg, override = {}) {
  if (!VERIFY_AD) return { status: "disabled" };
  if (!AD_VERIFY_PASSWORD) {
    return {
      status: "skipped",
      reason: "missing AD verify password and devices.json AD1 password",
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
  const target = override.target || (cfg && (cfg.verifyPresent || cfg.verifyAbsent));
  const expect = override.expect || (cfg && cfg.verifyPresent ? "present" : "absent");
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

async function sendPromptOnce(page, name, prompt, attempt) {
  log("prompt-start", { name, promptLength: prompt.length, attempt });
  await ensureConversation(page, `send:${name}`);
  const before = await text(page);
  const beforeAgentCount = await page.locator(".chat-messages__item.chat-messages__item--agent").count().catch(() => 0);
  await page.locator("textarea.chat-input__textarea").fill(prompt);
  await page.locator('button[utid="send-btn"]').click();
  log("prompt-sent", { name, beforeLength: before.length, beforeAgentCount, attempt });
  let after = await waitForIdleText(page, before, name);
  if (await ensureActiveAgent(page, `after-send:${name}`)) {
    after = await text(page);
  }
  const visibleDelta = after.startsWith(before) ? after.slice(before.length) : after;
  const visibleAgentText = await lastAgentAnswerText(page);
  await expandToolCalls(page);
  const expanded = await text(page);
  const delta = expanded.startsWith(before) ? expanded.slice(before.length) : expanded;
  const agentText = await lastAgentText(page);
  const toolEvidence = redactToolEvidence(await collectToolEvidence(page));
  const artifacts = await savePageArtifacts(page, name);
  const redactedDelta = redactSensitive(delta);
  const redactedAgentText = redactSensitive(agentText);
  const redactedVisibleAgentText = redactSensitive(visibleAgentText);
  log("prompt-done", {
    name,
    attempt,
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
    attempt,
    text: redactedDelta.slice(-12000),
    agentText: redactedAgentText.slice(-12000),
    visibleText: redactedVisibleAgentText.slice(-12000),
    visibleAgentText: redactedVisibleAgentText.slice(-12000),
    toolEvidence,
    artifacts,
  };
}

async function sendPrompt(page, name, prompt) {
  let lastResponse = null;
  for (let attempt = 1; attempt <= PROMPT_TRANSIENT_RETRIES + 1; attempt += 1) {
    const attemptName = attempt === 1 ? name : `${name}-retry${attempt - 1}`;
    const response = await sendPromptOnce(page, attemptName, prompt, attempt);
    lastResponse = { ...response, name };
    const responseText = `${response.visibleText || ""}\n${response.visibleAgentText || ""}\n${response.text || ""}\n${response.agentText || ""}`;
    const rateLimit = parseRateLimitProviderError(responseText);
    if (rateLimit) {
      log("prompt-rate-limit", { name, attempt, resetAt: rateLimit.resetAt || "" });
      throw new WorkBotRateLimitError(rateLimit, response);
    }
    if (!isTransientProviderError(responseText) || attempt > PROMPT_TRANSIENT_RETRIES) {
      return lastResponse;
    }
    log("prompt-transient-retry", { name, attempt, nextAttempt: attempt + 1 });
    await page.waitForTimeout(1500);
  }
  return lastResponse;
}

async function uploadFile(page, filePath, name = "upload") {
  log("upload-start", { name, file: filePath });
  await ensureConversation(page, `upload:${name}`);
  const input = page.locator('input[type="file"].hidden-input');
  if (!(await input.count())) throw new Error("upload file input not found");
  await input.setInputFiles(filePath);
  await page.waitForTimeout(2000);
  await ensureConversation(page, `post-upload:${name}`);
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
  const toolCommands = extractToolCommands(run.responses, { includePageText: false });
  const toolCommandText = toolCommands.join("\n");
  const workBotResponses = (run.responses || []).filter((item) => !item.localVerification);
  const workBotToolCommandText = extractToolCommands(workBotResponses, { includePageText: false }).join("\n");
  const workBotToolCandidateText = workBotResponses
    .flatMap((item) => (item.toolEvidence && item.toolEvidence.candidates) || [])
    .map((item) => item.text || "")
    .join("\n");
  const workBotResponseText = workBotResponses
    .map((item) => `${item.visibleText || ""}\n${item.visibleAgentText || ""}\n${item.text || ""}\n${item.agentText || ""}`)
    .join("\n");
  const toolCandidateText = (run.responses || [])
    .flatMap((item) => (item.toolEvidence && item.toolEvidence.candidates) || [])
    .map((item) => item.text || "")
    .join("\n");
  const visibleText = joinUniqueTexts(run.visibleText, run.visibleAgentText);
  const expandedText = joinUniqueTexts(run.text, run.agentText);
  const searchable = `${visibleText}\n${expandedText}\n${toolCommandText}\n${toolCandidateText}`;
  const found = tokens.filter((token) => searchable.includes(token));
  const missing = tokens.filter((token) => !searchable.includes(token));
  const templateExpected = templateExpectedFor(run.name, cfg);
  const templateFound = templateExpected.filter((token) => visibleText.includes(token));
  const templateMissing = templateExpected.filter((token) => !visibleText.includes(token));
  const commandExpected = commandExpectedFor(run.name, cfg);
  const commandFound = commandExpected.filter((token) => toolCommandText.includes(token));
  const commandMissing = commandExpected.filter((token) => !toolCommandText.includes(token));
  const defaultCommandForbidden = /^r[1-4]/.test(run.name) ? ["2>&1"] : [];
  const commandForbidden = [...defaultCommandForbidden, ...(cfg.commandForbidden || [])];
  const commandForbiddenFound = commandForbidden.filter((token) => toolCommandText.includes(token));
  if (/^r1/.test(run.name)) {
    const combinedProgress = /\b(?:sleep|Start-Sleep)\b[^\n]*\bcheck\.py\b[^\n]*\bprogress\b|\bcheck\.py\b[^\n]*\bprogress\b[^\n]*\b(?:sleep|Start-Sleep)\b/i;
    if (combinedProgress.test(toolCommandText)) commandForbiddenFound.push("sleep + check.py progress");
    if (/\b(?:sleep|Start-Sleep)\b/i.test(toolCommandText)) commandForbiddenFound.push("manual sleep");
  }
  const defaultVisibleForbidden = /^r[1-4]/.test(run.name) ? [
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
    "根据技能",
    "技能规则",
    "根据 ad-check-analysis",
    "根据ad-check-analysis",
    "下面汇总展示",
    "报告均已获取成功",
  ] : [];
  if (/^r1/.test(run.name)) {
    defaultVisibleForbidden.push(
      "重点异常",
      "ad.json",
      "security_check_state=",
      "remote_mt=",
      "ssh_authority=",
      "base_report_stab=",
      "algorithm=",
      "protocol=",
      "enable_iplimit=",
      "admin=",
      "heartbeat_state=",
      "shm_sem_state=",
    );
    defaultVisibleForbidden.push("巡检过程", "原始报告");
    if (run.name.startsWith("r1-all")) {
      defaultVisibleForbidden.push("跨设备对比", "高频异常", "重点关注设备", "设备详情", "详细报告");
    }
  }
  if (/^r2/.test(run.name)) {
    defaultVisibleForbidden.push(
      "覆盖说明",
      "AD Device Overview",
      "Device Info",
      "Virtual Services",
      "SSL Certificates",
      "Hardware Status",
      "| Name |",
      "| Component |",
      "Connections",
      "Rate",
    );
    const r2ConfigOnly =
      ["r2-short", "r2-config", "r2-config-all", "r2-node"].includes(run.name) ||
      run.name.startsWith("r2-vs") ||
      run.name.startsWith("r2-pool");
    const r2CertOnly = run.name.startsWith("r2-cert");
    const r2TrafficOnly = run.name.startsWith("r2-traffic");
    const r2StatusOnly =
      run.name.startsWith("r2-status") ||
      run.name.startsWith("r2-hardware") ||
      run.name.startsWith("r2-resource") ||
      run.name.startsWith("r2-ha");
    if (r2ConfigOnly) {
      defaultVisibleForbidden.push("设备状态", "硬件状态", "流量状态", "当前连接数", "新建速率", "吞吐量", "CPU 使用率", "内存使用率");
    }
    if (r2CertOnly) {
      defaultVisibleForbidden.push("设备状态", "硬件状态", "流量状态", "虚拟服务配置", "节点池配置", "CPU 使用率", "内存使用率");
    }
    if (r2TrafficOnly) {
      defaultVisibleForbidden.push("设备状态", "硬件状态", "虚拟服务配置", "节点池配置", "SSL 证书", "CPU 使用率", "内存使用率");
    }
    if (r2StatusOnly) {
      defaultVisibleForbidden.push("虚拟服务配置", "节点池配置", "流量状态", "当前连接数", "新建速率", "吞吐量", "SSL 证书");
    }
  }
  if (/^r4/.test(run.name)) {
    defaultVisibleForbidden.push(
      "模板中你需要填写",
      "字段\t说明",
      "字段 说明",
      "当前占位值",
      "占位字段",
      "TODO_",
      "其余字段",
      "可按需填写",
      "留空会自动忽略",
      "name\t",
      "vips\t",
      "vports\t",
      "pool\t",
      "http_profile\t",
      "pre_rules\t",
      "name —",
      "vips —",
      "vports —",
      "pre_rules —",
      "http_profile —",
    );
  }
  const visibleForbidden = [...defaultVisibleForbidden, ...(cfg.visibleForbidden || [])];
  const visibleForbiddenFound = visibleForbidden.filter((token) => visibleText.includes(token));
  const visibleForbiddenRegexes = /^r1/.test(run.name)
    ? [
        { name: "internal CHECK id", regex: /\b[A-Z][A-Z0-9_]+_CHECK\b/ },
        { name: "raw key=value device field", regex: /\b(?:[A-Za-z][A-Za-z0-9_]*|82599)=/ },
        { name: "english thinking leaked", regex: /\b(?:According to the skill rules|The user|Let me start|I need to)\b/i },
      ]
    : [];
  if (/^r1/.test(run.name) && !run.name.startsWith("r1-all")) {
    visibleForbiddenRegexes.push({ name: "single target URL form", regex: /目标[：:][^\n]*\(\s*https?:\/\// });
  }
  if (/^r2/.test(run.name)) {
    visibleForbiddenRegexes.push({ name: "query target URL scheme", regex: /目标设备?[：:][^\n]*https?:\/\// });
  }
  if (/^r3/.test(run.name)) {
    visibleForbiddenRegexes.push({
      name: "r3 anomaly status contradiction",
      regex: /状态[：:]\s*(?:✅\s*)?未发现明显异常[\s\S]*(?:\b(?:ALERT|ERROR)\b|(?:上升|下降)\s+\d+(?:\.\d+)?%|(?:轻微|明显|严重))/,
    });
  }
  if (/^r4/.test(run.name)) {
    visibleForbiddenRegexes.push({
      name: "r4 visible yaml field table",
      regex: /(?:^|\n)\s*字段\s+(?:当前占位值|说明|示例)/,
    });
  }
  const visibleForbiddenRegexFound = visibleForbiddenRegexes
    .filter((item) => item.regex.test(visibleText))
    .map((item) => item.name);
  const forbiddenWorkBotDeviceHosts = /^r[1-4]/.test(run.name) ? WORKBOT_FORBIDDEN_DEVICE_HOSTS : [];
  const workBotSearchable = `${workBotResponseText}\n${workBotToolCommandText}\n${workBotToolCandidateText}`;
  const forbiddenWorkBotDeviceHostsFound = forbiddenWorkBotDeviceHosts.filter((token) => workBotSearchable.includes(token));
  const stepViolations = stepRuleViolationsFor(run.name, cfg, run.responses || []);
  const forbidden = cfg.forbidExecute && /(^|\s)--execute(\s|$)/.test(searchable);
  const toolEvidenceOk = !cfg.requireTools || run.responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence);
  const perStepToolEvidenceMissing = cfg.requireToolsEachStep
    ? (run.responses || [])
        .filter((item) => !item.toolEvidence || !item.toolEvidence.hasEvidence)
        .map((item) => item.name || "unnamed-step")
    : [];
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
    visibleForbiddenRegexFound,
    forbiddenWorkBotDeviceHosts,
    forbiddenWorkBotDeviceHostsFound,
    stepViolations,
    toolCommands,
    toolEvidenceOk,
    perStepToolEvidenceMissing,
    cleanToolTriggerOk,
    cleanCommandTriggerOk,
    deviceEvidenceOk,
    localVerificationOk,
    toolFollowupUsed: Boolean(run.toolFollowupUsed),
    commandFollowupUsed: Boolean(run.commandFollowupUsed),
    deviceFollowupUsed: Boolean(run.deviceFollowupUsed),
    ok: missing.length === 0 && templateMissing.length === 0 && commandMissing.length === 0 && commandForbiddenFound.length === 0 && visibleForbiddenFound.length === 0 && visibleForbiddenRegexFound.length === 0 && forbiddenWorkBotDeviceHostsFound.length === 0 && stepViolations.length === 0 && perStepToolEvidenceMissing.length === 0 && !forbidden && toolEvidenceOk && cleanToolTriggerOk && cleanCommandTriggerOk && deviceEvidenceOk && localVerificationOk,
    forbidden_execute: forbidden,
  };
}

function assertGate(result, gateName) {
  if (result.ok) return;
  const reasons = [];
  if (result.missing && result.missing.length) reasons.push(`missing expected tokens: ${result.missing.join(", ")}`);
  if (result.templateMissing && result.templateMissing.length) reasons.push(`missing template headings: ${result.templateMissing.join(", ")}`);
  if (result.commandMissing && result.commandMissing.length) reasons.push(`missing tool commands: ${result.commandMissing.join(", ")}`);
  if (result.visibleForbiddenFound && result.visibleForbiddenFound.length) reasons.push(`forbidden visible text: ${result.visibleForbiddenFound.join(", ")}`);
  if (result.visibleForbiddenRegexFound && result.visibleForbiddenRegexFound.length) reasons.push(`forbidden visible pattern: ${result.visibleForbiddenRegexFound.join(", ")}`);
  if (result.commandForbiddenFound && result.commandForbiddenFound.length) reasons.push(`forbidden tool command: ${result.commandForbiddenFound.join(", ")}`);
  if (result.forbiddenWorkBotDeviceHostsFound && result.forbiddenWorkBotDeviceHostsFound.length) reasons.push(`forbidden WorkBot device host: ${result.forbiddenWorkBotDeviceHostsFound.join(", ")}`);
  if (result.stepViolations && result.stepViolations.length) reasons.push(`step violations: ${result.stepViolations.join(" | ")}`);
  if (!result.toolEvidenceOk) reasons.push("no tool-call evidence");
  if (result.perStepToolEvidenceMissing && result.perStepToolEvidenceMissing.length) reasons.push(`missing per-step tool evidence: ${result.perStepToolEvidenceMissing.join(", ")}`);
  if (!result.cleanToolTriggerOk) reasons.push("tool follow-up was needed");
  if (!result.cleanCommandTriggerOk) reasons.push("command follow-up was needed");
  if (!result.deviceEvidenceOk) reasons.push("no device evidence");
  if (!result.localVerificationOk) reasons.push("local AD verification failed");
  throw new Error(`${gateName} failed; stopping before later cases. ${reasons.join("; ")}`);
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
    } else if (step && step.adVerify) {
      const expect = step.adVerify;
      const target = step.target || cfg.verifyPresent || cfg.verifyAbsent;
      const localVerification = runLocalAdVerification(step.name || label, cfg, { expect, target });
      responses.push({
        name: step.name || label,
        text: JSON.stringify(localVerification, null, 2),
        agentText: "",
        visibleText: "",
        visibleAgentText: "",
        toolEvidence: { hasEvidence: false, candidates: [] },
        localVerification,
      });
    } else {
      throw new Error(`unsupported step for ${name}: ${JSON.stringify(step)}`);
    }
    const failFastViolations = failFastStepViolationsFor(name, cfg, responses);
    if (failFastViolations.length) {
      log("fail-fast", { name, step: label, violations: failFastViolations });
      if (r2r4NeedsRollbackAfterFailFast(name, responses)) {
        log("fail-fast-cleanup-start", { name, step: label });
        responses.push(await sendPrompt(page, `${name}-failfast-rollback`, "是。"));
        const target = cfg.verifyAbsent || cfg.verifyPresent;
        const localVerification = runLocalAdVerification(`${name}-failfast-ad-absent`, cfg, { expect: "absent", target });
        responses.push({
          name: `${name}-failfast-ad-absent`,
          text: JSON.stringify(localVerification, null, 2),
          agentText: "",
          visibleText: "",
          visibleAgentText: "",
          toolEvidence: { hasEvidence: false, candidates: [] },
          localVerification,
        });
        log("fail-fast-cleanup-done", { name, step: label, localVerification: localVerification.status });
      }
      throw new Error(`${name} failed fast at ${label}; ${failFastViolations.join(" | ")}`);
    }
  }
  const stepViolationsBeforeRecovery = stepRuleViolationsFor(name, cfg, responses);
  const skipRecoveryFollowups = stepViolationsBeforeRecovery.length > 0;
  let combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");

  if (!cfg.steps && cfg.params && asksForParameters(combinedText)) {
    responses.push(await sendPrompt(page, `${name}-params`, cfg.params));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  if (!skipRecoveryFollowups && cfg.requireTools && !responses.some((item) => item.toolEvidence && item.toolEvidence.hasEvidence)) {
    toolFollowupUsed = true;
    responses.push(await sendPrompt(page, `${name}-tool-followup`, NO_TOOL_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }

  const commandExpected = commandExpectedFor(name, cfg);
  if (!skipRecoveryFollowups && cfg.requireTools && commandExpected.length) {
    const commandText = extractToolCommands(responses).join("\n");
    const commandMissing = commandExpected.filter((token) => !commandText.includes(token));
    if (commandMissing.length) {
      commandFollowupUsed = true;
      responses.push(await sendPrompt(page, `${name}-command-followup`, COMMAND_FOLLOWUP.replace("{missing}", commandMissing.join(", "))));
      combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
    }
  }

  if (!skipRecoveryFollowups && cfg.requireDevice && !hasDeviceEvidence(combinedText)) {
    deviceFollowupUsed = true;
    responses.push(await sendPrompt(page, `${name}-device-followup`, DEVICE_FOLLOWUP));
    combinedText = responses.map((item) => `${item.agentText}\n${item.text}`).join("\n");
  }
  const localVerification = !skipRecoveryFollowups && VERIFY_AD && (cfg.requireDevice || cfg.verifyPresent || cfg.verifyAbsent) ? runLocalAdVerification(name, cfg) : { status: "disabled" };

  return verify({
    name,
    prompt: prompts
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && item.upload) return `[upload] ${item.upload}`;
        if (item && item.adVerify) return `[ad-verify] ${item.adVerify}`;
        return `[step] ${JSON.stringify(item)}`;
      })
      .join("\n\n"),
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
    log("main-start", { caseSuite: CASE_SUITE, cases: CASES, zip: ZIP_PATH, outDir: OUT_DIR, freshAgent: FRESH_AGENT });
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
    if (FRESH_AGENT) {
      debug.freshAgent = await ensureFreshAgent(page);
      debug.freshAgent.initialization = await initializeFreshAgent(page);
    }
    if (CASES.includes("cleanup")) {
      const cleanupResult = await runCase(page, "cleanup");
      results.push(cleanupResult);
      assertGate(cleanupResult, "cleanup");
    }
    const needsInstalledSkills = CASES.some((name) => name !== "install" && name !== "cleanup") || CASES.includes("install");
    if (needsInstalledSkills) {
      await uploadZip(page);
      const installResult = await runCase(page, "install");
      results.push(installResult);
      assertGate(installResult, "install");
    }
    for (const name of CASES.filter((name) => name !== "install" && name !== "cleanup")) {
      const result = await runCase(page, name);
      results.push(result);
      assertGate(result, name);
    }
  } catch (error) {
    failure = error;
    debug.error = error && error.stack ? error.stack : String(error);
    if (error && error.rateLimited) {
      debug.rateLimited = true;
      debug.rateLimitResetAt = error.resetAt || "";
      debug.rateLimitArtifacts = error.artifacts || null;
    }
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
      rateLimited: Boolean(failure && failure.rateLimited),
      rateLimitResetAt: failure && failure.rateLimited ? failure.resetAt || "" : "",
      debug,
      created_at: new Date().toISOString(),
    };
    const reportPath = path.join(OUT_DIR, `workbot-acceptance-${Date.now()}.json`);
    fs.writeFileSync(reportPath, redactSensitive(JSON.stringify(report, null, 2)), "utf8");
    console.log(JSON.stringify({ ok: report.ok, report: reportPath }, null, 2));
    if (browser) await browser.close();
  }
  if (failure) process.exitCode = 1;
}

await main();
