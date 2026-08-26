/* ════════════════════════════════════════════════════════════════
   ROCKMOUSE AI AGENTS — SHOWCASE DATA + LOGIC
   ════════════════════════════════════════════════════════════════ */

/* ─── CLAUDE API PROXY CONFIG ───────────────────────────────────
   Set these two values after deploying the Cloudflare Worker in /proxy.
   See proxy/DEPLOY.md for step-by-step instructions.
   If proxyUrl is empty, the Run button falls back to canned sample output. */
const API_CONFIG = {
  proxyUrl:    '/api/agent',
  sharedToken: 'EvcEETnK9mTErZ90CGguBccMdq2EbCV742tu5Gz4',
  model:       'claude-sonnet-4-6',    // claude-sonnet-4-6 | claude-opus-4-6 | claude-haiku-4-5
  maxTokens:   1024
};

/* ─── SIX DESIGN PRINCIPLES ─── */
const PRINCIPLES = [
  { n:'P1', title:'Human-in-the-Loop Always',
    body:'Every AI output requires human review and explicit approval before it reaches learners, markers, or members. AI drafts; humans decide.' },
  { n:'P2', title:'Context Before Content',
    body:"Every agent is anchored in the client's specific programs, rubrics, standards, and capability model — not generic AI outputs for a hypothetical learner." },
  { n:'P3', title:'Additive, Not Disruptive',
    body:'Agents augment existing team workflows. They reduce the least rewarding manual work and redirect expert time to where judgement matters most.' },
  { n:'P4', title:'Data for Learning, Not Surveillance',
    body:'Learner data informs personalised learning. It stays within the learning journey — never used for performance management or HR decisions.' },
  { n:'P5', title:'Progressive Complexity',
    body:'Pilots start narrow — one subject, one source, one use case. Confidence and governance frameworks are built before scaling. No big-bang deployments.' },
  { n:'P6', title:'Easily Contextualised',
    body:"Every agent is reshaped to the client's industry, tone, vocabulary, and evidence base. The same pattern drops into banking, health, education, or professional services — and feels local in each." }
];

/* ─── SIX AGENT TYPES ─── */
const AGENT_TYPES = [
  { id:'content',    name:'Content Agent',        icon:'✦',  category:'content',
    blurb:'Monitors, drafts, updates, and maintains learning content so it stays current with regulatory, rubric, and subject-matter changes.',
    detail:"Content agents act as the L&D team's editorial radar. They flag when a standard moves, when a rate table shifts, when an update lands — and draft revisions for human review. They also accelerate storyboarding from SME interviews and feedback.",
    colour:'#5ca2d5' },
  { id:'insights',   name:'Insights Agent',       icon:'◉',  category:'learning',
    blurb:'Clusters, analyses, and surfaces patterns from qualitative input — individual reflection, cohort data, or organisational signals.',
    detail:'Insights agents take unstructured learner voice (surveys, verbatims, reflections, check-ins) and turn it into usable signal. They surface what a cohort is struggling with, where energy sits, which themes recur — without exposing individual PII.',
    colour:'#5c3daa' },
  { id:'scenario',   name:'Scenario Coach',       icon:'▶',  category:'learning',
    blurb:'Delivers branching dilemmas, stress-tests positions, and gives personalised decision coaching in realistic workplace moments.',
    detail:"Scenario agents simulate the tough conversations: the difficult stakeholder, the ethical edge case, the messy ambiguity. They generate branching choices, surface consequences, play devil's advocate — then debrief against the client's capability model.",
    colour:'#0f7a8c' },
  { id:'mapper',     name:'Mapper / Connector',   icon:'◈',  category:'learning',
    blurb:"Maps tasks, skills, people, and goals — connecting what a learner knows to what's possible next.",
    detail:"Mappers take a collection of experiences and turn them into a developmental narrative. Placement primers, career compasses, capability maps, pathway recommenders — all work by linking the learner's state to the program's structure.",
    colour:'#1a6b3c' },
  { id:'cyber',      name:'Cybernetic Teammate',  icon:'◆',  category:'learning',
    blurb:'A live collaborative partner inside group work, team formation, peer coaching, and workshop settings.',
    detail:"Unlike solo coaches, a teammate sits inside the team's own work. It pulls together what different people in the room already know, names the assumptions nobody's said out loud, and helps the group work through ambiguity together, in real time.",
    colour:'#8b3d10' },
  { id:'assessment', name:'Assessment Agent',     icon:'⬢',  category:'assessment',
    blurb:'Marks learner work, drafts formative feedback, and calibrates scoring consistency — with human sign-off before release.',
    detail:'Assessment agents produce draft feedback against a rubric (knowledge checks, case studies, essays) and flag calibration drift across markers. Humans remain the decision-makers — agents do the heavy drafting and consistency work.',
    colour:'#d4681a' }
];

/* ─── SOURCE METADATA (internal only — not displayed) ─── */
const SOURCES = {
  iag:       { name:'RockMouse', colour:'#075C83' },
  deakinco:  { name:'RockMouse', colour:'#075C83' },
  caanz:     { name:'RockMouse', colour:'#075C83' },
  greatreset:{ name:'RockMouse', colour:'#075C83' }
};

