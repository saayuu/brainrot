// Multiplayer placeholder — real-time rooms coming via Firebase
const MP = {
  menu(){
    setHeaderRight('');
    render(`
      <button class="back" onclick="App.home()">Back</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.4rem;margin-bottom:8px">👥</div>
        <div style="font-weight:800;font-size:1rem">LIVE MULTIPLAYER</div>
        <div style="font-size:.75rem;color:var(--tx2);margin-top:8px;line-height:1.6">
          Real-time rooms are being built.<br>
          Host or join a room from different devices.<br>
          Race to answer · Simultaneous typing · All game modes.
        </div>
      </div>
      <div class="mp-feature-list">
        <div class="mp-feat">⚡ First correct answer wins the point</div>
        <div class="mp-feat">🎭 All game modes supported</div>
        <div class="mp-feat">📱 Join from any device</div>
        <div class="mp-feat">🔟 12 questions per match</div>
        <div class="mp-feat">⏭️ Skip requires both players to confirm</div>
      </div>
      <button class="btn btn-pk" onclick="toast('Coming soon! Setting up Firebase now 🔥',3000)">Notify Me When Live 🔔</button>`);
  }
};
