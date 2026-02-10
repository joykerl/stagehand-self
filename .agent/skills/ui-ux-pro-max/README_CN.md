# UI/UX Pro Max - 专业 UI/UX 设计智能技能

一个为 AI 编码助手提供设计智能的技能,支持跨多个平台和框架构建专业的 UI/UX。

## 概述

UI/UX Pro Max 是一个综合性的设计指南技能,包含:
- **67 种 UI 风格** - Glassmorphism、Claymorphism、极简主义、野兽派、新拟态、Bento Grid、深色模式、AI 原生 UI 等
- **96 种调色板** - 针对 SaaS、电商、医疗、金融科技、美容等行业的专用配色方案
- **57 种字体组合** - 精选的排版组合,包含 Google Fonts 导入
- **25 种图表类型** - 仪表板和数据分析的推荐图表
- **13 种技术栈** - React、Next.js、Astro、Vue、Nuxt.js、Svelte、SwiftUI、React Native、Flutter、HTML+Tailwind、shadcn/ui、Jetpack Compose
- **99 条 UX 指南** - 最佳实践、反模式和无障碍规则
- **100 条推理规则** - 行业特定的设计系统生成(v2.0 新增)

## v2.0 新功能

### 智能设计系统生成

v2.0 的旗舰功能是**设计系统生成器** - 一个由 AI 驱动的推理引擎,可以分析您的项目需求并在几秒钟内生成完整的、定制化的设计系统。

**生成的设计系统包括:**
- **模式推荐** - 页面结构、转化策略、CTA 位置
- **风格选择** - 基于产品类型和行业的最佳 UI 风格
- **配色方案** - 主色、辅助色、CTA 色、背景色、文本色
- **排版系统** - 字体组合、Google Fonts 链接
- **关键效果** - 阴影、过渡、悬停状态
- **反模式警告** - 需要避免的设计错误
- **交付前检查清单** - 确保专业质量的验证项

## 安装说明

### 前提条件

需要 Python 3.x 来运行搜索脚本:

```bash
# 检查 Python 是否已安装
python3 --version

# macOS 安装
brew install python3

# Ubuntu/Debian 安装
sudo apt update && sudo apt install python3

# Windows 安装
winget install Python.Python.3.12
```

### 安装方法

#### 方法 1: 使用 CLI(推荐)

```bash
# 全局安装 CLI
npm install -g uipro-cli

# 进入您的项目目录
cd /path/to/your/project

# 为 Antigravity 安装
uipro init --ai antigravity
```

**其他支持的平台:**
```bash
uipro init --ai claude      # Claude Code
uipro init --ai cursor      # Cursor
uipro init --ai windsurf    # Windsurf
uipro init --ai copilot     # GitHub Copilot
uipro init --ai codex       # Codex CLI
uipro init --ai all         # 所有平台
```

#### 方法 2: Claude Marketplace(仅限 Claude Code)

