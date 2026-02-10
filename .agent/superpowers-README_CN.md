# Superpowers - AI 代理技能框架

Superpowers 是一个完整的软件开发工作流程框架,专为编码代理设计。它基于一组可组合的"技能(skills)"构建,并配有初始指令确保您的代理能够正确使用这些技能。

## 工作原理

从您启动编码代理的那一刻起,它就开始发挥作用。当代理发现您正在构建某些东西时,它*不会*直接跳入编写代码。相反,它会退后一步,询问您真正想要做什么。

一旦它从对话中提炼出规格说明,它会将其分成足够短的块展示给您,以便您能够实际阅读和理解。

在您批准设计后,您的代理会制定一个实施计划,该计划足够清晰,即使是一个热情但品味不佳、没有判断力、缺乏项目背景且厌恶测试的初级工程师也能遵循。它强调真正的红-绿 TDD、YAGNI(你不会需要它)和 DRY 原则。

接下来,一旦您说"开始",它就会启动*子代理驱动开发*流程,让代理完成每个工程任务,检查和审查他们的工作,然后继续前进。Claude 能够在不偏离您制定的计划的情况下自主工作几个小时的情况并不少见。

这个系统还有更多内容,但这就是核心。由于技能会自动触发,您不需要做任何特殊的事情。您的编码代理就是拥有 Superpowers。

## 赞助

