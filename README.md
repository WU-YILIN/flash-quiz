# Flash Quiz

一个 Obsidian 插件，将你的笔记通过 LLM 自动生成选择题，并用间隔重复算法安排复习计划。

---

## 功能

- **自动出题** — 绑定 vault 中的笔记文件，调用 LLM 生成多选题题库
- **间隔重复** — 内置记忆调度算法，优先推送到期题目，新题按比例混入
- **答题卡界面** — 沉浸式弹窗，支持选项高亮、答案反馈、解析展示
- **打卡日历** — 可视化近 30 天答题记录，按日期查看正确率
- **会话恢复** — 中途关闭后下次自动续题，不丢进度
- **多语言** — 支持中文 / 英文界面，可跟随系统或手动切换
- **翻译辅助** — 英文题目自动翻译为中文显示（需配置 LLM）

---

## 安装

### 手动安装

1. 前往 [Releases](https://github.com/WU-YILIN/flash-quiz/releases) 下载最新版本的 `main.js`、`manifest.json`、`styles.css`
2. 将三个文件放入 vault 的插件目录：
   ```
   <your-vault>/.obsidian/plugins/flash-quiz/
   ```
3. 在 Obsidian 中启用社区插件，找到 **Flash Quiz** 并开启

### 本地构建

```bash
npm install
npm run build
```

构建完成后使用部署脚本一键复制到 vault：

```powershell
.\scripts\deploy-to-vault.ps1 -VaultPath "C:\path\to\your\vault"
```

---

## 使用

1. 打开 Obsidian 设置 → Flash Quiz
2. 填入 LLM API Key 和 Base URL（默认兼容 OpenAI 格式）
3. 在「题目来源」中绑定笔记文件
4. 点击「同步题库」生成题目
5. 点击左侧 ribbon 图标或命令面板中的 **Open Flash Quiz** 开始答题

---

## 设置项

| 设置 | 说明 |
|------|------|
| API Key | LLM 服务密钥 |
| Base URL | API 地址，默认 `https://api.openai.com/v1` |
| Model | 使用的模型名称，默认 `gpt-4.1-mini` |
| 每次出题数 | 每轮会话的题目数量 |
| 新题比例 | 每轮中新题占比（%） |
| 界面语言 | 跟随系统 / 中文 / English |

---

## 开发

```bash
npm install      # 安装依赖
npm run dev      # 监听模式构建
npm run build    # 生产构建
```

项目结构：

```
src/
├── main.ts              # 插件入口
├── ui/launchModal.ts    # 答题卡弹窗
├── generation/          # LLM 出题逻辑
├── review/              # 间隔重复调度
├── settings/            # 设置页面与类型
├── data/                # 数据结构与默认值
└── lib/                 # 工具函数
```

---

## License

MIT