```bash
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

### 验证安装

检查 `.agent/skills/ui-ux-pro-max` 目录是否存在,应包含:
- `SKILL.md` - 技能主文件
- `data/` - 设计数据库(风格、颜色、字体等)
- `scripts/` - Python 搜索脚本

## 在 Google Antigravity 中使用

### 🎯 自动激活模式

ui-ux-pro-max 在 Antigravity 中采用**自动激活**模式,这意味着您**不需要手动调用**技能。只需自然地提出 UI/UX 相关的请求,技能就会自动激活。

#### 触发关键词

当您的请求包含以下关键词时,技能会自动激活:
- **动作词**: 设计、构建、创建、制作、实施、开发、改进、修复、审查
- **UI/UX 词**: UI、UX、界面、落地页、仪表板、网站、应用、页面
- **设计词**: 风格、颜色、字体、布局、主题

#### 使用示例

直接提出请求即可:

```
✅ "为我的 SaaS 产品构建一个落地页"
✅ "创建一个医疗分析仪表板"
✅ "设计一个深色模式的作品集网站"
✅ "制作一个电商产品页面"
✅ "为金融科技应用设计 UI"
```

### 🔄 自动工作流程

当您提出 UI/UX 请求时,AI 代理会自动:

1. **激活技能** - 读取 `.agent/skills/ui-ux-pro-max/SKILL.md` 文件
2. **分析需求** - 提取产品类型、风格、行业、技术栈
3. **生成设计系统** - 运行 Python 搜索脚本获取完整设计系统
4. **实施设计** - 基于设计系统生成代码

### 💡 实际使用示例

#### 示例 1: 简单请求

**您说:**
```
为我的在线教育平台做一个落地页
```

**AI 会做:**
1. 自动激活 ui-ux-pro-max 技能
2. 分析: 产品类型=教育 SaaS, 风格=专业友好
3. 生成设计系统(教育行业配色、清晰排版)
4. 实施代码(HTML + Tailwind)

#### 示例 2: 详细请求

**您说:**
```
为我的美容水疗服务创建一个优雅的落地页,使用柔和的颜色和高端的感觉
```

**AI 会做:**
1. 提取关键词: beauty, spa, elegant, soft colors, premium
2. 运行: `search.py "beauty spa wellness elegant premium" --design-system`
3. 获得推荐:
   - 风格: Soft UI Evolution
   - 颜色: 柔和粉色 + 鼠尾草绿 + 金色
   - 字体: Cormorant Garamond / Montserrat
4. 生成优雅的落地页代码

#### 示例 3: 指定技术栈

**您说:**
```
用 React 和 Next.js 构建一个金融科技仪表板
```

**AI 会做:**
1. 识别技术栈: Next.js
2. 生成金融科技设计系统
3. 应用 Next.js 最佳实践
4. 生成 React 组件代码

### 🎨 设计系统示例输出

当技能运行时,您会看到类似这样的设计系统:

```
+------------------------------------------------------------------------------+
| TARGET: 美容水疗服务 - 推荐设计系统                                           |
+------------------------------------------------------------------------------+
| 
| 模式: Hero-Centric + Social Proof
| 转化策略: 情感驱动 + 信任元素
| 
| 风格: Soft UI Evolution
| 关键词: 柔和阴影、微妙深度、平静、高端感、有机形状
| 
| 配色方案:
| 主色: #E8B4B8 (柔和粉色)
| 辅助色: #A8D5BA (鼠尾草绿)
| CTA: #D4AF37 (金色)
| 背景: #FFF5F5 (温暖白)
| 文本: #2D3436 (炭黑)
| 
| 排版: Cormorant Garamond / Montserrat
| 风格: 优雅、平静、精致
| 
| 关键效果:
| - 柔和阴影
| - 平滑过渡 (200-300ms)
| - 温和的悬停状态
| 
| 避免(反模式):
| - 明亮霓虹色
| - 强烈动画
| - 深色模式
| - AI 紫色/粉色渐变
| 
+------------------------------------------------------------------------------+
```

### 🚀 高级用法

#### 持久化设计系统

如果您想保存设计系统供后续使用:

**您说:**
```
为我的项目生成设计系统并保存,项目名称是 "TaskFlow"
```

**AI 会运行:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "saas productivity" --design-system --persist -p "TaskFlow"
```

这会创建:
- `design-system/MASTER.md` - 全局设计规则
- `design-system/pages/` - 页面特定覆盖

#### 页面特定设计

**您说:**
```
为 TaskFlow 的仪表板页面创建特定设计
```

