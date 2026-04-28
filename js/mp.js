// ── MULTIPLAYER — Firebase Realtime Database ─────────────────────────────────
// Room lifecycle: host creates → guest joins → host starts → live game
// All players see questions simultaneously, first correct answer wins the point

let _db = null;
let _roomRef = null;
let _roomCode = null;
let _playerId = null;
let _isHost = false;
let _unsubscribes = [];

function getDB() {
  if (_db) return _db;
  if (typeof firebase !== 'undefined') {
    _db = firebase.database();
    return _db;
  }
  return null;
}

function genRoomCode() {
  return Array.from({length:4}, ()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random()*23)]).join('');
}

function genPlayerId() {
  return 'p_' + Math.random().toString(36).substr(2,8);
}

const MP = {

  menu() {
    setHeaderRight('');
    render(`
      <button class="back" onclick="App.home()">Back</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:2.4rem;margin-bottom:8px">👥</div>
        <div style="font-weight:800;font-size:1.1rem">LIVE MULTIPLAYER</div>
        <div style="font-size:.72rem;color:var(--tx2);margin-top:6px">Join from different devices. First correct answer wins.</div>
      </div>
      <button class="btn btn-pk" onclick="MP.hostSetup()">🏠 Host a Room</button>
      <button class="btn btn-bl" onclick="MP.joinSetup()" style="margin-top:0">🔗 Join a Room</button>`);
  },

  hostSetup() {
    render(`
      <button class="back" onclick="MP.menu()">Back</button>
      <div class="cd">
        <div class="lbl">Game Mode</div>
        <div class="chips" id="mpModeChips">
          ${['Trivia','Guess It','Name 10','Impostor'].map((m,i)=>`<button class="chip${i===0?' on':''}" onclick="MP._mode='${m}';document.querySelectorAll('#mpModeChips .chip').forEach(c=>c.classList.remove('on'));this.classList.add('on')">${m}</button>`).join('')}
        </div>
      </div>
      <div class="cd">
        <div class="lbl">Category</div>
        <div class="chips" id="mpCatChips">
          ${CATS.map((c,i)=>`<button class="chip${i===0?' on':''}" onclick="MP._cat='${c}';document.querySelectorAll('#mpCatChips .chip').forEach(ch=>ch.classList.remove('on'));this.classList.add('on')">${c}</button>`).join('')}
        </div>
      </div>
      <div class="cd">
        <div class="lbl">Difficulty</div>
        <div class="diffs">
          <button class="df" data-d="easy" onclick="MP._diff='easy';document.querySelectorAll('.df').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Easy</button>
          <button class="df on" data-d="medium" onclick="MP._diff='medium';document.querySelectorAll('.df').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Medium</button>
          <button class="df" data-d="hard" onclick="MP._diff='hard';document.querySelectorAll('.df').forEach(b=>b.classList.remove('on'));this.classList.add('on')">Hard</button>
        </div>
      </div>
      <button class="btn btn-pk" onclick="MP.createRoom()">Create Room ✨</button>`);
    MP._mode = 'Trivia';
    MP._cat = 'Mixed';
    MP._diff = 'medium';
  },

  async createRoom() {
    const db = getDB();
    if (!db) { toast('Firebase not loaded yet, try again'); return; }

    _isHost = true;
    _playerId = genPlayerId();
    _roomCode = genRoomCode();

    // Pick questions
    let pool = TRIVIA_BANK.filter(q => MP._cat === 'Mixed' || q.c === MP._cat);
    if (pool.length < 5) pool = [...TRIVIA_BANK];
    const questions = pool.sort(() => Math.random() - .5).slice(0, 12).map(q => ({q: q.q, a: q.a, alts: q.alts || []}));

    const roomData = {
      host: _playerId,
      hostName: window._me.name,
      mode: MP._mode,
      cat: MP._cat,
      diff: MP._diff,
      status: 'waiting',
      questions: questions,
      currentQ: 0,
      players: {
        [_playerId]: { name: window._me.name, score: 0, ready: true }
      }
    };

    await db.ref('rooms/' + _roomCode).set(roomData);
    _roomRef = db.ref('rooms/' + _roomCode);
    MP.showLobby();
  },

  joinSetup() {
    render(`
      <button class="back" onclick="MP.menu()">Back</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:1.8rem;margin-bottom:8px">🔗</div>
        <div style="font-weight:700">Enter Room Code</div>
      </div>
      <input class="inp" id="joinCode" type="text" placeholder="ABCD" maxlength="4" autocomplete="off"
        style="text-align:center;font-size:2rem;letter-spacing:8px;font-weight:800;text-transform:uppercase"
        oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key==='Enter')MP.joinRoom()">
      <button class="btn btn-bl" onclick="MP.joinRoom()">Join →</button>
      <div id="joinErr"></div>`);
    setTimeout(() => { const i = $('joinCode'); if(i) i.focus(); }, 100);
  },

  async joinRoom() {
    const code = ($('joinCode') || {}).value?.trim().toUpperCase();
    if (!code || code.length !== 4) { $('joinErr').innerHTML = '<div class="error">Enter a 4-letter code</div>'; return; }
    const db = getDB();
    if (!db) { toast('Firebase not loaded'); return; }

    const snap = await db.ref('rooms/' + code).once('value');
    if (!snap.exists()) { $('joinErr').innerHTML = '<div class="error">Room not found</div>'; return; }
    const room = snap.val();
    if (room.status !== 'waiting') { $('joinErr').innerHTML = '<div class="error">Game already started</div>'; return; }

    _isHost = false;
    _playerId = genPlayerId();
    _roomCode = code;
    _roomRef = db.ref('rooms/' + code);

    await _roomRef.child('players/' + _playerId).set({ name: window._me.name, score: 0, ready: true });
    MP.showLobby();
  },

  showLobby() {
    render(`
      <button class="back" onclick="MP.leaveRoom()">Leave</button>
      <div class="cd" style="text-align:center">
        <div style="font-size:.6rem;color:var(--tx2);font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px">Room Code</div>
        <div style="font-size:3rem;font-weight:800;letter-spacing:10px;color:var(--cy);font-family:var(--fm)">${_roomCode}</div>
        <div style="font-size:.7rem;color:var(--tx2);margin-top:6px">Share this code with your opponent</div>
      </div>
      <div class="cd">
        <div class="lbl">Players in room</div>
        <div id="mpPlayerList" style="display:flex;flex-direction:column;gap:6px">Loading...</div>
      </div>
      ${_isHost ? `<button class="btn btn-pk" id="startBtn" onclick="MP.startGame()" disabled style="opacity:.4">Waiting for players...</button>` : `<div style="text-align:center;color:var(--tx2);font-size:.8rem;padding:8px">Waiting for host to start...</div>`}`);

    // Listen for room changes
    const unsub = _roomRef.on('value', snap => {
      if (!snap.exists()) { MP.menu(); return; }
      const room = snap.val();

      // Update player list
      const list = $('mpPlayerList');
      if (list && room.players) {
        list.innerHTML = Object.values(room.players).map(p =>
          `<div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg2);border-radius:10px">
            <div style="font-size:1rem">🟢</div>
            <div style="font-weight:600">${p.name}</div>
            ${room.host === Object.keys(room.players).find(k => room.players[k].name === p.name) ? '<div style="font-size:.6rem;color:var(--or);background:rgba(255,123,58,.1);padding:2px 6px;border-radius:4px;margin-left:auto">HOST</div>' : ''}
          </div>`
        ).join('');
      }

      // Enable start for host when 2+ players
      const startBtn = $('startBtn');
      const playerCount = room.players ? Object.keys(room.players).length : 0;
      if (startBtn && playerCount >= 2) {
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.textContent = `Start Game (${playerCount} players) ⚡`;
      }

      // Game started
      if (room.status === 'playing') {
        _roomRef.off('value', unsub);
        MP.playGame(room);
      }
    });
    _unsubscribes.push(() => _roomRef.off('value', unsub));
  },

  async startGame() {
    await _roomRef.update({ status: 'playing', currentQ: 0, startedAt: Date.now() });
  },

  playGame(room) {
    MP._room = room;
    MP._scores = {};
    Object.keys(room.players).forEach(pid => MP._scores[pid] = 0);
    MP.showQuestion();

    // Listen for game state changes (question advances)
    const unsub = _roomRef.on('value', snap => {
      if (!snap.exists()) return;
      const r = snap.val();
      MP._room = r;
      if (r.status === 'finished') {
        _roomRef.off('value', unsub);
        MP.showResults(r);
      }
    });
    _unsubscribes.push(() => _roomRef.off('value', unsub));
  },

  _answerLocked: false,

  showQuestion() {
    const room = MP._room;
    const qIdx = room.currentQ || 0;
    const questions = room.questions || [];
    if (qIdx >= questions.length) { MP.finishGame(); return; }

    const q = questions[qIdx];
    MP._answerLocked = false;
    const total = questions.length;

    setHeaderRight(`<div class="hdr-score">Q${qIdx+1}/${total}</div>`);
    render(`
      <div class="gbar">
        <button class="back-sm" onclick="if(confirm('Leave game?'))MP.leaveRoom()">✕ Leave</button>
        <span class="qnum">Q${qIdx+1} / ${total} · ${room.cat}</span>
      </div>
      <div class="tbar"><div class="tf tf-ok" id="mpFill" style="width:100%"></div></div>
      <div class="mp-scores" id="mpScores"></div>
      <div class="qcard">
        <div class="qtxt">${q.q}</div>
        <div class="ans-row">
          <input class="ans-inp" id="mpAns" type="text" placeholder="Type answer..." autocomplete="off" onkeydown="if(event.key==='Enter')MP.submitAnswer()">
          <button class="ans-btn ans-pk" onclick="MP.submitAnswer()">→</button>
        </div>
        <div class="mp-skip-row">
          <button class="skip-btn" id="skipBtn" onclick="MP.requestSkip()">Skip →</button>
          <div id="skipStatus" style="font-size:.65rem;color:var(--dm)"></div>
        </div>
      </div>
      <div id="mpFb"></div>`);
    setTimeout(() => { const i = $('mpAns'); if(i) i.focus(); }, 80);

    // Start 30s timer
    let timeLeft = 30;
    const timerId = setInterval(() => {
      timeLeft--;
      const f = $('mpFill');
      if (f) { f.style.width = (timeLeft/30*100)+'%'; if(timeLeft<=8) f.className='tf tf-warn'; }
      if (timeLeft <= 0) { clearInterval(timerId); if(!MP._answerLocked) MP.timeUp(qIdx); }
    }, 1000);
    MP._timerId = timerId;

    // Listen for answers on this question
    const answersRef = _roomRef.child('answers/' + qIdx);
    const unsub = answersRef.on('value', snap => {
      if (!snap.exists()) return;
      const answers = snap.val();
      MP.updateScoreboard(answers);

      // Check if skip consensus reached
      const skips = Object.values(answers).filter(a => a.skipped).length;
      const players = Object.keys(MP._room.players || {}).length;
      const skipStatus = $('skipStatus');
      if (skipStatus) {
        if (skips > 0 && skips < players) skipStatus.textContent = `${skips}/${players} want to skip`;
      }
      if (skips >= players) {
        answersRef.off('value', unsub);
        clearInterval(timerId);
        MP.advanceQuestion(qIdx, null);
      }

      // Check if everyone has answered
      const answered = Object.values(answers).filter(a => !a.skipped && a.answer).length;
      if (answered >= players) {
        answersRef.off('value', unsub);
        clearInterval(timerId);
        setTimeout(() => MP.advanceQuestion(qIdx, null), 1500);
      }
    });
    _unsubscribes.push(() => answersRef.off('value', unsub));
  },

  updateScoreboard(answers) {
    const scoreboard = $('mpScores');
    if (!scoreboard || !MP._room.players) return;
    const entries = Object.entries(MP._room.players).map(([pid, p]) => {
      const ans = answers && answers[pid];
      return { name: p.name, score: MP._scores[pid] || 0, ans };
    });
    scoreboard.innerHTML = `<div class="mp-score-row">${entries.map(e =>
      `<div class="mp-score-cell">
        <div style="font-weight:700;font-size:.75rem">${e.name}</div>
        <div style="font-family:var(--fm);font-size:1.2rem;color:var(--cy)">${e.score}</div>
        ${e.ans ? `<div style="font-size:.6rem;color:${e.ans.correct?'var(--gn)':e.ans.skipped?'var(--dm)':'var(--rd)'}">${e.ans.correct?'✅':e.ans.skipped?'⏭️':'✗'}</div>` : ''}
      </div>`
    ).join('')}</div>`;
  },

  async submitAnswer() {
    if (MP._answerLocked) return;
    const ans = ($('mpAns')||{}).value?.trim() || '';
    if (!ans) return;
    MP._answerLocked = true;

    const room = MP._room;
    const qIdx = room.currentQ || 0;
    const q = (room.questions || [])[qIdx];
    const accepted = [q.a, ...(q.alts || [])];
    const correct = accepted.some(a => fuzzyMatch(ans, a));

    const ts = Date.now();
    await _roomRef.child('answers/' + qIdx + '/' + _playerId).set({ answer: ans, correct, ts, name: window._me.name });

    if (correct) {
      MP._scores[_playerId] = (MP._scores[_playerId] || 0) + 1;
      showFeedback(true);
      const fb = $('mpFb');
      if (fb) fb.innerHTML = `<div class="fb-wrap fb-ok"><div class="fb-icon">✅</div><div class="fb-answer">Correct!</div></div>`;
    } else {
      showFeedback(false);
      const fb = $('mpFb');
      if (fb) fb.innerHTML = `<div class="fb-wrap fb-no"><div class="fb-icon">❌</div><div class="fb-answer">Answer: <strong>${q.a}</strong></div></div>`;
    }

    // If host and correct, advance immediately
    if (_isHost && correct) {
      clearInterval(MP._timerId);
      setTimeout(() => MP.advanceQuestion(qIdx, _playerId), 1200);
    }
  },

  async requestSkip() {
    const qIdx = MP._room.currentQ || 0;
    await _roomRef.child('answers/' + qIdx + '/' + _playerId).set({ skipped: true, name: window._me.name, ts: Date.now() });
    const skipBtn = $('skipBtn');
    if (skipBtn) { skipBtn.textContent = 'Skipped ✓'; skipBtn.disabled = true; }
    toast('Waiting for other player to skip...');
  },

  timeUp(qIdx) {
    toast("Time's up!");
    if (_isHost) MP.advanceQuestion(qIdx, null);
  },

  async advanceQuestion(qIdx, winnerId) {
    clearInterval(MP._timerId);
    const room = MP._room;
    const nextQ = qIdx + 1;
    if (nextQ >= (room.questions || []).length) {
      await MP.finishGame();
    } else {
      await _roomRef.update({ currentQ: nextQ });
      setTimeout(() => MP.showQuestion(), 500);
    }
  },

  async finishGame() {
    const scores = Object.entries(MP._room.players || {}).map(([pid, p]) => ({
      name: p.name, score: MP._scores[pid] || 0, pid
    })).sort((a,b) => b.score - a.score);
    await _roomRef.update({ status: 'finished', finalScores: Object.fromEntries(scores.map(s => [s.pid, s.score])) });
    MP.showResults({ ...MP._room, finalScores: scores });
  },

  showResults(room) {
    clearInterval(MP._timerId);
    setHeaderRight('');
    const scores = room.finalScores || [];
    const sorted = Array.isArray(scores) ? scores : Object.entries(scores).map(([pid,score]) => ({name: (room.players?.[pid]||{}).name||pid, score})).sort((a,b)=>b.score-a.score);
    const winner = sorted[0];

    render(`<div class="res">
      <div class="res-i">👑</div>
      <div class="res-t" style="color:var(--yl)">${winner?.name} wins!</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin:16px 0">
        ${sorted.map((p,i)=>`
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border-radius:11px;border:1px solid var(--bd)">
            <span style="font-size:1.2rem">${['🥇','🥈','🥉','4️⃣'][i]||'·'}</span>
            <span style="font-weight:700;flex:1">${p.name}</span>
            <span style="font-family:var(--fm);font-size:1.3rem;color:var(--cy)">${p.score}</span>
          </div>`).join('')}
      </div>
      <div class="btn-r">
        <button class="btn btn-pk" onclick="MP.menu()">Play Again</button>
        <button class="btn btn-gh" onclick="App.home()">Home</button>
      </div>
    </div>`);

    // Clean up room after 60s
    setTimeout(() => { if(_roomRef) _roomRef.remove(); }, 60000);
  },

  leaveRoom() {
    _unsubscribes.forEach(fn => { try { fn(); } catch(e) {} });
    _unsubscribes = [];
    if (_roomRef && _playerId) {
      _roomRef.child('players/' + _playerId).remove();
      if (_isHost) _roomRef.remove();
    }
    _roomRef = null; _roomCode = null; _playerId = null; _isHost = false;
    clearInterval(MP._timerId);
    MP.menu();
  }
};
