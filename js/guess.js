// Flag CDN helper
const flagUrl=code=>`https://flagcdn.com/w160/${code.toLowerCase()}.png`;
const COUNTRY_CODES={
  "Japan":"jp","Brazil":"br","Egypt":"eg","Switzerland":"ch","Morocco":"ma",
  "India":"in","Australia":"au","Mexico":"mx","South Korea":"kr","Iceland":"is",
  "Peru":"pe","Greece":"gr","France":"fr","Germany":"de","Italy":"it",
  "Spain":"es","Portugal":"pt","Canada":"ca","Argentina":"ar","China":"cn",
  "Russia":"ru","Turkey":"tr","Saudi Arabia":"sa","Nigeria":"ng","Kenya":"ke",
  "South Africa":"za","Thailand":"th","Indonesia":"id","Vietnam":"vn","Netherlands":"nl",
  "Belgium":"be","Sweden":"se","Norway":"no","Denmark":"dk","Finland":"fi",
  "Poland":"pl","Ukraine":"ua","Iran":"ir","Pakistan":"pk","Bangladesh":"bd",
  "Ethiopia":"et","Ghana":"gh","Algeria":"dz","Tunisia":"tn","Senegal":"sn",
  "UAE":"ae","Qatar":"qa","Israel":"il","Jordan":"jo","Lebanon":"lb",
  "New Zealand":"nz","Singapore":"sg","Malaysia":"my","Philippines":"ph",
  "Colombia":"co","Chile":"cl","Venezuela":"ve","Cuba":"cu","Jamaica":"jm",
};

const Guess = {
  topic:'Countries', data:null, ci:0, st:0, done:false,

  setup(){
    setHeaderRight('');
    render(`
      <button class="back" onclick="App.home()">Back</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.2rem;margin-bottom:4px">🔍</div>
        <div style="font-weight:800;font-size:1rem">GUESS IT</div>
        <div style="font-size:.72rem;color:var(--tx2);margin-top:4px">Read the clues. Guess the answer. 3 strikes max.</div>
      </div>
      <div class="cd">
        <div class="lbl">Topic</div>
        <div class="chips">${GUESS_TOPICS.map(tp=>`<button class="chip${tp===this.topic?' on':''}" onclick="Guess.topic='${tp}';Guess.setup()">${tp}</button>`).join('')}</div>
      </div>
      <button class="btn btn-bl" onclick="Guess.start()">Start 🔍</button>`);
  },

  start(){
    const items=GUESS_DATA[this.topic]||GUESS_DATA.Countries;
    this.data=items[Math.floor(Math.random()*items.length)];
    this.ci=0;this.st=0;this.done=false;
    this.show();
  },

  getVisual(){
    // Show flag if Countries or Flags topic
    if((this.topic==='Countries'||this.topic==='Flags')&&COUNTRY_CODES[this.data.answer]){
      return `<div style="text-align:center;margin:10px 0"><img src="${flagUrl(COUNTRY_CODES[this.data.answer])}" style="height:70px;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.4)" alt="flag" onerror="this.style.display='none'"></div>`;
    }
    if(this.topic==='Flags'&&this.data.flagCode){
      return `<div style="text-align:center;margin:10px 0"><img src="${flagUrl(this.data.flagCode)}" style="height:70px;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.4)" alt="flag" onerror="this.style.display='none'"></div>`;
    }
    if(this.topic==='Brands'&&this.data.logo){
      return `<div style="text-align:center;margin:10px 0"><img src="${this.data.logo}" style="height:60px;border-radius:8px;background:white;padding:6px;box-shadow:0 4px 16px rgba(0,0,0,.4)" alt="logo" onerror="this.style.display='none'"></div>`;
    }
    return '';
  },

  show(){
    let stk='';for(let i=0;i<3;i++)stk+=`<div class="stk${i<this.st?' x':''}">${i<this.st?'✕':''}</div>`;
    let clues='';
    for(let i=0;i<=this.ci&&i<this.data.clues.length;i++){
      clues+=`<div class="clue-c"><div class="clue-n">Clue ${i+1} of ${this.data.clues.length}</div><div class="clue-t">${this.data.clues[i]}</div></div>`;
    }
    render(`
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="back" onclick="Guess.setup()">Back</button>
        <div class="strikes">${stk}</div>
      </div>
      <div style="font-size:.65rem;color:var(--tx2);font-weight:700;text-align:center;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">${this.topic}</div>
      ${this.getVisual()}
      ${clues}
      <div class="ans-row">
        <input class="ans-inp" id="gInp" type="text" placeholder="Your guess..." onkeydown="if(event.key==='Enter')Guess.submit()">
        <button class="ans-btn ans-pk" onclick="Guess.submit()">→</button>
      </div>
      ${this.ci<this.data.clues.length-1?`<button class="skip-btn" onclick="Guess.nextClue()">Next clue 💡</button>`:''}
      <div id="gFb"></div>`);
    setTimeout(()=>{const i=$('gInp');if(i)i.focus();},80);
  },

  nextClue(){this.ci++;this.show();},

  submit(){
    if(this.done)return;
    const g=($('gInp')||{}).value||'';if(!g.trim())return;
    const accepted=[this.data.answer,...(this.data.alts||[])];
    const ok=accepted.some(a=>fuzzyMatch(g,a));
    if(ok){
      this.done=true;window._me.correct++;window._me.total++;window._me.games++;window._me.wins++;Storage.saveMe();
      showFeedback(true);
      render(`<div class="res"><div class="res-i">🎉</div><div class="res-t">${this.data.answer}</div><div class="res-sub">Got it in ${this.ci+1} clue${this.ci!==0?'s':''}!</div><div class="btn-r"><button class="btn btn-bl" onclick="Guess.start()">Again</button><button class="btn btn-gh" onclick="App.home()">Home</button></div></div>`);
    }else{
      this.st++;window._me.total++;Storage.saveMe();showFeedback(false);
      if(this.st>=3){
        this.done=true;window._me.games++;Storage.saveMe();
        render(`<div class="res"><div class="res-i">💀</div><div class="res-t">It was: ${this.data.answer}</div><div class="res-sub">3 strikes!</div><div class="btn-r"><button class="btn btn-bl" onclick="Guess.start()">Again</button><button class="btn btn-gh" onclick="App.home()">Home</button></div></div>`);
      }else{this.show();}
    }
  }
};
