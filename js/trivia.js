const Trivia = {
  cat: 'Mixed', diff: 'easy', qs: [], idx: 0, sc: 0, strk: 0, timer: null, time: 0,

  setup(){
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div class="cd">
        <div class="lbl">${t('category')}</div>
        <div class="chips">${CATS.map(c=>`<button class="chip ${c===this.cat?'on':''}" onclick="Trivia.cat='${c}';Trivia.setup()">${c}</button>`).join('')}</div>
      </div>
      <div class="cd">
        <div class="lbl">${t('difficulty')}</div>
        <div class="diffs">
          <button class="df" data-d="easy" ${this.diff==='easy'?'class="df on" data-d="easy"':''} onclick="Trivia.diff='easy';Trivia.setup()">${t('easy')}</button>
          <button class="df" data-d="medium" ${this.diff==='medium'?'class="df on" data-d="medium"':''} onclick="Trivia.diff='medium';Trivia.setup()">${t('medium')}</button>
          <button class="df" data-d="hard" ${this.diff==='hard'?'class="df on" data-d="hard"':''} onclick="Trivia.diff='hard';Trivia.setup()">${t('hard')}</button>
        </div>
      </div>
      <div class="cd">
        <div class="lbl">${t('questions')}</div>
        <select class="sel" id="tNum"><option value="5">5</option><option value="10" selected>10</option><option value="15">15</option><option value="20">20</option></select>
      </div>
      <button class="btn btn-pk" id="tBtn" onclick="Trivia.start()">${t('play')} ⚡</button>`);
    // Fix diff button styling
    document.querySelectorAll('.df').forEach(b=>{if(b.dataset.d===this.diff)b.classList.add('on');});
  },

  async start(){
    const btn=$('tBtn');btn.disabled=true;btn.textContent='LOADING...';
    const n=parseInt($('tNum').value);
    let qs=await fetchAIQuestions(n,this.cat,this.diff);
    if(!qs||!qs.length){
      let pool=this.cat==='Mixed'?[...TRIVIA_BANK]:TRIVIA_BANK.filter(q=>q.c.toLowerCase().includes(this.cat.toLowerCase()));
      if(pool.length<3)pool=[...TRIVIA_BANK];
      qs=pool.sort(()=>Math.random()-.5).slice(0,Math.min(n,pool.length)).map(q=>({question:q.q,answer:q.a}));
    }
    this.qs=qs;this.idx=0;this.sc=0;this.strk=0;
    btn.disabled=false;btn.textContent=t('play')+' ⚡';
    this.showQ();
  },

  showQ(){
    if(this.idx>=this.qs.length){this.end();return;}
    const q=this.qs[this.idx];
    this.time=this.diff==='easy'?20:this.diff==='medium'?15:10;
    render(`
      <div class="gbar">
        <div class="gbar-l"><span class="qnum">Q${this.idx+1}/${this.qs.length}</span><span style="margin-left:8px;font-size:.6rem;color:var(--dm)">${this.cat}</span></div>
        <div class="gbar-r">
          <div class="score-pill">⚡ ${this.sc}${this.strk>=2?'<span class="streak-badge">🔥'+this.strk+'</span>':''}</div>
          <button class="gbtn" onclick="Trivia.quit()">✕</button>
        </div>
      </div>
      <div class="tbar"><div class="tf tf-ok" id="tFill" style="width:100%"></div></div>
      <div class="qcard">
        <div class="qnum">${t('questions').toUpperCase()} ${this.idx+1}</div>
        <div class="qtxt">${q.question}</div>
        <div class="ans-row">
          <input class="ans-inp" id="tAns" type="text" placeholder="${t('typeAnswer')}" autocomplete="off" onkeydown="if(event.key==='Enter')Trivia.submit()">
          <button class="ans-btn ans-pk" onclick="Trivia.submit()">→</button>
        </div>
        <button class="skip-btn" onclick="Trivia.skip()">${t('skip')} →</button>
      </div>
      <div id="tFb"></div>`);
    setTimeout(()=>{const i=$('tAns');if(i)i.focus();},100);
    this.startTimer();
  },

  startTimer(){
    clearInterval(this.timer);
    const total=this.time;
    this.timer=setInterval(()=>{
      this.time--;
      const f=$('tFill');
      if(f){f.style.width=(this.time/total*100)+'%';if(this.time<=5)f.className='tf tf-warn';}
      if(this.time<=0){clearInterval(this.timer);this.timeUp();}
    },1000);
  },

  submit(){
    clearInterval(this.timer);
    const ans=($('tAns')||{}).value||'';
    const ok=fuzzyMatch(ans,this.qs[this.idx].answer);
    if(ok){this.sc++;this.strk++;window._me.correct++;}else{this.strk=0;}
    window._me.total++;Storage.saveMe();
    showFeedback(ok);
    this.showFb(ok);
  },

  skip(){clearInterval(this.timer);this.strk=0;window._me.total++;Storage.saveMe();this.showFb(false);},
  timeUp(){this.strk=0;window._me.total++;Storage.saveMe();this.showFb(false);},

  showFb(ok){
    const fb=$('tFb'),a=this.qs[this.idx].answer;
    if(fb)fb.innerHTML=`<div class="fb-wrap ${ok?'fb-ok':'fb-no'}"><div class="fb-icon">${ok?'✅':'❌'}</div><div class="fb-answer">${ok?t('correct_answer'):t('answer_was')+' '+a}</div></div>`;
    setTimeout(()=>{this.idx++;this.showQ();},1500);
  },

  quit(){clearInterval(this.timer);window._me.games++;Storage.saveMe();this.showResult();},
  end(){window._me.games++;if(this.sc>=this.qs.length*.8)window._me.wins++;Storage.saveMe();this.showResult();},

  showResult(){
    clearInterval(this.timer);
    const pct=this.qs.length>0?Math.round(this.sc/this.qs.length*100):0;
    let msg=t('keepGoing'),icon='💪';if(pct>=90){msg=t('genius');icon='🧠';}else if(pct>=70){msg=t('nice');icon='⚡';}else if(pct>=50){msg=t('decent');icon='👍';}
    render(`<div class="res"><div class="res-i">${icon}</div><div class="res-t">${msg}</div><div class="res-sc">${this.sc}/${this.qs.length}</div><div class="res-sub">${pct}% · ${this.cat} · ${this.diff}</div><div class="btn-r"><button class="btn btn-pk" onclick="Trivia.setup()">${t('again')}</button><button class="btn btn-gh" onclick="App.home()">${t('home')}</button></div></div>`);
  }
};