/* ─── AUDIENCE METADATA ─── */
const AUDIENCES = {
  grad:         { name:'Graduate',        colour:'#f4d250', dot:'●' },
  professional: { name:'Professional',    colour:'#07aeac', dot:'●' },
  leadership:   { name:'Leadership',      colour:'#085c83', dot:'●' },
  orgwide:      { name:'Org-wide / L&D',  colour:'#05de92', dot:'●' }
};

/* ─── CATEGORY METADATA (top-level groupings) ─── */
const CATEGORIES = {
  content:    { name:'Content Creation',  blurb:'Agents that draft, maintain, and evolve learning content.', colour:'#5ca2d5' },
  learning:   { name:'Learning Agents',   blurb:'Agents that coach, simulate, reflect, and map the learner journey.', colour:'#05de92' },
  assessment: { name:'Assessment Agents', blurb:'Agents that mark, give feedback, and surface cohort patterns.', colour:'#085c83' }
};

/* ════════════════════════════════════════════════════════════════
   AGENT INVENTORY
   ════════════════════════════════════════════════════════════════ */
const AGENTS = [

  /* ── Coach / Scenario ── */
  {
    id:          'expert-practitioner',
    name:        'Expert Practitioner Coach',
    tagline:     'Adaptive HR capability coaching anchored to a real framework',
    description: 'Select your career stage and the coach calibrates its challenge level, language, and feedback to where you are. Anchored to the Australian HR Capability Framework across five domains: Business Strategist, Workforce Designer, Culture & Change, Org Enabler, and Trusted Partner.',
    category:    'learning',
    audience:    'professional',
    type:        'scenario',
    file:        'Agents/rm-expert-practitioner-agent.html',
    tags:        'HR coaching AHRCF capability framework career stage professional',
    sampleInput: 'I am a PAHRI-certified HR professional. A senior leader is bypassing our recruitment process to bring in someone externally without going through proper channels. How should I handle this?',
    sampleOutput: 'This is a classic Trusted Partner challenge — you are being asked to hold a standard that a senior leader finds inconvenient. The AHRCF would position this as a test of your professional integrity and your ability to influence upward without losing the relationship.\n\nThree things to consider:\n1. Separate the relationship from the position. You can push back on the process without making it personal.\n2. Name the risk explicitly — not to threaten, but to inform. "I want to flag the risk this creates for equity and legal exposure" lands differently than "you can\'t do this."\n3. Offer a path. Can the external candidate still be assessed through an expedited process? Giving the leader a way forward makes your pushback easier to accept.\n\nWhat is your relationship with this leader like — and has this happened before?'
  },

  {
    id:          'soft-skills-drill',
    name:        'Soft Skills Drill',
    tagline:     'Roleplay high-stakes professional conversations before they happen',
    description: 'Choose a scenario — senior partner pressure, difficult client, ethical dilemma — and practise the conversation with a live AI coach. You receive a structured debrief on completion anchored to professional competencies.',
    category:    'learning',
    audience:    'professional',
    type:        'scenario',
    file:        'Agents/rm-soft-skills-drill-agent.html',
    tags:        'roleplay scenario practice conversation skills debrief ethics pressure',
    sampleInput: 'I need to practise pushing back on a senior stakeholder who wants me to fast-track an approval, skipping a standard compliance check.',
    sampleOutput: 'Let\'s run the scenario. I\'ll play the senior stakeholder.\n\n"Look, I need this signed off by end of day. The client is waiting and we\'ve done this kind of deal a hundred times. Just process it — I\'ll take responsibility if anything comes up."\n\nYour move. How do you respond?'
  },

  {
    id:          'debate-coach',
    name:        'Debate Coach',
    tagline:     'The thinking partner who always pushes back',
    description: 'State your position on a workplace dilemma and the coach argues the opposing view with intellectual rigour. After 2–3 exchanges, you receive a structured debrief on your reasoning patterns and practical tactics for constructive challenge.',
    category:    'learning',
    audience:    'professional',
    type:        'scenario',
    file:        'Agents/rm-debate-coach-agent.html',
    tags:        'debate challenge reasoning critical thinking dilemma argument',
    sampleInput: 'We should launch the new customer process next month even though testing is not complete. The business pressure is real and we can fix issues as they arise.',
    sampleOutput: 'I\'ll take the opposing position.\n\n"Fix issues as they arise" is a strategy that transfers risk from the organisation to your customers — and you\'re making that decision without their knowledge or consent. That\'s not agility, it\'s externalising your quality problem.\n\nThe business pressure is real, but it\'s not new information. If testing isn\'t complete, one of two things is true: either the timeline was always unrealistic, or scope crept. Both of those are internal failures. Launching early doesn\'t fix either — it just adds a third failure on top.\n\nWhat specifically breaks if you delay by two weeks? I want a number, not a feeling.'
  },

  /* ── Mapper / Profile ── */
  {
    id:          'disc-coach',
    name:        'DISC Coach',
    tagline:     'From profile to practice — what your working style means for you',
    description: 'Select your DISC style (or let the coach identify it through conversation) and work through four targeted coaching questions. Output is a personalised Working Style Brief you can share with a new manager on Day 1.',
    category:    'learning',
    audience:    'professional',
    type:        'mapper',
    file:        'Agents/rm-disc-profiler-agent.html',
    tags:        'DISC profile working style self-awareness collaboration manager coaching',
    sampleInput: 'My primary DISC style is C — Conscientiousness. I am joining a fast-moving team and my new manager is a high-D. I want to understand how to make this work.',
    sampleOutput: 'That C–D combination is one of the most productive — and most friction-prone — pairings in any team.\n\nHere is what your C style is likely to experience:\n— Your instinct is to get it right before you get it done. Your manager\'s instinct is to get it done and fix it later. Neither is wrong, but they will collide.\n— You will want more context before committing. They will read that as hesitation or lack of confidence.\n— Your thoroughness will sometimes be experienced as slowness, even when it\'s preventing expensive mistakes.\n\nFirst coaching question: When you think about the last time your C style caused friction with a faster-moving colleague — what was actually happening beneath the surface?'
  },

  {
    id:          'goal-architect',
    name:        'Goal Architect',
    tagline:     'Turn vague intentions into structured, measurable goals',
    description: 'Works with the learner to transform fuzzy development intentions into well-formed goals with clear measures, milestones, and accountability — ready to drop into a development plan.',
    category:    'learning',
    audience:    'leadership',
    type:        'mapper',
    file:        'Agents/rm-goal-architect-agent.html',
    tags:        'goals development planning milestones accountability leadership growth',
    sampleInput: 'I want to become a better communicator and improve how I present to the executive team.',
    sampleOutput: 'Good starting point — but "better communicator" is doing a lot of work there. Let\'s get specific.\n\nWhen you say you want to improve how you present to the executive team, what is actually happening right now that you want to change? Are you losing the room? Getting too deep into detail? Struggling with questions? Not getting the decisions you need?\n\nThe goal we build will only be useful if it targets the real problem — so tell me: what happened in the last executive presentation that made you think "I need to get better at this"?'
  },

  /* ── Insights ── */
  {
    id:          'ttl-insights',
    name:        'Transition to Leadership — Insights Agent',
    tagline:     'Between-session learning partner for emerging leaders',
    description: 'A conversational coaching agent anchored to the Transition to Leadership program\'s Know / Do / Be framework. Supports participants as they move from skilled manager or individual contributor into a leadership identity — through reflection, concept exploration, session preparation, and learning consolidation. Works across public, private, and not-for-profit sectors.',
    category:    'learning',
    audience:    'leadership',
    type:        'insights',
    file:        'Agents/rm-ttl-insights-agent.html',
    tags:        'leadership transition coaching reflection insights TTL know do be identity emerging leaders',
    sampleInput: 'I had a difficult situation this week. One of my team members came to me frustrated about a decision I made without consulting them. I explained my reasoning but they didn\'t seem satisfied. I\'m not sure what I should have done differently.',
    sampleOutput: 'That\'s a really common early leadership moment — and the fact that it\'s sitting with you says something useful about your instincts.\n\nLet\'s look at it through the Know / Do / Be lens.\n\nWhat might be happening here (KNOW): When we move into leadership, our decisions start affecting other people\'s work and sense of autonomy. Even a well-reasoned decision can land poorly if the person affected didn\'t have a voice in it. This is often less about the decision itself and more about the process — people need to feel heard before they can feel informed.\n\nWhat you might explore (DO): The next time a decision affects someone directly, consider a brief conversation before you decide — not to hand over the decision, but to understand their perspective. "I\'m thinking about X — what am I not seeing from where you sit?" This builds trust over time, even when you still make the call.\n\nThe deeper shift (BE): This is the transition from being the expert who has the answers to being the leader who creates the conditions for good outcomes. That shift takes time — and discomfort like this is usually where it happens.\n\nWhat felt hardest about that conversation — the criticism itself, or not knowing how to respond to it?'
  },

  /* ── Cybernetic Teammate ── */
  {
    id:          'yellowedge-executive-cohesion',
    name:        'Executive Cohesion Agent',
    tagline:     'Facilitator support for executive team cohesion engagements',
    description: 'A specialist AI teammate built for Yellow Edge facilitators running executive cohesion programs. Supports five functions across an engagement: pre-session diagnostic intake, session design, facilitation prompt generation, cohesion health snapshot, and post-session synthesis. Anchored to the APS Integrated Leadership System for public sector clients. All outputs are drafts for facilitator review.',
    category:    'learning',
    audience:    'leadership',
    type:        'cyber',
    file:        'Agents/rm-executive-cohesion-agent.html',
    tags:        'executive cohesion team dynamics trust facilitation Yellow Edge APS leadership board strategy',
    sampleInput: 'I am facilitating a half-day cohesion session next week with a 7-person SES Band 1 executive team in a federal agency. A recent restructure has created tension between two divisions. The team has not worked together formally as a group before. My goal is to build enough trust to have an honest conversation about strategic priorities.',
    sampleOutput: 'Pre-Session Diagnostic Summary\n\nContext: Newly formed SES Band 1 executive team, 7 members, federal agency. Post-restructure tension between two divisional groups. No prior formal team engagement.\n\nCohesion risk factors to hold:\n— Identity fragmentation: members may still carry loyalty to previous structures rather than the new team\n— Asymmetric information: some members will know more about the restructure rationale than others — this creates a trust gap before the session begins\n— Authority ambiguity: without an established team contract, individuals may be unclear about decision rights and what "strategic priorities" actually means in their context\n\nSession design considerations:\n— Open with individual voice before group voice — give each person a low-stakes way to name what they are bringing into the room\n— Frame the session around the team\'s shared mandate, not the restructure — don\'t let the backstory become the main story\n— Use the ILS cluster "Cultivates Productive Working Relationships" as your reference point for the trust-building activities\n\n⚠️ DRAFT — Requires Yellow Edge facilitator review before use with any client.'
  },

  /* ── Assessment ── */
  {
    id:          'assessment-agent',
    name:        'Assessment Agent',
    tagline:     'Knowledge check and readiness mapping before formal assessment',
    description: 'Mode A: presents questions mapped to learning outcomes, analyses responses, and delivers an instant readiness report with a personalised study path. No PII required. Mode B: marker-assist generates draft feedback against a rubric for human review before release.',
    category:    'assessment',
    audience:    'professional',
    type:        'assessment',
    file:        'Agents/rm-assessment-agent.html',
    tags:        'assessment knowledge check readiness rubric feedback marking professional',
    sampleInput: 'I would like a knowledge check on professional ethics and independence standards before my upcoming assessment.',
    sampleOutput: 'Let\'s check your readiness across three areas: independence requirements, conflict of interest identification, and ethical decision-making frameworks.\n\nQuestion 1 of 6:\n\nA client asks you to review a set of financial statements that were prepared by your firm\'s advisory division last year. You have no personal involvement in the advisory engagement. Identify the specific independence threat this creates and describe how you would respond.\n\nTake your time — I\'m looking for the threat type, the severity assessment, and your proposed safeguard.'
  },

  /* ── Content ── */
  {
    id:          'content-currency',
    name:        'Content Currency Agent',
    tagline:     'Monitor the world so your content team doesn\'t have to',
    description: 'Paste a topic or content area and the agent scans for recent regulatory, standards, or research changes that may affect your content. Generates a structured change brief for the content owner to review and act on.',
    category:    'content',
    audience:    'orgwide',
    type:        'content',
    file:        'Agents/rm-content-currency-agent.html',
    tags:        'content currency regulatory update standards monitoring brief L&D',
    sampleInput: 'Check for recent changes to Australian independence and ethics standards in professional accounting that might affect our continuing professional development content.',
    sampleOutput: 'Content Currency Brief — Professional Ethics & Independence\nGenerated: June 2026\n\nSources monitored: APES 110, APESB updates, ASIC regulatory releases, IFAC ethics board\n\nChanges detected requiring content review:\n\n1. APES 110 — Revised fee disclosure requirements (effective 1 Jan 2026)\nImpact: Any module covering client acceptance or engagement management needs updating. The new thresholds and disclosure triggers differ from the 2023 version.\nRecommended action: Update module 3.2, review assessment questions in section 4.\n\n2. ASIC guidance on independence in audit (March 2026 update)\nImpact: Low — guidance aligns with existing APES 110 content. No immediate update required.\n\nHuman gate: This brief requires content owner review before any changes are made to materials.'
  },

  {
    id:          'spark-designer',
    name:        'SPARK Learning Designer',
    tagline:     'Upload a unit of competency — get a complete learning design',
    description: 'Upload a TGA unit PDF and training strategy document. SPARK extracts the competency requirements and generates a structured learning design: session plan, activities, and assessment mapping — all aligned to ASQA standards.',
    category:    'content',
    audience:    'orgwide',
    type:        'content',
    file:        'Agents/rm-spark-learning-designer-agent.html',
    tags:        'VET learning design unit competency TGA ASQA session plan assessment mapping',
    sampleInput: 'Upload your TGA unit PDF and Training and Assessment Strategy to generate a full learning design.',
    sampleOutput: 'SPARK Design Output\n\nUnit: BSBCRT311 — Apply critical thinking skills in a team environment\n\nSession Plan (3 x 90-minute sessions):\n\nSession 1 — What is critical thinking?\nOpening activity: Assumption mapping (20 min)\nContent: Four critical thinking dispositions — clarity, accuracy, relevance, logic (30 min)\nPractice: Case analysis in pairs (30 min)\nClose: Reflection prompt (10 min)\n\nAssessment mapping:\nKE1 → Session 1 content activity\nKE2 → Session 2 group task\nPE1, PE2 → Session 3 workplace simulation\n\n⚠️ SPARK disclaimer: Validate all content against current TGA requirements before use.'
  },

  /* ── Scenario ── */
  {
    id:          'speakup-scenario',
    name:        'SpeakUp Scenario Coach',
    tagline:     'Practise speaking up in difficult workplace situations',
    description: 'The agent presents realistic workplace scenarios where the right move is to say something — to a peer, manager, or client. Practise the conversation with the AI, then debrief on what worked and what to sharpen.',
    category:    'learning',
    audience:    'grad',
    type:        'scenario',
    file:        'Agents/rm-rockmouse-speakup-scenario-agent.html',
    tags:        'speak up voice graduate workplace courage conversation practice',
    sampleInput: 'A colleague made a comment in a team meeting that I found inappropriate. I am not sure whether to say something or let it go.',
    sampleOutput: 'This is exactly the kind of moment that matters — and the fact that you\'re unsure whether to act is completely normal. Let\'s work through it.\n\nFirst: what makes you hesitate? Is it uncertainty about whether the comment was actually inappropriate, concern about the relationship, worry about how it\'ll land, or something else?\n\nThat answer shapes everything about how — and whether — you speak up.'
  },

];

