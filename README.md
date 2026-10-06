# Filing Flows · Disclosure Lab

独立的免费公示数据试用项目：**CFTC COT + FDIC 银行季度财务 + SEC Form N-PX**。

原仓库 `eurikamonica/filing-flows` 没有被修改、推送或部署。本包是全新的标准库 Python + 静态 HTML/JS 项目，不要求复制原项目代码，也不要求开通付费数据服务。

## 本版联系信息

按用户指定：姓名 **Eurika**，邮箱 **eurikamonica@gmail.com**。采集器默认使用 `Eurika eurikamonica@gmail.com` 作为 SEC User-Agent。该联系信息随配置包含在代码包中，上传公开仓库时会公开；它不是密码或 API 密钥。工作流生成的数据提交也使用此姓名与邮箱署名。

## 先体验

1. 解压 ZIP。
2. 双击 `START-HERE.html`，点击“打开交互工作台”；也可以直接打开 `docs/index.html`。
3. 默认显示本包附带的**官方数据快照**。顶部可切换“虚构演示数据”，二者独立保存。
4. 查看“采集状态”了解每个来源的覆盖与失败信息。
5. 如浏览器限制本地文件，可双击 `START-WINDOWS.cmd`（需要 Python 3.12），或执行 `py -3.12 app/serve.py`。

无需 npm、Node.js、pip 安装、在线字体或图表 CDN；看附带页面不需要 Python。

## 本版实际实现

| 模块 | 采集与数据 | 可视化与操作 |
|---|---|---|
| COT | 官方 Socrata API；Disaggregated 与 TFF 的 futures-only 分类；按配置日期范围历史回补；分页、去重 | 市场/类别/日期筛选，净持仓折线，多空对比，连续周净变化，52 期区间位置，历史表与 CSV |
| 银行财务 | FDIC BankFind `/financials`；按 CERT 下载历史；ASSET、DEP、LNLSNET、EQ、NETINC、ROA、ROE | 指标历史折线、任意两季度比较、季度余额比较、累计利润转单季、CSV |
| N-PX | SEC submissions 新申报发现 + 历史分片；accession 文件目录；原 XML 下载与 SHA-256；已成功解析文件复用、可重新核验 | 单份申报选择、历史报告切换、公司/CUSIP/提案搜索、方向筛选、投票分布、投票明细、CSV |
| 运维 | 超时、重试、请求间隔、原文件、来源清单、错误状态、上一版有效数据保留 | 独立状态页；GitHub Actions 定时采集和 Pages 模板 |

**边界：**银行模块是从 Call Reports 衍生的精选财务指标，并不是完整 FFIEC 原始报表库。N-PX 解析结构化 XML，不包含旧版任意 HTML 文档通用解析。所有来源仅覆盖 `config/settings.json` 配置的对象，不是全市场搜索。

**本次不包含：**13F、Form 4、13D/G、国会/州/地方官员报告。它们在前文讨论过，但本包范围明确限定为最后确认的三类免费数据。以后可在独立模块中加入，不要把官员区间金额或 N-PX 股数冒充精确持仓。

## 附带真实数据与验证日期

本包于 2026-10-06 制作，数值直接来自官方响应，不是由演示数据生成：

| 模块 | 附带覆盖 | 验证结果 |
|---|---|---|
| COT | 2023-01-03 至 2026-09-29；WTI、黄金、日元；每市场五种交易者类别，共 2,940 行 | 配置范围的真实 API 抓取、标准化、页面数据生成成功 |
| 银行 | JPMorgan Chase Bank NA (628)、Bank of America NA (3510)、Wells Fargo Bank NA (3511)；2020 Q1 至 2026 Q2；共 78 个银行季度 | 三个 CERT 的真实 API 抓取与标准化成功 |
| N-PX | Nitorum Capital, L.P.；2024 与 2025 两份报告，分别 39、31 条投票表记录，共 70 条 | 使用 Eurika eurikamonica@gmail.com 完成真实自动发现、目录遍历、下载与解析；状态为 `ok` |

N-PX 完整自动发现→目录遍历→逐文件下载→解析的在线链路已于 2026-10-06 使用指定联系标识验证成功。当前官方响应在配置范围内发现两份申报，两份均成功解析，无截断、无错误；这不是全市场覆盖承诺。

具体测试见 `VALIDATION.md`。没有线上发布，没有真实浏览器交互/视觉验收；不要把模板逻辑测试当作浏览器验收。

## 本地更新：Windows / PowerShell

从这个项目的根目录执行。无需激活 venv，也不涉及 PowerShell 的 npm.ps1 执行策略。

