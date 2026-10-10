// Human-readable decision path for product-video-replication.
// Examples are pinned runs from the 43 customer-reference cases; the low-fit example is the user-selected Qianyi session.
const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
// Resolve the original dashboard's root-relative asset paths against the
// GitHub Pages project URL (for example /ecommerce-marketing-video-replication-skill/).
const localUrl = value => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '';
  return esc(new URL(value.slice(1), document.baseURI).href);
};

export const caseCatalog = {
  camisole: {
    key:'camisole', pid:'3841717054700912697', videoNumber:1, label:'细肩带背心', seconds:37.454,
    poster:'/workflow-assets/camisole-1.jpg', clip:'/workflow-assets/method-camisole-0-10.mp4',
    frames:[{time:3,label:'原片是宽肩带'},{time:17.27,label:'自然硬切位置'},{time:30,label:'后半段换色展示'}]
  },
  bracelet: {
    key:'bracelet', pid:'3843392270011334730', videoNumber:1, label:'桃木手串', seconds:12.746,
    poster:'/workflow-assets/bracelet-1.jpg', clip:'/workflow-assets/method-bracelet-0-8.mp4',
    frames:[{time:1,label:'腕部佩戴'},{time:6,label:'中段展示动作'},{time:11,label:'结尾商品画面'}]
  },
  pants: {
    key:'pants', pid:'3805716677245665565', videoNumber:1, label:'小黑裤', seconds:279.035,
    poster:'/workflow-assets/pants-1.jpg', clip:'/workflow-assets/method-pants-21-39.mp4',
    frames:[{time:21,label:'发现出席场合'},{time:35,label:'穿着成为冲突'},{time:75,label:'支持成为转折'}]
  },
  shoes: {
    key:'shoes', pid:'3776986041119015019', videoNumber:1, label:'老人鞋', seconds:49.412,
    poster:'/workflow-assets/shoes-1.jpg',
    frames:[{time:3,label:'前段商品展示'},{time:24,label:'自然分段位置'},{time:40,label:'后段试穿动作'}]
  },
  probiotic: {
    key:'probiotic', pid:'3724768853100724519', videoNumber:3, label:'益生菌', seconds:13.468,
    poster:'/workflow-assets/probiotic-1.jpg', clip:'/workflow-assets/method-probiotic-0-10.mp4',
    frames:[{time:1,label:'开头展示'},{time:6,label:'商品出现'},{time:11,label:'结束展示'}]
  },
  aicCamisole: {
    key:'aicCamisole', pid:'3832288776768586229', videoNumber:1, label:'大码女装背心 × 染发膏原片', seconds:183.033,
    sessionId:'837550881282', poster:'/workflow-assets/aic-camisole-ref-3.jpg', afterPoster:'/workflow-assets/aic-camisole-after-3.jpg',
    clip:'/workflow-assets/fit-aic-camisole-before-0-10.mp4', afterClip:'/workflow-assets/fit-aic-camisole-after-0-10.mp4', afterLabel:'复刻后 · 千意成片',
    frames:[{time:3,label:'事件型钩子'},{time:45,label:'染发膏商品展示'},{time:130,label:'染发实操与效果证明'}]
  },
  aicCordyceps: {
    key:'aicCordyceps', pid:'3535157620023425325', videoNumber:1, label:'冬虫夏草礼盒 × 食品办公室情景剧', seconds:53.104,
    sessionId:'837553320706', replicationVersion:'V1.1.0', poster:'/workflow-assets/cordyceps-ref-8.jpg', afterPoster:'/workflow-assets/cordyceps-after-8.jpg',
    clip:'/workflow-assets/fit-cordyceps-before-0-15.mp4', afterClip:'/workflow-assets/fit-cordyceps-after-0-15.mp4', afterLabel:'复刻后 · 千意成片',
    frames:[{time:4,label:'办公室质问钩子'},{time:16,label:'食品开始加量'},{time:40,label:'满桌商品展示'}]
  }
};

export const showcaseCases = Object.values(caseCatalog);