/* ════════════════════════════════════════════════════════════════
   INTERACTION LOGIC
   ════════════════════════════════════════════════════════════════ */

function switchTab(id, btn){
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  const pane = document.getElementById('tab-'+id);
  if(pane) pane.classList.add('active');
  if(btn) btn.classList.add('active');
  const hero = document.querySelector('.hero');
  if(hero) hero.style.display = (id === 'overview') ? '' : 'none';
  window.scrollTo({top:0, behavior:'smooth'});
}

function renderPrinciples(){
  const host = document.getElementById('principles-grid');
  if(!host) return;
  host.innerHTML = PRINCIPLES.map(p=>`
    <div class="principle-card">
      <div class="p-num">${p.n}</div>
      <div class="p-title">${p.title}</div>
      <div class="p-desc">${p.body}</div>
    </div>`).join('');
}

function renderAgentTypes(){
  const host = document.getElementById('types-grid');
  if(!host) return;
  host.innerHTML = AGENT_TYPES.map(t=>{
    const count = AGENTS.filter(a=>a.type===t.id).length;
    return `
    <div class="type-card" style="border-top:4px solid ${t.colour}">
      <div class="type-icon" style="background:${t.colour}22;color:${t.colour}">${t.icon}</div>
      <div class="type-name">${t.name}</div>
      <div class="type-blurb">${t.blurb}</div>
      <div class="type-detail">${t.detail}</div>
      <div class="type-count"><strong>${count}</strong> agents in this showcase</div>
    </div>`;
  }).join('');
}

