// Lightweight template/logic tests in Node; NOT a browser or visual QA test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const elements=new Map();
const doc={getElementById(id){if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',className:'',value:'',setAttribute(){},classList:{toggle(){}}});return elements.get(id)},querySelectorAll(){return []}};
const context=vm.createContext({document:doc,window:{},console,setTimeout,URL,Blob});
for(const f of ['data/live.js','data/demo.js','extensions.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'docs',f),'utf8'),context,{filename:f});
let checks=0;
for(const mode of ['official','demo'])for(const tab of ['holdings','congress','review','cot','banks','npx','status']){
 vm.runInContext(`state.mode='${mode}';state.tab='${tab}';state.date='';state.page=0;render();`,context);
 const html=elements.get('workspace').innerHTML;
 assert.ok(html.length>150,`${mode}/${tab} did not render`);
 assert.ok(!html.includes('NaN'),'Non-finite number displayed');checks++;
}
assert.equal(vm.runInContext(`esc('<img src=x onerror="bad">')`,context),'&lt;img src=x onerror=&quot;bad&quot;&gt;');checks++;
assert.equal(vm.runInContext(`csvCell('=HYPERLINK("bad")')`,context),'"\'=HYPERLINK(""bad"")"');checks++;
assert.equal(vm.runInContext(`link('javascript:alert(1)')`,context),'—');checks++;
assert.equal(vm.runInContext(`fmt(null)`,context),'—');checks++;
console.log(`${checks} UI template/logic checks passed; no browser rendering checked.`);
