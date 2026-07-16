# image-tag-editor-web

[koishi-plugin-starfx-bot](https://github.com/StarFreedomX/starfx-bot) 语录功能的 Web 管理面板。

## 安装

```shell
git clone https://github.com/StarFreedomX/image-tag-editor-web.git && cd image-tag-editor-web
pnpm install
```

## 配置

复制 `config-example.json` 为 `config.json`：

```json
{
  "ip": "0.0.0.0",
  "port": 3568,
  "imageFolderPath": "%AppData%\\Koishi\\Desktop\\data\\instances\\default\\data\\starfx-bot\\assets\\record",
  "tagConfigOutputPath": "%AppData%\\Koishi\\Desktop\\data\\instances\\default\\data\\starfx-bot\\assets\\tagConfig",
  "botApiUrl": "http://localhost:5140",
  "botApiSecret": "与Bot端apiSecret一致"
}
```

| 字段 | 说明 |
|------|------|
| `imageFolderPath` | 图片目录（填 starfx-bot 的 `assets/record/` 路径） |
| `tagConfigOutputPath` | 标签配置目录（填 `assets/tagConfig/` 路径） |
| `botApiUrl` | Bot 的 HTTP 服务地址 |
| `botApiSecret` | 与 Bot 端 `apiSecret` 一致 |

## 启动

```shell
pnpm build && pnpm start
```

启动后访问 `http://localhost:3568`。

## 使用流程

1. **获取 Token**：网页输入 QQ 号 → 拿到验证码 → QQ 群发送「语录.验证 XXXXXX」→ 网页自动跳转
2. **管理语录**：管理面板中点击群名进入，查看图片、添加/删除标签
3. **角色权限**：
   - **user**：查看、添加标签
   - **admin**：可删除标签和图片
   - **owner**：全部权限 + 用户管理 + 操作日志

## 图片目录结构

```
assets/record/              ← 填 record 目录
  ├─ onebot_999888777/
  │   ├─ 20250428-1.jpg
  │   ├─ 20250428-2.jpg
  │   └─ ......
  └─ ......
```
