/**
 * 阿里云 OSS 部署脚本
 * 使用方法: node deploy-oss.js
 */

const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

// 配置信息 - 请填写你的阿里云 OSS 信息
const config = {
  region: 'oss-cn-hangzhou', // 你的 OSS 区域,如: oss-cn-hangzhou, oss-cn-beijing
  accessKeyId: 'YOUR_ACCESS_KEY_ID', // 你的 AccessKey ID
  accessKeySecret: 'YOUR_ACCESS_KEY_SECRET', // 你的 AccessKey Secret
  bucket: 'YOUR_BUCKET_NAME', // 你的 Bucket 名称
};

const client = new OSS(config);

// 要上传的本地目录
const distPath = path.join(__dirname, 'dist');

// 递归获取目录下所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// 上传文件到 OSS
async function uploadFile(localPath, ossPath) {
  try {
    const result = await client.put(ossPath, localPath);
    console.log(`✓ 上传成功: ${ossPath}`);
    return result;
  } catch (error) {
    console.error(`✗ 上传失败: ${ossPath}`, error);
    throw error;
  }
}

// 设置文件的 Content-Type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// 主函数
async function deploy() {
  console.log('开始部署到阿里云 OSS...\n');

  try {
    // 检查 dist 目录是否存在
    if (!fs.existsSync(distPath)) {
      console.error('错误: dist 目录不存在,请先运行 npm run build');
      process.exit(1);
    }

    // 获取所有文件
    const files = getAllFiles(distPath);
    console.log(`找到 ${files.length} 个文件需要上传\n`);

    // 上传所有文件
    for (const file of files) {
      const relativePath = path.relative(distPath, file);
      const ossPath = relativePath.replace(/\\/g, '/'); // Windows 路径转换

      await uploadFile(file, ossPath);
    }

    console.log('\n✓ 部署完成!');
    console.log(`\n访问地址: https://${config.bucket}.${config.region}.aliyuncs.com/index.html`);

    // 如果配置了自定义域名,提示用户
    console.log('\n提示: 如果你配置了自定义域名,请使用自定义域名访问');
  } catch (error) {
    console.error('\n✗ 部署失败:', error);
    process.exit(1);
  }
}

// 运行部署
deploy();