**AI 会运行:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "dashboard analytics" --design-system --persist -p "TaskFlow" --page "dashboard"
```

### 📋 无需记忆命令

**重要**: 您**不需要记住**任何 Python 命令或技术细节!

只需要:
1. ✅ 用自然语言描述您想要的 UI/UX
2. ✅ AI 会自动激活技能
3. ✅ AI 会运行所有必要的命令
4. ✅ AI 会生成完整的代码

### ✨ 获得更好结果的技巧

1. **具体描述产品类型**
   - ✅ "医疗 SaaS 仪表板"
   - ❌ "一个应用"

2. **提及风格偏好**
   - ✅ "极简、专业、深色模式"
   - ✅ "优雅、奢华、柔和色调"

3. **说明行业**
   - ✅ "金融科技"、"电商"、"教育"

4. **指定技术栈(可选)**
   - ✅ "用 React"、"用 Next.js"
   - 如不指定,默认使用 HTML + Tailwind

### 🎯 Antigravity 使用总结

✅ **无需手动调用** - 自动激活  
✅ **自然对话** - 直接说出需求  
✅ **智能推荐** - 基于行业和产品类型  
✅ **完整设计系统** - 颜色、字体、风格、布局  
✅ **即刻可用** - 现在就可以开始使用

---

## 使用方法(其他平台)

### 技能模式(自动激活)

**支持平台:** Claude Code、Windsurf、Antigravity、Codex CLI、Continue、Gemini CLI、OpenCode、Qoder、CodeBuddy

技能会在您请求 UI/UX 工作时自动激活。只需自然对话:

```
为我的 SaaS 产品构建一个落地页
```

### 工作流模式(斜杠命令)

**支持平台:** Cursor、Kiro、GitHub Copilot、Roo Code

使用斜杠命令调用技能:

```
/ui-ux-pro-max 为我的 SaaS 产品构建一个落地页
```

## 工作流程

当您请求 UI/UX 工作时,技能会遵循以下流程:

### 步骤 1: 分析需求

从您的请求中提取关键信息:
- **产品类型**: SaaS、电商、作品集、仪表板、落地页等
- **风格关键词**: 极简、有趣、专业、优雅、深色模式等
- **行业**: 医疗、金融科技、游戏、教育等
- **技术栈**: React、Vue、Next.js 或默认 `html-tailwind`

### 步骤 2: 生成设计系统(必需)

**始终使用 `--design-system` 标志**获取带推理的综合推荐:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<产品类型> <行业> <关键词>" --design-system [-p "项目名称"]
```

**示例:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "美容 spa 养生 服务" --design-system -p "宁静水疗"
```

此命令会:
1. 并行搜索 5 个领域(产品、风格、颜色、落地页、排版)
2. 应用 `ui-reasoning.csv` 中的推理规则选择最佳匹配
3. 返回完整的设计系统:模式、风格、颜色、排版、效果
4. 包含需要避免的反模式

### 步骤 2b: 持久化设计系统(主文件 + 覆盖模式)

要保存设计系统以便跨会话分层检索,添加 `--persist`:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<查询>" --design-system --persist -p "项目名称"
```

这会创建:
- `design-system/MASTER.md` - 全局真实来源,包含所有设计规则
- `design-system/pages/` - 页面特定覆盖的文件夹

**带页面特定覆盖:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<查询>" --design-system --persist -p "项目名称" --page "dashboard"
```

这还会创建:
- `design-system/pages/dashboard.md` - 页面特定的主文件偏差

**分层检索工作原理:**
1. 构建特定页面(如"结账")时,首先检查 `design-system/pages/checkout.md`
2. 如果页面文件存在,其规则**覆盖**主文件
3. 如果不存在,仅使用 `design-system/MASTER.md`

### 步骤 3: 补充详细搜索(按需)

获取设计系统后,使用领域搜索获取额外细节:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --domain <领域> [-n <最大结果数>]
```

**何时使用详细搜索:**

| 需求 | 领域 | 示例 |
|------|------|------|
| 更多风格选项 | `style` | `--domain style "玻璃态 深色"` |
| 图表推荐 | `chart` | `--domain chart "实时仪表板"` |
| UX 最佳实践 | `ux` | `--domain ux "动画 无障碍"` |
| 替代字体 | `typography` | `--domain typography "优雅 奢华"` |
| 落地页结构 | `landing` | `--domain landing "英雄 社会证明"` |

### 步骤 4: 技术栈指南(默认: html-tailwind)

