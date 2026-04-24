
// ════════════════════════════════
// HELPERS
// ════════════════════════════════
const GEMO = {Animation:'🎞️',Horror:'👻',Romance:'💞',Fantasy:'🧙',Drama:'🎭',Family:'👨‍👩‍👧',Comedy:'😂','Sci-Fi':'🚀',Thriller:'🔪',Musical:'🎵',Action:'💥',Adventure:'🗺️',Mystery:'🔎'};
function emo(g){if(!g)return'🎬';return GEMO[g.split(',')[0].trim()]||'🎬';}

function fmtT(t){
  if(!t)return'—';
  const p=t.split(':');let h=parseInt(p[0]),m=parseInt(p[1]),ap=h>=12?'PM':'AM';
  h=h%12||12;return`${h}:${String(m).padStart(2,'0')} ${ap}`;
}
function fmtD(d){
  if(!d)return'—';
  try{const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}catch{return d;}
}
function rl(i){return String.fromCharCode(65+i);}

function movieStatus(id){
  const s=DB_SCHEDULES.filter(x=>x.movie_id===id&&x.active==='True');
  if(!s.length)return'No Schedule';
  const today=new Date();today.setHours(0,0,0,0);
  return s.some(x=>new Date(x.date+'T00:00:00')>=today)?'Showing':'Ended';
}

// ════════════════════════════════
// AUTH
// ════════════════════════════════
let CU=null;
function gU(){return JSON.parse(localStorage.getItem('lu_u')||'[]');}
function sU(u){localStorage.setItem('lu_u',JSON.stringify(u));}

