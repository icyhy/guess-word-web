#!/bin/bash
# AI猜词游戏启动脚本
# 请先设置环境变量: export DEEPSEEK_API_KEY="your-api-key-here"

cd /Volumes/doc/home/Documents/2026/guess-word-web

if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "警告: DEEPSEEK_API_KEY 环境变量未设置，AI将使用备用逻辑"
    echo "要设置API密钥，请运行: export DEEPSEEK_API_KEY='your-api-key-here'"
fi

echo "启动AI猜词游戏服务器..."
node server.js