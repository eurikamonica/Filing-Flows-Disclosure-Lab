# GitHub 部署：独立新仓库，原站保持不变

建议新仓库名：`filing-flows-disclosure-lab`。

预计地址（以你的账号和仓库名为准）：
`https://eurikamonica.github.io/filing-flows-disclosure-lab/`

这不是已经发布的地址；本包未执行任何推送或发布。

## 方案 A：先上线已有快照，不需要任何点开头的文件

1. 在 GitHub 点击 **New repository**，名称填 `filing-flows-disclosure-lab`，选择 Public，创建仓库。
2. 解压 ZIP，进入包含 `README.md`、`app`、`docs`、`config` 的那一级目录。
3. GitHub **Add file → Upload files**，上传**这一层里面的文件和目录**。不要上传 ZIP 本身，也不要再套一层 `Filing-Flows-Disclosure-Lab` 目录。
4. 上传后仓库根目录应直接看到 `docs/index.html` 这条路径。
5. **Settings → Pages → Build and deployment**：Source 选 **Deploy from a branch**；Branch 选 `main`；Folder 选 `/docs`；Save。
6. 等待 GitHub Pages 的发布任务结束，再打开 Pages 显示的地址。

现在网页会显示附带快照，**不会自动下载新数据**。无需 `.github`、`.gitignore`、`.env` 或 `.nojekyll`。本网页使用普通静态文件和相对路径。

之后可以在电脑运行采集器，把更新后的 `docs/data/live.json` 和 `docs/data/live.js` 重新上传，触发网页更新。

## 方案 B：启用自动采集与发布（推荐）

### 为什么 ZIP 没有 `.github`

GitHub Actions 只从 `.github/workflows/` 识别工作流。把 YAML 放在普通 `automation/` 目录不会自动执行。

为避开拖拽上传忽略隐藏目录的问题，本包将模板保存在：

`automation/update-and-deploy.yml`

**ZIP 内零隐藏路径；上传后直接在 GitHub 网页创建所需路径。**如果你要求仓库里永远也不能出现任何点开头的目录，就使用方案 A，本地定时采集后上传，不能把 GitHub Actions 的识别路径改成普通目录。

### 第一步：配置采集身份

仓库 **Settings → Secrets and variables → Actions → New repository secret**：

| Secret 名称 | 填什么 | 作用 |
|---|---|---|
| `SEC_USER_AGENT` | `Eurika eurikamonica@gmail.com` | 可选覆盖；不设置或空值时使用包内默认联系标识 |
| `FDIC_API_KEY` | 官方免费 API key，如需 | 通过 X-Api-Key 头传递 |
| `CFTC_APP_TOKEN` | Socrata app token，如需 | 通过 X-App-Token 头传递 |

本版已按用户要求在配置中预设 `Eurika eurikamonica@gmail.com`。无需额外设置这个 Secret 即可使用默认 SEC 请求标识；它不是 SEC 登录密码。FDIC 和 CFTC 的密钥仍只通过环境变量或 Secrets 提供。

### 第二步：选择 Pages 发布模式

仓库 **Settings → Pages → Build and deployment → Source: GitHub Actions**。

不要同时保留方案 A 的分支发布方式。切换 Source 即可，不需要另建 Pages 发布工作流。

### 第三步：在网页创建工作流

1. 仓库 **Code → Add file → Create new file**。
2. 文件名完整输入：`.github/workflows/update-and-deploy.yml`。
3. 在本地用记事本或 VS Code 打开 `automation/update-and-deploy.yml`，复制全部内容，粘贴到网页编辑器。
4. 点击 **Commit changes**，提交到 `main`。
5. GitHub 会将带 `/` 的文件名识别为目录，不依赖拖拽上传隐藏文件。

备用方式：已安装 Git 时，在本地执行 `py -3.12 automation/install-workflow.py`，再用 Git 命令或 VS Code 源代码管理提交生成的目录。不要再次试图用拖拽上传生成的隐藏目录。

### 第四步：权限

模板声明 `contents: write`、`pages: write` 和 `id-token: write`。如果仓库或组织策略禁止写入：

- 在 **Settings → Actions → General → Workflow permissions** 检查可用的读写权限；
- 如果 `main` 有保护规则，不允许 Actions 直接提交，请按仓库策略调整或改用专门数据分支方案；本试用模板不会绕过分支保护。

