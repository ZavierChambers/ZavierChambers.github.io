
/*
  data-loader.js
  Loads site-data.json and renders:
  - Courses grid on courses.html (#grid, #kpiTotal, .chip filters)
  - Projects on projects.html (#webGrid, #appGrid)
  - Lesson content on thecourse.html (expects #lessonTitle, #lessonMeta, #lessonBody, #tocLeft, #onpageNav)
  Works on static hosting. No backend required.
*/

(async function(){
  const DATA_URL = 'site-data.json'; // relative to your HTML files
  let data;
  try{
    const res = await fetch(DATA_URL, {cache:'no-store'});
    data = await res.json();
  }catch(e){
    console.error('Failed to load site-data.json', e);
    return;
  }

  // Accent/theme hydration (optional)
  if (data.site && data.site.accent){
    const root = document.documentElement;
    const hex = data.site.accent;
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(m){
      const r=parseInt(m[1],16), g=parseInt(m[2],16), b=parseInt(m[3],16);
      root.style.setProperty('--accent', `${r} ${g} ${b}`);
    }
  }

  // ---------- COURSES (courses.html) ----------
  const grid = document.getElementById('grid');
  const kpiTotal = document.getElementById('kpiTotal');
  const chips = grid ? Array.from(document.querySelectorAll('.chip')) : [];

  function renderCourses(tier='all'){
    if(!grid) return;
    const catalog = data.courses || [];
    if(kpiTotal) kpiTotal.textContent = String(catalog.length);
    grid.innerHTML = '';
    const filtered = catalog.filter(c => tier==='all' || c.tier===tier);
    filtered.forEach(c => grid.appendChild(courseCard(c)));
  }

  function courseCard(c){
    const el = document.createElement('article');
    el.className = 'card col-4';
    el.setAttribute('tabindex','0');
    const price = c.tier === 'free' ? '$0' : `$${c.price}`;
    el.innerHTML = `
      <span class="ribbon ${c.tier==='free'?'free':'pro'}">${c.tier==='free'?'FREE':'PRO'}</span>
      <div class="thumb" aria-hidden="true"></div>
      <div class="card-body">
        <div class="row">
          <span class="tag">${cap(c.category)}</span>
          <span class="tag">${c.difficulty}</span>
          <span class="tag">${c.duration_hours}h</span>
          <span class="tag price">${price}</span>
        </div>
        <h3>${esc(c.title)}</h3>
        <p class="meta">${esc(c.desc)}</p>
        <div class="actions">
          <a class="btn small" href="${c.url}" target="_blank" rel="noopener">Go to Course</a>
          <button class="btn small flat" data-details>Details</button>
          ${c.tier==='free' ? '' : `<span class="lock" title="Purchase required">🔒</span>`}
        </div>
      </div>`;
    el.querySelector('[data-details]').addEventListener('click',()=> openCourseModal(c));
    return el;
  }

  function openCourseModal(c){
    const modal = document.getElementById('modal');
    if(!modal) return;
    const mTitle = document.getElementById('mTitle');
    const mMeta  = document.getElementById('mMeta');
    const mDesc  = document.getElementById('mDesc');
    const mTags  = document.getElementById('mTags');
    const mPrice = document.getElementById('mPrice');
    const mGo    = document.getElementById('mGo');

    mTitle.textContent = c.title;
    mMeta.textContent = `${cap(c.category)} • ${c.difficulty} • ${c.duration_hours}h`;
    mDesc.textContent = c.desc;
    mTags.innerHTML = (c.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    mPrice.innerHTML = c.tier==='free' ? `<span class="tag">Free</span>` : `<span class="tag">Price: $${c.price}</span>`;
    mGo.href = c.url;

    modal.setAttribute('open','');
    modal.querySelectorAll('[data-close]').forEach(el=>el.onclick=()=>modal.removeAttribute('open'));
    modal.addEventListener('click',(e)=>{ if(e.target===modal) modal.removeAttribute('open'); }, {once:true});
  }

  chips.forEach(c=> c.addEventListener('click', ()=>{
    chips.forEach(x=>x.setAttribute('aria-pressed', String(x===c)));
    renderCourses(c.dataset.tier);
  }));

  renderCourses('all');


  // ---------- PROJECTS (projects.html) ----------
  const webGrid = document.getElementById('webGrid');
  const appGrid = document.getElementById('appGrid');

  function renderProjects(){
    if(!webGrid && !appGrid) return;
    const makeCard = (p)=>{
      const card = document.createElement('article');
      card.className = 'card col-4';
      card.innerHTML = `
        <div class="thumb"></div>
        <div class="card-body">
          <h3>${esc(p.title)}</h3>
          <p class="meta">${esc(p.desc)}</p>
          <div class="cta"><a class="btn" href="${p.url||'#'}">View Project</a></div>
        </div>`;
      return card;
    };
    const projects = data.projects || [];
    const web = projects.filter(p=>p.category==='web');
    const apps = projects.filter(p=>p.category==='applications');

    if(webGrid){ webGrid.innerHTML=''; web.forEach(p=> webGrid.appendChild(makeCard(p))); }
    if(appGrid){ appGrid.innerHTML=''; apps.forEach(p=> appGrid.appendChild(makeCard(p))); }
  }

  renderProjects();


  // ---------- LESSON (thecourse.html) ----------
  const lessonBody = document.getElementById('lessonBody');
  if(lessonBody){
    const lessonId = lessonBody.dataset.lessonId || 'cpp-step-1';
    const lesson = (data.lessons||[]).find(l=> l.id===lessonId);
    if(lesson){
      const titleEl = document.getElementById('lessonTitle');
      const metaEl  = document.getElementById('lessonMeta');
      if(titleEl) titleEl.textContent = lesson.title;
      if(metaEl) metaEl.textContent   = `${lesson.difficulty} • ${lesson.duration_minutes} min • Updated ${lesson.updated}`;

      // Build sections
      lessonBody.innerHTML = '';
      const leftToc = document.getElementById('tocLeft');
      if(leftToc) leftToc.innerHTML = '';

      (lesson.sections||[]).forEach((s, idx)=>{
        const id = s.heading.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
        const sec = document.createElement('section');
        sec.className = 'step';
        sec.id = id;
        sec.innerHTML = `<h2>${esc(s.heading)}</h2>${s.body_html}`;
        lessonBody.appendChild(sec);

        if(leftToc){
          const li = document.createElement('li');
          li.innerHTML = `<a href="#${id}">${esc(s.heading)}</a>`;
          leftToc.appendChild(li);
        }
      });

      // Build right-rail "On this page"
      const onpage = document.getElementById('onpageNav');
      if(onpage){
        const ul = document.createElement('ul');
        (lesson.sections||[]).forEach((s)=>{
          const id = s.heading.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#'+id;
          a.textContent = s.heading;
          li.appendChild(a); ul.appendChild(li);
        });
        onpage.innerHTML = ''; onpage.appendChild(ul);
      }
    }
  }


  // ---------- helpers ----------
  function cap(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }
  function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
})();
