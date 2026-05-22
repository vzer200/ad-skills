# Skills Changelog

## v2.1.1 (2026-05-22)

| Item | Change |
| --- | --- |
| `ad-config-ops` | Added the skill from the provided AD-OPS package and renamed it to lowercase `ad-config-ops` for valid skill metadata. |
| `ad-config-ops` | Added `render_slb_bundle.py`, a deterministic composition workflow for VS, Pool, nodes, HTTP Profile XFF, and HTTP Pre Rule combinations. |
| `ad-config-ops` | Added `discover_reuse.py` for read-only discovery of reusable XFF HTTP Profiles before rendering a bundle. |
| `ad-config-ops` | Fixed `optionalEnum` validation so fields such as `http_profile` can reference object names while still allowing special values like `NONE`. |
| `ad-perception` | Restored the legacy `collector.py daemon` subcommand and collection loop for compatibility with existing docs/tests. |
| All AD skills | Rewrote key `SKILL.md` files in readable UTF-8 Chinese and tightened the script-only output contract for WorkBot stability. |
| Docs | Added WorkBot acceptance prompts and tool-call verification guidance. |

Rollback: revert this change set and remove `.claude/skills/ad-config-ops/` if the config generation workflow must be withdrawn.

## v2.1.0 (2026-05-21)

Code quality release for existing AD operation skills, covering retry handling, password-source precedence, progress error handling, perception conflict matching, overview guardrails, and import hygiene.

## v2.0.0 (2026-05-21)

Initial unified skill template release for AD operation skills.