```powershell
py -3.12 --version
py -3.12 -m unittest discover -s tests -v

# 已预设 Eurika eurikamonica@gmail.com；通常不必设置环境变量。
# 如需显式指定或覆盖默认值：
$env:SEC_USER_AGENT = "Eurika eurikamonica@gmail.com"

# 以下两个变量按需设置。密钥不得写进网页、配置 JSON 或提交到仓库。
# $env:FDIC_API_KEY = "你的免费 FDIC API key"
# $env:CFTC_APP_TOKEN = "你的 Socrata app token"

py -3.12 app/collect.py
py -3.12 app/serve.py
```

也可以独立运行：

```powershell
py -3.12 app/collect.py --only cot
py -3.12 app/collect.py --only banks
py -3.12 app/collect.py --only npx
py -3.12 app/collect.py --only npx --revalidate
```

macOS/Linux 将 `py -3.12` 换成 `python3`，环境变量使用 `export SEC_USER_AGENT="Eurika eurikamonica@gmail.com"`。

- COT、银行每次重新获取配置范围，反映范围内的历史更正，不是只在末尾追加。
- N-PX 按 accession 增量，成功解析的文件默认复用；`--revalidate` 重新下载。
- `storage/raw/` 保存按 SHA-256 命名的原始响应，`storage/last-run-manifest.json` 记录地址、时间和哈希。`.bin` 是原始字节，JSON/XML 内容可以用编辑器查看。
- 失败时退出码为 1，但已成功模块仍保存；失败模块保留上次数据并标记 error/partial。
- 默认每次响应上限 80 MiB。超大 N-PX 文件会明确失败，需要提高配置或后续升级为流式解析，不会偷偷截断。
- 不要让两个采集进程同时写同一个输出目录。工作流已设置串行；本地请等待前一个命令结束。

## 配置

编辑 `config/settings.json`，不用改代码。

- `cot.since`：ISO 起始日期。`datasets` 每项包括官方数据集 ID、分类 family 和官方合约代码。
- 已验证：WTI `067651`、黄金 `088691` 属于 `72hh-3qpy` / `disaggregated`；日元 `097741` 属于 `gpe5-46if` / `tff`。不要把两套分类的字段对应关系混用。
- `banks.since`：`YYYYMMDD`，建议从某年 1 月 1 日开始，便于构建单季利润。
- `banks.certs`：FDIC 银行 CERT，**不是上市公司 ticker，也不是 SEC CIK**。
- `npx.ciks`：申报基金或机构的 SEC CIK。默认 `0001630243`。
- `npx.since`：申报日起点；会读取相关 submissions 历史分片。
- `npx.max_filings_per_cik`：默认最多 30 份。超出时状态为 partial，状态页说明 discovered/selected/truncated；需提高数值才能扩展历史覆盖。
- `http`：请求间隔、超时、重试、响应体上限。所有请求共用同一个串行客户端，默认间隔 0.55 秒，不建议盲目提速。

FDIC 官方说明页面关于 API key 的文字存在差异；本次从运行环境实际不带 key 获取成功。**不要把无 key 永久可用作为前提。**如出现 401/403，按官方 API 101 页面申请并设置 `FDIC_API_KEY`。CFTC app token 可选；遇到 429 按提示退避。SEC 默认联系标识为 `Eurika eurikamonica@gmail.com`，保存在 `config/settings.json` 的 `http.sec_user_agent`；非空环境变量 `SEC_USER_AGENT` 优先，空值自动使用配置。

## 目录

```text
START-HERE.html                 双击入口
START-WINDOWS.cmd               Windows 本地服务
README.md                      范围、运行与配置
DEPLOY-GITHUB.md                逐步部署
METHODOLOGY.md                 指标、单位、修订、口径
VALIDATION.md                  已验证与未验证内容
SOURCES.md                     官方资料与原项目研究
requirements.txt               标准库，无运行依赖
app/core.py                    数据接口、标准化、解析、错误处理
app/collect.py                 采集 CLI
app/make_demo.py               仅重建虚构 demo.js
app/serve.py                   本地预览
config/settings.json           跟踪范围
notes/initial-evidence.json    附带官方快照的下载清单与哈希
notes/evidence/                附带快照的官方原始响应
automation/update-and-deploy.yml   可复制的工作流模板
automation/install-workflow.py   可选，本地生成工作流再用 Git 上传
docs/index.html                网页
docs/app.js                    筛选、图表、CSV
docs/styles.css                响应式样式
docs/data/live.json             官方数据状态与内容
docs/data/live.js               同一官方数据的双击可读 JS 封装
docs/data/demo.js               独立虚构演示
tests/                         离线正确性测试与真实来源夹具
```

ZIP 不包含任何以 `.` 开头的文件或目录，也不含依赖、缓存或密钥。自动工作流的启用方式见部署指南。