export const fitCases = [
  {
    level:'高适配', tone:'high', caseKey:'bracelet', verdict:'可以近似复刻',
    evidence:'原片和目标都是手串，腕部佩戴、转动和近景展示都能直接沿用；真正需要替换的是材质、双圈结构、配珠和莲花装饰。',
    lesson:'因此优先尝试“商品图＋视频参考”。但 A 版仍改变了人物、背景和商品长环，说明高适配不等于自动通过验收。'
  },
  {
    level:'中适配', tone:'medium', caseKey:'aicCordyceps', verdict:'商品不能直接替换，但营销机制可以完整迁移',
    evidence:'目标是高端冬虫夏草礼盒，参考片是盼盼面包和乳酸菌的办公室情景剧。品类、价格和卖点不同，但“老板来买货→逐级加量→满桌展示→直播间促单”的商业结构，可以合理改写到礼盒商品上。',
    lesson:'千意 Session 837553320706 先指出跨品类差异，并请客户选择改编方式；客户确认保留办公室反转和加量结构。最终生成 28 秒＋25 秒两段并合成为 53.011 秒成片，商品、台词和卖点全部改为冬虫夏草。它比低适配多了一条可完整继承的营销主线，但仍不是直接换商品的 1:1 复刻。'
  },
  {
    level:'低适配', tone:'low', caseKey:'aicCamisole', verdict:'商品和参考完全不同品类，不能直接复刻',
    evidence:'目标商品是大码女装背心，参考原片实际是染发膏广告。商品形态、使用动作、口播卖点、实操证明和目标人群都无法直接迁移。',
    lesson:'千意 Session 837550881282 先识别出跨品类冲突，并向用户确认“保留营销机制改编”。最终只继承“事件型钩子→痛点点题→多人展示→效果对比→直播间转化”的结构，重写为 7 段、133 秒女装广告；这属于创意改编，不是 1:1 复刻，而且成片中的服装款式仍有不稳定。'
  }
];

export const replicationDegreeCases = [
  {
    name:'A · 较强复刻', caseKey:'pants', versionId:'import-A_story-v1',
    customerChoice:'客户更想保留原片的冲突、人物关系和情绪推进',
    decision:'保留“被质疑→被支持→有信心赴约”的因果骨架，把豆浆改成小黑裤介入故事。',
    tech:'18 秒原片冲突段＋3 张裤子商品图＋重写后的 30 秒剧情 Prompt；Seedance 2.5 视频参考生成。',
    output:'30.042 秒新剧情成片', clip:'/workflow-assets/after-pants-story-0-18.mp4'
  },
  {
    name:'B · 中度改编', caseKey:'pants', versionId:'import-B_comedy-v1',
    customerChoice:'客户只想保留“出门前被帮助完成穿搭”的营销桥接',
    decision:'不上传参考视频，改写成夫妻选衣轻喜剧；保留帮助与出门结果，不照搬原人物关系和冲突。',
    tech:'3 张裤子商品图＋28 秒对白时间轴；Seedance 2.5 图文生成。',
    output:'28.042 秒轻喜剧成片', clip:'/workflow-assets/after-pants-comedy-0-18.mp4'
  },
  {
    name:'C · 自由改编', caseKey:'pants', versionId:'import-C_loop-v1',
    customerChoice:'客户只保留“准备好后从容赴约”的情绪和商品角色',
    decision:'舍弃原剧情，改为一条裤子覆盖办公室、街边、咖啡馆三种场合的穿搭展示。',
    tech:'先生成角色与裤装锚点，再把同一锚点作为首帧和尾帧，以 24 秒时间轴生成。',
    output:'24.042 秒首尾呼应成片', clip:'/workflow-assets/after-pants-anchor-0-18.mp4'
  }
];