获取特定实现的最佳实践。如果用户未指定技术栈,**默认使用 `html-tailwind`**。

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<关键词>" --stack html-tailwind
```

**可用技术栈:** `html-tailwind`、`react`、`nextjs`、`vue`、`svelte`、`swiftui`、`react-native`、`flutter`、`shadcn`、`jetpack-compose`

## 搜索参考

### 可用领域

| 领域 | 用途 | 示例关键词 |
|------|------|-----------|
| `product` | 产品类型推荐 | SaaS、电商、作品集、医疗、美容、服务 |
| `style` | UI 风格、颜色、效果 | 玻璃态、极简主义、深色模式、野兽派 |
| `typography` | 字体组合、Google Fonts | 优雅、有趣、专业、现代 |
| `color` | 按产品类型的调色板 | saas、电商、医疗、美容、金融科技、服务 |
| `landing` | 页面结构、CTA 策略 | 英雄、英雄中心、推荐、定价、社会证明 |
| `chart` | 图表类型、库推荐 | 趋势、比较、时间线、漏斗、饼图 |
| `ux` | 最佳实践、反模式 | 动画、无障碍、z-index、加载 |
| `react` | React/Next.js 性能 | 瀑布流、打包、suspense、memo、重渲染、缓存 |
| `web` | Web 界面指南 | aria、焦点、键盘、语义、虚拟化 |

## 示例工作流程

**用户请求:** "为专业护肤服务制作落地页"

### 步骤 1: 分析需求
- 产品类型: 美容/水疗服务
- 风格关键词: 优雅、专业、柔和
- 行业: 美容/养生
- 技术栈: html-tailwind(默认)

### 步骤 2: 生成设计系统(必需)

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "美容 spa 养生 服务 优雅" --design-system -p "宁静水疗"
```

**输出:** 包含模式、风格、颜色、排版、效果和反模式的完整设计系统。

### 步骤 3: 补充详细搜索(按需)

```bash
# 获取动画和无障碍的 UX 指南
python3 skills/ui-ux-pro-max/scripts/search.py "动画 无障碍" --domain ux

# 如需要,获取替代排版选项
python3 skills/ui-ux-pro-max/scripts/search.py "优雅 奢华 衬线" --domain typography
```

### 步骤 4: 技术栈指南

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "布局 响应式 表单" --stack html-tailwind
```

**然后:** 综合设计系统 + 详细搜索并实施设计。

## 专业 UI 的常见规则

这些是经常被忽视的问题,会让 UI 看起来不专业:

### 图标和视觉元素

| 规则 | 正确做法 | 错误做法 |
|------|---------|---------|
| **不使用表情符号图标** | 使用 SVG 图标(Heroicons、Lucide、Simple Icons) | 使用 🎨 🚀 ⚙️ 等表情符号作为 UI 图标 |
| **稳定的悬停状态** | 悬停时使用颜色/透明度过渡 | 使用会移动布局的缩放变换 |
| **正确的品牌标志** | 从 Simple Icons 研究官方 SVG | 猜测或使用错误的标志路径 |
| **一致的图标大小** | 使用固定 viewBox(24x24)配合 w-6 h-6 | 随机混合不同图标大小 |

### 交互和光标

| 规则 | 正确做法 | 错误做法 |
|------|---------|---------|
| **光标指针** | 为所有可点击/可悬停卡片添加 `cursor-pointer` | 在交互元素上保留默认光标 |
| **悬停反馈** | 提供视觉反馈(颜色、阴影、边框) | 没有指示元素可交互 |
| **平滑过渡** | 使用 `transition-colors duration-200` | 瞬间状态变化或太慢(>500ms) |

### 亮色/深色模式对比度

| 规则 | 正确做法 | 错误做法 |
|------|---------|---------|
| **玻璃卡片亮色模式** | 使用 `bg-white/80` 或更高透明度 | 使用 `bg-white/10`(太透明) |
| **文本对比度亮色** | 文本使用 `#0F172A`(slate-900) | 正文文本使用 `#94A3B8`(slate-400) |
| **柔和文本亮色** | 最少使用 `#475569`(slate-600) | 使用 gray-400 或更浅 |
| **边框可见性** | 亮色模式使用 `border-gray-200` | 使用 `border-white/10`(不可见) |

### 布局和间距

| 规则 | 正确做法 | 错误做法 |
|------|---------|---------|
| **浮动导航栏** | 添加 `top-4 left-4 right-4` 间距 | 导航栏粘在 `top-0 left-0 right-0` |
| **内容填充** | 考虑固定导航栏高度 | 让内容隐藏在固定元素后面 |
| **一致的最大宽度** | 使用相同的 `max-w-6xl` 或 `max-w-7xl` | 混合不同的容器宽度 |

