import sqlite3, sys
from datetime import datetime

conn = sqlite3.connect("d:/workSpace/.claude/skills/ad-perception/scripts/vs_samples_https___14.18.243.211_21039.db")
rows = conn.execute("SELECT COUNT(*) FROM vs_samples").fetchone()[0]
groups = conn.execute("SELECT vs_name, metric, COUNT(*) as cnt FROM vs_samples GROUP BY vs_name, metric ORDER BY cnt DESC").fetchall()
print(f"Total rows: {rows}")
print(f"Groups: {len(groups)}")
above30 = [g for g in groups if g[2] >= 30]
print(f"Groups with >= 30 points: {len(above30)}/{len(groups)}")
for g in above30[:10]:
    print(f"  {g[0]}/{g[1]}: {g[2]} pts")
conn.close()
