# AD Skills Module

`.claude/skills/` contains four AD operation skills. The common contract is simple: the model schedules scripts, scripts perform the work, and user-facing answers display script output or short script summaries.

## Skill List

| Skill | Path | Responsibility | Typical command |
| --- | --- | --- | --- |
| `ad-connect` | `.claude/skills/ad-connect/` | Device reachability and auth precheck | `connect.py --devices devices.json --format json` |
| `ad-ops` | `.claude/skills/ad-ops/` | Config, VS, Pool, cert, traffic, status queries | `overview.py all --host ... --format markdown` |
| `ad-check-analysis` | `.claude/skills/ad-check-analysis/` | Standard and batch inspection | `check.py history/run/progress/wait` |
| `ad-perception` | `.claude/skills/ad-perception/` | Traffic/state/conflict/log perception analysis | `perception.py analyze --host ...` |

## Shared Rules

- Run `ad-connect` before any real-device query, inspection, perception analysis, or apply validation.
- Do not let the model call AD APIs directly.
- Do not let the model write reports, root causes, payloads, batch JSON, or apply scripts by hand.
- Display stdout from the relevant script. If the script prints JSON, use the JSON fields directly and do not infer missing state.

## Device List

`devices.json` contains AD1 and AD2:

| Device | Host | User | Password |
| --- | --- | --- | --- |
| AD1 | `https://192.168.8.30` | `admin` | Stored in `devices.json` |
| AD2 | `https://192.168.8.31` | `admin` | Stored in `devices.json` |

## Dependency Direction

```text
ad-connect -> ad-ops/ad-check-analysis/ad-perception real-device validation
ad-ops/ad_api.py -> reused by query, inspection, and perception scripts
```

## Boundaries

| User need | Use | Do not use |
| --- | --- | --- |
| Standard inspection report | `ad-check-analysis` | `ad-perception` |
| Config/status/cert/traffic overview | `ad-ops` | model-written tables |
| Traffic/state/conflict/log anomaly analysis | `ad-perception` | `ad-check-analysis` |