let FILTER_STATE = { category:'all', audience:'all', source:'all', type:'all', search:'' };

function updateFilter(key, value){
  FILTER_STATE[key] = value;
  document.querySelectorAll(`[data-filter="${key}"] .filter-chip`).forEach(c=>{
    c.classList.toggle('active', c.dataset.value===value);
  });
  renderAgentGrid();
}

function renderAgentGrid(){
  const host = document.getElementById('agents-grid');
  if(!host) return;
  const q = (FILTER_STATE.search || '').toLowerCase();
  const filtered = AGENTS.filter(a=>{
    if(FILTER_STATE.category!=='all' && a.category!==FILTER_STATE.category) return false;
    if(FILTER_STATE.audience!=='all' && a.audience!==FILTER_STATE.audience) return false;
    if(FILTER_STATE.type!=='all' && a.type!==FILTER_STATE.type) return false;
    if(q && !(a.name.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))) return false;
    return true;
  });
  document.getElementById('agents-count').textContent = filtered.length;
  if(filtered.length===0){
    host.innerHTML = `<div class="empty-state">No agents match the current filters. <button class="link" onclick="resetFilters()">Reset filters</button></div>`;
    return;
  }
  host.innerHTML = filtered.map(a=>{
    const t = AGENT_TYPES.find(x=>x.id===a.type);
    const aud = AUDIENCES[a.audience];
    const cat = CATEGORIES[a.category];
    return `
    <div class="agent-card" onclick="openAgentModal('${a.id}')">
      <div class="agent-card-top">
        <div class="agent-type-chip" style="background:${t.colour}18;color:${t.colour}">${t.icon} ${t.name}</div>
        <div class="agent-aud-dot" title="${aud.name}" style="color:${aud.colour}">${aud.dot}</div>
      </div>
      <div class="agent-name">${a.name}</div>
      <div class="agent-tagline">${a.tagline}</div>
      <div class="agent-card-bot">
        <span class="agent-source" style="color:${cat.colour}">${aud.name}</span>
        <span class="agent-try">Try it →</span>
      </div>
    </div>`;
  }).join('');
}

