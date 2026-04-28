const MP = {
  players: [], qs: [], idx: 0, cur: 0, scores: [], timer: null, time: 0,

  menu(){
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2rem;margin-bottom:6px">👥</div>
        <div style="font-weight:800;font-size:1rem">${t('multiplayer').toUpperCase()}</div>
        <div style="font-size:.75rem;color:var(--tx2);margin-top:4px">${t('mpDesc')}</div>
      </div>
      <button class="btn btn-pk" onclick="MP.setup()">${t('startGame')}</button>`);
  },

  setup(){
    render(`
      <button class="back" onclick="MP.menu()">${t('back')}</button>
      <div class="cd">
        <div class="lbl">${t('playerNames')}</div>
        <input class="inp" id="mp1" type="text" placeholder="Player 1" maxlength="12" style="margin-bottom:6px">
        <input class="inp" id="mp2" type="text" placeholder="Player 2" maxlength="12" style="margin-bottom:6px">
        <input class="inp" id="mp3" type="text" placeholder="Player 3 (optional)" maxlength="12" style="margin-bottom:6px">
        <input class="inp" id="mp4" type="text" placeholder="Player 4 (optional)" maxlength="12">
      </div>
      <div class="cd">
        <div class="lbl">${t('category')}</div>
        <select class="sel" id="mpCat">${CATS.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
        <div class="lbl" style="margin-top:10px">${t('questions')}</div>
        <select class="sel" id="mpNum"><option value="8">8</option><option value="12" selected>12</option><option value="16">16</option><option value="20">20</option></select>
      </div>
      <button class="btn btn-pk" id="mpBtn" onclick="MP.start()">${t('startGame')} ⚡</button>`);
  },

  async start(){
    this.players=[];
    for(let i=1;i<=4;i++){const v=($('mp'+i)||{}).value;if(v&&v.trim())this.players.push({name:v.trim(),av:randomAvatar()});}
    if(this.players.length<2)return;
    const btn=$('mpBtn');btn.disabled=true;btn.textContent='LOADING...';
    const n=parseInt($('mpNum').value),cat=$('mpCat').value;
    let qs=await fetchAIQuestions(n,cat,'medium');
    if(!qs||!qs.length){
      let pool=cat==='Mixed'?[...TRIVIA_BANK]:TRIVIA_BANK.filter(q=>q.c.toLowerCase().includes(cat.toLowerCase()));
      if(pool.length<3)pool=[...TRIVIA_BANK];
      qs=pool.sort(()=>Math.random()-.5).slice(0,Math.min(n,pool.length)).map(q=>({question:q.q,answer:q.a}));
    }
    this.qs=qs;this.idx=0;this.cur=0;this.scores=new Array(this.players.length).fill(0);
    btn.disabled=false;
    this.showQ();
  },

  showQ(){
    if(this.idx>=this.qs.length){this.end();return;}
    const q=this.qs[this.idx],p=this.players[this.cur];
    this.time=15;
    const cols=['var(--pk)','var(--bl)','var(--yl)','var(--pr)'];
    const scs=this.players.map((p,i)=>`<div class="sc ${i===this.cur?'on':''}" style="border-color:${cols[i]}"><div class="sc-nm" style="color:${cols[i]}">${p.name}</div><div class="sc-pt" style="color:${cols[i]}">${this.scores[i]}</div></div>`).join('');
    render(`
      <div class="scs">${scs}</div>
      <div class="gbar"><span class="qnum">Q${this.idx+1}/${this.qs.length}</span><button class="gbtn" onclick="clearInterval(MP.timer);App.home()">✕</button></div>
      <div class="tbar"><div class="tf tf-ok" id="mpF" style="width:100%"></div></div>
      <div class="qcard">
        <div style="font-size:.7rem;font-weight:700;color:${cols[this.cur]};letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px">${p.name}${t('yourTurn')}</div>
        <div class="qtxt">${q.question}</div>
        <div class="ans-row">
          <input class="ans-inp" id="mpAns" type="text" placeholder="${t('typeAnswer')}" onkeydown="if(event.key==='Enter')MP.submit()">
          <button class="ans-btn ans-pk" onclick="MP.submit()">→</button>
        </div>
        <button class="skip-btn" onclick="MP.skip()">${t('skip')} →</button>
      </div>
      <div id="mpFb"></div>`);
    setTimeout(()=>{const i=$('mpAns');if(i)i.focus();},100);
    clearInterval(this.timer);
    this.timer=setInterval(()=>{
      this.time--;const f=$('mpF');
      if(f){f.style.width=(this.time/15*100)+'%';if(this.time<=5)f.className='tf tf-warn';}
      if(this.time<=0){clearInterval(this.timer);this.skip();}
    },1000);
  },

  submit(){
    clearInterval(this.timer);
    const q=this.qs[this.idx],ans=($('mpAns')||{}).value||'';
    const ok=fuzzyMatch(ans,q.answer);
    if(ok)this.scores[this.cur]++;
    showFeedback(ok);
    const fb=$('mpFb');
    if(fb)fb.innerHTML=`<div class="fb-wrap ${ok?'fb-ok':'fb-no'}"><div class="fb-icon">${ok?'✅':'❌'}</div><div class="fb-answer">${ok?t('correct_answer'):t('answer_was')+' '+q.answer}</div></div>`;
    setTimeout(()=>this.next(),1500);
  },

  skip(){
    clearInterval(this.timer);
    const fb=$('mpFb');
    if(fb)fb.innerHTML=`<div class="fb-wrap fb-no"><div class="fb-icon">⏭️</div><div class="fb-answer">${t('answer_was')} ${this.qs[this.idx].answer}</div></div>`;
    setTimeout(()=>this.next(),1500);
  },

  next(){this.cur=(this.cur+1)%this.players.length;if(this.cur===0)this.idx++;this.showQ();},

  end(){
    clearInterval(this.timer);
    const cols=['var(--pk)','var(--bl)','var(--yl)','var(--pr)'];
    const sorted=this.players.map((p,i)=>({...p,score:this.scores[i],i})).sort((a,b)=>b.score-a.score);
    render(`<div class="res"><div class="res-i">👑</div><div class="res-t" style="color:${cols[sorted[0].i]}">${sorted[0].name} ${t('wins_round')}</div><div style="display:flex;flex-direction:column;gap:5px;margin:16px 0">${sorted.map((p,r)=>`<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg2);border-radius:10px;border:1px solid var(--bd)"><span style="font-family:var(--fm);font-size:1rem;width:28px">${['🥇','🥈','🥉','4️⃣'][r]}</span><div class="av av-s" style="background:${p.av.b}">${p.av.f}</div><span style="font-weight:700;flex:1;color:${cols[p.i]}">${p.name}</span><span style="font-family:var(--fm);font-size:1.2rem;color:${cols[p.i]}">${p.score}</span></div>`).join('')}</div><div class="btn-r"><button class="btn btn-pk" onclick="MP.setup()">${t('again')}</button><button class="btn btn-gh" onclick="App.home()">${t('home')}</button></div></div>`);
  }
};
