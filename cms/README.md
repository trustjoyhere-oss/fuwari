# Fuwari × Sveltia CMS 后台

这套后台使用本地安装的 `@sveltia/cms` 构建，不依赖运行时 CDN。构建产物输出到
`public/admin/`，线上入口为 `/admin/`。

## 能否迁移到其他博客

可以，但它是“可移植的 Git 内容后台”，不是完全脱离内容结构的通用数据库后台。

- 目标也是 Astro + Markdown，并沿用当前 Frontmatter 字段时，基本可以直接复制。
- 目标博客的文章目录、Frontmatter 或文章 URL 不同时，需要修改 `public/config.yml`。
- 目标不是 Astro 时，Sveltia CMS 仍可使用，但构建脚本和本地预览接入方式需要适配。
- Token、OAuth Secret 和其他密钥永远不能跟随后台文件复制或提交。

## 迁移清单

1. 复制整个 `cms/` 目录和根目录的 `vite.cms.config.mjs`。
2. 安装 `@sveltia/cms` 与 `vite`，并复制 `cms:build` 及构建前置脚本。
3. 在 `cms/public/config.yml` 顶部修改：
   - `backend.repo`
   - `backend.branch`
   - `app_title`
   - `site_url` 与 `display_url`
   - `logo.src`
4. 按目标博客调整文章集合：
   - `folder`
   - `preview_path`
   - `fields`
   - `media_folder` 与 `public_folder`
5. 将 `public/_headers` 中的 `/admin/*` 安全响应头合并到目标项目。
6. 确保托管平台将 `/admin` 重定向到 `/admin/`。
7. 运行 `pnpm cms:build` 和站点完整构建，再用测试草稿验证读写。

## 当前内容模型

文章保存在 `src/content/posts/**/*.md`，支持以下 Frontmatter：

- `title`
- `published`
- `updated`
- `draft`
- `description`
- `image`
- `category`
- `tags`
- `lang`

新文章的 `draft` 默认为 `true`。关闭草稿开关并保存后，Cloudflare Pages 才会在下一次构建中发布文章。

## 扩展组件

`editor-components.ts` 提供以下与 Fuwari 兼容的内容块：

- 本地 MP4/WebM 视频
- PDF 与普通附件
- YouTube 隐私增强嵌入
- 哔哩哔哩嵌入
- Fuwari 提示块指令
- Fuwari GitHub 仓库卡片指令

第三方视频在后台预览中不会自动加载，只有文章前台展示时才向对应平台发起请求。

## 安全与维护

- 后台配置是公开文件，只能放仓库名、路径等非敏感信息。
- Fine-grained PAT 只在 Sveltia CMS 登录界面输入，并限制到目标仓库。
- `admin.css`、`preview.css`、图标和 CMS JavaScript 都由本站提供。
- 升级时优先安装同一小版本的最新补丁，并检查官方 Release Notes：

  ```powershell
  pnpm add @sveltia/cms@最新版本
  pnpm cms:build
  pnpm check
  pnpm build
  ```

- Sveltia CMS 在 1.0 前仍可能出现破坏性变更，升级后必须重新验证现有文章、媒体和手机端编辑。
