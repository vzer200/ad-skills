#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collector.py 和 perception.py 共享的 SQL 表结构定义。
"""

SCHEMA_VERSION = 1

SCHEMA_VERSION_DDL = """
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);
INSERT OR IGNORE INTO schema_version (version) VALUES (1);
"""

VS_SAMPLES_DDL = """
CREATE TABLE IF NOT EXISTS vs_samples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    vs_name TEXT NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(ts, vs_name, metric)
);
"""

DEVICE_STATE_DDL = """
CREATE TABLE IF NOT EXISTS device_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    metric TEXT NOT NULL,
    value REAL NOT NULL,
    UNIQUE(ts, metric)
);
"""

INIT_DDL = SCHEMA_VERSION_DDL + VS_SAMPLES_DDL + DEVICE_STATE_DDL

COLUMNS = ["ts", "vs_name", "metric", "value"]

if __name__ == "__main__":
    print("This module is not meant to be run directly.", file=sys.stderr)
