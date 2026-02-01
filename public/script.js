class ChineseGuessWordGame {
  constructor() {
    this.socket = io();
    this.roomId = null;
    this.playerName = '';
    this.isServerActive = false;

    this.gameState = {
      gameMode: 'single',
      isRunning: false,
      words: [],
      currentIndex: 0,
      score: 0,
      timeLeft: 300,
      timer: null,
      roundDescriptions: []
    };

    this.initElements();
    this.initSocket();
    this.bindEvents();
  }

  initElements() {
    // UI Panels
    this.modeSelection = document.getElementById('mode-selection');
    this.roomJoinInput = document.getElementById('room-join-input');
    this.playerNameInput = document.getElementById('player-name-input');
    this.gameInterface = document.getElementById('game-interface');
    this.gameOver = document.getElementById('game-over');
    this.countdownOverlay = document.getElementById('countdown-overlay');

    // Controls
    this.singlePlayerBtn = document.getElementById('single-player-btn');
    this.createRoomBtn = document.getElementById('create-room-btn');
    this.joinRoomBtn = document.getElementById('join-room-btn');
    this.confirmJoinBtn = document.getElementById('confirm-join-btn');
    this.confirmNameBtn = document.getElementById('confirm-name-btn');
    this.submitDescBtn = document.getElementById('submit-description');
    this.skipBtn = document.getElementById('skip-round');
    this.playAgainBtn = document.getElementById('play-again');
    this.endGameBtn = document.getElementById('end-game');

    // Inputs
    this.joinRoomIdInput = document.getElementById('join-room-id');
    this.playerNameInputEl = document.getElementById('player-name');
    this.descriptionInput = document.getElementById('description-input');

    // Display
    this.displayRoomId = document.getElementById('display-room-id');
    this.roomInfoDisplay = document.getElementById('room-info-display');
    this.readyStatusMsg = document.getElementById('ready-status-msg');
    this.opponentStatus = document.getElementById('opponent-status');
    this.gameTimerEl = document.getElementById('game-timer');
    this.currentWordEl = document.getElementById('current-word');
    this.roundInfoEl = document.getElementById('round-info');
    this.oppProgressBadge = document.getElementById('opponent-progress');
    this.oppScoreEl = document.getElementById('opp-score');
    this.logContainer = document.getElementById('log-container');
    this.finalScoreList = document.getElementById('final-score-list');
    this.winnerMsg = document.getElementById('winner-message');
  }

  initSocket() {
    this.socket.on('room-created', ({ roomId }) => {
      this.roomId = roomId;
      this.displayRoomId.textContent = roomId;
      this.roomInfoDisplay.classList.remove('hidden');
      this.modeSelection.classList.add('hidden');
      this.playerNameInput.classList.remove('hidden');
    });

    this.socket.on('player-joined', ({ players }) => {
      if (players.length === 2) {
        this.addLogEntry('system', '对手已进入房间');
        this.opponentStatus.innerHTML = '<p>对手已加入，正在等待就绪...</p>';
      }
    });

    this.socket.on('ready-update', ({ players }) => {
      const opponent = players.find(p => p.id !== this.socket.id);
      if (opponent && opponent.ready) {
        this.opponentStatus.innerHTML = '<p>✅ 对手已就绪！</p>';
      }
    });

    this.socket.on('start-countdown', ({ words }) => {
      this.gameState.words = words;
      this.showCountdown();
    });

    this.socket.on('game-started', () => {
      this.startGameLogic();
    });

    this.socket.on('opponent-progress', ({ score, currentIndex, finished }) => {
      this.oppScoreEl.textContent = score;
      if (finished) {
        this.addLogEntry('system', '对手已完成所有挑战！');
      }
    });

    this.socket.on('dual-game-over', ({ results }) => {
      this.endGame(results);
    });

    this.socket.on('error-msg', (msg) => { alert(msg); });
  }

  bindEvents() {
    this.singlePlayerBtn.onclick = () => this.startSingleMode();

    this.createRoomBtn.onclick = () => {
      this.gameState.gameMode = 'dual';
      this.playerNameInputEl.placeholder = "请输入您的姓名";
      this.socket.emit('create-room', ''); // 先不传名，后面confirm传
    };

    this.joinRoomBtn.onclick = () => {
      this.modeSelection.classList.add('hidden');
      this.roomJoinInput.classList.remove('hidden');
    };

    this.confirmJoinBtn.onclick = () => {
      const rid = this.joinRoomIdInput.value.trim().toUpperCase();
      if (!rid) return alert('请输入房间号');
      this.roomId = rid;
      this.gameState.gameMode = 'dual';
      this.roomJoinInput.classList.add('hidden');
      this.playerNameInput.classList.remove('hidden');
      this.displayRoomId.textContent = rid;
      this.roomInfoDisplay.classList.remove('hidden');
    };

    this.confirmNameBtn.onclick = () => {
      const name = this.playerNameInputEl.value.trim() || '匿大侠';
      this.playerName = name;
      this.playerNameInputEl.disabled = true;
      this.confirmNameBtn.classList.add('hidden');
      this.readyStatusMsg.classList.remove('hidden');
      this.opponentStatus.classList.remove('hidden');

      if (this.gameState.gameMode === 'dual') {
        // 如果是加入者，现在正式加入
        if (!this.socket.rooms || !this.socket.rooms.has(this.roomId)) {
          this.socket.emit('join-room', { roomId: this.roomId, playerName: name });
        }
        this.socket.emit('player-ready', this.roomId);
      } else {
        this.showCountdown();
      }
    };

    this.submitDescBtn.onclick = () => this.handleSubmit();
    this.skipBtn.onclick = () => this.handleSkip();
    this.endGameBtn.onclick = () => this.endGame();
    this.playAgainBtn.onclick = () => location.reload();

    this.descriptionInput.onkeypress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSubmit(); }
    };
  }

  startSingleMode() {
    this.gameState.gameMode = 'single';
    this.modeSelection.classList.add('hidden');
    this.playerNameInput.classList.remove('hidden');
    this.opponentStatus.classList.add('hidden');
    this.roomInfoDisplay.classList.add('hidden');
  }

  showCountdown() {
    this.playerNameInput.classList.add('hidden');
    this.countdownOverlay.classList.remove('hidden');
    let c = 3;
    this.countdownNumber = document.getElementById('countdown-number');
    this.countdownNumber.textContent = c;
    const t = setInterval(() => {
      c--;
      if (c <= 0) {
        clearInterval(t);
        this.countdownOverlay.classList.add('hidden');
        if (this.gameState.gameMode === 'dual') {
          this.socket.emit('start-game-dual', this.roomId);
        } else {
          this.startGameLogic();
        }
      } else {
        this.countdownNumber.textContent = c;
      }
    }, 1000);
  }

  async startGameLogic() {
    this.gameState.isRunning = true;
    this.gameInterface.classList.remove('hidden');

    if (this.gameState.gameMode === 'dual') {
      this.oppProgressBadge.classList.remove('hidden');
      this.roundInfoEl.classList.remove('hidden');
    } else {
      this.oppProgressBadge.classList.add('hidden');
      this.roundInfoEl.classList.add('hidden');
      // 单人随机生成词
      const res = await fetch('/api/random-word');
      const data = await res.json();
      this.gameState.words = [data.word];
    }

    this.updateWordDisplay();
    this.startTimer();
  }

  updateWordDisplay() {
    const word = this.gameState.words[this.gameState.currentIndex] || '结束';
    this.currentWordEl.textContent = word;
    if (this.gameState.gameMode === 'dual') {
      this.roundInfoEl.textContent = `第 ${this.gameState.currentIndex + 1}/10 词`;
    }
  }

  async handleSubmit() {
    const desc = this.descriptionInput.value.trim();
    if (!desc || !this.gameState.isRunning) return;

    this.addLogEntry('player', `${this.playerName}: ${desc}`);
    this.gameState.roundDescriptions.push(desc);
    this.descriptionInput.value = '';
    this.submitDescBtn.disabled = true;

    try {
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, allDescriptions: this.gameState.roundDescriptions })
      });
      const data = await response.json();
      this.addLogEntry('ai', `AI猜测: ${data.guess}`);

      if (data.guess === this.gameState.words[this.gameState.currentIndex]) {
        this.addLogEntry('system', '🎉 猜对了！');
        this.gameState.score++;
        this.nextWord();
      }
    } catch (e) { } finally {
      this.submitDescBtn.disabled = false;
    }
  }

  handleSkip() {
    this.addLogEntry('system', `跳过。正确答案: ${this.gameState.words[this.gameState.currentIndex]}`);
    this.nextWord();
  }

  async nextWord() {
    this.gameState.roundDescriptions = [];
    if (this.gameState.gameMode === 'dual') {
      this.gameState.currentIndex++;
      const finished = this.gameState.currentIndex >= 10;
      this.socket.emit('update-progress', {
        roomId: this.roomId,
        score: this.gameState.score,
        currentIndex: this.gameState.currentIndex,
        wordFinished: finished
      });

      if (finished) {
        this.gameState.isRunning = false;
        this.currentWordEl.textContent = "已完成！";
        this.addLogEntry('system', '您已完成所有挑战，等待对手...');
      } else {
        this.updateWordDisplay();
      }
    } else {
      // 单人模式直接换新词
      const res = await fetch('/api/random-word');
      const data = await res.json();
      this.gameState.words = [data.word];
      this.updateWordDisplay();
    }
  }

  startTimer() {
    this.gameState.timer = setInterval(() => {
      this.gameState.timeLeft--;
      this.gameTimerEl.textContent = this.gameState.timeLeft;
      if (this.gameState.timeLeft <= 0) this.endGame();
    }, 1000);
  }

  endGame(results = null) {
    this.gameState.isRunning = false;
    clearInterval(this.gameState.timer);
    this.gameInterface.classList.add('hidden');
    this.gameOver.classList.remove('hidden');

    if (results) {
      this.finalScoreList.innerHTML = results.map(p => `
        <div class="final-score-item">
          <span>${p.name}</span>
          <span>${p.score}分 (${p.time}秒)</span>
        </div>
      `).join('');

      const winner = this.determineWinner(results);
      this.winnerMsg.innerHTML = winner ? `🏆 胜者: ${winner.name}` : '握手言和！';
    } else {
      this.finalScoreList.innerHTML = `<div class="final-score-item"><span>您的得分</span><span>${this.gameState.score}</span></div>`;
    }
  }

  determineWinner(players) {
    const [p1, p2] = players;
    if (p1.score > p2.score) return p1;
    if (p2.score > p1.score) return p2;
    if (p1.time < p2.time) return p1;
    if (p2.time < p1.time) return p2;
    return null;
  }

  addLogEntry(type, msg) {
    const d = document.createElement('div');
    d.className = `log-entry ${type}`;
    d.textContent = msg;
    this.logContainer.appendChild(d);
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }
}

window.onload = () => { new ChineseGuessWordGame(); };