<p align="center">
  <a href="./README.md">한국어</a> · <a href="./README.en.md">English</a> · <strong>简体中文</strong>
</p>

<p align="center">
  <img src="./public/icons/icon-192.png" width="112" height="112" alt="Screenshot Shield 盾牌标志" />
</p>

<h1 align="center">Screenshot Shield</h1>

<p align="center">
  <strong>分享之前，先遮盖。</strong><br />
  无需将截图上传到服务器，直接在浏览器中检查并遮盖<br />
  韩语优先 · 多语言 · 仅限本地的隐私编辑器
</p>

<p align="center">
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI 状态" />
  </a>
  <a href="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml">
    <img src="https://github.com/YoungsPlace/screenshot-shield/actions/workflows/deploy.yml/badge.svg?branch=main" alt="GitHub Pages 部署状态" />
  </a>
  <br />
  <strong>仅限本地处理源文件 · 韩语 / 英语 / 简体中文</strong>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN"><strong>打开本地编辑器</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=zh-CN"><strong>查看发布故事</strong></a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/privacy.html?lang=zh-CN">隐私</a>
  ·
  <a href="https://youngsplace.github.io/screenshot-shield/support.html?lang=zh-CN">支持</a>
</p>

<p align="center">
  <a href="https://youngsplace.github.io/screenshot-shield/?lang=zh-CN">
    <img src="./public/social-card.png" width="960" alt="Screenshot Shield — 分享前先遮盖" />
  </a>
</p>

## 为什么选择 Screenshot Shield？

- **图像仅在本地处理。** 没有上传端点、账户、广告、分析、跟踪或远程 OCR。
- **创建新结果，而非修改原图。** 将检查完成的画面渲染到新画布，生成 PNG 或 JPEG。
- **不依赖自动建议。** 即使 OCR 不可用或遗漏了项目，仍可继续手动遮盖、移动、调整大小和删除。
- **分享是独立的显式操作。** 只有准备好的新结果才会进入用户选择的下载/保存或分享流程。

## 合成居民登记证演示

下方卡片**并非真实居民登记证的复制品**，而是为了说明敏感信息遮盖流程而制作的明确合成档案。角色姓名 `김빵주`、刻意设为无效的示例号码 `940913-1234567`、虚构住址 `서울 올림픽파크포레온 999동 999호` 均仅供测试，不代表任何真实人物。

<p align="center">
  <img src="./docs/assets/synthetic-id-redaction-demo.svg" width="960" alt="Screenshot Shield 演示，对比遮盖合成档案中角色 김빵주 的姓名、无效居民登记号码示例和虚构地址前后的效果" />
</p>

此示例展示了产品边界：直接检查并遮盖姓名、身份号码、地址和角色面部后，只准备并非原图的**全新渲染结果**。请勿将含有真实敏感信息的图像上传到仓库、Issue 或测试资料中。

## 立即使用

