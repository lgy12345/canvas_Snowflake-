# 雪花图可视化组件

一个基于 React + Canvas 的交互式雪花图（Snowflake Chart）可视化组件。

## 功能特性

✅ 双类型交互模式（COMPANY / TOC）
✅ 五维数据可视化（VALUE、FUTURE、PAST、HEALTH、DIVIDEND）
✅ 动态颜色算法（红色到绿色渐变）
✅ 贝塞尔曲线平滑连接
✅ 实时数据更新
✅ 区域高亮选择
✅ 悬浮 Tooltip 显示详细信息
✅ 点击事件响应

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（端口 3001）
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. **调整维度分数**：使用滑块调整 0-7 的分数
2. **选择高亮区域**：通过单选按钮高亮特定维度
3. **悬浮交互**：鼠标悬浮在扇形上查看详细信息
4. **点击事件**：点击扇形触发消息提示
5. **重置**：点击重置按钮恢复初始状态

## 技术栈

- React 19
- Vite 7
- Canvas API
- CSS3