function resetFilters(){
  FILTER_STATE = { category:'all', audience:'all', source:'all', type:'all', search:'' };
  document.querySelectorAll('.filter-chip').forEach(c=>{
    c.classList.toggle('active', c.dataset.value==='all');
  });
  const s = document.getElementById('search-input');
  if(s) s.value = '';
  renderAgentGrid();
}

function openAgentModal(id){
  const a = AGENTS.find(x=>x.id===id);
  if(!a) return;

  const modal = document.getElementById('agent-modal');
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeAgentModal()"></div>
    <div class="modal-panel" style="position:relative;display:flex;flex-direction:column;width:94vw;max-width:1140px;height:92vh;padding:0;overflow:hidden;border-radius:12px;">
      <iframe src="${a.file}"
        style="flex:1;width:100%;border:none;display:block;border-radius:12px;"
        allow="clipboard-write"
        title="${a.name}">
      </iframe>
      <div style="position:absolute;top:10px;right:12px;display:flex;gap:6px;z-index:10;">
        <a href="${a.file}" target="_blank" rel="noopener"
           style="color:rgba(255,255,255,0.85);font-size:0.7rem;text-decoration:none;padding:3px 8px;background:rgba(0,0,0,0.35);border-radius:4px;backdrop-filter:blur(4px);">
          ↗ Full screen
        </a>
        <button onclick="closeAgentModal()" aria-label="Close"
          style="background:rgba(0,0,0,0.35);border:none;color:white;font-size:1.1rem;cursor:pointer;border-radius:4px;padding:2px 8px;backdrop-filter:blur(4px);">&times;</button>
      </div>
    </div>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAgentModal(){
  const modal = document.getElementById('agent-modal');
  modal.classList.remove('open');
  setTimeout(()=>{ modal.innerHTML=''; }, 200);
  document.body.style.overflow = '';
}

function loadSample(id){
  const a = AGENTS.find(x=>x.id===id);
  if(!a) return;
  document.getElementById('agent-input').value = a.sampleInput || '';
}

async function handleFileUpload(e){
  const f = e.target.files[0];
  if(!f) return;

  const textarea = document.getElementById('agent-input');
  const fileName = f.name.toLowerCase();

  // Text files (.txt, .md)
  if(fileName.endsWith('.txt') || fileName.endsWith('.md')){
    const reader = new FileReader();
    reader.onload = ev => { textarea.value = ev.target.result; };
    reader.readAsText(f);
  }
  // PDF files
  else if(fileName.endsWith('.pdf')){
    textarea.value = `[Loading PDF: ${f.name}...]`;
    try {
      // Check if PDF.js is loaded
      if(typeof pdfjsLib === 'undefined'){
        throw new Error('PDF library not yet loaded. Please wait a moment and try again.');
      }

      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for(let i = 1; i <= pdf.numPages; i++){
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }

      textarea.value = fullText.trim() || '[PDF loaded but contains no extractable text]';
    } catch(err){
      console.error('PDF parsing error:', err);
      textarea.value = `[Error reading PDF: ${err.message}. Please copy and paste the text content manually.]`;
    }
  }
  // Word docs and other files
  else {
    textarea.value = `[Uploaded: ${f.name}] — in a live deployment this file would be parsed and passed to the agent. For this demo, please copy and paste the text content into the field above.`;
  }
}

/* Initialize PDF.js worker when library loads */
function initPdfJs(){
  if(typeof pdfjsLib !== 'undefined'){
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    console.log('PDF.js initialized successfully');
  } else {
    // Try again in 500ms if not loaded yet
    setTimeout(initPdfJs, 500);
  }
}

// Initialize on DOM ready
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initPdfJs);
} else {
  initPdfJs();
}

