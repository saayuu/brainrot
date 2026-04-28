const $=id=>document.getElementById(id);
const app=document.getElementById('app');

function render(html){
  app.innerHTML=html;
  // Set RTL for Arabic
  document.documentElement.dir=window._me.lang==='arabic'?'rtl':'ltr';
}

function showFeedback(ok){
  const d=document.createElement('div');
  d.className='fbo';
  d.innerHTML=`<div class="fbt ${ok?'y':'n'} show">${ok?'✓':'✕'}</div>`;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),1000);
}

function toast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);setTimeout(()=>t.remove(),2000);
}

async function fetchAIQuestions(n,cat,diff){
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:3000,messages:[{role:'user',content:`Generate ${n} ${diff||'medium'} trivia questions about ${cat}. Return ONLY JSON array: [{"question":"Q","answer":"1-3 word answer"}]. Factual, varied, fun.`}]})});
    if(!r.ok)throw 'api';
    const d=await r.json();
    return JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim());
  }catch(e){return null;}
}

function fuzzyMatch(input,answer){
  const a=input.trim().toLowerCase(),b=answer.toLowerCase();
  if(a.length<2)return false;
  return a===b||b.includes(a)||a.includes(b);
}

const App={
  auth(){
    render(`
      <div class="logo-wrap">
        <span class="logo-i">🧠</span>
        <div class="logo"><span class="logo-main">BRAINROT</span><span class="logo-e">(E)</span></div>
        <div class="logo-sub">${t('tagline')}</div>
      </div>
      <div class="cd">
        <div class="lbl">${t('yourName')}</div>
        <input class="inp" id="aName" type="text" placeholder="${t('enterName')}" maxlength="12">
        <div class="lbl" style="margin-top:12px">${t('language')}</div>
        <select class="sel" id="aLang"><option value="english">🇬🇧 English</option><option value="french">🇫🇷 Français</option><option value="arabic">🇲🇦 العربية</option></select>
      </div>
      <button class="btn btn-pk" onclick="App.doAuth()">${t('enter')} 🧠</button>
      <div id="aErr"></div>`);
  },

  doAuth(){
    const n=$('aName').value.trim();
    if(!n){$('aErr').innerHTML='<div class="error">'+t('enterName')+'</div>';return;}
    window._me.name=n;window._me.lang=$('aLang').value;window._me.av=randomAvatar();
    Storage.saveMe();App.home();
  },

  home(){
    const m=window._me,pct=m.total>0?Math.round(m.correct/m.total*100):0;
    render(`
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0 16px">
        <div class="av av-m" style="background:${m.av.b}">${m.av.f}</div>
        <div style="flex:1"><div style="font-weight:800;font-size:1rem">${m.name}</div><div style="font-size:.65rem;color:var(--tx2)">${m.games>0?m.games+' '+t('games')+' · '+pct+'% '+t('accuracy'):t('readyToPlay')}</div></div>
        <button class="gbtn" onclick="App.stats()">📊</button>
      </div>
      <div class="modes">
        <div class="mode" onclick="Trivia.setup()"><span class="mi">⚡</span><div class="mn">${t('trivia')}</div><div class="md">${t('triviaDesc')}</div></div>
        <div class="mode" onclick="Guess.setup()"><span class="mi">🔍</span><div class="mn">${t('guessIt')}</div><div class="md">${t('guessDesc')}</div></div>
        <div class="mode" onclick="Name10.setup()"><span class="mi">🔟</span><div class="mn">${t('name10')}</div><div class="md">${t('n10Desc')}</div></div>
        <div class="mode" onclick="MP.menu()"><span class="mi">👥</span><div class="mn">${t('multiplayer')}</div><div class="md">${t('mpDesc')}</div></div>
      </div>`);
  },

  stats(){
    const m=window._me,pct=m.total>0?Math.round(m.correct/m.total*100):0;
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div style="text-align:center"><div class="av av-l" style="background:${m.av.b};margin:0 auto">${m.av.f}</div><div style="font-weight:800;font-size:1.2rem;margin-top:10px">${m.name}</div></div>
      <div class="sg">
        <div class="sb"><div class="sv" style="color:var(--pk)">${m.games}</div><div class="sl">${t('games')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--yl)">${m.wins}</div><div class="sl">${t('wins')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--cy)">${pct}%</div><div class="sl">${t('accuracy')}</div></div>
        <div class="sb"><div class="sv" style="color:var(--bl)">${m.correct}</div><div class="sl">${t('correct')}</div></div>
      </div>
      <button class="btn btn-gh btn-s" onclick="window._me.games=0;window._me.wins=0;window._me.correct=0;window._me.total=0;Storage.saveMe();App.stats()">${t('resetStats')}</button>`);
  }
};
