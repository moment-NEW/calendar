# 杭电课表日历订阅

将杭州电子科技大学课表API转换为可订阅的日历格式。

## 功能

- 自动从杭电助手API获取课表
- 生成标准的 iCalendar (.ics) 文件
- 通过 GitHub Pages 提供订阅服务
- 支持 Windows 日历、Apple 日历、Google 日历等

## 快速开始

### 1. Fork 仓库

点击右上角 "Fork" 按钮复制本仓库到你的GitHub账号下。

### 2. 配置 staffId（可选）

如果你想使用自己的课表数据：

1. 进入仓库的 **Settings** -> **Secrets and variables** -> **Actions**
2. 点击 **New repository secret**
3. 名称输入 `STAFF_ID`
4. 值填入你的 staffId（Base64编码）
5. 点击 "Add secret"

> **注意**：默认配置已包含示例staffId，可以直接使用查看效果。

### 3. 启用 GitHub Pages

1. 进入仓库的 **Settings** -> **Pages**
2. 在 "Build and deployment" 部分：
   - Source: 选择 **Deploy from a branch**
   - Branch: 选择 **gh-pages** , folder: **/(root)**
3. 点击 Save，等待部署完成

### 4. 订阅日历

部署完成后，访问：

```
https://你的用户名.github.io/hdu-calendar/
```

点击「订阅日历」按钮，或复制日历链接添加到你的日历应用中。

## Windows 日历订阅步骤

1. 打开 **Windows 日历** 应用
2. 点击左上角 **「添加日历」**
3. 选择 **「从网络订阅」**
4. 在 URL 中粘贴你的日历链接：
   ```
   https://你的用户名.github.io/hdu-calendar/schedule.ics
   ```
5. 日历名称填写「杭电课表」
6. 订阅更新频率选择「每天」或「每小时」
7. 点击确定

## 文件说明

```
.
├── README.md              # 说明文档
├── index.html             # 订阅页面
├── schedule.ics           # 课表日历文件（自动生成）
├── .gitignore             # Git忽略配置
└── .github/
    └── workflows/
        └── update-schedule.yml  # 自动更新工作流
```

## 自动更新

工作流会每天凌晨2点自动更新课表数据。你也可以手动触发：

1. 进入仓库的 **Actions** 页面
2. 选择 **Update Schedule** 工作流
3. 点击 **Run workflow** -> **Run workflow**

## 技术细节

- 使用 GitHub Actions 定时任务（每天凌晨2点）
- 从 `https://api.hduhelp.com/calendar/schedule` 获取数据
- 输出文件：`schedule.ics`
- 时区：Asia/Shanghai
- 课程数据包含：课程名称、上课时间、地点、授课老师
