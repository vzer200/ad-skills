#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""AD 单臂打流脚本 —— Windows 既当客户端又当服务端
独立基准测试工具，用于验证 AD 设备虚拟服务的连通性和吞吐量。
不属于 skills 系统，仅供开发调试使用。

用法:
    python ad_bench.py <VIP> [VIP端口] [后端端口] [并发数] [总请求数]
    python ad_bench.py 172.16.1.166               # 持续打流，Ctrl+C 停止
    python ad_bench.py 172.16.1.166 80 8080 20    # 指定后端端口8080，20并发
"""

import signal
import sys
import time
import socket
import threading
import http.server

# ========== 后端服务 ==========

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

def start_server(port):
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), QuietHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[服务端] 后端已启动 → http://0.0.0.0:{port}")
    return server


# ========== 打流客户端 ==========

def send_one(vip, vport, timeout=5):
    start = time.perf_counter()
    try:
        sock = socket.create_connection((vip, vport), timeout=timeout)
        sock.sendall(
            f"GET / HTTP/1.0\r\nHost: {vip}\r\nConnection: close\r\n\r\n".encode()
        )
        data = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            data += chunk
        sock.close()
        elapsed = (time.perf_counter() - start) * 1000
        body = data.split(b"\r\n\r\n", 1)[-1].decode(errors="ignore").strip()
        return (True, elapsed, body)
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return (False, elapsed, str(e))


def bench(vip, vport, concurrency, total=None):
    """
    total=None → 无限循环，Ctrl+C 停止
    total=N   → 打满 N 次停止
    """
    import queue

    running = [True]
    count = [0]
    success = [0]
    fail = [0]
    latencies = []
    lock = threading.Lock()

    if total:
        print(f"\n[客户端] 目标 → {vip}:{vport}  并发={concurrency}  总请求={total}")
    else:
        print(f"\n[客户端] 目标 → {vip}:{vport}  并发={concurrency}  持续打流 (Ctrl+C 停止)")
    print()

    start_time = time.perf_counter()

    def worker():
        while running[0]:
            lat, ok, resp = send_one(vip, vport)
            with lock:
                count[0] += 1
                if ok:
                    success[0] += 1
                    latencies.append(lat)
                else:
                    fail[0] += 1

                n = count[0]
                if n % 100 == 0:
                    elapsed = time.perf_counter() - start_time
                    rps = n / elapsed
                    avg = sum(latencies[-100:]) / min(len(latencies), 100)
                    print(f"  [{n}] 成功={success[0]} 失败={fail[0]}  RPS={rps:.0f}  近100次平均延迟={avg:.1f}ms")

                if total and n >= total:
                    running[0] = False

    threads = []
    for _ in range(concurrency):
        t = threading.Thread(target=worker, daemon=True)
        t.start()
        threads.append(t)

    # 等所有线程结束 / Ctrl+C
    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        pass

    running[0] = False

    elapsed = time.perf_counter() - start_time
    n = count[0]
    print(f"\n========== 结果 ==========")
    print(f"总请求: {n}  成功: {success[0]}  失败: {fail[0]}")
    print(f"耗时: {elapsed:.1f}s  平均 RPS: {n / elapsed if elapsed > 0 else 0:.0f}")
    if latencies:
        latencies.sort()
        print(f"延迟(ms): 最小={latencies[0]:.1f}  平均={sum(latencies)/len(latencies):.1f}  最大={latencies[-1]:.1f}")
        p50 = latencies[int(len(latencies) * 0.5)]
        p99 = latencies[int(len(latencies) * 0.99)]
        print(f"延迟(ms): P50={p50:.1f}  P99={p99:.1f}")


# ========== 主入口 ==========

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    vip = sys.argv[1]
    vport = int(sys.argv[2]) if len(sys.argv) > 2 else 80
    backend_port = int(sys.argv[3]) if len(sys.argv) > 3 else 80
    concurrency = int(sys.argv[4]) if len(sys.argv) > 4 else 20
    total = int(sys.argv[5]) if len(sys.argv) > 5 else None  # None=无限循环

    # 启动后端
    server = start_server(backend_port)

    # 等一秒确保服务就绪
    time.sleep(1)

    # 先验证链路
    print(f"[验证] 直连后端 http://127.0.0.1:{backend_port} ... ", end="")
    ok, lat, resp = send_one("127.0.0.1", backend_port)
    print(f"OK ({lat:.1f}ms)")

    print(f"[验证] 通过 VIP 访问 http://{vip}:{vport} ... ", end="")
    ok, lat, resp = send_one(vip, vport)
    if not ok:
        print(f"FAIL ({lat:.1f}ms) — {resp}")
        print(f"\n[告警] VIP 访问失败，检查 AD#2 虚拟服务+SNAT 配置后再试")
        sys.exit(1)
    print(f"OK ({lat:.1f}ms)")

    bench(vip, vport, concurrency, total)