/* Build a per-agent system prompt. Anchors Claude to the agent's purpose,
   audience, and category so the response is on-pattern rather than generic. */
function buildSystemPrompt(a){
  const t   = AGENT_TYPES.find(x=>x.id===a.type);
  const aud = AUDIENCES[a.audience];
  const cat = CATEGORIES[a.category];
  return [
    "You are a RockMouse AI agent operating inside a workplace learning program.",
    `AGENT: ${a.name}`,
    `PATTERN: ${t.name} — ${t.blurb}`,
    `CATEGORY: ${cat.name} — ${cat.blurb}`,
    `AUDIENCE: ${aud.name}.`,
    `PURPOSE: ${a.tagline}`,
    `DESIGN NOTES: ${a.description}`,
    "",
    "Respond as this specific agent. Adopt its tone and scope — not a general assistant tone.",
    "Keep outputs concrete and grounded in the user's input. If the user input is thin, ask one sharp clarifying question and stop. Otherwise produce the response the agent would produce.",
    "Format as clean plain text with short paragraphs or a compact list — no markdown headers, no preamble like 'Here is...'. Australian spelling. Under ~300 words unless the input clearly warrants more.",
    "You are an illustrative demo. Do not claim to have live system access, real learner records, or live rubrics — work from the user's input only."
  ].join("\n");
}

