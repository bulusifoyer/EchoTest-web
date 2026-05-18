# EchoTest-web（前端）

基于 Vue 3 + Vite + Element Plus 的 EchoTest 测试平台前端。

页面布局严格对照 `../docs/screenshots/html/` 下的论文截图实现，UI 风格为「Element Plus 克制 B2B 后台风」。
所有数据均来自真实后端，**不内置 mock**。

> 已实现：登录 / 注册、项目管理、环境管理、接口管理 + 在线试调、用例管理 + 编辑器、项目工作区上下文。
> 进行中：测试执行入口、报告详情页（阶段 7，对接后端 M3）。

---

## 1. 技术栈

| 组件 | 版本 |
| --- | --- |
| Vue | 3.3.x |
| Vite | 5.x |
| Vue Router | 4.x |
| Pinia | 2.x |
| Element Plus | 2.x |
| Axios | 1.x |
| Node.js | **20.x**（实测 20.18.1） |

监听端口：**3000**（vite dev）。

---

## 2. 环境准备

### 2.1 必需

- Node.js 18+ / npm 9+（推荐 Node 20.x）
- 已启动并可访问的后端服务（默认 `http://localhost:8080`，启动指南见 `../EchoTest-service/README.md`）

### 2.2 推荐：使用本仓库工具链脚本

仓库根目录的 `EchoTest-service/.echotest-env.sh` 同时把 `~/.echotest-toolchain` 下的 Node.js 注入当前 shell：

```bash
cd EchoTest-web
source ../EchoTest-service/.echotest-env.sh
node -v   # v20.18.1
npm -v
```

---

## 3. 安装依赖

```bash
cd EchoTest-web
npm install
```

> 仓库 **保留** `package-lock.json`，建议直接 `npm install` 复现锁定版本。
> `node_modules/` 与 `dist/` 都已在 `.gitignore` 中，不要提交。

---

## 4. 启动开发服务器

```bash
npm run dev
# 启动后会自动打开浏览器
# 访问 http://localhost:3000
```

启动成功的标志：终端出现
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

### 4.1 与后端的通信方式

前端代码直接请求 `http://localhost:8080/api/*`（见 `src/utils/request.js`）。
后端默认已开启 CORS，前端**无需 vite proxy**。

如需启用 vite 代理（例如部署反向代理或后端跨域出问题时），打开 `vite.config.js` 中已注释掉的 `server.proxy` 段即可。

### 4.2 后端必须先启动

启动顺序：
1. Docker Desktop 启动 → `docker start echotest-mysql`
2. `cd ../EchoTest-service && mvn spring-boot:run`（监听 8080）
3. `cd ../EchoTest-web && npm run dev`（监听 3000）

如果第 2 步未完成就启动前端，登录会因 `ERR_CONNECTION_REFUSED` 失败。

---

## 5. 生产构建

```bash
npm run build           # 输出 dist/，每次发布前必须能跑通
npm run preview         # 本地预览 dist/，端口 4173
```

`npm run build` 失败一定要修；任何 stage 完成前必须验证。

---

## 6. 代码检查

```bash
npm run lint            # eslint 自动 fix
npm run format          # prettier 全量格式化
```

---

## 7. 主要目录

```
EchoTest-web/
├── vite.config.js
├── package.json
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/                 # 路由 + 守卫（含 requireProject 项目工作区守卫）
│   ├── store/                  # pinia：user / project（项目工作区上下文，持久化到 localStorage）
│   ├── api/                    # 与后端 1:1 对应的 axios 封装
│   │   ├── user.js
│   │   ├── project.js
│   │   ├── environment.js
│   │   ├── apiDefinition.js
│   │   ├── testCase.js
│   │   └── (execution.js)      # 阶段 7 增加
│   ├── utils/
│   │   ├── request.js          # axios 实例 + 全局拦截
│   │   ├── format.js           # relativeTime / JSON 工具 / byteSize
│   │   └── projectContext.js   # 路由 query 与 store 的 projectId 解析
│   ├── styles/
│   │   ├── tokens.css          # 设计 tokens（覆盖 Element Plus 主色）
│   │   └── global.css          # 全局基线（背景 / 卡片 / tag 配色）
│   └── views/
│       ├── Login.vue           # 登录 / 注册（不参与本轮重做）
│       ├── Home.vue            # 顶栏 + 侧栏 + 当前项目 chip
│       ├── Welcome.vue         # 首页占位
│       ├── Placeholder.vue     # 阶段未上线模块的统一占位
│       ├── project/            # 项目管理（卡片网格）
│       ├── environment/        # 环境管理（左 280 列表 + 右详情）
│       ├── api/                # 接口管理 + 在线试调
│       └── case/               # 用例列表 + 用例编辑器
```

---

## 8. 常见问题

**Q：登录后接口都返回 401？**
- token 写在 localStorage `token`；可以打开 DevTools → Application 删掉重登
- 检查后端是否在 8080 监听：`curl -i 'http://localhost:8080/api/auth/check-username?username=ping'`

**Q：登录后空状态卡片提示「请先选择一个项目」？**
- 阶段 3.5 起，业务模块均有 `requireProject` 守卫；正常路径必须先在「项目管理」点进某个项目
- 顶栏中部应能看到「当前项目：XXX · 切换项目」chip
- 如果 `localStorage.echotest_current_project` 被你手动清除，刷新后会被守卫弹回 `/project`

**Q：`vite` 进程因解析报错退出，浏览器一直停留在旧错误页？**
- 终端重新 `npm run dev`；HMR 客户端会自动重连
- 浏览器不能识别新 dev server 时，硬刷新 `Cmd/Ctrl + Shift + R`

**Q：3000 端口被占？**
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN -t | xargs -r kill -9
```

**Q：后端只能在某台机/某 IP 访问？**
修改前端 axios baseURL（`src/utils/request.js`）或在 `vite.config.js` 启用 proxy 把 `target` 改到正确地址。

---

## 9. UI 设计参考（仅查阅，不要搬代码）

| 模块 | 参考文件 |
| --- | --- |
| 项目管理 | `../docs/screenshots/html/project_management.html` |
| 环境管理 | `../docs/screenshots/html/env_management.html` |
| 接口管理 + 试调 | `../docs/screenshots/html/api_management.html` |
| 用例编辑 | `../docs/screenshots/html/case_editor.html` |
| 报告详情 | `../docs/screenshots/html/report_detail.html` |
| 设计 tokens | `../docs/screenshots/html/_common.css` |

参考文件是**视觉对照基准**，请使用 Vue 3 + Element Plus 的真实组件实现，不要照搬静态 HTML/CSS。

---

## 10. 提交规范（仅本仓库）

- Commit message：`feat(stage-N): xxx 页面/模块`、`fix(P{编号}): xxx`
- **不提交**：`node_modules/`、`dist/`、`logs/`（已在 `.gitignore`）
- 每个 stage 完成必须 `npm run build` 通过
- 跨端改动：先后端 + 改 `../docs/api-contract.md` → 再前端 `src/api/*.js` → 各自 commit