function stab(t){
  document.getElementById('fl').style.display=t==='login'?'':'none';
  document.getElementById('fr').style.display=t==='reg'?'':'none';
  document.getElementById('tl').classList.toggle('on',t==='login');
  document.getElementById('tr').classList.toggle('on',t==='reg');
  ['lerr','rerr'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
}

function doLogin(){
  const e=document.getElementById('le').value.trim(),p=document.getElementById('lp').value;
  const u=gU().find(x=>x.email===e&&x.pass===p);
  if(!u){document.getElementById('lerr').style.display='block';return;}
  CU=u;launch();
}
function doReg(){
  const n=document.getElementById('rn').value.trim(),e=document.getElementById('re').value.trim(),p=document.getElementById('rp').value;
  const el=document.getElementById('rerr');
  if(!n||!e||!p){el.textContent='All fields required.';el.style.display='block';return;}
  if(p.length<6){el.textContent='Password needs 6+ characters.';el.style.display='block';return;}
  const us=gU();
  if(us.find(x=>x.email===e)){el.textContent='Email already registered.';el.style.display='block';return;}
  const user={id:Date.now(),name:n,email:e,pass:p};
  us.push(user);sU(us);CU=user;launch();
}
function logout(){
  CU=null;document.getElementById('app').style.display='none';document.getElementById('auth').style.display='flex';
}

function launch(){
  document.getElementById('auth').style.display='none';
  document.getElementById('app').style.display='block';
  const ini=CU.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('sav').textContent=ini;
  document.getElementById('snm').textContent=CU.name;
  buildFilters();rmov();nav('home');
}

// ════════════════════════════════
// HOME
// ════════════════════════════════
let activeG='All';
function buildFilters(){
  const gs=new Set(['All']);
  DB_MOVIES.forEach(m=>{(m.genre||'').split(',').forEach(g=>gs.add(g.trim()))});
  document.getElementById('gfil').innerHTML=[...gs].map(g=>`<button class="gf${g==='All'?' on':''}" onclick="setG('${g}',this)">${g}</button>`).join('');
}
function setG(g,b){
  activeG=g;
  document.querySelectorAll('.gf').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');rmov();
}

function rmov(){
  const q=(document.getElementById('sq').value||'').toLowerCase();
  const grid=document.getElementById('mgrid');
  const list=DB_MOVIES.filter(m=>{
    const mq=!q||m.movie_name.toLowerCase().includes(q)||(m.genre||'').toLowerCase().includes(q);
    const mg=activeG==='All'||(m.genre||'').includes(activeG);
    return mq&&mg;
  });
  if(!list.length){grid.innerHTML=`<div class="nores">No movies found.</div>`;return;}
  grid.innerHTML=list.map(m=>{
    const st=movieStatus(m.id);
    const bc=st==='Showing'?'bshow':st==='Ended'?'bend':'bsoon';
    const bt=st==='Showing'?'Showing':st==='Ended'?'Ended':'No Schedule';
    const imgPath=`static/uploads/${m.movie_image}`;
    const img=m.movie_image
      ?`<img src="${imgPath}" alt="${m.movie_name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" loading="lazy"><div class="pph" style="display:none">${emo(m.genre)}</div>`
      :`<div class="pph">${emo(m.genre)}</div>`;
    return`<div class="mcard" onclick="openM(${m.id})">
      <div class="pw">${img}<span class="bdg ${bc}">${bt}</span></div>
      <div class="mi">
        <div class="mn">${m.movie_name}</div>
        <div class="mg">${m.genre||'—'} · ${m.age_restrict}</div>
        <div class="mp">${st==='Showing'?'From ₱350':st==='Ended'?'Ended':'Coming Soon'}</div>
      </div>
    </div>`;
  }).join('');
}

// ════════════════════════════════
// MODAL
// ════════════════════════════════
let AM=null,AS=null,AX=null,AT='std';

function openM(id){
  AM=DB_MOVIES.find(m=>m.id===id);if(!AM)return;
  AS=null;AX=null;AT='std';
  document.getElementById('mtitle').textContent=AM.movie_name;
  document.getElementById('mdesc').textContent=AM.description||'No description available.';
  document.getElementById('mchips').innerHTML=[
    `<span class="chip chipa">${movieStatus(id)}</span>`,
    AM.genre?`<span class="chip">${AM.genre}</span>`:'',
    AM.duration&&AM.duration.length>0?`<span class="chip">${AM.duration}</span>`:'',
    AM.language?`<span class="chip">${AM.language.charAt(0).toUpperCase()+AM.language.slice(1)}</span>`:'',
    AM.age_restrict?`<span class="chip">${AM.age_restrict}</span>`:'',
    AM.movie_date_created?`<span class="chip">Added ${fmtD(AM.movie_date_created)}</span>`:''
  ].filter(Boolean).join('');
  const pw=document.getElementById('mpostw');
  pw.innerHTML=AM.movie_image
    ?`<div class="mpost"><img src="static/uploads/${AM.movie_image}" alt="${AM.movie_name}" onerror="this.parentElement.innerHTML='<div class=mpostph>${emo(AM.genre)}</div>'"></div>`
    :`<div class="mpostph">${emo(AM.genre)}</div>`;

  // Build schedule list for this movie
  const scheds=DB_SCHEDULES.filter(s=>s.movie_id===id);
  if(!scheds.length){
    document.getElementById('sgrid').innerHTML=`<div style="color:var(--text3);font-size:13px;padding:4px 0">No schedules assigned to this movie yet.</div>`;
  } else {
    document.getElementById('sgrid').innerHTML=scheds.map(s=>{
      const tk=getTk(s.id).length;
      const total=s.venue_row*s.venue_col;
      const left=Math.max(0,total-tk);
      const inactive=s.active==='False';
      return`<div class="sbtn${inactive?' sdisabled':''}" id="sbtn-${s.id}" onclick="${inactive?'':(`selS(${s.id})`)}">
        <div class="sd">${fmtD(s.date)}</div>
        <div class="st">${fmtT(s.start_time)} – ${fmtT(s.end_time)}</div>
        <div class="sv">${s.venue_name}</div>
        <div class="sv">Room ${s.venue_room} · ${s.venue_cap} cap.</div>
        <div class="sv ${inactive?'':'left<20?slow:savl'}">${inactive?'<span style="color:var(--text3)">Inactive</span>':`<span class="${left<20?'slow':'savl'}">${left} seats available</span>`}</div>
      </div>`;
    }).join('');
  }
  selType('std');
  renderSeats();
  updSum();
  document.getElementById('ovl').classList.add('open');
  document.body.style.overflow='hidden';
}

function closeM(){document.getElementById('ovl').classList.remove('open');document.body.style.overflow='';}
function cmClose(e){if(e.target===document.getElementById('ovl'))closeM();}

function selS(id){
  AS=DB_SCHEDULES.find(s=>s.id===id);AX=null;
  document.querySelectorAll('.sbtn').forEach(b=>b.classList.remove('on'));
  const btn=document.getElementById('sbtn-'+id);
  if(btn)btn.classList.add('on');
  renderSeats();updSum();
}

function selType(t){
  AT=t;AX=null;
  document.getElementById('tt-std').classList.toggle('on',t==='std');
  document.getElementById('tt-prm').classList.toggle('on',t==='prm');
  renderSeats();updSum();
}

// ════════════════════════════════
// SEAT MAP — uses real venue_row/col/gap from DB
// ════════════════════════════════
function getTk(sid){
  const k=`lu_tk_${sid}`;
  let d=null;
  try{d=localStorage.getItem(k);}catch{}
  if(d)return JSON.parse(d);
  const s=DB_SCHEDULES.find(x=>x.id===sid);
  if(!s)return[];
  const rows=s.venue_row,cols=s.venue_col;
  const tk=[];
  for(let r=0;r<rows;r++)
    for(let c=1;c<=cols;c++)
      if(Math.random()<0.28)tk.push(rl(r)+c);
  try{localStorage.setItem(k,JSON.stringify(tk));}catch{}
  return tk;
}
function addTk(sid,seat){
  const tk=getTk(sid);
  if(!tk.includes(seat))tk.push(seat);
  try{localStorage.setItem(`lu_tk_${sid}`,JSON.stringify(tk));}catch{}
}

function renderSeats(){
  const g=document.getElementById('srows');
  const hint=document.getElementById('seat-hint');
  if(!AS){
    g.innerHTML='';
    hint.style.display='block';
    hint.textContent='Select a schedule above to view the seat map.';
    return;
  }
  hint.style.display='none';
  const rows=AS.venue_row,cols=AS.venue_col,rg=AS.venue_row_gap,cg=AS.venue_col_gap;
  // Front rows (A–B) = premium
  const premRows=Math.min(2,rows);
  const tk=getTk(AS.id);
  let html='';
  for(let r=0;r<rows;r++){
    const label=rl(r);
    const isPrem=r<premRows;
    const dimRow=(isPrem&&AT==='std')||(!isPrem&&AT==='prm');
    let row=`<div class="srow"><div class="rlbl">${label}</div>`;
    for(let c=1;c<=cols;c++){
      const sid=label+c;
      const isTk=tk.includes(sid)||dimRow;
      const isSel=AX===sid;
      if(cg>0&&c>1&&(c-1)%cg===0)row+=`<div class="sgap"></div>`;
      let cls='seat';
      if(isTk&&!isSel)cls+=' tk';
      if(isSel)cls+=' on';
      const clickable=!isTk&&!isSel;
      row+=`<div class="${cls}"${clickable?` onclick="selSeat('${sid}')" title="${sid}${isPrem?' (Premium)':''}"`:!dimRow&&isTk?` title="${sid} – Taken"`:''}>${isSel?'✓':''}</div>`;
    }
    row+='</div>';
    if(rg>0&&r<rows-1&&(r+1)%rg===0)row+=`<div style="height:8px;width:100%"></div>`;
    html+=row;
  }
  g.innerHTML=html;
}

function selSeat(id){
  if(!AS)return;
  AX=AX===id?null:id;
  renderSeats();updSum();
}

function updSum(){
  const price=AT==='prm'?500:350;
  document.getElementById('sm').textContent=AM?AM.movie_name:'—';
  document.getElementById('sd').textContent=AS?fmtD(AS.date):'—';
  document.getElementById('sti').textContent=AS?`${fmtT(AS.start_time)} – ${fmtT(AS.end_time)}`:'—';
  document.getElementById('svn').textContent=AS?AS.venue_name:'—';
  document.getElementById('svr').textContent=AS?`Room ${AS.venue_room}`:'—';
  document.getElementById('ss').textContent=AX||'—';
  document.getElementById('sty').textContent=AT==='prm'?'Premium (₱500)':'Standard (₱350)';
  document.getElementById('stot').textContent=AX?`₱${price.toLocaleString()}`:'₱0';
  const btn=document.getElementById('bbtn');
  const rdy=AS&&AX;
  btn.disabled=!rdy;
  btn.textContent=rdy?`Confirm Booking — ₱${price.toLocaleString()}`:'Select a Schedule & Seat to Continue';
}

// ════════════════════════════════
// BOOKING
// ════════════════════════════════
function book(){
  if(!AS||!AX||!AM||!CU)return;
  const price=AT==='prm'?500:350;
  const code=Math.random().toString(36).slice(2,8).toUpperCase();
  const b={
    id:Date.now(),userId:CU.id,
    movieId:AM.id,movieName:AM.movie_name,movieEmoji:emo(AM.genre),
    schedId:AS.id,date:AS.date,startTime:AS.start_time,endTime:AS.end_time,
    venueName:AS.venue_name,venueRoom:AS.venue_room,
    seat:AX,type:AT,price,code,status:'valid',at:new Date().toISOString()
  };
  const bks=JSON.parse(localStorage.getItem('lu_bks')||'[]');
  bks.push(b);localStorage.setItem('lu_bks',JSON.stringify(bks));
  addTk(AS.id,AX);
  closeM();
  toast(`🎟️ Booked! ${AM.movie_name} · Seat ${AX} · Code: ${code}`);
}

// ════════════════════════════════
// MY TICKETS
// ════════════════════════════════
function renderTix(){
  if(!CU)return;
  const bks=JSON.parse(localStorage.getItem('lu_bks')||'[]').filter(b=>b.userId===CU.id).reverse();
  const el=document.getElementById('tlist');
  if(!bks.length){
    el.innerHTML=`<div class="empty"><div class="eico">🎟️</div><div class="etit">No tickets yet</div><div class="esub">Browse movies and book your first seat!</div></div>`;
    return;
  }
  el.innerHTML=bks.map(b=>`
    <div class="tcard">
      <div class="tbar"></div>
      <div class="tbody">
        <div class="temi">${b.movieEmoji}</div>
        <div class="tdet">
          <div class="tmov">${b.movieName}</div>
          <div class="tmet">
            📅 ${fmtD(b.date)} · ${fmtT(b.startTime)} – ${fmtT(b.endTime)}<br>
            📍 ${b.venueName} · ${b.venueRoom}<br>
            💺 Seat <strong>${b.seat}</strong> · ${b.type==='prm'?'Premium':'Standard'} · ₱${b.price.toLocaleString()}
          </div>
          <span class="tbadge ${b.status==='valid'?'tv':'tu'}">${b.status}</span>
        </div>
        <div class="tcod">
          <div class="cval">${b.code}</div>
          <div class="clbl">Ticket ID</div>
        </div>
      </div>
    </div>`).join('');
}

// ════════════════════════════════
// SCHEDULE PAGE
// ════════════════════════════════
function renderSched(){
  const el=document.getElementById('schedlist');
  const grp={};
  DB_SCHEDULES.forEach(s=>{if(!grp[s.date])grp[s.date]=[];grp[s.date].push(s);});
  el.innerHTML=Object.keys(grp).sort().map(date=>{
    const items=grp[date].map(s=>{
      const mov=DB_MOVIES.find(m=>m.id===s.movie_id);
      const tk=getTk(s.id).length;
      const left=Math.max(0,s.venue_row*s.venue_col-tk);
      const inactive=s.active==='False';
      return`<div class="sitem${inactive?' sdim':''}" onclick="${inactive?'':(`openM(${s.movie_id})`)}">
        <div class="siem">${emo(mov?.genre)}</div>
        <div class="sidet">
          <div class="simov">${mov?.movie_name||'Unknown'}${inactive?`<span class="itag">Inactive</span>`:''}</div>
          <div class="simet">${fmtT(s.start_time)} – ${fmtT(s.end_time)} · ${s.venue_name} · Room ${s.venue_room}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px">${mov?.genre||''} · ${s.venue_cap} cap.</div>
        </div>
        <div class="siright">
          <div class="siseat" style="color:${inactive?'var(--text3)':left<20?'var(--red)':'var(--green)'}">${inactive?'—':left+' left'}</div>
          <div class="siprice">${inactive?'Inactive':'From ₱350'}</div>
        </div>
      </div>`;
    }).join('');
    return`<div class="sday"><div class="sdate">${fmtD(date)}</div>${items}</div>`;
  }).join('');
}

// ════════════════════════════════
// TOAST
// ════════════════════════════════
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;t.style.display='block';
  clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',6000);
}