如果 Superpowers 帮助您做了能赚钱的事情,并且您愿意的话,我将非常感谢您考虑[赞助我的开源工作](https://github.com/sponsors/obra)。

谢谢!

- Jesse

## 安装说明

**注意:** 不同平台的安装方式不同。Claude Code 有内置的插件系统。Codex 和 OpenCode 需要手动设置。

### Claude Code (通过插件市场)

在 Claude Code 中,首先注册市场:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

然后从该市场安装插件:

```bash
/plugin install superpowers@superpowers-marketplace
```

### 验证安装

检查命令是否出现:

```bash
/help
```

```
# 应该看到:
# /superpowers:brainstorm - 交互式设计优化
# /superpowers:write-plan - 创建实施计划
# /superpowers:execute-plan - 批量执行计划
```

### Codex

告诉 Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

**详细文档:** [docs/README.codex.md](docs/README.codex.md)

### OpenCode

告诉 OpenCode:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**详细文档:** [docs/README.opencode.md](docs/README.opencode.md)

### Google Antigravity

对于 Google Antigravity 平台,请按照以下步骤安装:

1. **克隆仓库到您的项目目录:**

```bash
cd /path/to/your/project
git clone https://github.com/obra/superpowers.git
```

2. **创建 .agent/skills 目录(如果不存在):**

```bash
mkdir -p .agent/skills
```

3. **复制技能到 .agent/skills 目录:**

```bash
cp -r superpowers/skills/* .agent/skills/
```

4. **验证安装:**

检查 `.agent/skills` 目录是否包含所有技能文件夹,每个文件夹都应包含 `SKILL.md` 文件。

## 基本工作流程

1. **brainstorming (头脑风暴)** - 在编写代码之前激活。通过提问优化粗略的想法,探索替代方案,分段展示设计以供验证。保存设计文档。

2. **using-git-worktrees (使用 Git 工作树)** - 在设计批准后激活。在新分支上创建隔离的工作空间,运行项目设置,验证干净的测试基线。

3. **writing-plans (编写计划)** - 在批准的设计下激活。将工作分解为小任务(每个 2-5 分钟)。每个任务都有确切的文件路径、完整的代码和验证步骤。

4. **subagent-driven-development (子代理驱动开发)** 或 **executing-plans (执行计划)** - 在有计划时激活。为每个任务分派新的子代理,进行两阶段审查(规格合规性,然后代码质量),或在人工检查点批量执行。

5. **test-driven-development (测试驱动开发)** - 在实施期间激活。强制执行 RED-GREEN-REFACTOR:编写失败的测试,观察它失败,编写最少的代码,观察它通过,提交。删除在测试之前编写的代码。

6. **requesting-code-review (请求代码审查)** - 在任务之间激活。根据计划审查,按严重性报告问题。关键问题会阻止进度。

7. **finishing-a-development-branch (完成开发分支)** - 在任务完成时激活。验证测试,提供选项(合并/PR/保留/丢弃),清理工作树。

**代理在任何任务之前都会检查相关技能。** 这是强制性工作流程,而不是建议。

## 包含的内容

### 技能库

**测试**
- **test-driven-development** - RED-GREEN-REFACTOR 循环(包括测试反模式参考)

**调试**
- **systematic-debugging** - 4 阶段根本原因分析流程(包括根本原因追踪、深度防御、基于条件的等待技术)
- **verification-before-completion** - 确保问题真正得到修复

**协作** 
- **brainstorming** - 苏格拉底式设计优化
- **writing-plans** - 详细的实施计划
- **executing-plans** - 带检查点的批量执行
- **dispatching-parallel-agents** - 并发子代理工作流程
- **requesting-code-review** - 预审查检查清单
- **receiving-code-review** - 响应反馈
- **using-git-worktrees** - 并行开发分支
- **finishing-a-development-branch** - 合并/PR 决策工作流程
- **subagent-driven-development** - 快速迭代与两阶段审查(规格合规性,然后代码质量)

**元技能**
- **writing-skills** - 遵循最佳实践创建新技能(包括测试方法)
- **using-superpowers** - 技能系统介绍

## 设计理念

- **测试驱动开发** - 始终先编写测试
- **系统化而非临时** - 流程优于猜测
- **降低复杂性** - 简单性作为首要目标
- **证据优于声明** - 在宣布成功之前进行验证

了解更多: [Superpowers for Claude Code](https://blog.fsck.com/2025/10/09/superpowers/)

## 技能详细说明

### 1. brainstorming (头脑风暴)
**用途:** 交互式设计优化  
**触发时机:** 开始编写代码之前  
**功能:** 通过苏格拉底式提问帮助优化设计思路,探索多种方案,分段验证设计决策

### 2. writing-plans (编写计划)
**用途:** 创建详细的实施计划  
**触发时机:** 设计批准后  
**功能:** 将大型任务分解为 2-5 分钟的小任务,每个任务包含具体文件路径、完整代码和验证步骤

### 3. executing-plans (执行计划)
**用途:** 批量执行计划  
**触发时机:** 有实施计划时  
**功能:** 按批次执行任务,在关键点设置人工检查点

### 4. subagent-driven-development (子代理驱动开发)
**用途:** 快速迭代开发  
**触发时机:** 执行复杂任务时  
**功能:** 为每个任务分派独立的子代理,进行两阶段审查(先检查规格合规性,再检查代码质量)

### 5. test-driven-development (测试驱动开发)
**用途:** 强制执行 TDD 流程  
**触发时机:** 实施功能时  
**功能:** 严格遵循红-绿-重构循环,确保代码质量和可测试性

### 6. systematic-debugging (系统化调试)
**用途:** 4 阶段根本原因分析  
**触发时机:** 遇到 bug 时  
**功能:** 系统化地追踪问题根源,应用深度防御策略

### 7. verification-before-completion (完成前验证)
**用途:** 确保问题真正解决  
**触发时机:** 声称修复完成之前  
**功能:** 验证修复是否真正有效,避免假阳性

### 8. requesting-code-review (请求代码审查)
**用途:** 预审查检查清单  
**触发时机:** 任务完成后  
**功能:** 根据计划审查代码,按严重性分类问题

### 9. receiving-code-review (接收代码审查)
**用途:** 响应审查反馈  
**触发时机:** 收到审查意见时  
**功能:** 系统化地处理审查反馈

### 10. using-git-worktrees (使用 Git 工作树)
**用途:** 并行开发分支管理  
**触发时机:** 需要隔离工作环境时  
**功能:** 创建独立的工作空间,避免分支切换的开销

### 11. finishing-a-development-branch (完成开发分支)
**用途:** 分支完成流程  
**触发时机:** 任务全部完成时  
**功能:** 验证测试,提供合并/PR/保留/丢弃选项

### 12. dispatching-parallel-agents (分派并行代理)
**用途:** 并发子代理工作流程  
**触发时机:** 需要并行处理多个独立任务时  
**功能:** 协调多个子代理同时工作

### 13. writing-skills (编写技能)
**用途:** 创建新技能  
**触发时机:** 需要扩展技能库时  
**功能:** 遵循最佳实践创建和测试新技能

### 14. using-superpowers (使用 Superpowers)
**用途:** 技能系统介绍  
**触发时机:** 开始任何对话时  
**功能:** 建立如何查找和使用技能的规则,要求在任何响应(包括澄清问题)之前调用技能工具

## 贡献

技能直接存放在此仓库中。要贡献:

1. Fork 此仓库
2. 为您的技能创建一个分支
3. 遵循 `writing-skills` 技能来创建和测试新技能
4. 提交 PR

完整指南请参见 `skills/writing-skills/SKILL.md`。

## 更新

技能会在您更新插件时自动更新:

```bash
/plugin update superpowers
```

对于手动安装,重新运行安装步骤即可。

## 许可证

MIT 许可证 - 详见 LICENSE 文件

## 支持

- **问题反馈**: https://github.com/obra/superpowers/issues
- **插件市场**: https://github.com/obra/superpowers-marketplace

## 与 Google Antigravity 的兼容性

本技能框架完全符合 Google Antigravity 的技能规范:

### 目录结构
```
.agent/
└── skills/
    ├── brainstorming/
    │   └── SKILL.md
    ├── writing-plans/
    │   └── SKILL.md
    ├── test-driven-development/
    │   └── SKILL.md
    └── ... (其他技能)
```

### SKILL.md 格式
每个技能的 `SKILL.md` 文件都包含:
- **YAML frontmatter**: 包含 `name` 和 `description` 字段
- **Markdown 指令**: 详细的使用说明和最佳实践

### 使用方式
在 Google Antigravity 中,代理会自动:
1. 在开始任何任务前检查相关技能
2. 使用 `view_file` 工具读取 SKILL.md 文件
3. 严格遵循技能中的指令执行任务

### 技能调用规则
根据 `using-superpowers` 技能的要求:
- **强制性**: 如果技能适用于当前任务,必须使用它(不是可选的)
- **优先级**: 在任何响应或操作之前调用相关技能
- **检查标准**: 即使只有 1% 的可能性技能可能适用,也应该调用它

## 常见问题

### Q: 如何知道应该使用哪个技能?
A: 代理会根据任务类型自动判断。您也可以查看每个技能的 `description` 字段了解其用途。

### Q: 可以自定义技能吗?
A: 可以。参考 `writing-skills` 技能的指导创建自己的技能。

### Q: 技能之间有依赖关系吗?
A: 有些技能会引用其他技能。例如 `subagent-driven-development` 会使用 `test-driven-development`。

### Q: 如何更新已安装的技能?
A: 重新运行安装步骤,或者使用 `git pull` 更新 superpowers 仓库后重新复制。

## 最佳实践

1. **始终让代理检查技能**: 不要跳过技能检查步骤
2. **遵循技能指令**: 特别是标记为"刚性"的技能(如 TDD)
3. **逐步验证**: 在每个阶段验证结果,不要等到最后
4. **保持计划更新**: 当需求变化时,更新实施计划
5. **使用 Git 工作树**: 对于复杂任务,使用独立的工作空间

## 技术支持

如果您在使用过程中遇到问题:
1. 查看相关技能的 SKILL.md 文件
2. 检查 GitHub Issues 中是否有类似问题
3. 在 GitHub 上提交新的 Issue

---

**版本信息**  
本文档基于 Superpowers 主分支创建  
最后更新: 2026-01-29  
适用平台: Google Antigravity, Claude Code, Codex, OpenCode
