/**
 * oss-upload.ts - 阿里云 OSS 上传工具
 */
import OSS from 'ali-oss';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// 初始化 OSS 客户端
// 注意：需要确保 .env 中已配置相关变量
const store = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
    bucket: process.env.OSS_BUCKET!,
    secure: true, // 使用 HTTPS
});

/**
 * 上传本地文件到 OSS
 * @param localFilePath 本地文件路径
 * @param remoteFileName 由于 OSS 是扁平结构，这里指在 bucket 中的存储路径（包含前缀）
 *                       如果不传，会使用配置中的 OSS_PREFIX + 文件名
 * @returns 上传后的 URL
 */
export async function uploadToOSS(localFilePath: string, remoteFileName?: string): Promise<string> {
    try {
        if (!fs.existsSync(localFilePath)) {
            console.error(`❌ 文件不存在: ${localFilePath}`);
            return '';
        }

        // 确定远程路径
        let objectName = remoteFileName;
        if (!objectName) {
            const fileName = path.basename(localFilePath);
            const prefix = process.env.OSS_PREFIX || '';
            // 确保使用正斜杠
            objectName = path.join(prefix, fileName).split(path.sep).join('/');
        }

        console.log(`  ☁️ 正在上传到 OSS: ${objectName}...`);

        // 执行上传
        // headers 设置公共读权限？默认是私有还是继承 Bucket？通常图片需要公开访问
        // 如果 bucket 是公共读，则不需要特殊设置。
        const result = await store.put(objectName, localFilePath);

        // ali-oss 返回的 url 可能是 http，如果 secure: true 应该是 https
        // 但有时候 url 字段不一定包含自定义域名（如果配置了 cname）。这里假设返回的标准 url。

        if (result && result.url) {
            console.log(`  ✅ 上传成功: ${result.url}`);
            return result.url;
        } else {
            console.error('❌ 上传失败: 未返回 URL');
            return '';
        }
    } catch (err) {
        console.error(`❌ OSS 上传异常: ${err}`);
        return '';
    }
}
