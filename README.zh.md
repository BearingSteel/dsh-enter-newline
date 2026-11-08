# dsh-enter-newline

[English](README.md) | 中文

一个用于 DSH Web UI 对话输入框的插件，**调换了换行与发送按键**：**Enter 插入换行**，**Shift+Enter 发送消息**；发送按钮的提示气泡会显示该快捷键。

## 行为

- **Enter** 插入换行，不再发送消息。
- **Shift+Enter** 发送消息，或按发送按钮当前模式排队 / 插话发送。
- 鼠标悬浮或键盘聚焦发送按钮时，原有提示气泡改为两行：

  ```text
  Shift Enter
  发送消息
  ```

  快捷键行固定为 `Shift Enter`；动作行使用 Host 自身的本地化文案，跟随当前界面语言。排队发送和插话发送的文案也会同样适配。
- 触屏 / 粗指针设备保留 Host 原有提示，不添加额外快捷键行。
- 保留 **Ctrl+Enter** / **Cmd+Enter** 作为 Host 原有的加速发送手势；当 `/`、`@` 菜单或输入法组合占用 Enter 时，不拦截按键。

## 安装

### DSH Web

1. 打开 **插件 → 添加插件**。
2. 粘贴 `https://github.com/BearingSteel/dsh-enter-newline`。
3. 安装组合包，出现 **立即启用** 时点击启用。

### 命令行

```sh
dsh plugin --profile web add github:BearingSteel/dsh-enter-newline
```

该命令会把组合包安装为 profile 依赖。如果它没有自动启用，请在插件页打开 **dsh-enter-newline**。

组合包的 `cordis.patch.yml` 会插入 `enter-newline` 行。Host 侧只有空实现，所有行为都来自 `dsh.client` 声明的浏览器模块。启用后请刷新 Web 页面。

## 验证

- `node --check index.js client.js`
- JSON / YAML 清单解析
- 基于 happy-dom 的行为测试覆盖 Enter / Shift+Enter 改写、菜单与输入法放行、提示气泡标记、语言更新、触屏抑制和清理
- 运行中的客户端模块图会下发 `dsh-enter-newline` 的 `client.js`，Host 行处于激活状态
- 当前环境没有浏览器控制，无法进行最终视觉验证；安装后请刷新页面确认实际效果。

## AI 生成说明

本项目100%由AI生成。
