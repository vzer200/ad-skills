# SLB Bundle And WorkBot Automation Design

## Goal

Implement the minimum stable SLB configuration generation matrix and automate the repeated acceptance flow:

1. run full tests
2. validate skills
3. smoke SLB bundle generation
4. commit and push
5. package AD skills
6. clear WorkBot skills/memory
7. upload package
8. run fixed acceptance prompts
9. capture tool-call evidence

## Minimum SLB Combination Matrix

The project does not attempt to support every possible AD SLB object graph. The minimum supported combinations are:

| Case | Generated or referenced resources | Required script support |
| --- | --- | --- |
| VS + existing Pool | Create VS referencing an existing pool | `render_slb_bundle.py --pool` |
| VS + Pool + Nodes | Create Pool with inline nodes, then create VS | `--node ip:port` |
| VS + existing HTTP Profile | Create VS referencing existing HTTP Profile | `--http-profile` |
| VS + new XFF HTTP Profile | Create XFF HTTP Profile, then create VS | `--create-http-profile-xff` |
| VS + existing Pre Rule | Create VS referencing existing Pre Rule | `--pre-rule` |
| VS + new HTTP Pre Rule | Create HTTP Pre Rule, then create VS | `--create-pre-rule-http` |
| VS + Pool + XFF + Pre Rule | Combined dependencies in sorted order | combined flags |

## Guardrails

- Generation is offline by default.
- No `--execute` during acceptance prompts.
- Object reuse checks are read-only GETs and must be preceded by `ad-connect`.
- Rendered bundle/plan/batch/apply files are opaque machine artifacts.
- WorkBot final output must follow fixed templates and cite script stdout summaries.

## Automation Scripts

| Script | Purpose |
| --- | --- |
| `tools/package_ad_skills.py` | Create `dist/ad-skills-workbot.zip` with `skills/`, `devices.json`, and WorkBot docs. |
| `tools/workbot_acceptance.mjs` | Login to WorkBot, clear old skills/memory, upload zip, send fixed prompts, and save a JSON evidence report. |
| `tools/run_workbot_acceptance.ps1` | Orchestrate tests, validation, smoke, optional commit/push, packaging, and WorkBot acceptance. |

## Release Command

```powershell
$env:WORKBOT_PASSWORD = "<operator-provided password>"
.\tools\run_workbot_acceptance.ps1 -CommitAndPush
```

Credentials are runtime-only and must not be committed.