export const methodCases = [
  {name:'视频参考生成',caseKey:'bracelet',segment:'0–8 秒',versionId:'import-A_direct-v1',choose:'原视频的动作、构图很重要，而且商品品类接近时优先使用。',tech:'Seedance 2.5 reference_generation（generate_type=0）；参考视频控制动作、构图和节奏，商品图约束手串外观。',input:'4 张商品图＋完整手串参考视频；页面截取原片 0–8 秒用于对比。',output:'13.05 秒、720×1280、有音轨的模型成片；页面截取成片 0–8 秒。',beforeClip:'/workflow-assets/method-bracelet-0-8.mp4',afterClip:'/workflow-assets/after-bracelet-video-ref-0-8.mp4',result:'关键配珠和吊坠可见，但人物、背景和动作也被重新生成，没做到“只换手串”。'},
  {name:'局部替换（应法务要求，已屏蔽该能力）',caseKey:'camisole',segment:'0–10 秒',versionId:'import-B_timeline-v1',choose:'历史方法说明，仅用于理解旧版本；当前合规流程不再选择该能力。',tech:'该能力已屏蔽。需要保留动作节奏时，改为提取抽象时间轴后全镜头重新生成，不在原画面上擦除、遮罩或替换商品。',input:'历史示例：4 张目标背心商品图＋两段文字时间轴；新合规任务不得复制参考音轨。',output:'历史第二个 Codex 版本 B_timeline；新任务不再生成局部替换版本。',beforeClip:'/workflow-assets/method-camisole-0-10.mp4',afterClip:'/workflow-assets/after-camisole-timeline-0-10.mp4',result:'该历史版本用商品图和重建时间轴重新生成，说明全镜头重生成可以继承动作节奏。合规版不再使用局部替换或原音轨复制。'},
  {name:'剧情改编',caseKey:'pants',segment:'21–39 秒',versionId:'import-A_story-v1',choose:'跨品类，但原片的冲突、情绪或回报机制仍有价值时使用。',tech:'Codex 从 279 秒原片提取“穿着门槛→受到支持→赴约”的因果机制，裁出 21–39 秒冲突片段；Seedance 2.5 生成全新的 30 秒剧情和中文音轨，不复制豆浆对白。',input:'3 张裤子商品图＋18 秒办公室冲突片段＋重写后的 30 秒剧情 Prompt。',output:'30.042 秒、720×1280、有新音轨的模型原件，无后期剪辑；页面展示前 18 秒。',beforeClip:'/workflow-assets/method-pants-21-39.mp4',afterClip:'/workflow-assets/after-pants-story-0-18.mp4',result:'形成“被质疑→获得支持→收到裤子→换装出席”的完整链条，商品进入故事比较自然。'},
  {name:'时间轴重建',caseKey:'probiotic',segment:'0–10 秒',versionId:'import-B_timeline-v1',choose:'想保留原片的镜头顺序和动作，但不适合把原视频直接交给生成模型时使用。',tech:'Codex 先在本地按 1 fps 理解 13.468 秒参考视频，再人工写出 0–13.47 秒的逐段布景、手势、倒粉、加水和收尾时间轴；Seedance 2.5 以 generate_type=0 生成，但模型侧只接收商品图和文字。',input:'1 张蓝色益生菌盒商品图＋14 秒文字时间轴；参考视频只用于本地分析，明确没有上传给模型。',output:'模型先生成 14.05 秒，再按原片 404 帧裁回 13.468 秒并复制原参考 AAC；最终 720×1280、30 fps，页面展示前 10 秒。',beforeClip:'/workflow-assets/method-probiotic-0-10.mp4',afterClip:'/workflow-assets/after-probiotic-timeline-0-10.mp4',result:'蓝盒、手持指示、倒粉和加水顺序大体重建成功，但构图、切点和小袋细节是重新生成的，不能称为逐像素复刻。'}
];

