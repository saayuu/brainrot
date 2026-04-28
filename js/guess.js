const Guess = {
  topic: 'Countries', data: null, ci: 0, st: 0, done: false,

  setup(){
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.4rem;margin-bottom:6px">🔍</div>
        <div style="font-weight:800;font-size:1rem">${t('guessIt').toUpperCase()}</div>
        <div style="font-size:.75rem;color:var(--tx2);margin-top:4px;line-height:1.5">${t('guessDesc')}</div>
      </div>
      <div class="cd">
        <div class="lbl">${t('topic')}</div>
        <div class="chips">${GUESS_TOPICS.map(tp=>`<button class="chip ${tp===this.topic?'on':''}" onclick="Guess.topic='${tp}';Guess.setup()">${tp}</button>`).join('')}</div>
      </div>
      <button class="btn btn-bl" onclick="Guess.start()">${t('start')} 🔍</button>`);
  },

  start(){
    const items=GUESS_DATA[this.topic]||GUESS_DATA.Countries;
    this.data=items[Math.floor(Math.random()*items.length)];
    this.ci=0;this.st=0;this.done=false;
    this.show();
  },

  show(){
    let stk='';for(let i=0;i<3;i++)stk+=`<div class="stk ${i<this.st?'x':''}">${i<this.st?'✕':''}</div>`;
    let clues='';for(let i=0;i<=this.ci&&i<this.data.clues.length;i++)clues+=`<div class="clue-c"><div class="clue-n">Clue ${i+1}</div><div class="clue-t">${this.data.clues[i]}</div></div>`;
    render(`
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="back" onclick="App.home()">${t('back')}</button>
        <div class="strikes">${stk}</div>
      </div>
      <div style="font-size:.7rem;color:var(--tx2);font-weight:700;text-align:center;letter-spacing:.08em;text-transform:uppercase">${this.topic}</div>
      ${clues}
      <div class="ans-row">
        <input class="ans-inp" id="gInp" type="text" placeholder="${t('guessPlaceholder')}" onkeydown="if(event.key==='Enter')Guess.submit()">
        <button class="ans-btn ans-pk" onclick="Guess.submit()">→</button>
      </div>
      ${this.ci<this.data.clues.length-1?`<button class="skip-btn" onclick="Guess.ci++;Guess.show()">${t('nextClue')} 💡</button>`:''}
      <div id="gFb"></div>`);
    setTimeout(()=>{const i=$('gInp');if(i)i.focus();},100);
  },

  submit(){
    if(this.done)return;
    const g=($('gInp')||{}).value||'';if(!g.trim())return;
    const ok=fuzzyMatch(g,this.data.answer);
    if(ok){
      this.done=true;window._me.correct++;window._me.total++;window._me.games++;window._me.wins++;Storage.saveMe();
      showFeedback(true);
      render(`<div class="res"><div class="res-i">🎉</div><div class="res-t">${this.data.answer}</div><div class="res-sub">${t('gotIt')} (${this.ci+1} clue${this.ci>0?'s':''})</div><div class="btn-r"><button class="btn btn-bl" onclick="Guess.start()">${t('again')}</button><button class="btn btn-gh" onclick="App.home()">${t('home')}</button></div></div>`);
    }else{
      this.st++;window._me.total++;Storage.saveMe();showFeedback(false);
      if(this.st>=3){
        this.done=true;window._me.games++;Storage.saveMe();
        render(`<div class="res"><div class="res-i">💀</div><div class="res-t">${t('itWas')} ${this.data.answer}</div><div class="res-sub">3 strikes!</div><div class="btn-r"><button class="btn btn-bl" onclick="Guess.start()">${t('again')}</button><button class="btn btn-gh" onclick="App.home()">${t('home')}</button></div></div>`);
      }else{this.show();}
    }
  }
};