// ════════════════════════════════
// INIT — seed demo account
// ════════════════════════════════
window.onload=()=>{
  const us=gU();
  if(!us.find(u=>u.email==='demo@luma.com')){
    us.push({id:1,name:'Alex Rivera',email:'demo@luma.com',pass:'demo123'});
    sU(us);
  }
};

function openProfileModal(userId) {
    fetch(`/get_profile/${userId}`)
        .then(response => response.json())
        .then(user => {
            if (user.error) {
                alert(user.error);
                return;
            }

            document.getElementById("modalUsername").innerText = user.username;
            document.getElementById("modalEmail").innerText = user.email;
            document.getElementById("modalRole").innerText = user.role;
            document.getElementById("modalStatus").innerText = user.status;
            document.getElementById("modalBio").innerText = user.bio || "No bio";
            document.getElementById("modalGender").innerText = user.gender || "N/A";
            document.getElementById("modalNationality").innerText = user.nationality || "N/A";
            document.getElementById("modalProfileImage").src = user.image || "";

            document.getElementById("profileModal").style.display = "block";
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

document.addEventListener("DOMContentLoaded", function() {
    const imageprev = document.getElementById("sav");
    const span = document.getElementsByClassName("close")[0];


});

let selectedGenres = [];
let selectedStatus = "";

document.addEventListener("DOMContentLoaded", function() {
  // Genre tag click handler
  document.querySelectorAll(".genre").forEach(tag => {
    tag.addEventListener("click", () => {
      const value = tag.dataset.genre;

      if (value === "") {
        // "All" — reset genre selection
        selectedGenres = [];
        document.querySelectorAll(".genre").forEach(t => t.classList.remove("active"));
        tag.classList.add("active");
      } else {
        tag.classList.toggle("active");

        if (selectedGenres.includes(value)) {
          selectedGenres = selectedGenres.filter(g => g !== value);
        } else {
          selectedGenres.push(value);
        }

        // Deactivate "All" when specific genres are selected
        document.querySelector('.genre[data-genre=""]').classList.remove("active");

        // If nothing selected, re-activate "All"
        if (selectedGenres.length === 0) {
          document.querySelector('.genre[data-genre=""]').classList.add("active");
        }
      }

      rmov();
    });
  });

  // Status tag click handler
  document.querySelectorAll(".status").forEach(tag => {
    tag.addEventListener("click", function() {
      document.querySelectorAll(".status").forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      selectedStatus = this.dataset.status;
      rmov();
    });
  });

  // Search input
  const sq = document.getElementById("sq");
  if (sq) sq.addEventListener("input", rmov);

  // Run once on load to set initial state
  rmov();
});

function rmov() {
  const q = (document.getElementById("sq")?.value || "").toLowerCase().trim();
  const cards = document.querySelectorAll(".movies-grid .movie-link");

  cards.forEach(link => {
    const card = link.querySelector(".movie-card");
    if (!card) return;

    const nameEl  = card.querySelector(".movie-info h5");
    const genreEl = card.querySelector(".movie-info p");
    const statusEl = card.querySelector(".status");

    const name   = nameEl  ? nameEl.textContent.toLowerCase()  : "";
    const genre  = genreEl ? genreEl.textContent.toLowerCase() : "";
    const rawStatus = statusEl ? statusEl.textContent.trim().toLowerCase().replace(/\s+/g, "-") : "";

    // Search match: name or genre contains query
    const matchSearch = !q || name.includes(q) || genre.includes(q);

    // Genre match: every selected genre must appear in the genre text
    const matchGenre = selectedGenres.length === 0 ||
      selectedGenres.every(g => genre.includes(g.toLowerCase()));

    // Status match
    let matchStatus = true;
    if (selectedStatus) {
      matchStatus = rawStatus === selectedStatus;
    }

    link.style.display = (matchSearch && matchGenre && matchStatus) ? "" : "none";
  });

  // Show "no movies" message if everything is hidden
  const grid = document.querySelector(".movies-grid");
  if (grid) {
    const visible = [...grid.querySelectorAll(".movie-link")].filter(l => l.style.display !== "none");
    let noMsg = grid.querySelector(".no-movies-filter");
    if (visible.length === 0) {
      if (!noMsg) {
        noMsg = document.createElement("p");
        noMsg.className = "no-movies no-movies-filter";
        noMsg.textContent = "No movies match your filters.";
        grid.appendChild(noMsg);
      }
      noMsg.style.display = "";
    } else if (noMsg) {
      noMsg.style.display = "none";
    }
  }
}