export const lengthCases = [
  {
    caseKey:'aicCordyceps', mode:'split', title:'完整保留：按剧情断点拆成 2 个生成任务',
    sourceDuration:'53.104 秒', outputDuration:'53.011 秒', boundary:'28 秒', sessionId:'837553320706', version:'V1.1.0',
    segments:[
      {number:'01',range:'0–28 秒',resultRange:'0–28 秒',sourceClip:'/workflow-assets/length-cordyceps-source-part1-0-28.mp4',afterClip:'/workflow-assets/length-cordyceps-after-part1-0-28.mp4',content:'办公室门口质问起手，反转发现是老板来买货；接着逐级展示 12.5 克、25 克、50 克礼盒，停在“老板还嫌量少”的悬念上。',rewrite:'保留“质问→老板买货→逐级加量”，把面包和乳酸菌换成冬虫夏草三种规格，台词改写为头茬新干、高海拔头采等商品信息。'},
      {number:'02',range:'28–53.104 秒',resultRange:'28–53.011 秒',sourceClip:'/workflow-assets/length-cordyceps-source-part2-28-53.mp4',afterClip:'/workflow-assets/length-cordyceps-after-part2-28-53.mp4',content:'承接“还不够”继续加量，用满桌礼盒完成视觉高潮，再加入 17 年专注虫草的品牌背书、老板满意和直播间促单。',rewrite:'保留“继续加量→满桌展示→人物满意→直播间转化”，重写全部商品、卖点和促单台词，将第 1 段留下的“量不够”问题在本段解决。'}
    ],
    outputClip:'/workflow-assets/length-cordyceps-after-full.mp4'
  },
  {
    caseKey:'pants', mode:'compress', title:'允许改编：从 279 秒原片压缩成 30 秒完整广告',
    sourceDuration:'279.035 秒', outputDuration:'30.042 秒',
    modules:[
      {range:'21–39 秒',title:'赴约设定＋着装冲突',clip:'/workflow-assets/method-pants-21-39.mp4',use:'唯一上传给模型的视频参考，提供办公室对话节奏和反应镜头。'},
      {range:'40–54 秒',title:'女主退让',clip:'/workflow-assets/length-pants-source-retreat-40-54.mp4',use:'只用于本地理解“冲突造成的情绪后果”，不上传给模型。'},
      {range:'68–77 秒',title:'伴侣支持＋新衣承诺',clip:'/workflow-assets/length-pants-source-support-68-77.mp4',use:'只用于本地理解转折：支持她赴约，并提出已经准备新衣。'},
      {range:'81–86 秒',title:'心意被看见',clip:'/workflow-assets/length-pants-source-payoff-81-86.mp4',use:'只用于本地理解情绪回报，不照搬后续豆浆广告。'}
    ],
    outputClip:'/workflow-assets/length-pants-after-story-full.mp4'
  }
];

function itemFor(items, c) { return items.find(item => item.dataset === 'customer' && item.pid === c.pid && item.videoNumber === c.videoNumber); }
function productThumb(items, c) {
  const image = itemFor(items, c)?.productImages?.[0];
  return image ? `<img class="wf-case-product" src="${localUrl(image)}" alt="${esc(c.label)}商品图">` : '<div class="wf-case-product wf-missing">商品图不可用</div>';
}
function referenceSrc(items, c) { return c.clip || itemFor(items, c)?.referenceVideoUrl || ''; }
function videoTag(src, _poster, label) {
  return src ? `<video controls playsinline preload="metadata" src="${localUrl(src)}" aria-label="${esc(label)}"></video>` : `<div class="wf-video-missing">${esc(label)}不可用</div>`;
}
function comparePair(beforeSrc, afterSrc, c, beforeLabel = '复刻前 · 参考片段', afterLabel = '复刻后 · Codex 成片') {
  return `<div class="wf-compare-pair"><figure><figcaption>${esc(beforeLabel)}</figcaption>${videoTag(beforeSrc,c.poster,`${c.label}${beforeLabel}`)}</figure><figure><figcaption>${esc(afterLabel)}</figcaption>${afterSrc ? videoTag(afterSrc,c.afterPoster || c.poster,`${c.label}${afterLabel}`) : '<div class="wf-video-missing is-output">没有输出视频<br><small>任务创建前失败，如实保留</small></div>'}</figure></div>`;
}
function fullUnderstanding(items) {
  const c = caseCatalog.shoes;
  const item = itemFor(items, c);
  return `<section id="wf-understanding" class="wf-doc-section">
    <header class="wf-doc-heading"><span>第一部分</span><h3>一、最开始是怎么理解视频的？</h3><p>完成抽帧不等于完成理解。Skill 会先确认视频技术事实，再分层看画面，最后把画面、声音和商品事实整理成可执行的结构。</p></header>
    <div class="wf-reading-layout"><div class="wf-prose">
      <h4>第一步不是抽帧，而是探查视频</h4><p>先读取真正的视频时长、帧率、总帧数、分辨率、旋转信息和音轨。原因是“播放器显示 49 秒”并不等于存在 49 秒有效画面，也不能只用“时长 × 30”推算帧数。</p>
      <div class="wf-case-note"><b>老人鞋 Case</b><p>原片容器时长 49.411995 秒，视频流实际 49.4 秒、30 fps、1482 帧，音频略长。最终验收以视频流帧数为准，而不是只看容器时长。</p></div>
      <h4>第二步才是分层抽帧</h4><p>抽帧不是固定每秒一张，而是先粗看全片，再对钩子、商品出现、剧情转折和剪辑点加密。快速动作、文字变化或接缝位置，必要时会提高到每秒 4–10 帧甚至逐帧查看。</p>
      <div class="wf-case-note"><b>老人鞋 Case</b><p>先看完整的商品展示、手持细节、试穿和户外步行，再重点检查 24 秒附近。这个位置被选为两段的边界，但记录中明确说明：它是可用的人工切点，不是假装成“算法证明的最优切点”。</p></div>
      <h4>第三步是理解声音和文字</h4><p>如果是口播或剧情，光看图不够。还要确认台词、画面字幕、谁在说话，以及原音轨是否提到了原商品。OCR 只能证明画面上有什么字，不能替代听音。</p>
      <div class="wf-case-note"><b>老人鞋 Case</b><p>原片字幕按 0.25 秒采样识别并人工校对，得到 33 条有效字幕；原音轨保留用于评测，但记录同时提醒：参考中的性能话术并未自动获得新商品事实支持。</p></div>
      <h4>最终形成两份核心理解</h4><div class="wf-output-pair"><article><b>参考视频结构表</b><p>每个镜头发生什么、钩子是什么、商品何时出现、证明段和结尾在哪里。</p></article><article><b>商品事实表</b><p>商品到底是哪一个 SKU、可见结构和颜色是什么、哪些卖点有依据、哪些不能写。</p></article></div>
      <p class="wf-conclusion"><b>这个 Case 的理解结果：</b>要保留 49.4 秒完整内容，因此按 24 秒边界分两段；选择酒红色款和三张结构图；A 版用视频参考保镜头，B 版用文字时间轴保商品，最后分别检查接缝、商品和字幕。</p>
    </div><aside class="wf-case-aside"><span class="wf-aside-label">完整理解 Case · 43 条中的真实原片</span><div class="wf-case-identity">${productThumb(items,c)}<div><b>${esc(c.label)}</b><small>PID ${esc(c.pid)} · 视频 1</small></div></div>${item?.referenceVideoUrl ? `<video id="wf-understanding-video" controls playsinline preload="metadata" src="${localUrl(item.referenceVideoUrl)}"></video>` : '<div class="wf-media-empty">参考视频不可用</div>'}<div class="wf-filmstrip">${c.frames.map((frame,index)=>`<button type="button" data-wf-seek="${frame.time}" data-wf-target="wf-understanding-video"><img loading="lazy" src="/workflow-assets/${c.key}-${index+1}.jpg" alt="${esc(frame.label)}"><span>${frame.time} 秒 · ${esc(frame.label)}</span></button>`).join('')}</div></aside></div>
  </section>`;
}

