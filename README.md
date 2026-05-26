# Pet — AI 虚拟宠物陪伴

一只会说话、会撒娇的 AI 柯基「桃桃」，在你疲惫时安抚你，在你出门时和你告别，陪你记录每一天的成长时光。

## 适用场景

- 独自学习/工作时想要一个不打扰的陪伴
- 情绪低落时需要被治愈和安慰
- 日常碎碎念想要一个会回应的倾听对象

## 功能描述

**宠物对话**：和桃桃自由聊天，她会根据你的情绪给出不同的回应。检测到「好累」「好困」等关键词时自动触发安抚模式，检测到「出门」「拜拜」时触发欢送模式。

**动效交互**：桃桃有五种状态 —— 默认待机摇头、聆听中、欢送、安抚、开心，每种状态对应不同的 GIF 动画，点击宠物可以互动。

**心情日记**：内置心情日历和每周心情曲线，记录每一次互动后的心情变化。

**成长时光记**：珍藏你和桃桃的回忆，包括照片墙、视频播放等记忆浏览功能。

## 技术栈

- **后端**：Python FastAPI
- **AI 框架**：OpenAI Agents SDK
- **模型**：DeepSeek Chat
- **会话存储**：SQLite
- **前端**：原生 HTML + CSS + JavaScript

## 项目结构

```
├── main.py                  # FastAPI 服务入口，含鉴权中间件
├── configs.py               # 环境变量配置
├── api/users.py             # 用户登录/注册/会话管理
├── requirements.txt         # Python 依赖
├── pet/
│   ├── login.html           # 登录页
│   ├── ai_pet.html          # 对话主页面
│   ├── js/login.js          # 登录逻辑
│   ├── js/ai_pet.js         # 对话逻辑 + 宠物状态机
│   ├── css/                 # 样式文件
│   └── *.gif/*.png          # 宠物动效素材
└── UI/
    ├── videoplayer/         # 视频播放器
    └── 时光成长记/          # 时光记忆 React 子项目
```

## 快速开始

```bash
pip install -r requirements.txt
cp .env.example .env          # 编辑 .env 填入 DEEPSEEK_API_KEY
python main.py                # 访问 http://localhost:8000/pet/login.html
```
