#!/bin/bash
# 快速启动脚本

cd "$(dirname "$0")"

# 检查配置文件
if [ ! -f "config/config.yaml" ]; then
  echo "配置文件不存在，从示例文件创建..."
  mkdir -p config
  cp config/config.example.yaml config/config.yaml
  echo "配置文件已创建: config/config.yaml"
  echo "请根据需要修改配置文件"
fi

# 运行命令
bun run dist/cli/index.js "$@"
