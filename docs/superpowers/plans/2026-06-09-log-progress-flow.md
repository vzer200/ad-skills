# Log Progress Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a progress-style service-log query flow so long date-range semantic log scans can continue across WorkBot tool calls without hitting the 60 second command timeout.

**Architecture:** Keep the implementation inside `perception.py` beside the existing logs command. Persist a small JSON job file under the OS temp directory with scan parameters, per-level/module pagination offsets, and matched entries. `logs-start` creates the job, `logs-progress` advances bounded work, and `logs-wait` loops progress for a bounded timeout before rendering the same markdown shape as `logs`.

**Tech Stack:** Python standard library, existing AD client APIs, existing markdown rendering helpers, `unittest`.

---

### Task 1: Regression Tests

**Files:**
- Modify: `test/test_perception_logs.py`

- [ ] **Step 1: Add a fake paged log client and tests**

Add tests that create a job for a fake host, call progress with a one-page budget so the first call remains unfinished, then call progress again and verify the second page address conflict is matched.

- [ ] **Step 2: Run tests and verify failure**

Run: `python -m unittest test.test_perception_logs -v`

Expected: failure because job helpers do not exist yet.

### Task 2: Job State and Progress Helpers

**Files:**
- Modify: `.claude/skills/ad-perception/scripts/perception.py`

- [ ] **Step 1: Implement job helpers**

Add helpers to build a job id, write/read temp JSON state, initialize scan cursors from levels/modules, advance a bounded number of pages, and render a progress result.

- [ ] **Step 2: Keep display limit separate**

Store `display_limit` separately from `page_size`; keep output entries capped to `display_limit`.

### Task 3: CLI Commands

**Files:**
- Modify: `.claude/skills/ad-perception/scripts/perception.py`

- [ ] **Step 1: Add `logs-start`, `logs-progress`, and `logs-wait` parsers**

Commands accept the same device connection options. `logs-progress` and `logs-wait` accept `--job-id`.

- [ ] **Step 2: Wire command handling**

`logs-start` writes state and prints job id. `logs-progress` advances one bounded slice and prints progress markdown or JSON. `logs-wait` advances repeatedly until done or timeout and prints final markdown when done.

### Task 4: Verification

**Files:**
- Modify: `test/test_perception_logs.py`
- Modify: `.claude/skills/ad-perception/scripts/perception.py`

- [ ] **Step 1: Run tests**

Run: `python -m unittest discover -s test -p "test_*.py" -v`

- [ ] **Step 2: Compile**

Run: `python -m py_compile .claude/skills/ad-perception/scripts/perception.py test/test_perception_logs.py`
