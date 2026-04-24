# 🚀 MemoHub CLI 安装 - npm 发布包方式

## ✅ 打包测试成功！

刚才已经成功打包：
```
memohub-cli-3.0.0.tgz
package size: 11.9 kB
```

---

## 📦 推荐安装方式

### 方式 1: npm link（开发模式，推荐）

**最适合开发场景**：

```bash
cd /Users/embaobao/workspace/ai/memo-hub
bun run build

cd apps/cli
npm link --global
```

**优点**：
- ✅ 开发时自动更新
- ✅ 无需重新安装
- ✅ 本地更改立即生效

---

### 方式 2: npm install（从打包文件）

**适合分发特定版本**：

```bash
cd apps/cli
npm pack

# 全局安装打包文件
npm install -g memohub-cli-3.0.0.tgz
```

**优点**：
- ✅ 版本固定
- ✅ 离线可用
- ✅ 适合团队内部分发

---

### 方式 3: 发布到 npm（公开）

**适合公开发布**：

```bash
# 1. 登录 npm
npm login

# 2. 发布
cd apps/cli
npm publish --access public
```

然后用户可以安装：
```bash
npm install -g @memohub/cli
```

---

## 🧪 测试安装

### 安装后验证

```bash
# 检查版本
memohub --version

# 查看帮助
memohub --help

# 测试命令
memohub list
```

---

## 🔧 卸载/更新

### 卸载

```bash
npm unlink -g @memohub/cli
# 或
npm uninstall -g @memohub/cli
```

### 更新

```bash
# 开发模式：重新链接
cd apps/cli
bun run build
npm link --global

# 打包模式：重新安装
bun run build
cd apps/cli
npm pack
npm install -g memohub-cli-3.0.0.tgz
```

---

## 📋 完整示例

### 开发者安装

```bash
# 1. 进入项目目录
cd /Users/embaobao/workspace/ai/memo-hub

# 2. 构建项目
bun run build

# 3. 全局链接
cd apps/cli
npm link --global

# 4. 验证
memohub --version
# 输出: 3.0.0
```

### 用户安装

```bash
# 方式 1: 从 npm 安装（如果已发布）
npm install -g @memohub/cli

# 方式 2: 从本地打包文件
# 获取 memohub-cli-3.0.0.tgz 后运行：
npm install -g memohub-cli-3.0.0.tgz
```

---

## ⚠️ 注意事项

### npm link 的问题

**权限问题**：
```bash
# 如果遇到权限问题
sudo npm link --global

# 或使用 bun（推荐）
bun link --global
```

**路径问题**：
```bash
# 确保 npm 全局 bin 目录在 PATH 中
echo $PATH | grep -o '/[^:]*npm[^:]*bin'

# 查看链接位置
which memohub
```

### bun vs npm

**推荐使用 bun**：
```bash
# 更快
bun link --global

# 安装
bun install -g @memub/cli
```

---

## 📊 对比

| 方式 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **npm link** | 开发 | 自动更新 | 需要源码 |
| **npm install (本地)** | 团队分发 | 版本固定 | 需要打包文件 |
| **npm install (npm)** | 公开发布 | 最简单 | 需要发布 |

---

## 🎉 总结

✅ **打包成功**：已生成 memohub-cli-3.0.0.tgz

**推荐安装方式**：
1. 开发者：`npm link --global`（自动更新）
2. 用户：`npm install -g @memohub/cli`
3. 团队：`npm install -g memohub-cli-3.0.0.tgz`

---

**版本**: 3.0.0  
**状态**: ✅ 可安装  
**最后更新**: 2026-04-24