function fitSection(items) {
  const dimensions = [['商品身份','商品名称、图片、SKU 是否一致？'],['镜头适配','原视频的动作和构图能否换成新商品？'],['叙事适配','新商品能否合理参与原故事的冲突和解决？'],['卖点适配','原广告说的功能、价格、效果能否迁移？'],['生成可行性','当前模型能否把旧商品干净地替换掉？']];
  const afterByCase = {bracelet:'/workflow-assets/after-bracelet-video-ref-0-8.mp4',aicCordyceps:'/workflow-assets/fit-cordyceps-after-0-15.mp4',aicCamisole:'/workflow-assets/fit-aic-camisole-after-0-10.mp4'};
  const pants = caseCatalog.pants;
  return `<section class="wf-doc-section"><header class="wf-doc-heading"><span>第二部分</span><h3>二、怎么判断视频和商品适不适配？</h3><p>这里看的不是“长得像不像”，也不是先打一个总分，而是判断哪些内容可以安全继承。先看高、中、低三档；即使落在同一档，无法确定客户想保留什么时，仍然要问客户。</p></header><div class="wf-dimension-table"><div class="wf-table-head"><b>判断维度</b><b>实际问题</b></div>${dimensions.map(row=>`<div><b>${row[0]}</b><span>${row[1]}</span></div>`).join('')}</div><div class="wf-fit-list">${fitCases.map((fit,index)=>{const c=caseCatalog[fit.caseKey];return `<article class="wf-fit-row ${fit.tone}"><div class="wf-fit-copy"><span>${index+1}. ${esc(fit.level)}</span><h4>${esc(fit.verdict)}</h4><p>${esc(fit.evidence)}</p><div class="wf-case-note"><div class="wf-case-note-title">${productThumb(items,c)}<b>${esc(c.label)} Case</b></div><p>${esc(fit.lesson)}</p></div></div>${comparePair(referenceSrc(items,c),afterByCase[c.key],c,'复刻前 · 参考片段',c.afterLabel || '复刻后 · Codex 成片')}</article>`;}).join('')}</div><article class="wf-uncertain-fit"><div class="wf-uncertain-copy"><span>4. 无法确定是否适配</span><h4>不要替客户决定“要复刻到什么程度”</h4><p>有些参考并不是简单的高或低适配：镜头、情绪和营销桥接各自有价值，但不可能全部照搬。这时要把可选的复刻程度说清楚，请客户确认更想保留哪一层。</p><div class="wf-ask-line"><b>建议向客户确认：</b><span>更看重原片剧情和人物关系、只保留营销结构，还是只保留情绪与商品角色？</span></div><div class="wf-case-note"><div class="wf-case-note-title">${productThumb(items,pants)}<b>小黑裤 Case · 同一目标的三种真实版本</b></div><p>原片是 279 秒豆浆短剧，目标商品是小黑裤。下面三条都真实跑过，但复刻程度不同。它们不是同一位客户连续选择三次，而是用来说明：客户选择会直接改变技术路线和成片形态。</p></div></div><figure class="wf-shared-reference"><figcaption>三个版本共同参考 · 21–39 秒冲突片段</figcaption>${videoTag(referenceSrc(items,pants),pants.poster,'小黑裤三个版本共同参考片段')}</figure></article><div class="wf-degree-grid">${replicationDegreeCases.map((degree,index)=>`<article><span>0${index+1}</span><h4>${esc(degree.name)}</h4><p class="wf-degree-choice">${esc(degree.customerChoice)}</p><dl><div><dt>怎么处理</dt><dd>${esc(degree.decision)}</dd></div><div><dt>技术路线</dt><dd>${esc(degree.tech)}</dd></div><div><dt>实际输出</dt><dd>${esc(degree.output)}</dd></div></dl>${videoTag(degree.clip,pants.poster,`${degree.name}成片片段`)}</article>`).join('')}</div><blockquote>商品正确性是硬门槛。中适配表示存在可迁移的结构，但商品事实和动作仍需重写；低适配不能声称在做 1:1 复刻。无法确定复刻程度时，先让客户选择保留哪一层，再决定技术路线。</blockquote></section>`;
}