模板只适用于新建的独立仓库，不要放进你原来的网站仓库，否则发布目标可能冲突。

### 第五步：手动跑一次

**Actions → Collect disclosures and deploy → Run workflow → main → Run workflow**。

- 默认 `revalidate = false`，复用已成功解析的 N-PX 文件。
- 首次验收可勾选 `revalidate`，重新下载附带报告并核对。
- 页面“采集状态”显示三个模块的状态和覆盖。
- 新版附带 N-PX 两份真实采集报告，状态为 `ok`；之后报错会显示 `partial` 或 `error`。
- 查看工作流日志：COT 与 banks 应显示 `ok`；N-PX 有 errors 时检查 SEC 标识和上游响应。

### 自动频率与失败行为

- 模板每天 **10:37 UTC** 触发；纽约夏令时 06:37，冬令时 05:37。
- 周日自动重新校验已解析 N-PX，平日按 accession 增量。
- 这些数据本来按周/季度/年披露，没有必要每 15 分钟回补全部历史。
- GitHub 定时任务可能延迟，且依赖默认分支及平台调度；不是实时保证。
- 采集失败会保留上次有效数据，先将错误状态发布到网页，再把任务标记失败，方便你在 Actions 发现问题。
- 原文件和下载清单作为 `source-evidence-运行编号` Artifact 保存 30 天。要长期审计，请另行保存到对象存储；30 天 Artifact 不是永久档案。
- 数据 JSON/JS 会提交到独立仓库的 main；小范围试用足够，规模扩大后不要无限累积大文件提交。

## 上线后验收

1. 页面顶部选“官方数据快照”，不会出现虚构银行或 DEMO 标签。
2. COT 切换黄金、WTI、日元及类别，检查报告日、周变化与源链接。
3. 银行切换 CERT 628 / 3510 / 3511，选择两季度；检查千美元单位及 NETINC 累计/单季区分。
4. N-PX 手动运行采集后，检查新文件选择器和申报日；原版、修订应显示为不同文件。
5. 任意模块 CSV 能下载；切换到“虚构演示”时提示必须明确变化。
6. 在手机屏幕检查筛选控件、表格横向滚动和图表文字。

本制作环境没有执行这些真实浏览器验收，请部署后按此清单检查。

## 常见问题

| 问题 | 处理 |
|---|---|
| 网页 404 | 检查 repo 根目录是否直接有 docs；Pages Source 与方案是否一致；查看发布日志 |
| Actions 看不到模板 | 普通 automation/ 只是模板；必须在网页创建 `.github/workflows/update-and-deploy.yml` |
| 页面仍是旧数据 | 查看采集状态和最新工作流；浏览器强制刷新；成功/报告日期不等于网页打开时间 |
| SEC 报错 | 确认请求标识为 Eurika eurikamonica@gmail.com；若设置了 SEC_USER_AGENT，检查其是否覆盖配置；对 403/429 不增加频率；查看源站状态 |
| FDIC 401/403 | 申请官方 API key，设置 FDIC_API_KEY；不要把 key 放在 config/settings.json |
| 推送 403 / protected branch | 检查工作流权限和新仓库分支保护；不要关闭原项目保护来迁就试用包 |
| NPX no_structured_vote_table | 可能是 notice/no-vote/旧 HTML 或不支持格式，打开官方目录核对，不当作零持仓 |
| NPX partial / truncated | 看状态页 discovered 与 selected；按需要提高 max_filings_per_cik |
| Windows 找不到 Python | 附带 HTML 可直接双击；需要更新数据时再安装 Python 3.12，并用 py -3.12 检查 |

## 规模扩大后的部署建议

当前默认跟踪 3 个市场、3 家银行、1 个 N-PX 申报人，适合验证功能。扩大到上千机构时，建议迁移为：持久任务队列 + PostgreSQL/SQLite + 对象存储保存原文件 + 分页静态数据或 API。前端可以继续用这版，但 N-PX 全部历史不应长期塞进一个 live.js。

13F 与官员披露以后分别新建采集器、数据表和页面；共享来源记录和任务状态，不共享“持仓”的错误语义。原 Filing Flows 可以在你以后明确希望整合时仅增加导航入口。
