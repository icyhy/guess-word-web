class ChineseGuessWordGame {
  constructor() {
    this.gameState = {
      isRunning: false,
      players: [],
      currentPlayerIndex: 0,
      currentWord: '',
      scores: {},
      gameMode: 'single', // 'single' or 'dual'
      roundTime: 60, // 增加到60秒
      totalTime: 300,
      roundTimeLeft: 60, // 增加到60秒
      gameTimeLeft: 300,
      roundInterval: null,
      gameInterval: null,
      roundDescriptions: [] // 记录本轮所有描述
    };
    
    this.initializeElements();
    this.bindEvents();
    this.loadWords();
  }

  initializeElements() {
    // 模式选择
    this.modeSelection = document.getElementById('mode-selection');
    this.singlePlayerBtn = document.getElementById('single-player-btn');
    this.dualPlayerBtn = document.getElementById('dual-player-btn');
    
    // 玩家输入
    this.playerInput = document.getElementById('player-input');
    this.player1Input = document.getElementById('player1-input');
    this.player2Input = document.getElementById('player2-input');
    this.player1Name = document.getElementById('player1-name');
    this.player2Name = document.getElementById('player2-name');
    this.startGameBtn = document.getElementById('start-game-btn');
    
    // 游戏界面
    this.gameInterface = document.getElementById('game-interface');
    this.roundTimerEl = document.getElementById('round-timer');
    this.gameTimerEl = document.getElementById('game-timer');
    this.currentWordEl = document.getElementById('current-word');
    this.currentPlayerNameEl = document.getElementById('current-player-name');
    this.player1Score = document.getElementById('player1-score');
    this.player2Score = document.getElementById('player2-score');
    this.player1ScoreLabel = document.getElementById('player1-score-label');
    this.player2ScoreLabel = document.getElementById('player2-score-label');
    this.descriptionInput = document.getElementById('description-input');
    this.submitDescriptionBtn = document.getElementById('submit-description');
    this.skipRoundBtn = document.getElementById('skip-round');
    this.logContainer = document.getElementById('log-container');
    this.endGameBtn = document.getElementById('end-game');
    
    // 游戏结束
    this.gameOver = document.getElementById('game-over');
    this.finalScoreList = document.getElementById('final-score-list');
    this.winnerMessage = document.getElementById('winner-message');
    this.playAgainBtn = document.getElementById('play-again');
  }

  bindEvents() {
    // 模式选择事件
    this.singlePlayerBtn.addEventListener('click', () => this.setGameMode('single'));
    this.dualPlayerBtn.addEventListener('click', () => this.setGameMode('dual'));
    
    // 开始游戏事件
    this.startGameBtn.addEventListener('click', () => this.startGame());
    
    // 游戏控制事件
    this.submitDescriptionBtn.addEventListener('click', () => this.handleSubmitDescription());
    this.skipRoundBtn.addEventListener('click', () => this.handleSkipRound());
    this.endGameBtn.addEventListener('click', () => this.endGame());
    
    // 再来一局事件
    this.playAgainBtn.addEventListener('click', () => this.resetGame());
    
    // 回车提交描述
    this.descriptionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSubmitDescription();
      }
    });
  }

  loadWords() {
    // 在实际应用中，这里会从服务器加载词汇
    // 现在我们使用一个简单的中文词库
    this.words = {
      common: [
        "苹果", "香蕉", "电脑", "书本", "房子", "汽车", "电话", "水", "太阳", "树",
        "狗", "猫", "鸟", "鱼", "花", "椅子", "桌子", "门", "窗户", "床",
        "钟表", "灯光", "音乐", "食物", "饮料", "衬衫", "裤子", "鞋子", "帽子", "包",
        "笔", "铅笔", "纸", "钱", "工作", "玩耍", "快乐", "悲伤", "大", "小"
      ],
      medium: [
        "望远镜", "显微镜", "实验室", "大学", "毕业证书", "护照", "假期", "冒险",
        "字典", "百科全书", "直升机", "潜水艇", "卫星", "宇航员", "火山", "地震",
        "蝴蝶", "大象", "长颈鹿", "鳄鱼", "袋鼠", "企鹅", "黑猩猩", "犀牛"
      ],
      hard: [
        "拟声词", "意外发现", "顿悟", "典型", "普遍存在", "短暂", "悦耳",
        "多音节", "窗前投掷", "高傲", "敏锐", "史前", "迷宫般",
        "不切实际", "透明", "合朔", "万能药", "矛盾修辞", "黄道带"
      ]
    };
    
    // 合并所有难度的词
    this.allWords = [...this.words.common, ...this.words.medium, ...this.words.hard];
  }

  setGameMode(mode) {
    this.gameState.gameMode = mode;
    
    if (mode === 'dual') {
      this.player2Input.classList.remove('hidden');
    } else {
      this.player2Input.classList.add('hidden');
    }
    
    this.modeSelection.classList.add('hidden');
    this.playerInput.classList.remove('hidden');
  }

  startGame() {
    const player1Name = this.player1Name.value.trim() || '玩家1';
    let player2Name = '';
    
    if (this.gameState.gameMode === 'dual') {
      player2Name = this.player2Name.value.trim() || '玩家2';
    }
    
    // 初始化玩家
    this.gameState.players = [player1Name];
    this.gameState.scores = {[player1Name]: 0};
    
    if (this.gameState.gameMode === 'dual') {
      this.gameState.players.push(player2Name);
      this.gameState.scores[player2Name] = 0;
    }
    
    // 更新UI标签
    this.player1ScoreLabel.textContent = `${player1Name}:`;
    if (this.gameState.gameMode === 'dual') {
      this.player2ScoreLabel.textContent = `${player2Name}:`;
    }
    
    this.gameState.isRunning = true;
    this.gameState.currentPlayerIndex = 0;
    
    // 隐藏输入界面，显示游戏界面
    this.playerInput.classList.add('hidden');
    this.gameInterface.classList.remove('hidden');
    
    // 开始游戏
    this.startNewRound();
    this.startTimers();
    
    this.addLogEntry('system', `游戏开始！模式: ${this.gameState.gameMode === 'single' ? '单人挑战' : '双人对抗'}`, true);
  }

  startNewRound() {
    if (!this.gameState.isRunning) return;

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    
    // 更新当前玩家显示
    this.currentPlayerNameEl.textContent = currentPlayer;
    
    // 生成随机词语
    this.gameState.currentWord = this.getRandomWord();
    this.currentWordEl.textContent = this.gameState.currentWord;
    
    // 重置本轮时间
    this.gameState.roundTimeLeft = this.gameState.roundTime;
    this.updateTimerDisplay();
    
    // 重置本轮描述历史
    this.gameState.roundDescriptions = [];
    
    // 清空描述输入框
    this.descriptionInput.value = '';
    
    this.addLogEntry('system', `轮到 ${currentPlayer}，词语是: ${this.gameState.currentWord}`, true);
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.allWords.length);
    return this.allWords[randomIndex];
  }

  async handleSubmitDescription() {
    const description = this.descriptionInput.value.trim();
    if (!description) {
      alert('请输入描述！');
      return;
    }

    if (!this.gameState.isRunning) {
      alert('游戏未开始！');
      return;
    }

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    
    // 添加描述到本轮描述历史
    this.gameState.roundDescriptions.push(description);
    
    // 添加玩家描述到日志
    this.addLogEntry('player', `${currentPlayer}: "${description}"`);
    
    // 检查是否作弊（这里只是模拟，实际需要调用后端API）
    if (this.isCheating(this.gameState.currentWord, description)) {
      this.addLogEntry('system', `检测到作弊！${currentPlayer} 直接说出了词语或其近义词。本轮跳过。`);
      this.nextRound();
      return;
    }

    // 模拟AI猜测（实际应该调用后端API）
    this.addLogEntry('system', 'AI正在思考...');
    
    try {
      // 调用后端AI接口
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: description,
          allDescriptions: this.gameState.roundDescriptions
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const aiGuess = data.guess;
        this.addLogEntry('ai', `AI猜测: ${aiGuess}`);
        
        // 检查AI是否猜对
        if (aiGuess === this.gameState.currentWord) {
          this.gameState.scores[currentPlayer]++;
          this.updateScoresDisplay();
          
          this.addLogEntry('system', `🎉 恭喜！AI猜对了！${currentPlayer} 得1分。`);
          
          // AI猜对了，进入下一轮
          setTimeout(() => {
            this.nextRound();
          }, 2000);
        } else {
          this.addLogEntry('system', `AI猜错了。还有 ${this.gameState.roundTimeLeft} 秒继续描述。`);
          
          // 清空输入框，等待下一次描述
          this.descriptionInput.value = '';
          this.descriptionInput.focus();
        }
      } else {
        throw new Error(data.error || 'AI猜测失败');
      }
    } catch (error) {
      console.error('AI猜测错误:', error);
      this.addLogEntry('system', `AI猜测出现错误: ${error.message}`);
      
      // 清空输入框，等待下一次描述
      this.descriptionInput.value = '';
      this.descriptionInput.focus();
    }
  }

  handleSkipRound() {
    if (!this.gameState.isRunning) {
      alert('游戏未开始！');
      return;
    }

    const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
    this.addLogEntry('system', `${currentPlayer} 选择了跳过本轮。正确答案是: ${this.gameState.currentWord}`);
    
    this.nextRound();
  }

  nextRound() {
    // 切换到下一个玩家
    if (this.gameState.gameMode === 'dual' && this.gameState.players.length > 1) {
      this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.gameState.players.length;
    }

    // 开始新回合
    setTimeout(() => {
      if (this.gameState.isRunning) {
        this.startNewRound();
      }
    }, 1000);
  }

  startTimers() {
    // 回合计时器
    this.gameState.roundInterval = setInterval(() => {
      this.gameState.roundTimeLeft--;
      this.updateTimerDisplay();
      
      if (this.gameState.roundTimeLeft <= 0) {
        this.addLogEntry('system', `⏰ 时间到！本轮结束，词语是: ${this.gameState.currentWord}`);
        this.nextRound();
      }
    }, 1000);
    
    // 总游戏计时器
    this.gameState.gameInterval = setInterval(() => {
      this.gameState.gameTimeLeft--;
      this.updateTimerDisplay();
      
      if (this.gameState.gameTimeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.roundTimerEl.textContent = this.gameState.roundTimeLeft;
    this.gameTimerEl.textContent = this.gameState.gameTimeLeft;
  }

  updateScoresDisplay() {
    const player1Name = this.gameState.players[0];
    this.player1Score.textContent = this.gameState.scores[player1Name] || 0;
    
    if (this.gameState.gameMode === 'dual' && this.gameState.players.length > 1) {
      const player2Name = this.gameState.players[1];
      this.player2Score.textContent = this.gameState.scores[player2Name] || 0;
    }
  }

  addLogEntry(type, message, scrollToBottom = false) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = message;
    this.logContainer.appendChild(entry);
    
    if (scrollToBottom) {
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
  }

  isCheating(originalWord, description) {
    // 简单的防作弊检测（实际应该调用后端API）
    const normalizedOriginal = this.normalizeText(originalWord);
    const normalizedDescription = this.normalizeText(description);
    
    // 检查是否直接包含原词
    if (normalizedDescription.includes(normalizedOriginal)) {
      return true;
    }
    
    // 这里可以添加更复杂的检测逻辑
    return false;
  }

  normalizeText(text) {
    return text.replace(/[^\u4e00-\u9fa5\w\s]/g, '').trim();
  }

  simulateAIGuess(description) {
    // 模拟AI猜测逻辑，基于描述中的关键词
    const keywords = description.replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
                               .split(/\s+/)
                               .filter(k => k.length > 0);
    
    // 简单的匹配逻辑，实际应该调用后端AI接口
    if (keywords.some(k => k.includes('水果'))) {
      return ['苹果', '香蕉'].sort(() => Math.random() - 0.5)[0];
    } else if (keywords.some(k => k.includes('计算') || k.includes('电脑'))) {
      return '电脑';
    } else if (keywords.some(k => k.includes('书') || k.includes('阅读'))) {
      return '书本';
    } else if (keywords.some(k => k.includes('住') || k.includes('家'))) {
      return '房子';
    } else if (keywords.some(k => k.includes('交通工具') || k.includes('轮子'))) {
      return '汽车';
    } else if (keywords.some(k => k.includes('通讯') || k.includes('打电话'))) {
      return '电话';
    } else if (keywords.some(k => k.includes('液体') || k.includes('喝'))) {
      return '水';
    } else if (keywords.some(k => k.includes('发光') || k.includes('天空'))) {
      return '太阳';
    } else if (keywords.some(k => k.includes('植物') || k.includes('绿色'))) {
      return '树';
    } else if (keywords.some(k => k.includes('宠物') || k.includes('汪'))) {
      return '狗';
    } else if (keywords.some(k => k.includes('喵') || k.includes('抓'))) {
      return '猫';
    }
    
    // 随机返回一个词
    return this.allWords[Math.floor(Math.random() * 20)]; // 前20个常用词
  }

  endGame() {
    this.gameState.isRunning = false;
    
    // 清除定时器
    if (this.gameState.roundInterval) {
      clearInterval(this.gameState.roundInterval);
    }
    if (this.gameState.gameInterval) {
      clearInterval(this.gameState.gameInterval);
    }
    
    // 显示最终得分
    this.showFinalScores();
    
    // 隐藏游戏界面，显示结束界面
    this.gameInterface.classList.add('hidden');
    this.gameOver.classList.remove('hidden');
  }

  showFinalScores() {
    // 清空之前的分数显示
    this.finalScoreList.innerHTML = '';
    
    // 显示每个玩家的分数
    for (const [player, score] of Object.entries(this.gameState.scores)) {
      const scoreItem = document.createElement('div');
      scoreItem.className = 'final-score-item';
      scoreItem.innerHTML = `
        <span>${player}</span>
        <span>${score} 分</span>
      `;
      this.finalScoreList.appendChild(scoreItem);
    }
    
    // 找出获胜者
    let winner = '';
    let highestScore = -1;
    for (const [player, score] of Object.entries(this.gameState.scores)) {
      if (score > highestScore) {
        highestScore = score;
        winner = player;
      }
    }
    
    if (winner) {
      this.winnerMessage.innerHTML = `🏆 获胜者: <strong>${winner}</strong> (${highestScore} 分)`;
    } else {
      this.winnerMessage.textContent = '比分持平！';
    }
  }

  resetGame() {
    // 清除定时器
    if (this.gameState.roundInterval) {
      clearInterval(this.gameState.roundInterval);
    }
    if (this.gameState.gameInterval) {
      clearInterval(this.gameState.gameInterval);
    }
    
    // 重置游戏状态
    this.gameState = {
      isRunning: false,
      players: [],
      currentPlayerIndex: 0,
      currentWord: '',
      scores: {},
      gameMode: 'single',
      roundTime: 30,
      totalTime: 300,
      roundTimeLeft: 30,
      gameTimeLeft: 300,
      roundInterval: null,
      gameInterval: null
    };
    
    // 重置UI
    this.gameOver.classList.add('hidden');
    this.modeSelection.classList.remove('hidden');
    
    // 清空输入
    this.player1Name.value = '';
    this.player2Name.value = '';
    this.player2Input.classList.add('hidden');
    
    // 清空日志
    this.logContainer.innerHTML = '';
    
    // 重置显示
    this.currentWordEl.textContent = '[词语]';
    this.currentPlayerNameEl.textContent = '-';
    this.player1Score.textContent = '0';
    this.player2Score.textContent = '0';
    this.roundTimerEl.textContent = '30';
    this.gameTimerEl.textContent = '300';
  }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  new ChineseGuessWordGame();
});