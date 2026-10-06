# 来源与原项目研究

核对日期：2026-10-06。公开接口的 schema、访问要求和发布政策可能调整；配置与错误状态用于发现变化。

## 原项目（只读研究）

- 用户给出的仓库：https://github.com/eurikamonica/filing-flows/tree/main
- 本次实际成功读取：https://raw.githubusercontent.com/eurikamonica/filing-flows/main/README.md

README 说明项目以 Python pipeline 抓取 SEC、处理数据，`web` 目录呈现静态可视化，`scripts/build_site.py` 生成站点，通过 GitHub Actions/Pages 发布。它已有自己的状态与发布流程。

本次没有声称完成原仓库全部代码审计；没有 clone 后修改，也没有提交或部署。选择独立仓库、独立 `docs/data/` 和独立工作流，避免覆盖原网站的数据与 Pages 构建产物。

采用同样轻量的数据发布方式，但这三种新数据的周期、字段、身份和单位独立处理，不能塞进原来的利润表 Sankey 数据模型。

## CFTC

- COT 总入口：https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm
- 官方 API/下载说明：https://publicreporting.cftc.gov/stories/s/COT-Help/p2fg-u73y/
- Disaggregated Futures Only：https://publicreporting.cftc.gov/stories/s/Disaggregated-Futures-Only/ubmb-6exi/
- Disaggregated 数据集：https://publicreporting.cftc.gov/d/72hh-3qpy
- 本版 API：https://publicreporting.cftc.gov/resource/72hh-3qpy.json
- TFF Futures Only 数据集：https://publicreporting.cftc.gov/d/gpe5-46if
- 本版 API：https://publicreporting.cftc.gov/resource/gpe5-46if.json

使用 `$where`、`$order`、`$limit`、`$offset` 分页查询。代码逐页获取直到返回不足一页；按数据集/合约/日期/类别识别记录。

## FDIC

- 官方数据下载：https://www.fdic.gov/bank-data-guide/data-downloads
- BankFind API 文档：https://api.fdic.gov/banks/docs/
- API 101：https://banks.data.fdic.gov/bankfind-suite/bulkData/api101
- 财务字段定义：https://api.fdic.gov/banks/docs/risview_properties.yaml
- API schema：https://api.fdic.gov/banks/docs/swagger.yaml
- 本版使用：https://api.fdic.gov/banks/financials

本版请求字段 CERT, NAME, REPDTE, ASSET, DEP, LNLSNET, EQ, NETINC, ROA, ROE。这里获取的是 BankFind 标准化数据，而非完整 Call Report 附表原始文件。

当前官方页面对 key 的说明不完全一致，本次无 key 请求成功；代码支持 `X-Api-Key`。不要据此保证未来免 key，参见 README。

## SEC N-PX

- 官方表格技术规范：https://www.sec.gov/submit-filings/technical-specifications
- N-PX 3.1 规范包：https://www.sec.gov/files/edgar/filer-information/specifications/edgar-form-n-px-xml-technical-specification-31.zip
- SEC API 说明：https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- 投票披露规则说明：https://www.sec.gov/newsroom/press-releases/2022-198
- submissions 样本：https://data.sec.gov/submissions/CIK0001630243.json
- 本包样本目录：https://www.sec.gov/Archives/edgar/data/1630243/000163024325000012/0001630243-25-000012-index.htm
- 本包投票 XML：https://www.sec.gov/Archives/edgar/data/1630243/000163024325000012/BRDN3P_0001630243_2025.xml
- 本包封面 XML：https://www.sec.gov/Archives/edgar/data/1630243/000163024325000012/primary_doc.xml

接口结构和 XML 映射基于官方页面与上述成功下载的实际响应核对；不依赖付费第三方 N-PX API。

## GitHub

- 自定义 Pages 工作流：https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- 工作流语法：https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions
- Pages 发布源：https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

工作流模板不是已部署服务；运行额度、Artifacts 配额和仓库策略以 GitHub 当前账户情况为准。没有承诺规模扩大后仍完全零运行成本。