## 交付前检查清单

交付 UI 代码前,验证这些项目:

### 视觉质量
- [ ] 没有使用表情符号作为图标(使用 SVG 代替)
- [ ] 所有图标来自一致的图标集(Heroicons/Lucide)
- [ ] 品牌标志正确(从 Simple Icons 验证)
- [ ] 悬停状态不会导致布局移位
- [ ] 直接使用主题颜色(bg-primary)而不是 var() 包装器

### 交互
- [ ] 所有可点击元素都有 `cursor-pointer`
- [ ] 悬停状态提供清晰的视觉反馈
- [ ] 过渡平滑(150-300ms)
- [ ] 键盘导航的焦点状态可见

### 亮色/深色模式
- [ ] 亮色模式文本有足够对比度(最少 4.5:1)
- [ ] 玻璃/透明元素在亮色模式下可见
- [ ] 边框在两种模式下都可见
- [ ] 交付前测试两种模式

### 布局
- [ ] 浮动元素与边缘有适当间距
- [ ] 没有内容隐藏在固定导航栏后面
- [ ] 在 375px、768px、1024px、1440px 响应式
- [ ] 移动端无横向滚动

### 无障碍
- [ ] 所有图像都有 alt 文本
- [ ] 表单输入都有标签
- [ ] 颜色不是唯一指示器
- [ ] 尊重 `prefers-reduced-motion`

## 输出格式

`--design-system` 标志支持两种输出格式:

```bash
# ASCII 框(默认) - 最适合终端显示
python3 skills/ui-ux-pro-max/scripts/search.py "金融科技 加密货币" --design-system

# Markdown - 最适合文档
python3 skills/ui-ux-pro-max/scripts/search.py "金融科技 加密货币" --design-system -f markdown
```

## 获得更好结果的技巧

1. **关键词要具体** - "医疗 SaaS 仪表板" > "应用"
2. **多次搜索** - 不同关键词揭示不同见解
3. **组合领域** - 风格 + 排版 + 颜色 = 完整设计系统
4. **始终检查 UX** - 搜索"动画"、"z-index"、"无障碍"以发现常见问题
5. **使用技术栈标志** - 获取特定实现的最佳实践
6. **迭代** - 如果首次搜索不匹配,尝试不同关键词

## 支持的技术栈

该技能为以下技术栈提供特定指南:

| 技术栈 | 重点 |
|--------|------|
| `html-tailwind` | Tailwind 工具类、响应式、无障碍(默认) |
| `react` | 状态、钩子、性能、模式 |
| `nextjs` | SSR、路由、图像、API 路由 |
| `vue` | Composition API、Pinia、Vue Router |
| `svelte` | Runes、stores、SvelteKit |
| `swiftui` | 视图、状态、导航、动画 |
| `react-native` | 组件、导航、列表 |
| `flutter` | Widgets、状态、布局、主题 |
| `shadcn` | shadcn/ui 组件、主题、表单、模式 |
| `jetpack-compose` | Composables、Modifiers、状态提升、重组 |

## 其他 CLI 命令

```bash
uipro versions        # 列出可用版本
uipro update          # 更新到最新版本
uipro init --offline  # 跳过 GitHub 下载,使用捆绑资源
```

## 工作原理

1. **您提问** - 请求任何 UI/UX 任务(构建、设计、创建、实施、审查、修复、改进)
2. **生成设计系统** - AI 使用推理引擎自动生成完整的设计系统
3. **智能推荐** - 基于您的产品类型和需求,找到最佳匹配的风格、颜色和排版
4. **代码生成** - 使用适当的颜色、字体、间距和最佳实践实施 UI
5. **交付前检查** - 验证常见的 UI/UX 反模式

## 许可证

MIT License

## 支持项目

如果您觉得这个技能有用,请考虑支持项目:
https://paypal.me/uiuxpromax

## 资源

- **GitHub 仓库**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **技能位置**: `.agent/skills/ui-ux-pro-max`

---

**安装时间**: 2026-01-29  
**版本**: v2.0  
**平台**: Google Antigravity
