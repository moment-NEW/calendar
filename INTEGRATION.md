# 外部 API 集成指南

本文档介绍如何将课表数据接入外部自动化服务。

## API 端点

部署后可通过以下端点获取数据：

| 端点 | 说明 | 示例 |
|------|------|------|
| `/api/schedule` | 获取完整课表 | `?staffId=xxx` |
| `/api/courses` | 获取课程列表（去重） | `?staffId=xxx` |
| `/api/today` | 获取今日课程 | `?staffId=xxx` |
| `/api/week` | 获取本周课程 | `?staffId=xxx` |

## 返回格式

### /api/schedule 返回示例

```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "summary": "嵌入式系统",
      "dtstart": "2026-04-25T15:15:00",
      "dtend": "2026-04-25T20:05:00",
      "location": "第11教研楼106",
      "description": "授课老师：袁文强",
      "uid": "嵌入式系统-0-7"
    }
  ]
}
```

### /api/today 返回示例

```json
{
  "success": true,
  "date": "2026-04-25",
  "count": 4,
  "data": [
    {
      "summary": "嵌入式系统",
      "dtstart": "2026-04-25T15:15:00",
      "dtend": "2026-04-25T20:05:00",
      "location": "第11教研楼106",
      "time": "15:15"
    }
  ]
}
```

## 集成示例

### 1. n8n 集成

在 n8n 中创建 HTTP Request 节点：

```
URL: https://你的域名/api/today
Method: GET
```

### 2. Zapier/Make 集成

使用 Webhook 或 HTTP 请求模块：

```
URL: https://你的域名/api/today
Method: GET
```

### 3. 自定义提醒（每日推送）

创建 Cloudflare Worker 或 Vercel API 路由，每日定时调用：

```javascript
// 每日 7:00 发送课程提醒
async function sendDailyReminder() {
  const response = await fetch('/api/today');
  const { data } = await response.json();
  
  if (data.length > 0) {
    // 发送通知（钉钉/企业微信/飞书）
    for (const course of data) {
      console.log(`📚 ${course.summary} - ${course.time} @ ${course.location}`);
    }
  }
}
```

### 4. AI 助手集成

让你的 AI 助手调用 API 获取课表：

```
用户：今天有什么课？
AI：让我查一下...
（调用 /api/today）
今天你有 4 节课：
1. 嵌入式系统 - 15:15 @ 第11教研楼106
2. 信息系统 - 13:30 @ 第11教研楼301303
3. 计算机视觉 - 18:30 @ 第11教研楼201203
4. 算法与数据结构 - 18:30 @ 第11教研楼106
```

## 部署方式

### 方式1：Cloudflare Workers（免费）

1. 安装 Wrangler：`npm install -g wrangler`
2. 部署：`wrangler deploy api/schedule.js`

### 方式2：Vercel

创建 `vercel.json`：

```json
{
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/schedule.js" }
  ]
}
```

### 方式3：GitHub Actions + API

在 workflow 中添加 API 服务支持。

## 安全建议

- 如需保护 API，可添加 API Key 验证
- staffId 建议通过环境变量或 GitHub Secrets 配置
- 避免在客户端代码中暴露敏感信息