function methodSection(items) {
  return `<section class="wf-doc-section"><header class="wf-doc-heading"><span>第三部分</span><h3>三、怎么决定用哪种复刻方式？</h3><p>“严格 1:1”是目标，不是一种具体技术。真正的选择依据，是参考里最值得保留的东西，以及当前工具能否把商品做对。</p></header><div class="wf-rule-flow"><code>品类接近，而且镜头动作很重要 → 视频参考生成</code><code>只想换一个对象 → 局部替换已屏蔽，改为抽象时间轴＋全镜头重新生成</code><code>跨品类，但故事机制有价值 → 重写商品参与的因果</code><code>参考视频不上传、只保留镜头顺序与动作 → 时间轴重建</code></div><div class="wf-method-list">${methodCases.map((method,index)=>{const c=caseCatalog[method.caseKey];return `<article class="wf-method-detail"><div class="wf-method-title"><span>0${index+1}</span><div><h4>${esc(method.name)}</h4><p>${esc(method.choose)}</p></div></div><dl><div><dt>技术实现方式</dt><dd>${esc(method.tech)}</dd></div><div><dt>输入</dt><dd>${esc(method.input)}</dd></div><div><dt>输出</dt><dd>${esc(method.output)}</dd></div></dl><div class="wf-case-note"><b>${esc(c.label)} Case · ${esc(method.segment)}</b><p>${esc(method.result)}</p></div>${comparePair(method.beforeClip,method.afterClip,c,method.beforeLabel || '复刻前 · 参考片段',method.afterLabel || '复刻后 · Codex 成片')}</article>`;}).join('')}</div><div class="wf-tradeoff"><span>参考视频相似度</span><i>←→</i><span>商品准确度</span><i>←→</i><span>创作自由度</span></div><p>多方案不是换三个随机种子。强参考、时间轴重建和剧情改编保留的对象不同；每条路线都必须能从真实输入参数和输出中被验证。</p></section>`;
}