| 语言         | 发布页面                                                                | 直接打开编辑器                                                                        |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **韩语**     | [发布故事](https://youngsplace.github.io/screenshot-shield/?lang=ko)    | [韩语编辑器](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko)    |
| **英语**     | [发布故事](https://youngsplace.github.io/screenshot-shield/?lang=en)    | [英语编辑器](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en)    |
| **简体中文** | [发布故事](https://youngsplace.github.io/screenshot-shield/?lang=zh-CN) | [中文编辑器](https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN) |

Screenshot Shield 是一款韩语优先的多语言移动 Web 工具，用于在浏览器内准备新遮盖的截图。它不是图像上传服务。

[隐私政策](https://youngsplace.github.io/screenshot-shield/privacy.html?lang=zh-CN) ·
[支持](https://youngsplace.github.io/screenshot-shield/support.html?lang=zh-CN) ·
[安全报告政策](./SECURITY.md)

## 移动端使用流程

1. 打开上方语言链接，从**照片**或**文件**中选择截图。在桌面端也可以粘贴或拖放。
2. 检查本地自动建议，然后添加手动遮盖区域，并进行选择、移动、调整大小或删除。即使 OCR 不可用或遗漏项目，仍可继续手动遮盖。
3. 检查最终预览并准备新的 PNG 或 JPEG。编辑器不会复用原始字节或元数据，而是在新画布上绘制结果。
4. 如果浏览器支持文件分享，可通过单独的用户操作进行分享，也可下载或保存同一份准备好的文件。

用户选择的分享目标可能会依据其自身政策保存或上传结果，而非依据 Screenshot Shield 的政策。发送前请亲自检查完成的图像。

## 编辑器优先路径、语言与安装行为

根服务是韩语发布页面。若要跳过发布页面，请使用以下编辑器优先地址。

- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=ko`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=en`
- `https://youngsplace.github.io/screenshot-shield/?view=editor&lang=zh-CN`

公开语言标签严格为 `ko`、`en`、`zh-CN`。如果 `lang` 值缺失、无效、格式错误或重复，无论浏览器语言为何，均使用韩语。应用会将 `lang=zh` 规范化为 `zh-CN`。

在常规页面中，只有用户明确选择的语言可以保存到 `localStorage` 的 `screenshot-shield.locale`。从主屏幕启动已安装的应用时，会以编辑器优先模式打开，并且在渲染前只读取这一项设置。如果存储已清空、不可用、值错误或访问受阻，则回退为韩语。常规根地址不读取此设置，始终使用韩语。图像、文件名、遮盖区域、OCR 结果、准备好的输出和编辑历史均不会保存。

应用使用单一固定的 Web Manifest 和单一移动 Web 身份。浏览器安装由浏览器控制。在 iPhone 或 iPad Safari 中，请使用**分享 → 添加到主屏幕**；在 Android Chromium 中，仅当浏览器提供时使用**安装应用**或**添加到主屏幕**。菜单名称及其是否可用取决于浏览器、操作系统和政策。即使从主屏幕启动，它仍是移动 Web 应用，并不代表存在原生二进制文件或应用商店上架。

## 提供状态与边界

目前声称提供的范围仅为上述 GitHub Pages Web 服务。仓库包含已应用品牌的 Capacitor iOS/Android 阶段 0 项目和失败即阻断的政策检查。但在确认准确的工具链以及真实设备的启动链接、名称变更、时间戳和强制终止矩阵证据之前，`npm run native:preflight` 会阻止扩展原生运行时与分享实现。原生提供状态还会继续受阻，直至签名、群组、审核和商店公开证据得到确认。不声称已在 App Store 或 Google Play 发布。

不声称提供 Web Service Worker 或 Web 离线支持。浏览器可能会根据自身政策保留资源，但 Screenshot Shield 不提供离线编辑器或离线缓存生命周期。

当前 Web 应用没有应用上传端点、后端、账户、广告、分析、遥测、跟踪、远程 OCR 或外部图像处理 API。编辑期间，原始图像仅存在于浏览器内存中。唯一预期的图像外传，是用户明确下载、保存或分享的新遮盖结果。

OCR 和自动检测只是检查辅助工具，并非保证。OCR 可能不可用，也可能遗漏敏感项目。面部检测目前不在范围内。浏览器扩展、受损的设备或浏览器，以及被篡改的部署，都可能破坏本地处理边界。

在规划中的原生设计里，显式分享可以只将一份新遮盖结果放入受限的私有缓存。原图、备份和图库均不包含在内，该缓存也不是通用图像存储库。此规划不保证接收应用的打开、成功、取消、保留或删除行为，也不是当前已提供原生应用的证据。完整区分请参阅 [PRIVACY.md](./PRIVACY.md)。

## 安全地报告问题

如需一般性的非敏感帮助，请使用[公开仓库](https://github.com/YoungsPlace/screenshot-shield)；可访问 GitHub 时也可使用 [Issue](https://github.com/YoungsPlace/screenshot-shield/issues)。请注明应用/部署版本、完整地址和语言、设备、操作系统和浏览器版本、复现步骤、预期与实际结果，并且只附上已经遮盖或合成的证据。

请勿在公开 Issue 中发布原始截图、凭据、真实秘密、个人信息或攻击代码。对于意外的网络活动、图像持久化存储、输出/分享边界问题或其他漏洞，请使用[安全报告政策](./SECURITY.md)。仓库维护不保证实时响应或特定响应时间。

## 未来扩展边界

文档扫描、透视校正、对比度增强、PDF 及更多图像格式不在当前发布范围内。未来扩展本地流水线时，应保持原图与分享/下载 API 隔离，并按获取 → 非破坏性转换 → 遮盖 → 检查 → 格式编码的阶段推进。新编码器必须使用检查完成的渲染结果作为输入，而非原始文件。

广告或其他变现功能需要另行批准的隐私、同意、网络和内容隔离设计。这些功能不得访问原始图像、OCR 文本、遮盖区域、准备好的文件或编辑操作，也不得削弱无跟踪本地编辑器的可用性。

## 贡献与本地开发

提出更改前，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。必须维持浏览器本地处理边界、现有公开路径、`?embed=editor`、发布页面及 GitHub Pages 子路径。

```bash
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test
npm run native:policy
npm run store:verify
VITE_BASE_PATH=/screenshot-shield/ npm run build
VITE_BASE_PATH=/screenshot-shield/ PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173/screenshot-shield/ npm run e2e
```

`npm run build:native` 和 `npm run cap:sync` 都会先执行原生预检。如果计算机没有经过检查的完整 Xcode/JDK/Android SDK、已连接的真实 iOS/Android 设备、固定的工具链与 SPM 锁定，以及已签名的真实设备门禁证据，则正常情况就是中止。请勿绕过此中止。无需凭据的发布准备资料位于 [`docs/native-release-runbook.md`](./docs/native-release-runbook.md)、[`docs/rollback-and-observation.md`](./docs/rollback-and-observation.md) 和 [`store/`](./store/)。

本项目是 Vite/React 静态应用。测试使用合成图像，并且必须验证真实行为，而不是外部 OCR 服务。未经另行批准的隐私和生命周期设计，不得添加后端、上传中继、遥测、远程 OCR、Service Worker、Web 离线支持声明、Web 分享目标或图像持久化存储。

## GitHub Pages 部署

GitHub Pages 通过 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) 部署静态 `dist/` 结果。在仓库设置中选择 **Pages → Build and deployment → GitHub Actions**，然后将获批的更改合并到 `main`。生产构建必须保留 Vite 的 `/screenshot-shield/` 基础路径，本地开发使用 `/`。

此部署不是原生发布。如果没有独立获批的签名、设备、商店审核和公开提供证据，请勿声称提供商店构建版本。

## 许可证

MIT。请参阅 [LICENSE](./LICENSE)。
