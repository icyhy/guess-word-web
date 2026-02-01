require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const ChineseAIInterface = require('./src/ai-interface');
const ChineseCheatDetector = require('./src/cheat-detector');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化AI和防作弊检测器
const aiInterface = new ChineseAIInterface();
const cheatDetector = new ChineseCheatDetector();

// 加载词汇库
const wordsData = require('./src/words.json');
const allWords = [...wordsData.common, ...wordsData.medium, ...wordsData.hard];

// 房间状态管理
const rooms = new Map(); // roomId -> roomState

// API路由
app.get('/api/random-word', (req, res) => {
  const randomIndex = Math.floor(Math.random() * allWords.length);
  const word = allWords[randomIndex];
  res.json({ word });
});

app.post('/api/guess', async (req, res) => {
  const { description, allDescriptions } = req.body;
  if (!description) return res.status(400).json({ error: '描述不能为空' });
  try {
    const guess = await aiInterface.guessWord(description, allDescriptions);
    res.json({ guess });
  } catch (error) {
    console.error('AI猜测错误:', error);
    res.status(500).json({ error: 'AI猜测失败' });
  }
});

// Socket.io 逻辑
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 创建房间
  socket.on('create-room', (playerName) => {
    // 生成4位随机数字
    let roomId = Math.floor(1000 + Math.random() * 9000).toString();
    while (rooms.has(roomId)) {
      roomId = Math.floor(1000 + Math.random() * 9000).toString();
    }

    // 创建者默认先加入，名字可能为空，稍后更新
    const roomState = {
      id: roomId,
      players: [{ id: socket.id, name: playerName || '', ready: false, score: 0, currentIndex: 0, finished: false, time: null }],
      words: [],
      status: 'waiting',
      startTime: null
    };
    rooms.set(roomId, roomState);
    socket.join(roomId);
    socket.emit('room-created', { roomId, players: roomState.players });
    console.log(`房间已创建: ${roomId} (Socket: ${socket.id})`);
  });

  // 加入房间
  socket.on('join-room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('error-msg', '房间不存在');

    // 检查是否已经在房间里 (这种情况通常是创建者在更新名字)
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      existingPlayer.name = playerName;
      // 广播更新
      io.to(roomId).emit('player-joined', { players: room.players });
      return;
    }

    // 新玩家加入检查
    if (room.players.length >= 2) return socket.emit('error-msg', '房间已满');
    if (room.status !== 'waiting') return socket.emit('error-msg', '游戏已开始');

    const newPlayer = { id: socket.id, name: playerName, ready: false, score: 0, currentIndex: 0, finished: false, time: null };
    room.players.push(newPlayer);
    socket.join(roomId);

    io.to(roomId).emit('player-joined', { players: room.players });
    console.log(`用户加入房间: ${roomId} (加入者: ${playerName})`);
  });

  // 玩家准备
  socket.on('player-ready', (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) player.ready = true;

    io.to(roomId).emit('ready-update', { players: room.players });

    // 检查是否都准备好了
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      room.status = 'countdown';
      // 生成包含10个词的词包
      room.words = [...allWords].sort(() => Math.random() - 0.5).slice(0, 10);
      io.to(roomId).emit('start-countdown', { words: room.words });
    }
  });

  // 开始游戏 (倒计时结束)
  socket.on('start-game-dual', (roomId) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'countdown') return;
    room.status = 'playing';
    room.startTime = Date.now();
    io.to(roomId).emit('game-started');
  });

  // 同步进度
  socket.on('update-progress', ({ roomId, score, currentIndex, wordFinished }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.score = score;
      player.currentIndex = currentIndex;
      if (wordFinished) {
        player.finished = true;
        player.time = Math.floor((Date.now() - room.startTime) / 1000);
      }
    }

    // 广播进度给对手
    socket.to(roomId).emit('opponent-progress', {
      score: player.score,
      currentIndex: player.currentIndex,
      finished: player.finished
    });

    // 检查游戏是否结束
    if (room.players.every(p => p.finished)) {
      room.status = 'finished';
      io.to(roomId).emit('dual-game-over', { results: room.players });
    }
  });

  socket.on('disconnect', () => {
    // 处理退出
    rooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        if (room.players.length === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('player-left', { players: room.players });
          room.status = 'waiting'; // 重置
        }
      }
    });
    console.log('用户断开连接:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AI猜词游戏服务器运行在 http://localhost:${PORT}`);
});