function lengthSection() {
  const split = lengthCases.find(item => item.mode === 'split');
  const compress = lengthCases.find(item => item.mode === 'compress');
  const cordyceps = caseCatalog[split.caseKey];
  const pants = caseCatalog[compress.caseKey];
  return `<section class="wf-doc-section wf-length-section"><header class="wf-doc-heading"><span>第四部分</span><h3>四、自然分段与剧情压缩，具体怎么做？</h3><p>先判断用户要保留的是“完整内容”，还是“完整广告效果”。前者按自然边界拆开、分别生成、再拼回去；后者不机械复制全片，而是从原片抽取有用的剧情模块，重写为一条更短但因果完整的新广告。</p></header>
    <article class="wf-length-showcase"><header><span>机制 A · 自然分段</span><h4>${esc(cordyceps.label)} Case：${esc(split.title)}</h4><p>原片是 ${esc(split.sourceDuration)} 的办公室情景剧。客户选择保留“老板来买货→逐级加量→满桌展示→直播间促单”的完整结构。${esc(split.version)} 没有把 53 秒当成一个超长生成任务，而是在 28 秒的剧情悬念处拆成两段。</p></header>
      <div class="wf-source-timeline" aria-label="冬虫夏草情景剧分段时间轴"><span>0 秒</span><b>第 1 段 · 28 秒</b><i>剧情断点 28 秒</i><b>第 2 段 · 25 秒</b><span>53 秒</span></div>
      <p class="wf-boundary-note"><b>为什么在 28 秒切？</b>第 1 段已经完成“质问→身份反转→三次加量”的小闭环，又故意停在老板“还嫌少”的句子上；第 2 段从“那就继续加”开始，独立看得懂，连起来又是同一条因果链。这就是自然边界：上一段有可用的收口，下一段有清楚的启动点，而不是“时长到了就硬切”。</p>
      <div class="wf-segment-grid">${split.segments.map(segment=>`<article><div class="wf-segment-media"><figure><figcaption>原片第 ${esc(segment.number)} 段 · ${esc(segment.range)}</figcaption>${videoTag(segment.sourceClip,cordyceps.poster,`冬虫夏草 Case 原片第${segment.number}段`)}</figure><figure><figcaption>复刻后第 ${esc(segment.number)} 段 · ${esc(segment.resultRange)}</figcaption>${videoTag(segment.afterClip,cordyceps.afterPoster,`冬虫夏草 Case 复刻后第${segment.number}段`)}</figure></div><div><span>PART ${esc(segment.number)}</span><h5>${esc(segment.content)}</h5><dl><div><dt>这段保留什么</dt><dd>${esc(segment.rewrite)}</dd></div><div><dt>生成输入</dt><dd>冬虫夏草礼盒商品图＋这一段重写后的分镜脚本；原片用于理解剧情和节奏，不直接把原商品画面拼进成片。</dd></div><div><dt>独立输出</dt><dd>一条带新画面、新台词和新音轨的分段视频；该段生成后先单独检查商品、剧情和画面异常。</dd></div></dl></div></article>`).join('')}</div>
      <div class="wf-assembly-flow"><div><b>① 分别生成</b><span>分镜工具先产出 28 秒和 25 秒两份脚本，再把两段作为独立视频任务生成。</span></div><i>→</i><div><b>② 分段验收</b><span>第 1 段检查礼盒和反转；第 2 段检查满桌展示、礼盒外观和画面异常。</span></div><i>→</i><div><b>③ 混剪成片</b><span>两段都通过后再调用混剪，按 01→02 顺序直接组装，得到 ${esc(split.outputDuration)} 成片。</span></div></div>
      <div class="wf-length-result"><div><b>最终得到什么？</b><p>一条 ${esc(split.outputDuration)} 的冬虫夏草办公室情景剧。两段在 28 秒处由“老板还嫌少”转到“继续加量”，因果连续；但由于是两次独立生成，人物和机位会在边界换镜，所以要把切点放在允许换镜的地方。</p><small>Case：PID ${esc(cordyceps.pid)} · 千意复刻 ${esc(split.version)} · Session ${esc(split.sessionId)}</small></div><figure><figcaption>28 秒＋25 秒混剪后的完整千意成片</figcaption>${videoTag(split.outputClip,cordyceps.afterPoster,'冬虫夏草两段混剪后的完整成片')}</figure></div>
    </article>
    <article class="wf-length-showcase is-compress"><header><span>机制 B · 压缩改编</span><h4>${esc(pants.label)} Case：${esc(compress.title)}</h4><p>这里的目标不是保留 279 秒每一句话，而是保留能让新商品成立的因果。原片前约 90 秒先讲商务晚宴和着装门槛，后面才转入豆浆广告；小黑裤真正需要继承的是“赴约压力→受到支持→准备新衣→从容出席”。</p></header>
      <div class="wf-module-grid">${compress.modules.map((module,index)=>`<article><figure><figcaption>原片模块 ${index+1} · ${esc(module.range)}</figcaption>${videoTag(module.clip,pants.poster,`小黑裤改编所依据的原片模块${index+1}`)}</figure><div><span>MODULE 0${index+1}</span><h5>${esc(module.title)}</h5><p>${esc(module.use)}</p></div></article>`).join('')}</div>
      <div class="wf-compress-rule"><b>关键点：这不是把 4 段原片直接拼短。</b><p>四段原片只负责说明剧情机制。实际送模时，只有 21–39 秒被作为视频参考；40–54、68–77、81–86 秒只参与本地理解。豆浆商品、豆浆口播和后续促销全部舍弃。</p></div>
      <div class="wf-rewrite-map"><div><span>原片 279 秒</span><b>挑出 4 个有用模块</b><small>赴约设定 / 着装冲突 / 伴侣支持 / 情绪回报</small></div><i>→</i><div><span>重写因果</span><b>把“新衣”具体改成小黑裤</b><small>目标商品必须亲自参与解决穿搭问题</small></div><i>→</i><div><span>新广告 30 秒</span><b>写成 5 个连续段落</b><small>冲突 0–5 / 支持 5–9 / 递裤 9–13 / 商品证明 13–21 / 赴约回报 21–30</small></div></div>
      <div class="wf-length-result"><div><b>压缩后为什么仍是一条完整广告？</b><p>新片不是原剧情摘要，而是重新完成“钩子—冲突—商品介入—商品证明—情绪回报”。Seedance 接收 3 张裤子图、21–39 秒原片和全新的 30 秒 Prompt，一次生成 30.042 秒成片；使用新中文音轨，不复制豆浆对白，也没有后期再把多个生成片段拼在一起。</p></div><figure><figcaption>压缩重写后的完整 Codex 成片 · A_story</figcaption>${videoTag(compress.outputClip,pants.poster,'小黑裤压缩重写后的完整成片')}</figure></div>
    </article>
  </section>`;
}

