# AD Agent 模块

## 概述

`AD-agent/` 是一个基于 LLM 的 AD 设备智能运维代理，提供 Web UI 对话界面，通过自然语言操作 AD 设备。后端负责设备管理、会话管理、API 调用编排，前端提供聊天式交互界面。

## 目录结构

```
AD-agent/
├── backend/              # Python 后端（FastAPI + WebSocket）
│   ├── main.py           # 应用入口
│   ├── config.py         # 配置管理
│   ├── api/              # HTTP/WS 接口层
│   │   ├── chat.py       # WebSocket 聊天端点
│   │   ├── devices.py    # 设备 CRUD API
│   │   └── sessions.py   # 会话管理 API
│   ├── agent/            # Agent 核心
│   │   ├── loop.py       # Agent 循环引擎
│   │   ├── knowledge_loader.py  # 知识加载（SKILL.md 解析）
│   │   └── tools/        # AD API 工具集（自动生成）
│   │       ├── base.py, cgi.py, debug.py, dns.py, ha.py
│   │       ├── lc.py, log.py, net.py, rc.py, slb.py
│   │       ├── stat.py, sys_tools.py
│   ├── device/           # 设备管理
│   │   ├── client.py     # AD API 客户端
│   │   ├── manager.py    # 设备连接池管理
│   │   └── models.py     # 设备数据模型
│   ├── security/         # 安全模块
│   │   ├── crypto.py     # 密码加密
│   │   └── interceptor.py
│   └── session/          # 会话管理
│       ├── manager.py    # 会话生命周期
│       ├── history.py    # 对话历史
│       └── store.py      # 持久化存储
├── frontend/             # React 前端（TypeScript + TailwindCSS）
│   └── src/
│       ├── App.tsx       # 根组件
│       ├── main.tsx      # 入口
│       ├── components/
│       │   ├── ChatWindow.tsx     # 聊天窗口
│       │   ├── Sidebar.tsx       # 侧栏（会话列表/设备选择）
│       │   ├── MessageList.tsx   # 消息列表
│       │   ├── MessageInput.tsx  # 消息输入框
│       │   ├── MarkdownRenderer.tsx  # Markdown 渲染
│       │   ├── ResultPanel.tsx   # 结果面板
│       │   └── ConfirmCard.tsx   # 确认卡片
│       ├── hooks/
│       │   ├── useWebSocket.ts   # WebSocket 连接管理
│       │   ├── useDevices.ts     # 设备状态管理
│       │   └── useSessions.ts    # 会话状态管理
│       └── types.ts      # TypeScript 类型定义
├── tools_generator/      # 工具代码生成器
│   ├── swagger_to_tools.py  # Swagger → Python 工具代码
├── tests/                # 后端测试（pytest）
│   ├── conftest.py
│   ├── test_crypto.py
│   ├── test_device_*.py
│   ├── test_session.py
│   ├── test_api_chat.py
│   ├── test_e2e_cases.py
│   └── test_e2e_real.py
├── docs/                 # 设计文档
│   └── superpowers/
│       ├── specs/        # 设计规范
│       │   ├── 2026-04-25-ad-agent-design.md
│       │   ├── 2026-04-26-multi-device-enterprise-ui-design.md
│       │   └── 2026-04-26-agent-e2e-tests-design.md
│       └── plans/        # 实现计划
│           ├── 2026-04-25-ad-agent.md
│           ├── 2026-04-26-multi-device-enterprise-ui.md
│           └── 2026-04-26-agent-e2e-tests.md
└── AD API document/      # AD REST API 参考文档
    ├── json/             # API 示例（cgi/debug/dns/ha/lc/log/net/rc/slb/stat/sys）
    ├── css/, js/, imgs/  # 文档渲染资源
```

## 核心架构

```
浏览器 (React + TailwindCSS)
  ↕ WebSocket (ws://)
FastAPI 后端
  ├── Agent Loop (agent/loop.py)
  │   ├── 解析用户意图
  │   ├── 加载 skill 知识 (knowledge_loader.py)
  │   └── 调度 tools/
  ├── 设备管理 (device/manager.py)
  │   └── ADClient (device/client.py)
  └── 会话管理 (session/manager.py)
```

## 前端技术栈

- **框架**: React 19 + TypeScript
- **构建**: Vite (Rolldown)
- **样式**: TailwindCSS 4
- **Markdown**: react-markdown + remark-gfm
- **WebSocket**: 自定义 `useWebSocket` hook（自动重连、消息队列）

## 后端技术栈

- **框架**: FastAPI + WebSocket
- **密码安全**: Fernet 加密（`security/crypto.py`）
- **测试**: pytest + pytest-asyncio
- **代码生成**: `tools_generator/` 从 Swagger/OpenAPI 规范自动生成 AD API 工具代码

## 权重

| 维度 | 说明 |
|------|------|
| 前端源码 | ~12 个 TSX 文件 |
| 后端源码 | ~30 个 Python 文件 |
| 测试 | ~16 个测试文件（含 E2E） |
| AD API 工具 | 11 个模块（cgi/debug/dns/ha/lc/log/net/rc/slb/stat/sys） |