async function runAgent(id){
  const a = AGENTS.find(x=>x.id===id);
  if(!a) return;
  const input = document.getElementById('agent-input').value.trim();
  if(!input){
    alert('Please paste some input or click "Load sample data" first.');
    return;
  }
  const output  = document.getElementById('agent-output');
  const section = document.getElementById('output-section');
  section.style.display = 'block';
  output.innerHTML = '<div class="thinking"><span></span><span></span><span></span> Thinking…</div>';
  section.scrollIntoView({ behavior:'smooth', block:'start' });
  window._lastAgentResult = { agent: a, input, output: '' };

  // If the proxy isn't configured, fall back to the canned sample output.
  if(!API_CONFIG.proxyUrl || !API_CONFIG.sharedToken){
    await new Promise(r=>setTimeout(r,700));
    const fallback = a.sampleOutput || 'This agent would produce a structured response based on the input above, anchored to the program context, learner history, and rubric.';
    window._lastAgentResult.output = fallback;
    output.innerHTML = `<div class="demo-banner">⚠ Demo mode — proxy not configured. Showing canned sample output. See <code>proxy/DEPLOY.md</code> to enable live Claude responses.</div>` +
                       fallback.replace(/\n/g,'<br>');
    return;
  }

  // Live call via Cloudflare Worker proxy.
  try {
    const visitorEmail = (function(){ try { return localStorage.getItem('rm_visitor_email') || ''; } catch(e){ return ''; } })();
    const res = await fetch(API_CONFIG.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + API_CONFIG.sharedToken,
        'X-Visitor-Email': visitorEmail
      },
      body: JSON.stringify({
        agentId:      a.id,
        systemPrompt: buildSystemPrompt(a),
        userInput:    input,
        model:        API_CONFIG.model
      })
    });
    const data = await res.json();
    if(!res.ok){
      throw new Error((data && (data.error || JSON.stringify(data))) || ('HTTP ' + res.status));
    }
    const text = (data.output || '').trim() || 'The agent returned no content.';
    window._lastAgentResult.output = text;
    output.innerHTML = text.replace(/\n/g,'<br>');
  } catch (err) {
    const fallback = a.sampleOutput || '';
    window._lastAgentResult.output = fallback;
    output.innerHTML =
      `<div class="demo-banner">Live call failed: ${String(err).replace(/</g,'&lt;')}. Showing canned sample output instead.</div>` +
      (fallback ? fallback.replace(/\n/g,'<br>') : '<em>No sample output available for this agent.</em>');
  }
}

function copyOutput(){
  const text = document.getElementById('agent-output').innerText;
  navigator.clipboard.writeText(text).then(()=>{
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(()=>{ btn.textContent = orig; }, 1400);
  });
}

