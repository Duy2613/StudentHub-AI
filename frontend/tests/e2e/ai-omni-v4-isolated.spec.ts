import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIR = process.env.OMNI_V4_ARTIFACTS!;
const USER = 'f7338472-6392-4ca0-9d63-63028558713a';
const CASE = 'e7338472-6392-4ca0-9d63-63028558713a';
const POST = 'c7338472-6392-4ca0-9d63-63028558713a';
const EXPERT = 'a7338472-6392-4ca0-9d63-63028558713a';
const SOURCE = 'https://example.org/omni-contract-source';
const captures: object[] = [];
const expert = { expertId:EXPERT,name:'Minh An · hồ sơ kiểm tra',canonicalIdentity:'Minh An · hồ sơ kiểm tra',title:'Nghiên cứu nguồn và chính sách',scopes:[{domain:'PUBLIC_POLICY',level:'DOMAIN_VERIFIED',isEstablished:true}],credentials:[],publications:[],roles:[],institution:'Đơn vị minh họa',authorityBoundaries:{establishedDomains:['PUBLIC_POLICY'],limitedDomains:[],outOfScopeDomains:[]} };
const contribution = { postId:POST,contributionId:POST,title:'Đối chiếu nguồn học vụ',content:'Đóng góp dùng cho kiểm tra giao diện.',publicationState:'PUBLISHED',revision:1,caseScope:{caseId:CASE,caseRevision:3},evidenceRefs:[],sources:[],reactions:{},ranking:{} };
const post = { postId:POST,title:'Cùng đọc nguồn trước khi thảo luận',content:'Cuộc trò chuyện minh họa cho kiểm tra giao diện Omni.',author:{name:'Thành viên kiểm tra'},topic:'ACADEMIC',sources:[{url:SOURCE,title:'Hướng dẫn · tài liệu kiểm tra',publisher:'Nguồn minh họa'}],comments:[],media:[],communityPerception:{trust:0,doubt:0},isAuthoritative:false };
const answer = 'Hãy tách câu hỏi thành **đối tượng áp dụng** và **thời điểm có hiệu lực**.\n\nBạn có thể hỏi: “Văn bản nào quy định điều kiện này và hiện còn hiệu lực không?”\n\n[Tham khảo do AI đề xuất](https://example.org/reference). Cần đọc nguồn gốc để đối chiếu.';
type Options = { anonymous?:boolean; failSearch?:boolean; stale?:boolean; wrongOwner?:boolean; providerStatus?:string; malicious?:boolean; fixture?:boolean; race?:boolean; theme?:string };

