'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=0)=>v==null||!Number.isFinite(Number(v))?'—':Number(v).toLocaleString('en-US',{maximumFractionDigits:d});
const pct=(v,d=1)=>v==null?'—':fmt(v*100,d)+'%';
const signed=v=>v==null?'—':(v>0?'+':'')+fmt(v);
const compact=v=>v==null?'—':Math.abs(v)>=1e9?fmt(v/1e9,2)+'B':Math.abs(v)>=1e6?fmt(v/1e6,2)+'M':Math.abs(v)>=1e3?fmt(v/1e3,1)+'K':fmt(v,1);
const link=(url,label='原始来源 ↗')=>/^https:\/\//.test(url||'')?`<a target="_blank" rel="noopener" href="${esc(url)}">${esc(label)}</a>`:'—';
const uniq=a=>[...new Set(a)];
const state={tab:'cot',mode:'official',page:0,market:'',group:'',cert:'',filing:'',metric:'assets',date:'',base:'',from:'',to:'',query:'',direction:''};
let exported=[];
const data=()=>state.mode==='demo'?(window.DISCLOSURE_DEMO||{modules:{}}):(window.DISCLOSURE_LIVE||{modules:{}});
const moduleData=()=>data().modules[state.tab]||{};
function options(items,value){return items.map(x=>{const [v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(l)}</option>`}).join('')}
function choose(current,values){return values.includes(String(current))?String(current):values[0]||''}
function field(id,label,items,value,wide=false){return `<div class="field ${wide?'wide':''}"><label for="${id}">${label}</label><select id="${id}">${options(items,value)}</select></div>`}
function kpi(label,value,caption=''){return `<div class="metric"><label>${esc(label)}</label><strong>${esc(value)}</strong><small>${esc(caption)}</small></div>`}
function head(title,subtitle,tag){return `<div class="section-head"><div><h2>${title}</h2><p class="sub">${subtitle}</p></div><span class="tag">${tag}</span></div>`}
function empty(text){return `<div class="empty">${esc(text)}</div>`}
function bind(id,key){if($(id))$(id).onchange=e=>{state[key]=e.target.value;state.page=0;render()}}
function baseRender(){
 const d=data(),m=moduleData();
 $('buildtime').textContent='快照生成：'+(d.generated_at||'未生成');
 $('notice').className=state.mode==='demo'||['error','partial'].includes(m.status)?'warn':'';
 $('notice').textContent=state.mode==='demo'?'演示模式：全部数据为虚构，仅用于体验交互与图表，不可作为市场信息。':
   state.tab==='status'?'各数据源独立运行。失败时保留上次有效数据；不会用演示数值填补官方数据。':
   `官方数据快照 · 状态 ${m.status||'未采集'} · 最近成功/部分完成 ${m.updated_at||'—'} · 最近尝试 ${m.last_attempt||'—'}${m.error?' · '+m.error:''}`;
}
function lineChart(rows,key,unit){
 if(!rows.length)return empty('该时间范围没有数据');
 const vals=rows.map(r=>r[key]).filter(v=>v!=null&&Number.isFinite(v));
 if(!vals.length)return empty('该指标没有可绘制的有效数值');
 const W=720,H=290,L=78,R=20,T=24,B=40;
 let lo=Math.min(0,...vals),hi=Math.max(0,...vals);if(lo===hi)hi=lo+1;
 const y=v=>T+(hi-v)/(hi-lo)*(H-T-B),x=i=>L+i/Math.max(rows.length-1,1)*(W-L-R);
 let s=`<svg class="plot" role="img" aria-label="${esc(unit)}历史趋势，准确值见下表" viewBox="0 0 ${W} ${H}">`;
 for(let i=0;i<=4;i++){let v=lo+(hi-lo)*i/4;s+=`<line class="gridline" x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L-10}" y="${y(v)+4}" text-anchor="end">${esc(compact(v))}</text>`}
 let path='',gap=true;
 rows.forEach((r,i)=>{if(r[key]==null){gap=true;return}path+=(gap?'M':'L')+x(i)+','+y(r[key])+' ';gap=false});
 s+=`<path class="chartline" d="${path}"/>`;
 rows.forEach((r,i)=>{if(r[key]!=null)s+=`<circle cx="${x(i)}" cy="${y(r[key])}" r="3.4" fill="#137958"><title>${esc(r.date)} · ${esc(fmt(r[key],2))} ${esc(unit)}</title></circle>`});
 [0,Math.floor((rows.length-1)/2),rows.length-1].filter((v,i,a)=>a.indexOf(v)===i).forEach(i=>s+=`<text class="axis" x="${x(i)}" y="${H-12}" text-anchor="${i===0?'start':i===rows.length-1?'end':'middle'}">${esc(rows[i].date)}</text>`);
 return s+'</svg>';
}
function bars(items,caption){
 const max=Math.max(1,...items.map(x=>Math.abs(x.value??0)));
 return items.map(x=>`<div class="bar-row"><div class="bar-label"><span>${esc(x.label)}</span><span>${esc(fmt(x.value,2))}${caption?' '+esc(caption):''}</span></div><div class="bar-track"><div class="bar-fill" style="width:${x.value==null?0:Math.abs(x.value)/max*100}%;background:${x.color||'#137958'}"></div></div></div>`).join('');
}
function table(headers,rows){
 const size=25,start=state.page*size,total=rows.length;
 if(start>=total)state.page=0;
 return `<div class="tablebox"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.slice(state.page*size,state.page*size+size).map(c=>`<tr>${c.map((v,i)=>`<td class="${i?'num':''}">${v}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}">没有匹配记录</td></tr>`}</tbody></table></div><div class="pager"><span>${total} 条 · ${state.page+1}/${Math.max(1,Math.ceil(total/size))} 页</span><button class="action" id="prev" ${state.page===0?'disabled':''}>上一页</button><button class="action" id="next" ${(state.page+1)*size>=total?'disabled':''}>下一页</button></div>`;
}
function actions(){
 if($('prev'))$('prev').onclick=()=>{state.page--;render()};
 if($('next'))$('next').onclick=()=>{state.page++;render()};
 if($('csv'))$('csv').onclick=downloadCSV;
}
function dates(){return `<div class="field"><label for="from">开始日期</label><input id="from" type="date" value="${esc(state.from)}"></div><div class="field"><label for="to">结束日期</label><input id="to" type="date" value="${esc(state.to)}"></div>`}
function filteredDates(rows){return rows.filter(r=>(!state.from||r.date>=state.from)&&(!state.to||r.date<=state.to))}
function cot(){
 const all=moduleData().rows||[];
 let out=head('期货分类持仓','Futures only · 净持仓 = 多头合约 − 空头合约；不同交易者分类不可直接混用。','CFTC / WEEKLY');
 if(!all.length)return out+empty('尚无 COT 数据。运行采集器，或切换到虚构演示模式。');
 const markets=uniq(all.map(r=>r.dataset+'|'+r.code));state.market=choose(state.market,markets);
 const r=all.filter(x=>x.dataset+'|'+x.code===state.market),groups=uniq(r.map(x=>x.group));state.group=choose(state.group,groups);
 out+=`<div class="toolbar">${field('market','市场 / 合约代码',markets.map(v=>[v,all.find(r=>r.dataset+'|'+r.code===v).market+' · '+v.split('|')[1]]),state.market,true)}${field('group','交易者类别',groups,state.group)}${dates()}</div>`;
 const rows=filteredDates(r.filter(x=>x.group===state.group)).sort((a,b)=>a.date.localeCompare(b.date));
 const days=rows.map(x=>x.date).reverse();state.date=choose(state.date,days);
 out+=`<div class="toolbar">${field('asof','查看报告期（不是发布日期）',days,state.date)}</div>`;
 const last=rows.find(x=>x.date===state.date);
 if(!last)return out+empty('该时间范围没有数据，请调整日期。');
 out+=`<div class="metrics">${kpi('净持仓 / 合约',fmt(last.net),state.group)}${kpi('较前一周变化 / 合约',signed(last.weekly_change),'仅连续 7 天的相邻报告期计算')}${kpi('全市场未平仓合约',fmt(last.open_interest),last.date)}${kpi('52 期净持仓区间位置',fmt(last.index_52_observations,1),'0–100；不足 52 期或区间恒定不计算')}</div>`;
 out+=`<div class="charts"><div class="panel"><h3>净持仓历史</h3><p class="sub">${esc(state.group)} · 合约数，不是美元</p>${lineChart(rows,'net','contracts')}</div><div class="panel"><h3>多头与空头</h3><p class="sub">${esc(last.date)} · ${esc(state.group)}</p>${bars([{label:'LONG / 多头',value:last.long},{label:'SHORT / 空头',value:last.short,color:'#cf673a'}],'合约')}<div class="explain">净持仓不包含单独的跨期套利（spreading）列。指数是历史区间位置，不是百分位排名，也不是交易信号。</div>${link(last.source_url)}</div></div>`;
 out+=`<div class="section-head"><div><h3>历史记录</h3><p class="sub">导出当前市场、类别与日期范围的全部记录</p></div><button class="action" id="csv">下载 CSV ↓</button></div>`;
 exported=rows;
 out+=table(['报告期','多头','空头','净持仓','周变化','52 期区间位置'],[...rows].reverse().map(x=>[esc(x.date),fmt(x.long),fmt(x.short),fmt(x.net),signed(x.weekly_change),fmt(x.index_52_observations,1)]));
 return out;
}
const BANK_METRICS={assets:'总资产',deposits:'总存款',loans_net:'净贷款',equity:'股东权益',net_income_quarter:'单季净利润',net_income_ytd:'年初至今净利润'};
function banks(){
 const all=moduleData().rows||[];let out=head('银行季度财务','BankFind 财务指标 · 金额单位为千美元；银行法律实体与上市控股公司口径不同。','FDIC / QUARTERLY');
 if(!all.length)return out+empty('尚无银行数据。运行采集器，或切换到虚构演示模式。');
 const certs=uniq(all.map(r=>String(r.cert)));state.cert=choose(state.cert,certs);
 const rows=all.filter(x=>String(x.cert)===state.cert).sort((a,b)=>a.date.localeCompare(b.date)),days=rows.map(x=>x.date).reverse();
 state.date=choose(state.date,days);state.base=choose(state.base,days.filter(x=>x<state.date));
 out+=`<div class="toolbar">${field('cert','银行 / FDIC CERT',certs.map(v=>[v,all.find(r=>String(r.cert)===v).name+' · '+v]),state.cert,true)}${field('metric','历史图指标',Object.entries(BANK_METRICS),state.metric)}</div><div class="toolbar">${field('asof','当前季度',days,state.date)}${field('base','比较基期（早于当前季度）',days.filter(x=>x<state.date),state.base)}</div>`;
 const last=rows.find(x=>x.date===state.date),base=rows.find(x=>x.date===state.base);
 const change=(k)=>last[k]!=null&&base?.[k]!=null&&base[k]!==0?pct((last[k]-base[k])/Math.abs(base[k])):'—';
 out+=`<div class="metrics">${kpi('总资产 / 千美元',compact(last.assets),'较基期 '+change('assets'))}${kpi('总存款 / 千美元',compact(last.deposits),'较基期 '+change('deposits'))}${kpi('单季净利润 / 千美元',compact(last.net_income_quarter),'由同年累计值差分')}${kpi('净贷款 / 存款',pct(last.loan_deposit_ratio),'净贷款口径，不是监管资本充足率')}</div>`;
 out+=`<div class="charts"><div class="panel"><h3>${BANK_METRICS[state.metric]}历史</h3><p class="sub">单位：千美元 · 缺失值保留为空</p>${lineChart(rows,state.metric,'USD thousands')}</div><div class="panel"><h3>季度余额对照</h3><p class="sub">${esc(last.date)} · 分别展示，不相加</p>${bars(['assets','deposits','loans_net','equity'].map(k=>({label:BANK_METRICS[k],value:last[k]})),'千美元')}${link(last.source_url)}</div></div>`;
 out+=`<div class="explain">NETINC 原字段是年初至今累计利润：Q1 = Q1 累计；Q2 = Q2 累计 − Q1 累计，后续季度同理。缺少紧邻的上一季时不推算。合并、收购或会计调整也会改变可比性。资产、存款与贷款是期末余额。</div>`;
 out+=`<h3>两期比较 · ${esc(state.base||'无基期')} → ${esc(state.date)}</h3><div class="tablebox"><table><thead><tr><th>指标 / 千美元</th><th>基期</th><th>当前</th><th>变化额</th><th>变化率（基期绝对值分母）</th></tr></thead><tbody>${Object.keys(BANK_METRICS).map(k=>`<tr><td>${BANK_METRICS[k]}</td><td>${fmt(base?.[k])}</td><td>${fmt(last[k])}</td><td>${signed(last[k]!=null&&base?.[k]!=null?last[k]-base[k]:null)}</td><td>${change(k)}</td></tr>`).join('')}</tbody></table></div>`;
 exported=rows;
 out+=`<div class="section-head"><h3>全部历史季度</h3><button id="csv" class="action">下载 CSV ↓</button></div>`+table(['报告期','总资产','存款','净贷款','权益','累计利润 YTD','单季利润'],[...rows].reverse().map(r=>[esc(r.date),fmt(r.assets),fmt(r.deposits),fmt(r.loans_net),fmt(r.equity),fmt(r.net_income_ytd),fmt(r.net_income_quarter)]));
 return out;
}
function npx(){
 const all=moduleData().filings||[];let out=head('基金与管理人代理投票','每次仅分析一份申报。投票股数不是当前持仓；不同提案的股数不能相加成持仓。','SEC / ANNUAL');
 if(!all.length)return out+empty('尚无 N-PX 文件。设置 SEC_USER_AGENT 后采集，或切换虚构演示模式。');
 const files=[...all].sort((a,b)=>(b.filing_date+b.accession).localeCompare(a.filing_date+a.accession));state.filing=choose(state.filing,files.map(f=>f.accession));
 const f=files.find(x=>x.accession===state.filing);
 out+=`<div class="toolbar">${field('filing','申报人 / 文件 / 原始或修订',files.map(x=>[x.accession,`${x.filer} · ${x.filing_date} · ${x.form} · ${x.accession}`]),state.filing,true)}</div>`;
 out+=`<div class="explain">报告期：${esc(f.report_date||'—')} · 申报日：${esc(f.filing_date)} · 解析状态：${esc(f.parse_status)} · ${link(f.source_url,'SEC 文件目录 ↗')}<br>${esc(f.coverage_note||'')}${f.is_amendment?'<br><b>修订申报：本页只显示该修订文件的内容，不假设其完整替换原版，也不与原版相加。</b>':''}${f.refresh_error?'<br>本次刷新失败：'+esc(f.refresh_error):''}</div>`;
 if(f.cover_fields)out+=`<details><summary>报告类型、保密标记与申报人说明</summary><p>报告类型：${esc(f.cover_fields.reportType)}<br>申报人类型：${esc(f.cover_fields.registrantType)}<br>保密申请：${esc(f.cover_fields.confidentialTreatment)}<br>修订类型：${esc(f.cover_fields.amendmentType)}<br>${esc(f.cover_fields.explanatoryNotes)}</p></details>`;
 out+=`<div class="toolbar"><div class="field wide"><label for="query">公司 / CUSIP / 提案搜索（Enter 应用）</label><input id="query" value="${esc(state.query)}" placeholder="公司名、证券标识或提案关键词"></div>${field('direction','投票方向',[['','全部方向'],['FOR','赞成 FOR'],['AGAINST','反对 AGAINST'],['ABSTAIN','弃权 ABSTAIN'],['WITHHOLD','不予支持 WITHHOLD'],['1 YEAR','1 YEAR'],['2 YEARS','2 YEARS'],['3 YEARS','3 YEARS']],state.direction)}</div>`;
 const query=state.query.trim().toLowerCase();
 const rows=(f.votes||[]).filter(r=>(!query||[r.issuer,r.cusip,r.isin,r.description].join(' ').toLowerCase().includes(query))&&(!state.direction||r.votes.some(v=>v.how===state.direction)));
 const votes=rows.flatMap(r=>r.votes),counts={};votes.forEach(v=>counts[v.how||'未标明']=(counts[v.how||'未标明']||0)+1);
 const opposing=votes.filter(v=>v.management_alignment==='AGAINST').length;
 const comparable=votes.filter(v=>['FOR','AGAINST'].includes(v.management_alignment)).length;
 out+=`<div class="metrics">${kpi('提案 / 表格行',fmt(rows.length),'同一提案可能分系列或管理人列报')}${kpi('涉及发行人',fmt(uniq(rows.map(r=>r.cusip||r.isin||r.issuer)).length),'按 CUSIP / ISIN / 名称去重')}${kpi('投票明细段',fmt(votes.length),'分拆投票会产生多个明细段')}${kpi('反对管理层 / 可分类明细',comparable?pct(opposing/comparable):'—',`${opposing} / ${comparable} 段；未按股数加权`)}</div>`;
 out+=`<div class="charts"><div class="panel"><h3>投票方向分布</h3><p class="sub">当前筛选提案的全部投票明细段数；不是股数分布</p>${bars(Object.entries(counts).map(([label,value])=>({label,value,color:label==='AGAINST'?'#cf673a':'#137958'})),'段')||empty('没有可汇总的投票明细')}</div><div class="panel"><h3>如何解读</h3><div class="explain">FOR 表示赞成提案；“支持 / 反对管理层”读取另一字段，不能由 FOR/AGAINST 推断。<br><br>管理人的 N-PX 与注册基金 N-PX 覆盖事项不同。未召回的借出股票单独保留。系列 ID、管理人编号与原字段可在 CSV 中核对。</div></div></div>`;
 exported=rows.map(r=>({...r,accession:f.accession,filer:f.filer,report_date:f.report_date,filing_date:f.filing_date}));
 out+=`<div class="section-head"><h3>提案与投票明细</h3><button class="action" id="csv">下载 CSV ↓</button></div>`;
 out+=table(['发行人 / 标识','会议日期','提案','投票 / 股数 / 对管理层','已投票总股数','借出未召回股数','来源'],rows.map(r=>[`${esc(r.issuer)}<br><span class="muted">${esc(r.cusip||r.isin)}</span>`,esc(r.meeting_date),`<span style="white-space:normal;display:block;min-width:220px;max-width:430px;line-height:1.7">${esc(r.description)}</span>`,r.votes.map(v=>`<span class="pill">${esc(v.how)} · ${fmt(v.shares,6)} · ${esc(v.management_alignment||'未标明')}</span>`).join('<br>')||'未列投票明细',fmt(r.shares_voted,6),fmt(r.shares_on_loan,6),link(r.source_url,'XML ↗')]));
 return out;
}
function status(){
 const d=data();return head('采集状态与覆盖范围','记录检查时间、错误和覆盖边界；新鲜度由报告期与采集时间共同判断。','SOURCE HEALTH')+`<div class="statusgrid">${['cot','banks','npx'].map(k=>{const m=d.modules[k]||{};return `<div class="panel"><h3>${k.toUpperCase()}</h3><span class="tag">${esc(m.status||'未采集')}</span><pre>最近尝试\n${esc(m.last_attempt||'—')}\n\n成功/部分完成时间\n${esc(m.updated_at||'—')}\n\n记录数\n${fmt((m.rows||m.filings||[]).length)}\n\n错误\n${esc(m.error||(m.errors||[]).join('\n')||'无')}</pre><details open><summary>覆盖说明</summary><pre>${esc(typeof m.coverage==='string'?m.coverage:JSON.stringify(m.coverage||{},null,2))}</pre></details></div>`}).join('')}</div><div class="explain">COT：按配置的合约及日期范围重新抓取，可反映历史数据修正。银行：按 CERT 与历史起点重新抓取财务指标。N-PX：跟踪配置的 CIK，新文件自动下载；已解析文件可用 --revalidate 重新核对。历史 HTML 报告与不支持的结构仅保留状态和官方入口，不能解释为零持仓。</div>`;
}
function render(){
 baseRender();exported=[];
 $('workspace').innerHTML=({cot,banks,npx,status}[state.tab])();
 bind('market','market');bind('group','group');bind('from','from');bind('to','to');bind('asof','date');bind('cert','cert');bind('metric','metric');bind('base','base');bind('filing','filing');bind('direction','direction');
 if($('query')){$('query').onchange=e=>{state.query=e.target.value;state.page=0;render()};$('query').onkeydown=e=>{if(e.key==='Enter')e.target.blur()}}
 actions();
}
function csvCell(v){let s=typeof v==='object'&&v!==null?JSON.stringify(v):String(v??'');if(/^[=+@\t\r]/.test(s)||(/^[-]/.test(s)&&!/^[-]\d+(\.\d+)?$/.test(s)))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
function downloadCSV(){if(!exported.length)return;const keys=uniq(exported.flatMap(Object.keys));const csv='\ufeff'+[keys.map(csvCell).join(','),...exported.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`disclosure-${state.tab}-${state.mode}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
$('mode').onchange=e=>{state.mode=e.target.value;state.page=0;state.date='';state.filing='';render()};
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;state.page=0;state.date='';document.querySelectorAll('nav button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});render()});
render();
