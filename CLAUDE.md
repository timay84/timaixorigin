# CLAUDE.md

## 项目概述

这是一个 1 天极速版的多模态外星萌宠前端 Demo，技术栈包括 React、Vite、Tailwind CSS、Framer Motion 和 Web Audio API。

当前 Demo 支持：

- 流式输出模拟外星语文本
- 句子级文本分块
- 模拟外星语音和 TTS 队列播放
- 基于 Web Audio API 振幅分析的实时口型同步
- SVG 外星头像的情绪动画
- 点击头像或触摸屏幕打断当前发言
- 打断后的本地受惊动画和怪声音效

当前 LLM 和 TTS 默认使用本地 mock 实现，后续可替换为真实的流式 LLM 和 Fish Audio TTS 服务。

## 核心架构与关键机制

### 对话竞态与打断

- 每次对话使用递增的 `conversationId` 标识。
- `AbortController` 用于终止正在进行的 LLM 流。
- TTS 处理完成后会再次检查 `conversationId` 和 `AbortSignal`，旧对话的结果不会重新进入播放队列。
- `AudioQueueManager` 使用队列 generation 检查，防止打断前已经开始解码的旧音频在之后入队。
- 打断时会清空音频队列、停止当前音频、取消旧流、清空字幕并触发受惊反馈。

### 音频队列与口型同步

`AudioQueueManager` 负责：

- 顺序解码和播放音频片段
- 管理当前播放源和待播放队列
- 通过 `AnalyserNode` 获取实时音频振幅
- 向头像组件提供口型同步用的 RMS 振幅

音频队列共用单一的 `requestAnimationFrame` 循环进行振幅分析，避免每个音频片段重复创建动画循环导致泄漏、CPU 占用升高和口型失控。播放结束、打断和组件卸载时都会停止该循环；组件卸载通过 `destroy()` 清理音频节点和回调。

### 文本分块与 TTS 缓冲

- `TextChunker` 缓存 LLM 流式文本，并在句末标点处输出文本片段。
- 每个文本片段进入 TTS 处理后，再交给 `AudioQueueManager` 排队播放。
- 当前 `llmService.ts` 和 `ttsService.ts` 默认是 mock 实现，但服务接口已经按照未来接入真实流式 LLM/TTS 的方向组织。
- 情感标签目前支持 `[laugh]` 和 `[cry]`，用于驱动情绪动画和特殊音效。

## 关键文件结构

```text
src/
├── App.tsx
├── components/
│   ├── AlienAvatar.tsx       # SVG 外星头像、情绪动画和口型同步
│   ├── CameraPiP.tsx         # 摄像头画面权限和画中画展示
│   ├── SettingsPanel.tsx     # LLM/TTS 配置界面
│   ├── Subtitles.tsx         # 流式字幕和情感标签展示
│   └── WakeUpScreen.tsx      # 用户手势唤醒和 AudioContext 初始化
├── services/
│   ├── audioQueueManager.ts  # Web Audio 播放队列、振幅分析和打断清理
│   ├── llmService.ts         # mock LLM 流和 TextChunker
│   └── ttsService.ts         # mock TTS、WAV 生成和情绪音效
├── types/
│   └── index.ts              # Emotion、LLMChunk、Settings 等类型
├── index.css
└── main.tsx
```

`App.tsx` 是主要编排层，连接对话状态、LLM 流、文本分块、TTS、音频队列、字幕和头像动画。真实服务接入时，优先保持这些服务的接口稳定，避免把网络细节扩散到 UI 组件中。

## 常用开发命令

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
```

推荐提交前至少运行：

```bash
npm run typecheck && npm run lint && npm run build
```

## 当前开发边界

- LLM 和 TTS 当前默认是 mock 服务。
- 摄像头目前主要用于本地画中画展示，完整的摄像头帧和麦克风流式上传仍待后续接入。
- 修改音频队列时必须保持单 RAF 循环，并确保打断和卸载路径都能清理资源。
- 修改 LLM/TTS 异步流程时必须保留 `conversationId`、`AbortController` 和入队前的有效性检查。
- 这是面向 1 天 Demo 的前端原型，优先保证交互流畅、可演示和改造成本低。
