const $=id=>document.getElementById(id);
const app=document.getElementById('app');

function render(html){
  app.innerHTML=html;
  document.documentElement.dir=window._me&&window._me.lang==='arabic'?'rtl':'ltr';
}

function setHeaderRight(html){
  const el=document.getElementById('headerRight');
  if(el)el.innerHTML=html||'';
}

function showFeedback(ok){
  const d=document.createElement('div');
  d.className='fbo';
  d.innerHTML=`<div class="fbt ${ok?'y':'n'} show">${ok?'✓':'✕'}</div>`;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),800);
}

function toast(msg,dur=2000){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),dur);
}

// ── FUZZY MATCHING ──────────────────────────────────────────────────────────
function levenshtein(a,b){
  const m=a.length,n=b.length;
  if(m===0)return n;if(n===0)return m;
  const dp=[];
  for(let i=0;i<=m;i++)dp[i]=[i];
  for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++)
    for(let j=1;j<=n;j++)
      dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}

function fuzzyMatch(input,answer){
  const clean=s=>s.trim().toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ');
  const inp=clean(input);
  const ans=clean(answer);
  if(!inp||inp.length<1)return false;
  if(inp===ans)return true;
  if(ans.length<=3)return inp===ans;
  // Multi-word: try containment only if input is substantial
  if(ans.split(' ').length>1&&inp.length>=Math.ceil(ans.length*0.55)){
    if(ans.includes(inp)||inp.includes(ans))return true;
  }
  // Single word with typo tolerance
  if(inp.length<Math.ceil(ans.length*0.65))return false;
  const maxDist=ans.length<=4?0:ans.length<=7?1:2;
  return levenshtein(inp,ans)<=maxDist;
}

const App={
  auth(){
    setHeaderRight('');
    render(`
      <div class="auth-wrap">
        <div class="cd">
          <div class="lbl">${t('yourName')}</div>
          <input class="inp" id="aName" type="text" placeholder="${t('enterName')}" maxlength="14" autocomplete="off">
          <div class="lbl" style="margin-top:12px">${t('language')}</div>
          <select class="sel" id="aLang">
            <option value="english">🇬🇧 English</option>
            <option value="french">🇫🇷 Français</option>
            <option value="arabic">🇲🇦 العربية</option>
          </select>
        </div>
        <button class="btn btn-pk" onclick="App.doAuth()">${t('enter')} 🧠</button>
        <div id="aErr"></div>
      </div>`);
    setTimeout(()=>{const i=$('aName');if(i)i.focus();},100);
  },

  doAuth(){
    const n=$('aName').value.trim();
    if(!n){$('aErr').innerHTML='<div class="error">'+t('enterName')+'</div>';return;}
    window._me.name=n;window._me.lang=$('aLang').value;window._me.av=randomAvatar();
    Storage.saveMe();App.home();
  },

  home(){
    const m=window._me,pct=m.total>0?Math.round(m.correct/m.total*100):0;
    setHeaderRight(`<button class="hdr-btn" onclick="App.stats()">📊</button>`);
    render(`
      <div class="home-profile">
        <div class="av av-m" style="background:${m.av.b}">${m.av.f}</div>
        <div>
          <div class="home-name">${m.name}</div>
          <div class="home-sub">${m.games>0?m.games+' '+t('games')+' · '+pct+'% '+t('accuracy'):t('readyToPlay')}</div>
        </div>
      </div>
      <div class="section-lbl">SOLO</div>
      <div class="modes">
        <div class="mode mode-1" onclick="Trivia.setup()"><span class="mi">⚡</span><div class="mn">${t('trivia')}</div><div class="md">${t('triviaDesc')}</div></div>
        <div class="mode mode-2" onclick="Guess.setup()"><span class="mi">🔍</span><div class="mn">${t('guessIt')}</div><div class="md">${t('guessDesc')}</div></div>
        <div class="mode mode-3" onclick="Name10.setup()"><span class="mi">🔟</span><div class="mn">${t('name10')}</div><div class="md">${t('n10Desc')}</div></div>
        <div class="mode mode-4" onclick="Impostor.setup()"><span class="mi">🎭</span><div class="mn">IMPOSTOR</div><div class="md">Get assigned a secret word. Interrogate each other.</div></div>
      </div>
      <div class="section-lbl" style="margin-top:4px">MULTIPLAYER</div>
      <div class="mode mode-5" onclick="MP.menu()" style="display:flex;align-items:center;gap:12px;text-align:left;padding:16px">
        <span style="font-size:1.8rem">👥</span>
        <div>
          <div class="mn">Live Rooms</div>
          <div class="md">Host or join · First to answer wins · Real-time</div>
        </div>
      </div>`);
  },

  stats(){
    const m=window._me,pct=m.total>0?Math.round(m.correct/m.total*100):0;
    setHeaderRight('');
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div style="text-align:center;margin:10px 0 16px">
        <div class="av av-l" style="background:${m.av.b};margin:0 auto">${m.av.f}</div>
        <div style="font-weight:800;font-size:1.1rem;margin-top:10px">${m.name}</div>
      </div>
      <div class="sg">
        <div class="sb"><div class="sv" style="color:var(--pk)">${m.games}</div><div class="sl">${t('games')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--yl)">${m.wins}</div><div class="sl">${t('wins')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--cy)">${pct}%</div><div class="sl">${t('accuracy')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--bl)">${m.correct}</div><div class="sl">${t('correct')}</div></div>
      </div>
      <button class="btn btn-gh btn-s" style="margin-top:8px" onclick="if(confirm('Reset all stats?')){window._me.games=0;window._me.wins=0;window._me.correct=0;window._me.total=0;Storage.saveMe();App.stats()}">${t('resetStats')}</button>`);
  }
};
