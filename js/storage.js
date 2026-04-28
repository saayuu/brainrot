const Storage = {
  get(k){ const v=localStorage.getItem(k); return v?JSON.parse(v):null; },
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); },
  loadMe(){
    const d=this.get('br-me');
    if(d){window._me={...window._me,...d};return true;}
    return false;
  },
  saveMe(){
    const m=window._me;
    this.set('br-me',{id:m.id,name:m.name,lang:m.lang,av:m.av,games:m.games,wins:m.wins,correct:m.correct,total:m.total});
  }
};
window._me={id:'u'+Math.random().toString(36).substr(2,8),name:'',lang:'english',av:randomAvatar(),games:0,wins:0,correct:0,total:0};
