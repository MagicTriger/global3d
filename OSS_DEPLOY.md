# 阿里云 OSS 部署指南

## 准备工作

### 1. 创建阿里云 OSS Bucket

1. 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 创建一个新的 Bucket
   - 选择合适的区域(如:华东1-杭州)
   - 读写权限选择"公共读"
   - 其他选项保持默认
3. 记录下 Bucket 名称和区域

### 2. 获取 AccessKey

1. 访问 [AccessKey 管理页面](https://ram.console.aliyun.com/manage/ak)
2. 创建 AccessKey(建议使用 RAM 子账号,并只授予 OSS 权限)
3. 记录下 AccessKey ID 和 AccessKey Secret

### 3. 配置静态网站托管

1. 在 OSS 控制台,进入你的 Bucket
2. 点击"基础设置" → "静态页面"
3. 开启静态网站托管
4. 默认首页设置为: `index.html`
5. 默认 404 页设置为: `index.html` (用于 Vue Router 的 history 模式)

## 部署方法

### 方法 1: 使用部署脚本(推荐)

1. 编辑 `deploy-oss.js` 文件,填写你的 OSS 配置:

```javascript
const config = {
  region: 'oss-cn-hangzhou', // 你的区域
  accessKeyId: 'YOUR_ACCESS_KEY_ID', // 你的 AccessKey ID
  accessKeySecret: 'YOUR_ACCESS_KEY_SECRET', // 你的 AccessKey Secret
  bucket: 'YOUR_BUCKET_NAME', // 你的 Bucket 名称
};
```

2. 运行部署命令:

```bash
npm run deploy:oss
```

这个命令会:

- 自动构建项目(`npm run build`)
- 将 dist 目录下的所有文件上传到 OSS

### 方法 2: 手动上传

1. 构建项目:

```bash
npm run build
```

2. 在 OSS 控制台手动上传 dist 目录下的所有文件

## 访问网站

部署完成后,你可以通过以下地址访问:

### 默认域名

```
https://your-bucket-name.oss-cn-hangzhou.aliyuncs.com/index.html
```

### 自定义域名(推荐)

1. 在 OSS 控制台绑定自定义域名
2. 配置 CNAME 解析
3. 通过自定义域名访问

## 注意事项

1. **安全性**: 不要将 AccessKey 提交到 Git 仓库
2. **权限**: Bucket 需要设置为"公共读"才能被访问
3. **缓存**: 如果更新后看不到变化,清除浏览器缓存
4. **HTTPS**: 建议配置 CDN 并启用 HTTPS
5. **跨域**: 如果需要,在 OSS 控制台配置 CORS 规则

## 自动化部署(可选)

如果想在 Gitee 推送后自动部署到 OSS,可以在 `.workflow/master-pipeline.yml` 中添加 OSS 上传步骤。

## 故障排查

### 上传失败

- 检查 AccessKey 是否正确
- 检查 Bucket 名称和区域是否匹配
- 确认 RAM 账号有 OSS 写入权限

### 访问 404

- 确认 Bucket 已开启静态网站托管
- 检查文件是否上传成功
- 确认 Bucket 权限为"公共读"

### 路由不工作

- 确认 404 页面设置为 `index.html`
- 检查 Vue Router 配置
