# 免费部署建议：中国香港和大陆使用

## 结论

优先做两个免费镜像：

1. Cloudflare Pages：香港访问通常更快，构建命令 `npm run build`，输出目录 `dist`。
2. GitHub Pages：作为大陆备用入口，已提供 GitHub Actions 配置。

大陆网络对海外免费域名没有稳定保证。`chatgpt.site`、`pages.dev`、`github.io`、`vercel.app`、`netlify.app` 都可能在某些地区或浏览器内置环境中被拦截或变慢。若后续要面向多人长期稳定使用，大陆最稳的路线是购买域名、ICP备案、接入大陆 CDN；这通常不是完全免费方案。

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root

Cloudflare Pages 会读取 `public/_redirects`，单页应用刷新也会回到 `index.html`。

## GitHub Pages

已添加 `.github/workflows/deploy-github-pages.yml`。仓库推送到 `main` 后，在 GitHub 仓库设置里把 Pages Source 设为 `GitHub Actions`。

## 现有 chatgpt.site 备用部署

保留特殊构建命令：

```bash
npm run build:sites
```

普通免费静态托管不要使用这个命令，直接用 `npm run build`。
