# 分析日课

面向互联网大厂 **数据分析 / 数据运营** 的自学站：SQL、R（对照 Python）、商业小案例、国内互联网热点简报。手机可以学，电脑再开 SQL / R 实验室。进度存在浏览器，支持 **JSON 导入导出** 和 **进度口令**（方便发微信同步到另一台设备）。

## 线上打开（手机）

电脑能开本地预览；要让手机随时打开，需要把站点发到网上。

当前部署方式：Vercel。在本机项目目录执行：

```bash
pnpm dlx vercel login
pnpm dlx vercel deploy --prod --yes
```

第一次会弹出登录页（用邮箱或 GitHub）。登录完成后终端会打印一个 `https://….vercel.app` 地址，手机浏览器打开即可。

可选：在 Vercel 项目设置里加上环境变量 `DEEPSEEK_API_KEY`（不要把密钥写进代码）。不加的话，热点仍会出，只是讲解会走本地规则；也可以在「我的」里填密钥。

换设备后进度不会自动同步：在「我的」导出 JSON 或复制口令，到另一台设备导入。

## 本地运行

需要 Node.js 18+。本机若已装 pnpm 也可以。

```bash
npm install
npm run dev
```

或：

```bash
pnpm install
pnpm run dev
```

浏览器打开终端里给出的本地地址。

可选：根目录新建 `.env`，写入 `DEEPSEEK_API_KEY=你的密钥` 后重启一次。有密钥时，热点由模型选出当天最值得学的一条。

## 构建静态网站

```bash
npm run build
```

产物在 `dist/`。这是纯静态站点，**Cloud Studio / 腾讯云静态托管 / GitHub Pages / Vercel** 都可以发。

建议构建参数：

- 安装：`npm install`
- 构建：`npm run build`
- 产物目录：`dist`
- 本项目已用 Hash 路由（地址带 `#/`），子路径部署一般不用再配 404 回退。

### Cloud Studio / 腾讯云静态托管

1. 把本仓库导入 Cloud Studio 或上传到 Git。
2. 构建命令 `npm run build`，输出目录 `dist`。
3. 部署完成后用手机浏览器打开分配的域名。

换设备后：在「我的」导出 JSON 或复制进度口令，在新设备导入。两个浏览器的进度不会自动同步。

## 学习怎么排

默认每天约 20–30 分钟：**热点 5 分钟 + 案例 10 分钟 + SQL 或 R 一课**。SQL 和 R 同步，首页两块都能进，不必等 SQL 学完才学 R。忙可以少做；实验室可以晚点再做。R 课按业务选工具来写：日常取数仍用 SQL，检验和实验判断才轮到 R，自动化和上线用 Python。