async function harness(page:Page, options:Options={}) {
  const state={...options}; const calls:{path:string;method:string;body:unknown}[]=[]; const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(({theme})=>{
    localStorage.setItem('studenthub-theme-mode',theme);
    document.addEventListener('click',event=>{
      const target=event.target instanceof Element?event.target.closest('button'):null;
      const label=target?.getAttribute('aria-label')||target?.textContent||'';
      if(/Mở AI \/ Omni/i.test(label)) performance.mark('omni-v4:test-open-intent');
    },true);
  },{theme:state.theme||'light'});
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='http://127.0.0.1:3114') return route.abort();
    if(!url.pathname.startsWith('/api/')) return route.continue();
    calls.push({path:url.pathname+url.search,method:route.request().method(),body:route.request().postDataJSON()});
    const q=url.searchParams.get('q')||url.searchParams.get('topic')||'';
    const hasFixtureMatch=['nguồn','alpha','beta'].includes(q.toLocaleLowerCase('vi'));
    const empty=q.length>0&&!hasFixtureMatch;
    const searching=['/api/v1/search','/api/v1/experts'].includes(url.pathname)||(url.pathname==='/api/community/social'&&!url.searchParams.has('postId'));
    if(state.race&&q==='alpha') await new Promise(resolve=>setTimeout(resolve,850));
    if(searching&&(state.failSearch||q==='searcherror')) return route.fulfill({status:503,json:{success:false,error:{code:'SERVICE_UNAVAILABLE'}}});
    let body:unknown={success:true,data:[]};
    if(url.pathname==='/api/auth/session') body=state.anonymous?{authenticated:false,user:null}:{authenticated:true,user:{id:USER,email:'omni@example.invalid',roles:['STUDENT']}};
    if(url.pathname==='/api/users/me') body={success:true,profile:{fullName:'Tài khoản kiểm tra Omni'}};
    if(url.pathname==='/api/v1/search') body={success:true,contractVersion:'search.v1',query:q,communitySource:state.fixture?'DEMO_FIXTURE':'DURABLE_POSTGRES',data:{results:empty?[]:[{id:POST,kind:'COMMUNITY',title:state.race?`${q} đóng góp`:contribution.title,summary:contribution.content},{id:CASE,kind:'COMMUNITY',title:'PRIVATE HIDDEN RESULT',visibility:'PRIVATE'}]}};
    if(url.pathname==='/api/community/social') {
      if(url.searchParams.has('postId')&&state.stale) return route.fulfill({status:404,json:{success:false}});
      body={success:true,contractVersion:'community-social.v1',sourceState:state.fixture?'DEMO_FIXTURE':'DURABLE_POSTGRES',posts:empty?[]:[{...post,title:state.race?`${q} trò chuyện`:post.title}]};
    }
    if(url.pathname==='/api/v1/experts') body={success:true,contractVersion:'experts.v1',data:{sourceState:state.fixture?'DEMO_FIXTURE':'DURABLE_POSTGRES',total:empty?0:1,experts:empty?[]:[expert]}};
    if(url.pathname===`/api/expert/profile/${EXPERT}`) body={success:true,expert,meta:{sourceState:'DURABLE_POSTGRES'}};
    if(url.pathname===`/api/intelligence/community/experiences/${POST}`) {
      if(state.stale) return route.fulfill({status:404,json:{success:false}});
      body={success:true,experience:contribution,sourceState:'DURABLE_POSTGRES'};
    }
    if(url.pathname===`/api/v1/trust/cases/${CASE}`) body={success:true,case:{id:CASE,owner_id:state.wrongOwner?EXPERT:USER,claims:[{id:POST,statement:'Câu hỏi trong hồ sơ của tôi'}],evidence:[]}};
    if(url.pathname==='/api/v1/trust/cases') body={success:true,cases:[{id:CASE,case_revision:3,input_type:'TEXT',created_at:'2026-09-28T08:00:00Z'}]};
    if(url.pathname==='/api/chat') body={role:'assistant',providerStatus:state.providerStatus||'LIVE',requestId:'isolated-chat-response',content:state.malicious?'[Chạy](javascript:alert(1)) <img src=x onerror=alert(1)>\n\n[Điểm đến bị loại](/dashboard)\n\n[Link chứa token](https://example.org?token=secret)\n\n[Kiểm chứng](/trust)':answer};
    if(url.pathname.includes('realtime')) return route.fulfill({status:503,json:{success:false}});
    return route.fulfill({json:body});
  });
  await page.goto('/trust');
  await expect(page.getByText('Đang xác minh phiên…')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-theme',state.theme==='midnight'?'midnight':'light');
  await expect(page.locator('html')).toHaveAttribute('data-paper',state.theme==='midnight'?'night':'day');
  return {state,calls,errors};
}
const dialog=(page:Page)=>page.getByRole('dialog',{name:'Omni',exact:true});
const query=(page:Page)=>dialog(page).getByRole('combobox',{name:'Tìm trong StudentHub'});
async function open(page:Page) { await page.getByRole('button',{name:/Mở AI \/ Omni/}).first().click(); await expect(query(page)).toBeFocused(); }
async function search(page:Page,value='nguồn') { await query(page).fill(value); await expect(dialog(page).getByText('Đang tìm nội dung phù hợp…')).toHaveCount(0); }
async function mixed(page:Page) { await search(page); await expect(dialog(page).getByRole('option')).toHaveCount(4); }
async function shot(page:Page,name:string) { await mkdir(DIR,{recursive:true});await page.screenshot({path:path.join(DIR,`${name}.png`)});captures.push({file:`${name}.png`,viewport:page.viewportSize(),classification:'ISOLATED CONTRACT FIXTURE — NOT LIVE',timestamp:new Date().toISOString()});await writeFile(path.join(DIR,'screenshots.json'),JSON.stringify(captures,null,2)); }
async function noOverflow(page:Page,checkDocument=true) { await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));if(checkDocument){const size=await page.evaluate(()=>({root:document.documentElement.scrollWidth,viewport:innerWidth,offenders:[...document.body.querySelectorAll('*')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,className:typeof el.className==='string'?el.className:'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}}).filter(el=>el.right>innerWidth+1||el.left< -1).slice(0,20)}));expect(size.root,`document overflow at viewport ${size.viewport}: ${JSON.stringify(size)}`).toBeLessThanOrEqual(size.viewport+1);}const box=await dialog(page).boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(page.viewportSize()!.width+1);const inner=await dialog(page).evaluate(el=>el.scrollWidth<=el.clientWidth+1);expect(inner).toBe(true); }
async function axe(page:Page) { await dialog(page).evaluate(async element=>{await Promise.all(element.getAnimations().filter(animation=>animation.playState==='running').map(animation=>animation.finished.catch(()=>undefined)));});const result=await new AxeBuilder({page}).include('[data-testid="omni-v4"]').analyze();expect(result.violations.filter(v=>['serious','critical'].includes(v.impact||''))).toEqual([]); }

test('one surface opens from shell, traps keyboard, restores focus and navigates commands',async({page})=>{
  const h=await harness(page);const trigger=page.getByRole('button',{name:/Mở AI \/ Omni/}).first();await open(page);
  await expect(dialog(page).getByRole('option')).toHaveCount(6);await axe(page);await shot(page,'01-initial');
  await query(page).press('Shift+Tab');await expect(dialog(page).getByRole('button',{name:'Đóng Omni'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(dialog(page).getByRole('button',{name:'Mở Kiểm chứng',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(dialog(page)).toHaveCount(0);await expect(trigger).toBeFocused();
  await page.keyboard.press('Control+k');await expect(query(page)).toBeFocused();await query(page).fill('> cài đặt');
  await expect(dialog(page).getByRole('option')).toHaveCount(1);await query(page).press('Enter');await expect(page).toHaveURL(/\/settings$/);await expect(dialog(page)).toHaveCount(0);
  expect(h.calls.some(c=>c.path.startsWith('/api/chat'))).toBe(false);expect(h.errors).toEqual([]);
});
test('mixed results preserve identity, public filtering, scopes and source provenance',async({page})=>{
  const h=await harness(page);await open(page);await mixed(page);await expect(dialog(page).getByText('PRIVATE HIDDEN RESULT')).toHaveCount(0);await shot(page,'02-mixed');await axe(page);
  await dialog(page).getByRole('option',{name:/Minh An/}).hover();await expect(dialog(page).getByText('PUBLIC POLICY')).toBeVisible();await shot(page,'03-expert-detail');
  await dialog(page).getByRole('option',{name:/Hướng dẫn/}).click();await expect(dialog(page).getByRole('link',{name:/Mở Hướng dẫn/})).toHaveAttribute('href',SOURCE);await shot(page,'04-source-context');
  await dialog(page).getByRole('option',{name:/Cùng đọc nguồn/}).click();await expect(page).toHaveURL(new RegExp(`/community/discussion/${POST}$`));expect(h.calls.some(c=>c.path===`/api/community/social?postId=${POST}`)).toBe(true);expect(h.errors).toEqual([]);
});
test('Trust exact owner lookup, wrong owner exclusion, and canonical case handoff',async({page})=>{
  const h=await harness(page);await open(page);await search(page,CASE);await expect(dialog(page).getByRole('option',{name:/Câu hỏi trong hồ sơ/})).toBeVisible();await shot(page,'05-owned-trust');
  h.state.wrongOwner=true;await dialog(page).getByRole('option',{name:/Câu hỏi trong hồ sơ/}).click();await expect(dialog(page).getByRole('alert')).toContainText('không còn khả dụng');await expect(page).toHaveURL(/\/trust$/);
  h.state.wrongOwner=false;await query(page).fill('');await search(page,CASE);await query(page).press('Enter');await expect(page).toHaveURL(new RegExp(`caseId=${CASE}`));await expect(page.getByRole('heading',{name:'Hồ sơ đã lưu'})).toBeVisible();await expect(page.getByText('Câu hỏi trong hồ sơ của tôi')).toBeVisible();expect(h.errors).toEqual([]);
});
test('stale selection is removed and cannot navigate after publication disappears',async({page})=>{
  const h=await harness(page,{stale:true});await open(page);await mixed(page);await dialog(page).getByRole('option',{name:/Đối chiếu nguồn/}).click();await expect(dialog(page).getByRole('alert')).toContainText('không còn khả dụng');await shot(page,'06-stale-result');await expect(page).toHaveURL(/\/trust$/);expect(h.errors).toEqual([]);
});
test('older responses cannot replace newer query, command typing never calls remote search',async({page})=>{
  const h=await harness(page,{race:true});await open(page);await query(page).fill('alpha');await expect.poll(()=>h.calls.some(c=>c.path.includes('q=alpha'))).toBe(true);
  await query(page).fill('beta');await expect(dialog(page).getByRole('option',{name:/beta đóng góp/})).toBeVisible();await page.waitForTimeout(1000);await expect(dialog(page).getByText(/alpha đóng góp/)).toHaveCount(0);
  const before=h.calls.length;await query(page).fill('> expert');await page.waitForTimeout(300);expect(h.calls.length).toBe(before);expect(h.errors).toEqual([]);
});
test('AI is explicit and lazy; minimal removable topic context; safe Markdown and links',async({page})=>{
  const h=await harness(page,{malicious:true});await open(page);await search(page,'Làm rõ một câu hỏi');expect(h.calls.some(c=>c.path==='/api/chat')).toBe(false);
  const before=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/_next/')&&e.name.includes('.js')).map(e=>e.name));
  await dialog(page).getByRole('checkbox',{name:/Thêm chủ đề/}).uncheck();await dialog(page).getByRole('button',{name:'Hỏi AI',exact:true}).click();await expect(dialog(page).getByText('Gợi ý này chưa được kiểm chứng.',{exact:false})).toBeVisible();
  const request=h.calls.find(c=>c.path==='/api/chat')!.body as {subject:string;messages:{content:string}[]};expect(request.subject).toBe('general');expect(request.messages).toHaveLength(1);expect(JSON.stringify(request)).not.toContain(CASE);
  await expect(dialog(page).locator('img,script,iframe')).toHaveCount(0);await expect(dialog(page).locator('a[href^="javascript:"],a[href*="token="],a[href="/dashboard"]')).toHaveCount(0);await expect(dialog(page).getByRole('link',{name:'Kiểm chứng',exact:true})).toHaveAttribute('href','/trust');
  const after=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/_next/')&&e.name.includes('.js')).map(e=>e.name));expect(after.filter(name=>!before.includes(name)).length).toBeGreaterThan(0);
  await axe(page);await shot(page,'07-ai-safe-output');expect(h.errors).toEqual([]);
});
test('HTTP 200 provider failure is unavailable and session close clears AI context',async({page})=>{
  const h=await harness(page,{providerStatus:'LIVE_PROVIDER_NOT_CONFIGURED'});await open(page);await search(page,'Cần kiểm tra gì');await dialog(page).getByRole('button',{name:'Hỏi AI',exact:true}).click();await expect(dialog(page).getByRole('alert')).toContainText('chưa trả lời');await shot(page,'08-ai-unavailable');
  await page.keyboard.press('Escape');await open(page);await expect(query(page)).toHaveValue('');await expect(dialog(page).getByTestId('omni-ai-answer')).toHaveCount(0);expect(h.errors).toEqual([]);
});
test('anonymous search cannot read private Trust or call AI; fixtures fail closed',async({page})=>{
  const h=await harness(page,{anonymous:true,fixture:true});await open(page);await expect(dialog(page).getByRole('option')).toHaveCount(3);await search(page,CASE);await expect(dialog(page).getByText('Đăng nhập để tra cứu hồ sơ của bạn bằng mã đầy đủ.')).toBeVisible();expect(h.calls.some(c=>c.path.includes(`/api/v1/trust/cases/${CASE}`))).toBe(false);
  await search(page,'nguồn');await expect(dialog(page).getByRole('option')).toHaveCount(0);await expect(dialog(page).getByRole('button',{name:'Hỏi AI',exact:true})).toHaveCount(0);expect(h.calls.some(c=>c.path==='/api/chat')).toBe(false);expect(h.errors).toEqual([]);
});
test('responsive state evidence at all seven widths, including mobile viewport contraction',async({page})=>{
  const h=await harness(page);
  for(const width of [360,390,768,1024,1280,1440,1920]){
    await page.setViewportSize({width,height:960});await open(page);await shot(page,`responsive-${width}-initial`);await noOverflow(page);
    await mixed(page);await shot(page,`responsive-${width}-mixed`);
    await dialog(page).getByRole('option',{name:/Đối chiếu nguồn/}).hover();await shot(page,`responsive-${width}-community`);
    await dialog(page).getByRole('option',{name:/Minh An/}).hover();await shot(page,`responsive-${width}-expert`);
    await dialog(page).getByRole('option',{name:/Hướng dẫn/}).click();await expect(dialog(page).getByRole('link',{name:/Mở Hướng dẫn/})).toBeVisible();await shot(page,`responsive-${width}-context-action`);
    await search(page,CASE);await expect(dialog(page).getByRole('option',{name:/Câu hỏi trong hồ sơ/})).toBeVisible();await shot(page,`responsive-${width}-trust`);
    await search(page,'zz-no-result');await expect(dialog(page).getByRole('heading',{name:'Không tìm thấy nội dung phù hợp.'})).toBeVisible();await shot(page,`responsive-${width}-empty`);
    await search(page,'searcherror');await expect(dialog(page).getByRole('alert')).toBeVisible();await shot(page,`responsive-${width}-error`);
    await search(page,'Hỏi rõ về nguồn');await dialog(page).getByRole('button',{name:'Hỏi AI',exact:true}).click();await expect(dialog(page).getByText('Gợi ý này chưa được kiểm chứng.',{exact:false})).toBeVisible();await shot(page,`responsive-${width}-ai`);await noOverflow(page);
    if(width<=390){await page.setViewportSize({width,height:480});await expect(query(page)).toBeVisible();await expect(dialog(page).getByRole('button',{name:'Đóng Omni'})).toBeInViewport();await shot(page,`responsive-${width}-keyboard-viewport-proxy`);await page.setViewportSize({width,height:960});}
    await axe(page);await page.keyboard.press('Escape');
  }
  expect(h.errors).toEqual([]);
});
test('Midnight, system theme, reduced motion, 200 percent zoom and text spacing',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});const h=await harness(page,{theme:'midnight'});await open(page);await mixed(page);
  for(const width of [360,390,768,1024,1280,1440,1920]){await page.setViewportSize({width,height:960});await noOverflow(page,false);await shot(page,`midnight-${width}`);await axe(page);}
  expect(await dialog(page).evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>{document.documentElement.style.zoom='2';});await noOverflow(page,false);await shot(page,'accessibility-zoom200');await page.evaluate(()=>{document.documentElement.style.zoom='';});
  await page.addStyleTag({content:'[data-testid="omni-v4"] * {line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}'});await noOverflow(page);await shot(page,'accessibility-text-spacing');
  expect(h.errors).toEqual([]);
});
test('compatibility AI entry opens the same shell Omni',async({page})=>{
  await harness(page);await page.goto('/ai');await expect(page).toHaveURL(/\/trust\?omni=1$/);await expect(query(page)).toBeFocused();await expect(dialog(page)).toHaveCount(1);
});
test('five production LAB samples for open, local/mixed results, AI and contextual action',async({page})=>{
  await harness(page);const samples:object[]=[];
  for(let i=0;i<6;i++){
    await open(page);
    const opening=await page.evaluate(()=>{const start=performance.getEntriesByName('omni-v4:test-open-intent').at(-1)!.startTime;return {openMs:performance.getEntriesByName('omni-v4:open').at(-1)!.startTime-start,localResultsMs:performance.getEntriesByName('omni-v4:local-results').at(-1)!.startTime-start};});
    const queryStart=await page.evaluate(()=>performance.now());await mixed(page);
    const mixedMs=await page.evaluate(start=>performance.now()-start,queryStart);
    await dialog(page).getByRole('option',{name:/Hướng dẫn/}).click();await expect(dialog(page).getByRole('link',{name:/Mở Hướng dẫn/})).toBeVisible();
    const actionMs=await page.evaluate(()=>performance.getEntriesByName('omni-v4:context-action').at(-1)!.startTime-performance.getEntriesByName('omni-v4:context-action-start').at(-1)!.startTime);
    await dialog(page).getByRole('button',{name:'Hỏi AI',exact:true}).click();await expect(dialog(page).getByText('Gợi ý này chưa được kiểm chứng.',{exact:false})).toBeVisible();
    const ai=await page.evaluate(()=>({rendererMs:performance.getEntriesByName('omni-v4:ai-renderer').at(-1)!.startTime-performance.getEntriesByName('omni-v4:ai-invoke').at(-1)!.startTime,answerMs:performance.getEntriesByName('omni-v4:ai-ready').at(-1)!.startTime-performance.getEntriesByName('omni-v4:ai-invoke').at(-1)!.startTime}));
    samples.push({sample:i,cold:i===0,...opening,mixedMs,actionMs,...ai});await page.keyboard.press('Escape');
  }
  await mkdir(DIR,{recursive:true});await writeFile(path.join(DIR,'performance-samples.json'),JSON.stringify({classification:'LOCAL PRODUCTION BUILD + MOCKED CONTRACT RESPONSES; NOT FIELD INP OR PROVIDER LATENCY',samples},null,2));
  const warm=samples.slice(1) as {openMs:number;localResultsMs:number;mixedMs:number;actionMs:number;rendererMs:number}[];
  const median=(key:keyof typeof warm[0])=>warm.map(s=>s[key]).sort((a,b)=>a-b)[2];
  expect(median('openMs')).toBeLessThan(250);expect(median('localResultsMs')).toBeLessThan(250);expect(median('mixedMs')).toBeLessThan(1500);expect(median('actionMs')).toBeLessThan(500);expect(median('rendererMs')).toBeLessThan(500);
});
