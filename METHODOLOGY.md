# 数据口径与计算

## 通用

- `date` / `report_date` 是报告期，不是数据首次公开时间。
- `filing_date` / `accepted_at` 是申报信息；`first_seen_at` 是本系统发现时间；`fetched_at` / `updated_at` 是获取或处理时间。
- 本版没有构建完整的 point-in-time 数据库。重新抓取历史会得到修订后的官方数据，不能直接宣称无前视偏差回测。
- `null` 显示为 `—`；不以零代替未知值。
- CSV 导出当前筛选的所有记录，不仅当前分页；对象/列表保留 JSON 字符串。
- CSV 对可能被电子表格解释为公式的文本进行前缀处理，实际数值仍保留为数值字符串。
- `docs/data/live.json` 与 `live.js` 是同一数据的两种封装；前端本地打开读取 JS。演示文件完全独立。

## COT

只下载期货，不混入 futures-and-options-combined 数据。

Disaggregated 分类：生产商/贸易商、掉期交易商、Managed money、其他可报告、不可报告。
TFF 分类：Dealer/Intermediary、Asset managers、Leveraged funds、其他可报告、不可报告。

二者用途不同。日元采用 TFF，黄金和 WTI 采用 Disaggregated；不能把 managed money 与 leveraged funds 视为完全相同人群。

公式：

- `net = long - short`
- `weekly_change = net_t - net_(t-1)`，仅两个报告日严格相隔 7 天时计算。
- `index_52_observations = 100 × (当前净仓 − 最近52条报告最小净仓) / (最近52条最大净仓 − 最近52条最小净仓)`。

52 条观测含当期；不足 52 条、存在缺失、范围为零均返回 null。它是**区间位置，不是百分位排名**；遇到缺报，52 条观测也不一定严格等于 52 周。

长短仓取对应 long/short 列，单独的 spreading 列不叠加。未平仓量是全市场指标，不是该类别的仓位。数据单位为合约，不是美元，也不是一家具体基金的实名持仓。

COT 通常是周度披露，具体节假日和延迟以 CFTC 发布安排为准；页面只把官方报告日期标为报告期。

## 银行

| 规范字段 | FDIC 原字段 | 单位/性质 |
|---|---|---|
| assets | ASSET | 千美元，期末余额 |
| deposits | DEP | 千美元，期末余额 |
| loans_net | LNLSNET | 千美元，净贷款及租赁口径 |
| equity | EQ | 千美元，期末权益 |
| net_income_ytd | NETINC | 千美元，年初至今累计 |
| net_income_quarter | 派生 | 千美元，单季度 |
| roa / roe | ROA / ROE | API 原始百分比值，保留至导出，不重复乘100 |
| loan_deposit_ratio | LNLSNET / DEP | 无单位 |
| equity_asset_ratio | EQ / ASSET | 无单位；不是风险加权资本比率 |

Q1 单季净利润等于 Q1 累计；Q2/Q3/Q4 为当前累计减去**同年紧邻上一季度**累计。若上一季度没有记录，结果为空；不跨年份差分利润。

两期对比页面的增长率使用 `(当前 − 基期) / abs(基期)`。基期为零或缺失不计算；负基期明确采用绝对值分母，避免把扭亏为盈显示为负增长。余额与累计利润可以任意选择两期，但不同年内季度的 YTD 利润直接比较时需考虑累计长度。

金额不额外乘1000；页面始终注明千美元。视觉缩写中：1M 千美元 = 10亿美元，1B 千美元 = 1万亿美元。CSV 保留未缩写的千美元数值。

仅覆盖选定银行法律实体；不将某个 CERT 默认合并为上市控股公司。合并、收购、报表重分类会影响可比性。

## N-PX

发现：SEC submissions `recent` + 日期范围相关的历史 JSON 分片，筛选 N-PX/N-PX/A，以 accession 去重。
下载：访问 accession 的 `index.json`，选择实际列出的 XML 文件；不是猜测一个固定的投票文件名。
解析：识别 `proxyVoteTable` / `proxyTable`，忽略命名空间前缀差异，保留原文叶子字段。

关键区分：

1. **提案层 sharesVoted** 是提案总投票股数；投票明细 `voteRecord.sharesVoted` 是某个方向的股数，不与提案总股数再相加。
2. `howVoted` 是提案方向，如 FOR、AGAINST、ABSTAIN、WITHHOLD、1 YEAR。
3. `managementRecommendation` 在该结构中标示相对管理层的 FOR/AGAINST，不由 `howVoted` 猜测。
4. `sharesOnLoan` 单独保存，不默认为零；投票股数、借出股数都不能当作当前持仓。
5. 一个提案可能多方向分拆；方向分布统计“投票明细段数”，不是按股数加权。按某方向筛选时保留匹配提案的全部分拆明细，避免丢失上下文。
6. 反对管理层比例 = `management_alignment == AGAINST` 明细段数 / 明确为 FOR 或 AGAINST 的明细段数。
7. 发行人数量优先按 CUSIP，其次 ISIN，再次名称去重；这是标识级近似计数，不是已完成全球发行人实体解析。
8. `series_ids`、`manager_numbers`、`raw_fields` 保留在导出中；本版不跨系列合并证券、不自动映射 ticker。

**修订：**保留 N-PX/A，读取可用 amendmentType 等封面信息。每次页面只展示一份文件，不与原版相加，也不假设“日期最新的一份”已经覆盖全部原版记录。原文件/修订之间的精细替换合并尚未实现。

**无表不等于无仓：**旧 HTML、notice、no-vote、保密申请或不支持结构会显示 `no_structured_vote_table` 并提供源链接。它与成功解析的空表不同，更不代表零持仓。

注册基金与机构管理人的 N-PX 报告覆盖事项不同，页面保留 registrantType/reportType/confidentialTreatment/explanatoryNotes，不把管理人高管薪酬投票记录说成全部治理投票。
