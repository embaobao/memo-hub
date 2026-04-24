# MemoHub v1 - CLI 命令集成指南

> **🎯 适用对象**: 所有需要通过命令行使用 MemoHub 的用户
> **⚡ 集成难度**: ⭐ (非常简单)
> **🔧 功能完整度**: ⭐⭐⭐⭐ (90%)

---

## 📋 目录

- [快速开始](#快速开始)
- [全局安装](#全局安装)
- [命令参考](#命令参考)
- [使用示例](#使用示例)
- [脚本集成](#脚本集成)
- [故障排除](#故障排除)

---

## 🚀 快速开始

### 方式 1: npm link (推荐)

```bash
# 1. 进入项目目录
cd /path/to/memo-hub

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 全局安装 CLI
cd apps/cli
npm link --force

# 5. 验证安装
memohub --version
```

**预期输出**:
```
3.0.0
```

如果看到版本号，说明 CLI 安装成功！

---

### 方式 2: npm pack

```bash
# 1. 构建项目
cd /path/to/memo-hub
bun run build

# 2. 打包
cd apps/cli
npm pack

# 3. 全局安装
npm install -g memohub-cli-3.0.0.tgz

# 4. 验证安装
memohub --version
```

---

### 方式 3: 直接运行（不推荐）

```bash
# 使用 bun 运行
cd /path/to/memo-hub
bun run --filter @memohub/cli start -- add "知识内容"

# 或使用 node 运行
node /path/to/memo-hub/apps/cli/dist/index.js add "知识内容"
```

**注意**: 这种方式需要每次都指定完整路径，不推荐使用。

---

## 📦 全局安装

### 完整安装步骤

```bash
# 1. 克隆或下载项目
cd /path/to/memo-hub

# 2. 安装依赖
bun install

# 3. 构建项目
bun run build

# 4. 进入 CLI 目录
cd apps/cli

# 5. 全局链接
npm link --force

# 6. 验证安装
memohub --version
```

### 验证安装

```bash
# 检查版本
memohub --version

# 查看帮助
memohub --help

# 查看配置
memohub config
```

### 查看 CLI 路径

```bash
# 查看 CLI 安装位置
which memohub

# 或
where memohub
```

**示例输出**:
```bash
# macOS/Linux
/usr/local/bin/memohub

# Windows
C:\Users\your-username\AppData\Roaming\npm\memohub.cmd
```

---

## 📖 命令参考

### 知识管理命令

#### 1. add - 添加知识

```bash
memohub add <text> [options]
```

**参数**:
- `text` - 知识内容 (必填)

**选项**:
- `-c, --category <category>` - 分类 (默认: "other")
- `-i, --importance <importance>` - 重要性 0-1 (默认: 0.5)
- `-t, --tags <tags>` - 标签，逗号分隔 (例如: "tag1,tag2")

**示例**:
```bash
# 添加简单知识
memohub add "用户喜欢 TypeScript"

# 添加带分类和标签的知识
memohub add "用户注重代码质量" -c user -i 0.8 -t "preference,quality"

# 添加项目信息
memohub add "这是一个 React 项目" -c project -t "frontend,react"
```

---

#### 2. search - 搜索知识

```bash
memohub search <query> [options]
```

**参数**:
- `query` - 查询内容 (必填)

**选项**:
- `-l, --limit <limit>` - 返回数量 (默认: 5)

**示例**:
```bash
# 搜索知识
memohub search "TypeScript 偏好"

# 搜索并返回更多结果
memohub search "开发习惯" -l 10
```

---

#### 3. list - 列出分类

```bash
memohub list
```

**示例**:
```bash
# 列出所有分类和数量
memohub list
```

**输出**:
```
✔ Categories:
  uncategorized: 5
  user: 3
  project: 2
  Total: 10
```

---

#### 4. delete - 删除知识

```bash
memohub delete [options]
```

**选项**:
- `--ids <ids>` - ID 列表，逗号分隔
- `--category <category>` - 按分类删除

**示例**:
```bash
# 删除指定 ID
memohub delete --ids "insight-1713990000-abc123,insight-1713990001-def456"

# 删除整个分类
memohub delete --category "user"
```

---

### 代码管理命令

#### 5. add-code - 添加代码

```bash
memohub add-code <file> [options]
```

**参数**:
- `file` - 文件路径 (必填)

**选项**:
- `-l, --language <language>` - 编程语言 (默认: "typescript")

**示例**:
```bash
# 添加 TypeScript 文件
memohub add-code ./src/utils.ts

# 添加 Python 文件
memohub add-code ./script.py -l python

# 添加 JavaScript 文件
memohub add-code ./index.js -l javascript
```

---

#### 6. search-code - 搜索代码

```bash
memohub search-code <query> [options]
```

**参数**:
- `query` - 查询内容 (必填)

**选项**:
- `-l, --limit <limit>` - 返回数量 (默认: 5)

**示例**:
```bash
# 搜索代码
memohub search-code "fetch function"

# 搜索并返回更多结果
memohub search-code "react hook" -l 10
```

---

### 高级命令

#### 7. search-all - 统一检索

```bash
memohub search-all <query> [options]
```

**参数**:
- `query` - 查询内容 (必填)

**选项**:
- `-l, --limit <limit>` - 返回数量 (默认: 10)
- `--lexical` - 启用词法通道 (默认: false)
- `--entity-expansion` - 启用实体扩展 (默认: true)

**示例**:
```bash
# 统一检索
memohub search-all "用户认证"

# 启用词法通道
memohub search-all "数据库配置" --lexical

# 返回更多结果
memohub search-all "API 调用" -l 20
```

---

#### 8. dedup - 去重扫描

```bash
memohub dedup [options]
```

**选项**:
- `--track <trackId>` - 轨道 ID (默认: "track-insight")
- `--threshold <threshold>` - 相似度阈值 (默认: "0.95")

**示例**:
```bash
# 扫描知识轨道
memohub dedup --track track-insight

# 扫描代码轨道
memohub dedup --track track-source

# 调整阈值
memohub dedup --threshold 0.90
```

---

#### 9. distill - 知识蒸馏

```bash
memohub distill [options]
```

**选项**:
- `--track <trackId>` - 轨道 ID (默认: "track-insight")

**示例**:
```bash
# 蒸馏知识轨道
memohub distill --track track-insight

# 蒸馏代码轨道
memohub distill --track track-source
```

---

### 配置命令

#### 10. config - 配置管理

```bash
memohub config [options]
```

**选项**:
- `--validate` - 验证配置

**示例**:
```bash
# 显示配置
memohub config

# 验证配置
memohub config --validate
```

---

### 服务命令

#### 11. serve - 启动 MCP Server

```bash
memohub serve
```

**示例**:
```bash
# 启动 MCP Server
memohub serve
```

**注意**: 此命令用于 MCP 协议集成，详见 [MCP 集成指南](./mcp-integration.md)

---

## 💡 使用示例

### 场景 1: 记住用户偏好

```bash
# 记住用户偏好
memohub add "用户喜欢 TypeScript 进行开发" -c user -i 0.9 -t "preference,typescript"

# 查询用户偏好
memohub search "TypeScript 偏好"
```

---

### 场景 2: 管理项目信息

```bash
# 添加项目信息
memohub add "这是一个基于 React 的前端项目" -c project -t "frontend,react"

# 添加技术栈
memohub add "使用 TypeScript + Vite + TailwindCSS" -c project -t "techstack"

# 查询项目信息
memohub search "项目技术栈"
```

---

### 场景 3: 管理代码片段

```bash
# 添加代码文件
memohub add-code ./src/hooks/useFetch.ts -l typescript

# 搜索代码
memohub search-code "fetch hook"
```

---

### 场景 4: 统一检索

```bash
# 同时搜索知识和代码
memohub search-all "用户认证"

# 查看检索结果，包括知识和代码
```

---

## 🔧 脚本集成

### Shell 脚本

```bash
#!/bin/bash
# remember-user-preference.sh

# 记住用户偏好
memohub add "$1" -c user -i 0.8 -t "preference"

echo "已记住用户偏好: $1"
```

**使用**:
```bash
chmod +x remember-user-preference.sh
./remember-user-preference.sh "用户喜欢深色主题"
```

---

### Node.js 脚本

```javascript
// remember.js
const { execSync } = require('child_process');

function remember(text, options = {}) {
  const category = options.category || 'other';
  const tags = options.tags ? options.tags.join(',') : '';
  const importance = options.importance || 0.5;

  const cmd = `memohub add "${text}" -c ${category} -i ${importance} -t "${tags}"`;
  execSync(cmd, { stdio: 'inherit' });
}

// 使用
remember('用户喜欢使用 VS Code', {
  category: 'user',
  importance: 0.9,
  tags: ['preference', 'editor']
});
```

---

### Python 脚本

```python
# remember.py
import subprocess

def remember(text, category='other', importance=0.5, tags=None):
    cmd = ['memohub', 'add', text, '-c', category, '-i', str(importance)]
    if tags:
        cmd.extend(['-t', ','.join(tags)])
    subprocess.run(cmd)

# 使用
remember('用户喜欢 Python 编程',
         category='user',
         importance=0.8,
         tags=['preference', 'python'])
```

---

## 🔍 故障排除

### 问题 1: 命令未找到

**症状**: `memohub: command not found`

**解决方案**:

1. **检查安装**
   ```bash
   npm list -g @memohub/cli
   ```

2. **重新安装**
   ```bash
   cd /path/to/memo-hub/apps/cli
   npm link --force
   ```

3. **检查 PATH**
   ```bash
   echo $PATH | grep -o "[^:]*npm"
   ```

---

### 问题 2: 添加知识失败

**症状**: `Error: Cannot connect to Ollama`

**解决方案**:

1. **检查 Ollama 是否运行**
   ```bash
   ollama list
   ```

2. **启动 Ollama**
   ```bash
   ollama serve
   ```

3. **检查配置**
   ```bash
   memohub config
   ```

---

### 问题 3: 搜索结果为空

**症状**: 搜索返回 "No results found"

**解决方案**:

1. **检查是否有数据**
   ```bash
   memohub list
   ```

2. **调整查询文本**
   - 使用更相关的查询
   - 尝试不同的关键词

3. **增加返回数量**
   ```bash
   memohub search "查询" -l 10
   ```

---

## 🎯 最佳实践

### 1. 分类规范

```bash
# 用户偏好
memohub add "..." -c user -t "preference,..."

# 项目信息
memohub add "..." -c project -t "config,..."

# 环境信息
memohub add "..." -c environment -t "system,..."

# 代码片段
memohub add "..." -c code -t "snippet,..."
```

---

### 2. 批量添加

```bash
# 使用循环批量添加
for item in "item1" "item2" "item3"; do
  memohub add "$item" -c batch -t "import"
done
```

---

### 3. 定期维护

```bash
# 定期去重
memohub dedup

# 定期蒸馏
memohub distill

# 查看统计
memohub list
```

---

## 📚 相关文档

- [集成指南首页](./index.md) - 所有集成方式
- [MCP 协议集成](./mcp-integration.md) - MCP 协议集成
- [配置指南](../guides/configuration.md) - 详细配置
- [快速开始](../guides/quickstart.md) - 5 分钟上手

---

**版本**: 3.0.0
**最后更新**: 2026-04-24
**集成难度**: ⭐ (非常简单)
**功能完整度**: ⭐⭐⭐⭐ (90%)
