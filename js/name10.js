const Name10 = {
  cat:'', ans:[], wrong:0, valid:[], ti:null, tm:60,

  setup(){
    render(`
      <button class="back" onclick="App.home()">${t('back')}</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.4rem;margin-bottom:6px">🔟</div>
        <div style="font-weight:800;font-size:1rem">${t('name10').toUpperCase()}</div>
        <div style="font-size:.75rem;color:var(--tx2);margin-top:4px">${t('n10Sub')}</div>
      </div>
      <button class="btn btn-or" onclick="Name10.start()">Go! 🔟</button>`);
  },

  start(){
    this.cat=N10_CATS[Math.floor(Math.random()*N10_CATS.length)];
    this.valid=N10_DATA[this.cat];this.ans=[];this.wrong=0;this.tm=60;
    this.show();
    clearInterval(this.ti);
    this.ti=setInterval(()=>{
      this.tm--;
      const el=$('n10T');if(el){el.textContent=this.tm;if(this.tm<=10)el.style.color='var(--rd)';}
      if(this.tm<=0){clearInterval(this.ti);this.end(false);}
    },1000);
  },

  n10match(input, validWord){
    const clean=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();
    const inp=clean(input);
    const vld=clean(validWord);
    if(!inp||inp.length<2)return false;
    if(inp===vld)return true;
    // For very short valid answers, require exact match
    if(vld.length<=3)return inp===vld;
    // Multi-word: allow if input matches all key words
    const vWords=vld.split(' ');
    if(vWords.length>1){
      // Input must contain the main word (first or longest)
      const mainWord=vWords.reduce((a,b)=>a.length>=b.length?a:b);
      if(inp===mainWord||levenshtein(inp,mainWord)<=1)return true;
    }
    // Single word with typo tolerance
    if(inp.length<Math.ceil(vld.length*0.65))return false;
    return levenshtein(inp,vld)<=(vld.length<=5?1:2);
  },

  show(){
    let stk='';for(let i=0;i<3;i++)stk+=`<div class="stk${i<this.wrong?' x':''}">${i<this.wrong?'✕':''}</div>`;
    render(`
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="back" onclick="clearInterval(Name10.ti);App.home()">${t('back')}</button>
        <div class="strikes">${stk}</div>
      </div>
      <div class="n10-title">${t('n10Title')} ${this.cat}</div>
      <div class="n10-timer" id="n10T" style="color:${this.tm<=10?'var(--rd)':'var(--cy)'}">${this.tm}</div>
      <div class="n10-cnt">${this.ans.length} / 10</div>
      <div class="n10-list">${this.ans.map(a=>`<span class="n10-ok">${a}</span>`).join('')}</div>
      <div class="ans-row">
        <input class="ans-inp" id="n10I" type="text" placeholder="${t('typeAnswer')}" onkeydown="if(event.key==='Enter')Name10.submit()">
        <button class="ans-btn" style="background:var(--g3);color:#111" onclick="Name10.submit()">+</button>
      </div>
      <div id="n10Fb"></div>`);
    setTimeout(()=>{const i=$('n10I');if(i)i.focus();},50);
  },

  submit(){
    const inp=$('n10I');if(!inp)return;
    const v=inp.value.trim();if(!v)return;
    const vl=v.toLowerCase();
    // Already answered check
    if(this.ans.map(a=>a.toLowerCase()).some(a=>levenshtein(a.replace(/[^a-z0-9]/g,''),vl.replace(/[^a-z0-9]/g,''))<=1)){inp.value='';toast('Already got that one!');return;}
    const ok=this.valid.some(x=>this.n10match(v,x));
    if(ok){
      const displayVal=this.valid.find(x=>this.n10match(v,x));
      this.ans.push(displayVal||v);
      const list=document.querySelector('.n10-list');if(list)list.innerHTML+=`<span class="n10-ok">${displayVal||v}</span>`;
      const cnt=document.querySelector('.n10-cnt');if(cnt)cnt.textContent=this.ans.length+' / 10';
      const fb=$('n10Fb');if(fb)fb.innerHTML='';
      inp.value='';
      if(this.ans.length>=10){clearInterval(this.ti);this.end(true);}
    }else{
      this.wrong++;showFeedback(false);
      const fb=$('n10Fb');if(fb)fb.innerHTML=`<div style="text-align:center;color:var(--rd);font-size:.8rem;padding:4px">❌ "${v}" ${t('wrongAnswer')} ${3-this.wrong} ${t('strikes')}</div>`;
      inp.value='';
      document.querySelectorAll('.stk').forEach((s,i)=>{if(i<this.wrong){s.classList.add('x');s.textContent='✕';}});
      if(this.wrong>=3){clearInterval(this.ti);this.end(false);}
    }
  },

  end(win){
    clearInterval(this.ti);
    window._me.games++;window._me.correct+=this.ans.length;window._me.total+=10;
    if(win)window._me.wins++;Storage.saveMe();
    const reason=this.wrong>=3?'3 Strikes!':(!win?t('timeUp'):'');
    // Show what was missed
    const missed=this.valid.filter(x=>!this.ans.some(a=>this.n10match(a,x))).slice(0,5);
    render(`<div class="res"><div class="res-i">${win?'🔥':'⏰'}</div><div class="res-t">${win?t('genius'):reason}</div><div style="font-size:.8rem;color:var(--tx2);margin-bottom:6px">${this.cat}</div><div class="res-sc">${this.ans.length}/10</div><div class="n10-list" style="margin:12px 0">${this.ans.map(a=>`<span class="n10-ok">${a}</span>`).join('')}</div>${missed.length&&!win?`<div style="font-size:.7rem;color:var(--tx2);margin-bottom:8px">You missed: ${missed.map(m=>`<span style="color:var(--tx)">${m}</span>`).join(', ')}${this.valid.length-this.ans.length>5?' and more':''}</div>`:''}<div class="btn-r"><button class="btn btn-or" onclick="Name10.start()">${t('again')}</button><button class="btn btn-gh" onclick="App.home()">${t('home')}</button></div></div>`);
  }
};
