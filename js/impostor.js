// IMPOSTOR — each player is secretly assigned a word.
// They take turns asking each other yes/no questions to figure out what the other was assigned.
// 3 wrong guesses each. Pick a category, pick player count.

const IMPOSTOR_DATA = {
  "Animals":["dolphin","eagle","octopus","elephant","penguin","chameleon","cheetah","gorilla","flamingo","platypus","narwhal","tiger","wolf","koala","pangolin"],
  "Countries":["Morocco","Japan","Brazil","Iceland","Peru","Ethiopia","Australia","Canada","Switzerland","Indonesia","Vietnam","Argentina","Portugal","Nigeria","Thailand"],
  "Food":["croissant","sushi","tagine","ramen","shawarma","guacamole","paella","dim sum","fondue","baklava","kimchi","pho","risotto","hummus","empanada"],
  "Professions":["surgeon","astronaut","diplomat","sommelier","taxidermist","cryptographer","volcanologist","puppeteer","auctioneer","locksmith","falconer","cartographer"],
  "Objects":["compass","hourglass","periscope","metronome","sextant","abacus","kaleidoscope","telescope","thermometer","microscope","barometer","pendulum"],
  "Movies":["Inception","Parasite","The Matrix","Titanic","Clueless","Amélie","Mad Max","Ratatouille","Oldboy","Her","Arrival","Spirited Away"],
  "Famous People":["Cleopatra","Napoleon","Tesla","Frida Kahlo","Mozart","Einstein","Coco Chanel","Genghis Khan","Marie Curie","Leonardo da Vinci"],
  "Concepts":["nostalgia","entropy","irony","karma","déjà vu","serendipity","schadenfreude","wanderlust","zeitgeist","cognitive dissonance"],
};

const IMP_CATS = Object.keys(IMPOSTOR_DATA);

