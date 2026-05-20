#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Shared SQL schema for collector.py and perception.py.
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

COLUMNS = ["ts", "vs_name", "metric", "value"]