export function renderWorkflow(root, items) {
  root.innerHTML = `<article class="wf-document"><header class="wf-document-title"><span>PRODUCT VIDEO REPLICATION</span><h2>商品视频复刻的决策路径</h2><p>这套 Skill 不是把商品图和参考视频一起扔给模型，而是先理解、再选策略。下面以文字说明决策逻辑，Case 和视频直接放在对应判断旁边作为证据。</p><div class="wf-simple-path">核对目标 <i>→</i> 理解参考 <i>→</i> 判断适配 <i>→</i> 选择方法 <i>→</i> 决定长度</div><small>案例范围：43 条客户参考视频；主要使用 Codex 历史实验，中适配和低适配使用用户指定的千意 Session 837553320706 / 837550881282。</small></header>${fullUnderstanding(items)}${fitSection(items)}${methodSection(items)}${lengthSection()}</article>`;
}

export function bindWorkflow(root) {
  root.addEventListener('click', event => {
    const seek = event.target.closest('[data-wf-seek]');
    if (!seek) return;
    const player = root.querySelector(`#${seek.dataset.wfTarget}`);
    if (!player) return;
    const setTime = () => { player.currentTime = Number(seek.dataset.wfSeek); player.scrollIntoView({behavior:'smooth',block:'center'}); player.focus(); };
    if (player.readyState >= 1) setTime(); else player.addEventListener('loadedmetadata', setTime, {once:true});
  });
  root.addEventListener('play', event => {
    if (event.target.tagName === 'VIDEO') root.querySelectorAll('video').forEach(video => { if (video !== event.target) video.pause(); });
  }, true);
}
