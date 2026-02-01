require('dotenv').config();
const express = require('express');
const path = require('path');
const ChineseAIInterface = require('./src/ai-interface');
const ChineseCheatDetector = require('./src/cheat-detector');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 初始化AI和防作弊检测器
const aiInterface = new ChineseAIInterface();
const cheatDetector = new ChineseCheatDetector();

// 存储每轮的描述历史
const roundDescriptions = new Map(); // 使用Map存储每轮的描述历史

// 加载词汇库
const wordsData = require('./src/words.json');
const allWords = [...wordsData.common, ...wordsData.medium, ...wordsData.hard];

// API路由
// 获取随机词
app.get('/api/random-word', (req, res) => {
  const randomIndex = Math.floor(Math.random() * allWords.length);
  const word = allWords[randomIndex];
  res.json({ word });
});

// AI猜测
app.post('/api/guess', async (req, res) => {
  const { description, allDescriptions } = req.body;

  if (!description) {
    return res.status(400).json({ error: '描述不能为空' });
  }

  try {
    // 使用AI接口进行猜测，传入所有描述
    const guess = await aiInterface.guessWord(description, allDescriptions);
    res.json({ guess });
  } catch (error) {
    console.error('AI猜测错误:', error);
    res.status(500).json({ error: 'AI猜测失败' });
  }
});

// 检查是否作弊
app.post('/api/check-cheat', (req, res) => {
  const { originalWord, description } = req.body;

  if (!originalWord || !description) {
    return res.status(400).json({ error: '词语和描述不能为空' });
  }

  try {
    const isCheat = cheatDetector.detect(originalWord, description);
    res.json({ isCheat });
  } catch (error) {
    console.error('作弊检测错误:', error);
    res.status(500).json({ error: '作弊检测失败' });
  }
});

// 获取词汇库
app.get('/api/words', (req, res) => {
  res.json(wordsData);
});

// 主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = '127.0.0.1';

  // 查找非内部IPv4地址
  for (const interfaceName in interfaces) {
    const interface = interfaces[interfaceName];
    for (const config of interface) {
      if (!config.internal && config.family === 'IPv4') {
        localIP = config.address;
        break;
      }
    }
    if (localIP !== '127.0.0.1') break;
  }

  console.log(`🚀 AI猜词游戏服务器运行在 http://localhost:${PORT}`);
  console.log('🌐 局域网访问地址: http://' + localIP + ':' + PORT);
  console.log('按 Ctrl+C 停止服务器');
});

module.exports = app;