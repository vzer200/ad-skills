# CLAUDE.md

This repository contains Sangfor AD/ADC operation skills for WorkBot and Claude-compatible skill runtimes.

## Project Overview

The core implementation lives under `.claude/skills/`. The model must only schedule scripts and display script output. It must not call AD APIs directly, handcraft business conclusions, or invent device state.

## Architecture

```text
.claude/skills/
  ad-connect/             connection and auth precheck
  ad-ops/                 ADClient, overview, config/status/cert/traffic queries
  ad-config-ops/          API-document driven config generation, apply, verify, rollback
  ad-check-analysis/      standard and batch inspection workflows
  ad-perception/          traffic/state/conflict/log perception analysis
```

Shared rule: every user-facing result must come from `scripts/` stdout or a generated script summary.

## Devices

`devices.json` is the authoritative device list.

| Device | Host | User | Password |
| --- | --- | --- | --- |
| AD1 | `https://192.168.8.30` | `admin` | Stored in `devices.json` |
| AD2 | `https://192.168.8.31` | `admin` | Stored in `devices.json` |

Device credentials are stored directly in `devices.json` for WorkBot packaging. Never print, quote, or include passwords in logs, reports, or chat replies.

## Skills

| Skill | Main scripts | Responsibility |
| --- | --- | --- |
| `ad-connect` | `connect.py` | TCP/TLS reachability and Basic Auth precheck |
| `ad-ops` | `ad_api.py`, `overview.py`, `multi_device.py` | VS/Pool/cert/device/traffic/status queries |
| `ad-config-ops` | `lookup_api.py`, `render_template.py`, `ad_ops_flow.py`, `execute_plan.py`, `rollback.py` | API-document driven config generation, apply verification, and rollback |
| `ad-check-analysis` | `check.py` | Standard and batch inspection: history, run, progress, wait |
| `ad-perception` | `collector.py`, `perception.py` | Traffic anomaly, state threshold, IP:Port conflict, log correlation |

## Error Codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | Connection failure |
| 2 | Authentication failure |
| 4 | Parameter error |
| 5 | Partial failure |
| 7 | Multi-device partial failure |
| 9 | Import/dependency failure |

## Local Validation

Use a real Python executable, not the Windows Store `python.exe` alias. In this Codex environment the bundled Python path is:

```powershell
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" -m unittest discover -s test -p "test_*.py" -v
```

For skill validation on Windows, set UTF-8 mode:

```powershell
$env:PYTHONUTF8="1"
& "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" C:\Users\Administrator\.codex\skills\.system\skill-creator\scripts\quick_validate.py .claude\skills\ad-ops
```

## WorkBot Acceptance

See `docs/workbot-acceptance.md` for the fixed prompts, upload flow, and tool-call verification checklist.

## Codex Operating Memory

Before modifying, committing, pushing, packaging, or running WorkBot acceptance, read `docs/codex-operating-memory.md`. It records the project-local Git connection, commit, test, package, and WorkBot runbook.
