import json
import os
import sys

report_dir = sys.argv[1] if len(sys.argv) > 1 else r"c:\Users\Administrator\Downloads\report_681550F1_admin_标准巡检_20260521113506"

# Load ad.json
ad_path = os.path.join(report_dir, "ad.json")
if not os.path.exists(ad_path):
    for root, _, files in os.walk(report_dir):
        if "ad.json" in files:
            ad_path = os.path.join(root, "ad.json")
            break

with open(ad_path, encoding="utf-8") as f:
    ad = json.load(f)

check_path = os.path.join(report_dir, "acheck_offline_check_info.json")
with open(check_path, encoding="utf-8") as f:
    check_info = json.load(f)

RULE_FIELD_MAP = {
    "ssh_or_adapi_authority": ["ssh_authority", "ADAPI_authority"],
    "patch_info": ["patch_info"],
    "base_report_stability": ["base_report_stab"],
    "weak_password": ["weak_pwd"],
    "ssl_strategy_check": ["unsafe_algorithm", "unsafe_protocol"],
    "enable_iplimit": ["enable_iplimit"],
    "dangerous_port": ["dangerous_port"],
    "security_check": ["security_check_state"],
    "cluster_brain_split_check": ["cluster_brain_split_check"],
    "check_admin_account": ["admin_account", "admin"],
    "base_app_version": ["ad_appversion"],
    "bios_version_check": ["bios_update_state"],
    "shm_sem_check": ["shm_sem_state"],
    "base_conntrack": ["conntrack_count", "conntrack_new_count"],
    "power_state": ["power_state"],
    "fan_state": ["fan_state"],
    "acceleration_check": ["acceleration"],
    "base_memory": ["base_mem_usage", "snmp_mem_rate"],
    "base_crash_time": ["base_crash_time"],
    "base_disk": ["base_disk_read_only", "base_disk_high_usage", "disk_info"],
    "remote_maintenance": ["remote_mt"],
    "base_kernel_log": ["base_kernel_log"],
    "base_core_process": ["base_core_process_lack"],
    "base_net_state": ["base_net_state", "base_eth_abnormal", "base_eth_mtu",
                       "base_drop_err_packet_rate", "base_eth_info"],
    "base_file_leak": ["base_file_ds"],
    "base_cpu_info": ["base_cpu_usage", "base_cpu_mpstat", "base_cpu_use_rate"],
    "base_err_log": ["base_log_error_exist"],
    "base_running_time": ["base_running_time"],
    "check_dev_online": ["online"],
    "base_blackbox_data": ["base_blackbox_dmesg"],
    "base_blackbox_state": ["base_blackbox_state"],
    "alarms_enabled": ["alarms_enabled"],
    "config_id_conflict_check": ["id_conflict_list"],
    "nic_health_check": ["I350_nic_state", "82599_nic_state"],
    "snat_sport_exhaustion_check": ["snat_sport_exhaustion_log_num"],
}

def fmt_val(v):
    if isinstance(v, str) and len(v) > 80:
        return repr(v[:80] + "...")
    if isinstance(v, list):
        if not v:
            return "[] (空)"
        return f"[{len(v)}] {v[:3]}"
    if isinstance(v, dict):
        if not v:
            return "{} (空)"
        return f"{{{len(v)} keys}} {dict(list(v.items())[:3])}"
    return repr(v)

print("=" * 80)
print(f"设备: {ad.get('dst_ip', '?')}  版本: {ad.get('version', '?')}")
print(f"报告: {check_info.get('name', '?')}")
print(f"规则总数: {len(check_info['rules'])}")
print("=" * 80)

for rule in check_info["rules"]:
    rid = rule["id"]
    checked = rule["checked"]
    status = "PASS" if checked == "true" else "FAIL"
    icon = "O" if checked == "true" else "X"

    fields = RULE_FIELD_MAP.get(rid, [])
    values = []
    for fname in fields:
        if fname in ad:
            values.append(f"  {fname} = {fmt_val(ad[fname])}")
        else:
            values.append(f"  {fname} = (不存在)")

    if not values:
        values = ["  (无映射字段)"]

    print(f"\n[{icon}] {rid}")
    for v in values:
        print(v)

# Also list ad.json keys that are NOT covered by any rule
print("\n" + "=" * 80)
print("ad.json 中存在但未被任何 rule 覆盖的字段:")
print("=" * 80)
all_mapped = set()
for fields in RULE_FIELD_MAP.values():
    all_mapped.update(fields)
ad_keys = set(ad.keys())
# Skip metadata keys
skip = {"version", "gateway_id", "dst_ip", "online", "start_time",
        "ad_appversion", "base_running_time"}
uncovered = ad_keys - all_mapped - skip
for k in sorted(uncovered):
    print(f"  {k} = {fmt_val(ad[k])}")