const Impostor = {
  players: [], assignments: [], guesses: [], eliminated: [], cat: 'Animals', numP: 2,
  phase: 'setup', // setup → interrogate → result
  curP: 0, curTarget: 1, qCount: 0,

  setup(){
    setHeaderRight('');
    render(`
      <button class="back" onclick="App.home()">Back</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.2rem;margin-bottom:4px">🎭</div>
        <div style="font-weight:800;font-size:1rem">IMPOSTOR</div>
        <div style="font-size:.72rem;color:var(--tx2);margin-top:4px;line-height:1.5">Each player is secretly assigned a word from the same category.<br>Take turns asking yes/no questions to guess what the other person got.<br>3 wrong guesses and you're out.</div>
      </div>
      <div class="cd">
        <div class="lbl">Category</div>
        <div class="chips">${IMP_CATS.map(c=>`<button class="chip${c===this.cat?' on':''}" onclick="Impostor.cat='${c}';Impostor.setup()">${c}</button>`).join('')}</div>
      </div>
      <div class="cd">
        <div class="lbl">Number of Players</div>
        <div class="chips">${[2,3,4].map(n=>`<button class="chip${n===this.numP?' on':''}" onclick="Impostor.numP=${n};Impostor.setup()">${n} Players</button>`).join('')}</div>
      </div>
      <div class="cd" id="pNameInputs">
        <div class="lbl">Player Names</div>
        ${Array.from({length:this.numP},(_,i)=>`<input class="inp" id="pn${i}" type="text" placeholder="Player ${i+1}" maxlength="12" style="margin-bottom:${i<this.numP-1?'8px':'0'}" autocomplete="off">`).join('')}
      </div>
      <button class="btn btn-or" onclick="Impostor.begin()">Assign Words 🎭</button>`);
  },

  begin(){
    this.players=[];
    for(let i=0;i<this.numP;i++){
      const v=($('pn'+i)||{}).value.trim()||'Player '+(i+1);
      this.players.push(v);
    }
    const pool=[...IMPOSTOR_DATA[this.cat]].sort(()=>Math.random()-.5);
    this.assignments=this.players.map((_,i)=>pool[i%pool.length]);
    this.guesses=this.players.map(()=>({wrong:0,guessed:false}));
    this.eliminated=new Array(this.numP).fill(false);
    this.curP=0;this.curTarget=1;this.qCount=0;
    this.phase='assign';
    this.showAssignment(0);
  },

  showAssignment(idx){
    if(idx>=this.players.length){this.phase='interrogate';this.curP=0;this.curTarget=1;this.showTurn();return;}
    render(`
      <div class="reveal-card">
        <div style="font-size:.7rem;font-weight:700;color:var(--tx2);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">Pass to</div>
        <div style="font-size:1.4rem;font-weight:800;margin-bottom:16px">${this.players[idx]}</div>
        <div style="font-size:.75rem;color:var(--tx2);margin-bottom:20px">Tap to reveal your secret word. Don't show anyone else.</div>
        <button class="btn btn-or" onclick="Impostor.revealWord(${idx})">👁 Show My Word</button>
      </div>`);
  },

  revealWord(idx){
    render(`
      <div class="reveal-card">
        <div style="font-size:.7rem;font-weight:700;color:var(--or);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">${this.players[idx]}'s word</div>
        <div class="secret-word">${this.assignments[idx]}</div>
        <div style="font-size:.7rem;color:var(--tx2);margin:12px 0">Category: <strong style="color:var(--tx)">${this.cat}</strong></div>
        <button class="btn btn-gh" onclick="Impostor.showAssignment(${idx+1})">Got it — pass the phone →</button>
      </div>`);
  },

  showTurn(){
    // Find next active player pair
    if(this.allDone()){this.showResult();return;}
    while(this.eliminated[this.curP]){this.nextPair();}

    const asker=this.players[this.curP];
    const target=this.players[this.curTarget];
    const wrongLeft=3-this.guesses[this.curP].wrong;
    const cols=['var(--pk)','var(--bl)','var(--or)','var(--pr)'];

    render(`
      <div class="gbar">
        <button class="back-sm" onclick="if(confirm('End game?'))App.home()">✕ End</button>
        <div class="imp-scoreboard">
          ${this.players.map((p,i)=>`<div class="imp-pip ${this.eliminated[i]?'elim':''}"><span>${p[0]}</span></div>`).join('')}
        </div>
      </div>
      <div class="imp-turn-card">
        <div style="font-size:.6rem;color:var(--tx2);font-weight:700;letter-spacing:.1em;text-transform:uppercase">Your turn</div>
        <div style="font-size:1.3rem;font-weight:800;color:${cols[this.curP]};margin:6px 0">${asker}</div>
        <div style="font-size:.8rem;color:var(--tx2)">Ask <strong style="color:var(--tx)">${target}</strong> a yes/no question about their word.<br>Then try to guess what it is.</div>
        <div style="font-size:.65rem;margin-top:8px;color:var(--dm)">${wrongLeft} wrong guess${wrongLeft!==1?'es':''} left · Category: ${this.cat}</div>
      </div>
      <div style="font-size:.7rem;color:var(--tx2);text-align:center;margin:4px 0">After asking your question, type your guess:</div>
      <div class="ans-row">
        <input class="ans-inp" id="impGuess" type="text" placeholder="Your guess..." autocomplete="off" onkeydown="if(event.key==='Enter')Impostor.makeGuess()">
        <button class="ans-btn ans-pk" onclick="Impostor.makeGuess()">→</button>
      </div>
      <button class="skip-btn" onclick="Impostor.passWithoutGuess()">Skip guessing this round →</button>`);
    setTimeout(()=>{const i=$('impGuess');if(i)i.focus();},80);
  },

  makeGuess(){
    const g=($('impGuess')||{}).value.trim();if(!g)return;
    const target=this.assignments[this.curTarget];
    const ok=fuzzyMatch(g,target);
    if(ok){
      this.guesses[this.curP].guessed=true;
      showFeedback(true);
      render(`<div class="reveal-card">
        <div style="font-size:2rem">🎉</div>
        <div style="font-weight:800;font-size:1.1rem;margin:8px 0">${this.players[this.curP]} got it!</div>
        <div style="font-size:.85rem;color:var(--tx2)">${this.players[this.curTarget]}'s word was <strong style="color:var(--cy)">${target}</strong></div>
        <button class="btn btn-or" style="margin-top:16px" onclick="Impostor.afterGuess(true)">Continue →</button>
      </div>`);
    }else{
      this.guesses[this.curP].wrong++;
      showFeedback(false);
      if(this.guesses[this.curP].wrong>=3){
        this.eliminated[this.curP]=true;
        render(`<div class="reveal-card">
          <div style="font-size:2rem">💀</div>
          <div style="font-weight:800;font-size:1.1rem;margin:8px 0">${this.players[this.curP]} is out!</div>
          <div style="font-size:.8rem;color:var(--tx2)">3 wrong guesses. ${this.players[this.curTarget]}'s word was <strong style="color:var(--cy)">${target}</strong></div>
          <button class="btn btn-gh" style="margin-top:16px" onclick="Impostor.afterGuess(false)">Continue →</button>
        </div>`);
      }else{
        const left=3-this.guesses[this.curP].wrong;
        toast(`Wrong! ${left} guess${left!==1?'es':''} left.`);
        this.showTurn();
      }
    }
  },

  passWithoutGuess(){this.nextPair();this.showTurn();},

  afterGuess(won){
    this.nextPair();
    if(this.allDone())this.showResult();
    else this.showTurn();
  },

  nextPair(){
    this.curTarget=(this.curTarget+1)%this.numP;
    if(this.curTarget===this.curP){
      this.curTarget=(this.curTarget+1)%this.numP;
      this.curP=(this.curP+1)%this.numP;
      while(this.eliminated[this.curP]&&!this.allDone())this.curP=(this.curP+1)%this.numP;
    }
    this.qCount++;
  },

  allDone(){
    const active=this.players.filter((_,i)=>!this.eliminated[i]&&!this.guesses[i].guessed);
    return active.length<=1||(this.guesses.every(g=>g.guessed||this.eliminated[this.players.indexOf(this.players[this.guesses.indexOf(g)])]));
  },

  showResult(){
    setHeaderRight('');
    const results=this.players.map((p,i)=>({
      name:p,
      word:this.assignments[i],
      guessed:this.guesses[i].guessed,
      eliminated:this.eliminated[i],
      wrong:this.guesses[i].wrong
    })).sort((a,b)=>(b.guessed?1:0)-(a.guessed?1:0));

    render(`<div class="res">
      <div class="res-i">🎭</div>
      <div class="res-t">Game Over</div>
      <div style="margin:16px 0;display:flex;flex-direction:column;gap:8px">
        ${results.map(r=>`
          <div style="background:var(--bg2);border:1px solid var(--bd);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700">${r.name}</div>
              <div style="font-size:.7rem;color:var(--tx2)">Word: <strong style="color:var(--cy)">${r.word}</strong></div>
            </div>
            <div style="font-size:1.3rem">${r.guessed?'✅':r.eliminated?'💀':'🤷'}</div>
          </div>`).join('')}
      </div>
      <div class="btn-r">
        <button class="btn btn-or" onclick="Impostor.setup()">Again</button>
        <button class="btn btn-gh" onclick="App.home()">Home</button>
      </div>
    </div>`);
  }
};