/* ─── ROCKMOUSE-BRANDED DOCX EXPORT ─── */
async function downloadDocx(id){
  const a = AGENTS.find(x=>x.id===id);
  if(!a) return;
  const data = window._lastAgentResult;
  if(!data || !data.output){ alert('Run the agent first before downloading.'); return; }

  const d = window.docx;
  if(!d){ alert('Docx library still loading. Try again in a second.'); return; }

  const t = AGENT_TYPES.find(x=>x.id===a.type);
  const s = SOURCES[a.source] || { name: 'RockMouse' }; // no agent sets a.source today — this fallback stops the download crashing
  const cat = CATEGORIES[a.category];
  const aud = AUDIENCES[a.audience];

  const RM_GREEN = '05DE92';
  const RM_NAVY  = '075C83';
  const RM_TEAL  = '07AEAC';
  const INK      = '212121';
  const GREY     = '6D8592';

  let bannerBuffer = null, footerBuffer = null;
  try { bannerBuffer = await (await fetch('assets/rockmouse-banner.png')).arrayBuffer(); } catch(e){}
  try { footerBuffer = await (await fetch('assets/rockmouse-footer.png')).arrayBuffer(); } catch(e){}

  const kickerLine = (label, value) => new d.Paragraph({
    spacing:{ after:80 },
    children:[
      new d.TextRun({ text:label+'  ', bold:true, color:GREY, size:18, characterSpacing:60 }),
      new d.TextRun({ text:value, color:INK, size:20 })
    ]
  });

  const heading = (text, level='h1') => new d.Paragraph({
    spacing:{ before:220, after:140 },
    children:[ new d.TextRun({
      text,
      size: level==='h1' ? 34 : 26,
      bold:true,
      color: level==='h1' ? RM_NAVY : RM_TEAL,
      font:'DM Sans'
    }) ]
  });

  const textLine = (text) => new d.Paragraph({
    spacing:{ after:100 },
    children:[ new d.TextRun({ text, size:22, color:INK }) ]
  });

  const divider = () => new d.Paragraph({
    spacing:{ before:120, after:120 },
    border:{ top:{ color:'E4ECE9', size:6, style:d.BorderStyle.SINGLE, space:1 } }
  });

  const outputParas = data.output.split(/\n\n+/).map(block => {
    const lines = block.split(/\n/).map(L=>L.trim()).filter(Boolean);
    return lines.map(line => new d.Paragraph({
      spacing:{ after:110 },
      children:[ new d.TextRun({ text:line, size:22, color:INK }) ]
    }));
  }).flat();

  const inputParas = data.input.split(/\n/).filter(L=>L.trim()).map(line => new d.Paragraph({
    spacing:{ after:100 },
    children:[ new d.TextRun({ text:line, size:22, color:INK, italics:true }) ],
    border:{ left:{ color:RM_TEAL, size:18, style:d.BorderStyle.SINGLE, space:8 } },
    indent:{ left:240 }
  }));

  const children = [];

  if(bannerBuffer){
    children.push(new d.Paragraph({
      children:[ new d.ImageRun({ data:bannerBuffer, transformation:{ width:600, height:80 } }) ]
    }));
  }

  children.push(
    new d.Paragraph({
      spacing:{ before:180, after:40 },
      children:[ new d.TextRun({ text:'ROCKMOUSE AI AGENTS', bold:true, color:RM_GREEN, size:16, characterSpacing:140 }) ]
    }),
    new d.Paragraph({
      spacing:{ after:60 },
      children:[ new d.TextRun({ text:a.name, bold:true, color:RM_NAVY, size:44, font:'DM Serif Display' }) ]
    }),
    new d.Paragraph({
      spacing:{ after:140 },
      children:[ new d.TextRun({ text:a.tagline, italics:true, color:GREY, size:22 }) ]
    }),
    kickerLine('AGENT TYPE', t.name),
    kickerLine('CATEGORY', cat.name),
    kickerLine('AUDIENCE', aud.name),
    kickerLine('SOURCE', s.name),
    divider(),
    heading('What this agent does','h2'),
    textLine(a.description),
    heading('Your input','h2'),
    ...inputParas,
    heading('Agent response','h2'),
    ...outputParas,
    divider(),
    new d.Paragraph({
      spacing:{ before:80 },
      children:[ new d.TextRun({
        text:'Generated by the RockMouse AI Agents showcase — hello@rockmouse.com.au · rockmouse.com.au',
        size:16, color:GREY
      }) ]
    })
  );

  if(footerBuffer){
    children.push(new d.Paragraph({
      spacing:{ before:200 },
      children:[ new d.ImageRun({ data:footerBuffer, transformation:{ width:600, height:60 } }) ]
    }));
  }

  const doc = new d.Document({
    creator:'RockMouse',
    title:a.name,
    styles:{ default:{ document:{ run:{ font:'DM Sans', size:22, color:INK } } } },
    sections:[{
      properties:{ page:{ margin:{ top:720, bottom:720, left:900, right:900 } } },
      children
    }]
  });

  const blob = await d.Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${a.id}-rockmouse.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── EMAIL GATE ─────────────────────────────────────────────────
   Shows the overlay until a visitor enters an email. Stores the
   email in localStorage so the gate only fires once per browser.
   Also fires a one-off POST to the proxy so the site owner gets a
   notification. Silent failure — if the notify POST errors, we
   still let the visitor in. */
function openGate(){
  const g = document.getElementById('rm-gate');
  if(g){ g.classList.add('open'); g.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
}
function closeGate(){
  const g = document.getElementById('rm-gate');
  if(g){ g.classList.remove('open'); g.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
}
function getVisitorEmail(){
  try { return localStorage.getItem('rm_visitor_email') || ''; } catch(e){ return ''; }
}
async function handleGateSubmit(e){
  if(e && e.preventDefault) e.preventDefault();
  const emailInput = document.getElementById('rm-gate-email');
  const nameInput  = document.getElementById('rm-gate-name');
  const errBox     = document.getElementById('rm-gate-error');
  const btn        = document.getElementById('rm-gate-submit');
  const email = (emailInput.value || '').trim();
  const name  = (nameInput.value  || '').trim();

  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if(!ok){
    errBox.classList.add('show');
    errBox.textContent = 'Please enter a valid email address.';
    emailInput.focus();
    return false;
  }
  errBox.classList.remove('show');
  btn.disabled = true;
  const origLabel = btn.textContent;
  btn.textContent = 'Entering…';

  // Save first so the visitor is not blocked if the notification fails.
  try { localStorage.setItem('rm_visitor_email', email); if(name) localStorage.setItem('rm_visitor_name', name); } catch(e){}

  // Fire-and-forget notification. Deliberately not awaited: this must never hold up
  // the visitor, and a slow or unreachable proxy (offline, blocked by a network
  // policy, or the file opened locally rather than served) can otherwise hang here
  // indefinitely — which used to leave the gate stuck open, covering the whole page.
  if(API_CONFIG.proxyUrl && API_CONFIG.sharedToken){
    fetch(API_CONFIG.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + API_CONFIG.sharedToken
      },
      body: JSON.stringify({ action:'signup', email, name })
    }).catch(err => console.warn('Signup notification failed:', err));
  }

  btn.textContent = origLabel;
  btn.disabled = false;
  closeGate();
  return false;
}
function initGate(){
  const form = document.getElementById('rm-gate-form');
  if(form){ form.addEventListener('submit', handleGateSubmit); }
  if(!getVisitorEmail()) openGate();
}

/* ═════ INIT ═════ */
document.addEventListener('DOMContentLoaded', ()=>{
  renderPrinciples();
  renderAgentTypes();
  renderAgentGrid();
  initGate();

  const totalEl = document.getElementById('total-agents');
  if(totalEl) totalEl.textContent = AGENTS.length;

  const search = document.getElementById('search-input');
  if(search){
    search.addEventListener('input', e=>{
      FILTER_STATE.search = e.target.value;
      renderAgentGrid();
    });
  }

  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ closeAgentModal(); }
  });
});
