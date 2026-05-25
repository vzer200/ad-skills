# AD Skills Module

`.claude/skills/` contains six AD operation skills. The common contract is simple: the model schedules scripts, scripts perform the work, and user-facing answers display script output or short script summaries.

## Skill List

| Skill | Path | Responsibility | Typical command |
| --- | --- | --- | --- |
| `ad-connect` | `.claude/skills/ad-connect/` | Device reachability and auth precheck | `connect.py --devices devices.json --format json` |
| `ad-ops` | `.claude/skills/ad-ops/` | Config, VS, Pool, cert, traffic, status queries | `overview.py all --host ... --format markdown` |
| `ad-check-analysis` | `.claude/skills/ad-check-analysis/` | Standard and batch inspection | `check.py history/run/progress/wait` |
| `ad-perception` | `.claude/skills/ad-perception/` | Traffic/state/conflict/log perception analysis | `perception.py analyze --host ...` |
| `ad-config-ops` | `.claude/skills/ad-config-ops/` | Offline config script generation for VS, Pool, nodes, HTTP Profile, Pre Rule, and other bundles | `render_slb_bundle.py`, then `ad_ops_flow.py plan-and-render` |

## Shared Rules

- Run `ad-connect` before any real-device query, inspection, perception analysis, or apply validation.
- Do not let the model call AD APIs directly.
- Do not let the model write reports, root causes, payloads, batch JSON, or apply scripts by hand.
- Display stdout from the relevant script. If the script prints JSON, use the JSON fields directly and do not infer missing state.
- For `ad-config-ops`, default to generation only. `--execute` requires a separate explicit user confirmation.

## Device List

`devices.json` contains AD1 and AD2:

| Device | Host | User | Password |
| --- | --- | --- | --- |
| AD1 | `https://192.168.8.30` | `admin` | Stored in `devices.json` |
| AD2 | `https://192.168.8.31` | `admin` | Stored in `devices.json` |

## Dependency Direction

```text
ad-connect -> ad-ops/ad-check-analysis/ad-perception/ad-config-ops real-device validation
ad-ops/ad_api.py -> reused by query, inspection, and perception scripts
ad-config-ops -> independent offline generation scripts, real apply only after confirmation
```

## Boundaries

| User need | Use | Do not use |
| --- | --- | --- |
| Standard inspection report | `ad-check-analysis` | `ad-perception` |
| Config/status/cert/traffic overview | `ad-ops` | model-written tables |
| Traffic/state/conflict/log anomaly analysis | `ad-perception` | `ad-check-analysis` |
| Generate new VS with XFF, Pre Rule, Pool, nodes, or referenced policies | `ad-config-ops` | handwritten YAML or API payload |
