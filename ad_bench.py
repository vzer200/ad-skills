#!/usr/bin/env python
"""AD 单臂打流脚本 —— Windows 既当客户端又当服务端

用法:
    python ad_bench.py <VIP> [端口] [并发数] [总请求数]
    python ad_bench.py 192.168.1.200
    python ad_bench.py 192.168.1.200 80 20 5000
"""

import sys
import time
import socket
import threading
import http.server

# ========== 后端服务 ==========

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """返回固定内容，不打印访问日志"""
    def log_message(self, format, *args):
        pass  # 安静模式

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")
        self.wfile.write(bytes(self.client_address[0], "utf-8"))

def start_server(port):
    """在后台线程启动后端 HTTP 服务"""
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), QuietHandler)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    print(f"[服务端] 后端已启动 → http://0.0.0.0:{port}")
    return server


# ========== 打流客户端 ==========

def send_one(vip, vport, timeout=5):
    """发一次请求，返回 (序号, 状态码, 延迟ms, 后端IP)"""
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
        return (elapsed, body)
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return (elapsed, str(e))


def bench(vip, vport, concurrency, total):
    """多线程打流"""
    import queue

    print(f"\n[客户端] 目标 → {vip}:{vport}")
    print(f"[客户端] 并发={concurrency}  总请求={total}")
    print(f"[客户端] 开始打流...\n")

    q = queue.Queue()
    for i in range(total):
        q.put(i)

    results = []
    lock = threading.Lock()
    success = 0
    fail = 0
    latencies = []

    def worker():
        nonlocal success, fail
        while True:
            try:
                idx = q.get_nowait()
            except queue.Empty:
                return
            lat, resp = send_one(vip, vport)
            with lock:
                results.append((idx, lat, resp))
                if isinstance(resp, str) and resp.startswith("["):
                    fail += 1
                else:
                    success += 1
                    latencies.append(lat)
                done = success + fail
                if done % 50 == 0 or done == total:
                    print(f"  进度 {done}/{total}  成功={success}  失败={fail}", end="")
                    if latencies:
                        avg = sum(latencies[-50:]) / len(latencies[-50:])
                        print(f"  近50次平均延迟={avg:.1f}ms", end="")
                    print()

    threads = []
    for _ in range(concurrency):
        t = threading.Thread(target=worker, daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    print(f"\n========== 结果 ==========")
    print(f"总请求: {total}")
    print(f"成功:   {success}")
    print(f"失败:   {fail}")
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
    concurrency = int(sys.argv[3]) if len(sys.argv) > 3 else 20
    total = int(sys.argv[4]) if len(sys.argv) > 4 else 1000
    backend_port = 8080

    # 启动后端
    server = start_server(backend_port)

    # 等一秒确保服务就绪
    time.sleep(1)

    # 先验证链路
    print(f"[验证] 直连后端 http://127.0.0.1:{backend_port} ... ", end="")
    lat, resp = send_one("127.0.0.1", backend_port)
    print(f"{resp} ({lat:.1f}ms)")

    print(f"[验证] 通过 VIP 访问 http://{vip}:{vport} ... ", end="")
    lat, resp = send_one(vip, vport)
    print(f"{resp} ({lat:.1f}ms)")
    if resp.startswith("["):
        print(f"\n[告警] VIP 访问失败，检查 AD#2 虚拟服务+SNAT 配置后再试")
        sys.exit(1)

    # 正式打流
    bench(vip, vport, concurrency, total)
