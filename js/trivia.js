const TIMER_DEFAULT = 30;

const Trivia = {
  cat:'Mixed', diff:'medium', qs:[], idx:0, sc:0, strk:0, timer:null, time:0,

  setup(){
    setHeaderRight('');
    if(!this._qn) this._qn = 10;
    const makeDiff=(d,label,sub)=>`<button class="df${this.diff===d?' on':''}" data-d="${d}" onclick="Trivia.diff='${d}';Trivia.setup()">${label}<span class="df-sub">${sub}</span></button>`;
    render(`
      <button class="back" onclick="App.home()">Back</button>
      <div class="cd">
        <div class="lbl">Category</div>
        <div class="chips">${CATS.map(c=>`<button class="chip${c===this.cat?' on':''}" onclick="Trivia.cat='${c}';Trivia.setup()">${c}</button>`).join('')}</div>
      </div>
      <div class="cd">
        <div class="lbl">Difficulty</div>
        <div class="diffs">
          ${makeDiff('easy','Easy','recognizable facts')}
          ${makeDiff('medium','Medium','need to think')}
          ${makeDiff('hard','Hard','specialist knowledge')}
        </div>
      </div>
      <div class="cd">
        <div class="lbl">Questions</div>
        <div class="chips">
          ${[5,10,15,20].map(n=>`<button class="chip${this._qn===n?' on':''}" onclick="Trivia._qn=${n};Trivia.setup()">${n} Qs</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-pk" onclick="Trivia.start()">Play ⚡</button>`);
  },

  start(){
    const n = this._qn || 10;
    const diffFilter = this.diff; // easy/medium/hard
    let pool = TRIVIA_BANK.filter(q => {
      const catOk = this.cat === 'Mixed' || q.c === this.cat;
      const diffOk = !q.d || q.d === diffFilter;
      return catOk && diffOk;
    });
    // If strict filter < 5, relax difficulty
    if(pool.length < 5) pool = TRIVIA_BANK.filter(q => this.cat==='Mixed' || q.c===this.cat);
    if(pool.length < 5) pool = [...TRIVIA_BANK];
    this.qs = pool.sort(()=>Math.random()-.5).slice(0, Math.min(n, pool.length));
    this.idx = 0; this.sc = 0; this.strk = 0;
    this.showQ();
  },

  showQ(){
    if(this.idx >= this.qs.length){ this.end(); return; }
    const q = this.qs[this.idx];
    this.time = TIMER_DEFAULT;
    setHeaderRight(`<div class="hdr-score">⚡${this.sc}${this.strk>=2?'🔥'+this.strk:''}</div>`);
    render(`
      <div class="gbar">
        <button class="back-sm" onclick="Trivia.confirmQuit()">✕ Quit</button>
        <span class="qnum">Q${this.idx+1} / ${this.qs.length}</span>
        <span style="font-size:.6rem;color:var(--dm)">${this.cat}</span>
      </div>
      <div class="tbar"><div class="tf tf-ok" id="tFill" style="width:100%"></div></div>
      <div class="qcard">
        <div class="qtxt">${q.q}</div>
        <div class="ans-row">
          <input class="ans-inp" id="tAns" type="text" placeholder="Type your answer..." autocomplete="off" onkeydown="if(event.key==='Enter')Trivia.submit()">
          <button class="ans-btn ans-pk" onclick="Trivia.submit()">→</button>
        </div>
        <button class="skip-btn" onclick="Trivia.skip()">Skip →</button>
      </div>
      <div id="tFb"></div>`);
    setTimeout(()=>{const i=$('tAns');if(i)i.focus();},80);
    this.startTimer();
  },

  startTimer(){
    clearInterval(this.timer);
    const total = TIMER_DEFAULT;
    this.timer = setInterval(()=>{
      this.time--;
      const f = $('tFill');
      if(f){ f.style.width=(this.time/total*100)+'%'; if(this.time<=8) f.className='tf tf-warn'; }
      if(this.time<=0){ clearInterval(this.timer); this.timeUp(); }
    }, 1000);
  },

  submit(){
    clearInterval(this.timer);
    const inp = $('tAns');
    const ans = (inp||{}).value || '';
    if(!ans.trim()){ inp&&inp.focus(); this.startTimer(); return; }
    const q = this.qs[this.idx];
    const accepted = [q.a, ...(q.alts||[])];
    const ok = accepted.some(a => fuzzyMatch(ans, a));
    if(ok){ this.sc++; this.strk++; window._me.correct++; }
    else { this.strk = 0; }
    window._me.total++; Storage.saveMe();
    showFeedback(ok);
    this.showFb(ok, false);
  },

  skip(){ clearInterval(this.timer); this.strk=0; window._me.total++; Storage.saveMe(); this.showFb(false, true); },
  timeUp(){ this.strk=0; window._me.total++; Storage.saveMe(); this.showFb(false, false); },

  showFb(ok, skipped){
    const fb = $('tFb');
    const q = this.qs[this.idx];
    if(fb) fb.innerHTML = `
      <div class="fb-wrap ${ok?'fb-ok':'fb-no'}">
        <div class="fb-icon">${ok?'✅':skipped?'⏭️':'❌'}</div>
        <div class="fb-answer">${ok?'Correct!':'Answer: <strong>'+q.a+'</strong>'}</div>
        ${q.h ? `<div class="fb-hint">💡 ${q.h}</div>` : ''}
      </div>`;
    // Buffer: 2.5s correct, 4s wrong so you can read the answer + fact
    setTimeout(()=>{ this.idx++; this.showQ(); }, ok ? 2500 : 4000);
  },

  confirmQuit(){
    clearInterval(this.timer);
    if(confirm('Quit this round?')){ window._me.games++; Storage.saveMe(); this.showResult(); }
    else this.startTimer();
  },

  end(){ window._me.games++; if(this.sc>=this.qs.length*.7) window._me.wins++; Storage.saveMe(); this.showResult(); },

  showResult(){
    clearInterval(this.timer);
    setHeaderRight('');
    const pct = this.qs.length>0 ? Math.round(this.sc/this.qs.length*100) : 0;
    let msg='Keep going 💪', icon='💪';
    if(pct>=90){msg='Genius!';icon='🧠';}
    else if(pct>=70){msg='Nice one!';icon='⚡';}
    else if(pct>=50){msg='Not bad!';icon='👍';}
    render(`<div class="res"><div class="res-i">${icon}</div><div class="res-t">${msg}</div><div class="res-sc">${this.sc}/${this.qs.length}</div><div class="res-sub">${pct}% · ${this.cat} · ${this.diff}</div><div class="btn-r"><button class="btn btn-pk" onclick="Trivia.setup()">Again</button><button class="btn btn-gh" onclick="App.home()">Home</button></div></div>`);
  }
};
