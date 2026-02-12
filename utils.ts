/**
 * utils.ts - 工具函数模块
 * 
 * 包含：Cookie 解析、文件操作、延迟、重试、媒体下载等通用工具
 */

import fs from "fs";         // 文件系统操作
import path from "path";     // 路径处理
import https from "https";   // HTTPS 请求（用于下载媒体）
import http from "http";     // HTTP 请求

import type { ScrapeProgress } from "./types.js";

// ============================================================
// 常量定义
// ============================================================

/** 数据存储根目录 */
export const DATA_DIR = path.join(process.cwd(), "data");
/** 帖子详情存储目录 */
export const POSTS_DIR = path.join(DATA_DIR, "posts");
/** 图片存储目录 */
export const IMAGES_DIR = path.join(DATA_DIR, "media", "images");
/** 视频存储目录 */
export const VIDEOS_DIR = path.join(DATA_DIR, "media", "videos");
/** 进度文件路径 */
export const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");

// ============================================================
// 初始化数据目录
// ============================================================

/**
 * 创建所有需要的数据目录
 * 如果目录已经存在则不会报错（recursive: true）
 */
export function initDataDirs(): void {
    // fs.mkdirSync 的 recursive 选项：
    // 类似 mkdir -p，会自动创建中间的父级目录
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
    console.log("✅ 数据目录已就绪");
}

// ============================================================
// Cookie 解析
// ============================================================

/**
 * 将 Cookie 字符串解析为 Playwright 需要的 Cookie 对象数组
 * 
 * @param cookieString - 浏览器导出的 Cookie 字符串，格式: "name1=value1; name2=value2"
 * @param domain - Cookie 所属域名
 * @returns Playwright 格式的 Cookie 数组
 * 
 * 注意：
 * - __Host- 前缀的 Cookie 必须设置 secure: true
 * - __Secure- 前缀的 Cookie 也必须设置 secure: true
 * - 这些是浏览器的安全策略要求
 */
export function parseCookies(
    cookieString: string,
    domain: string
): Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    secure: boolean;
    httpOnly: boolean;
}> {
    return cookieString
        .split(";")                          // 按分号分割每个 Cookie
        .map((cookie) => cookie.trim())      // 去除前后空格
        .filter((cookie) => cookie.length > 0)  // 过滤空项
        .map((cookie) => {
            // 用第一个 = 号分割 name 和 value
            // 注意：value 中可能包含 = 号，所以只分割第一个
            const eqIndex = cookie.indexOf("=");
            const name = cookie.substring(0, eqIndex);
            const value = cookie.substring(eqIndex + 1);

            // __Host- 和 __Secure- 前缀的 Cookie 必须标记为 secure
            const isSecure =
                name.startsWith("__Host-") || name.startsWith("__Secure-");

            return {
                name,
                value,
                domain,           // 绑定到目标域名
                path: "/",        // 对整个站点生效
                secure: isSecure, // 安全标记
                httpOnly: false,  // 设为 false 让浏览器可以访问
            };
        });
}

// ============================================================
// 延迟函数
// ============================================================

/**
 * 等待指定毫秒数
 * 用于控制采集速率，避免请求过快被服务器封禁
 * 
 * @param ms - 等待的毫秒数
 * 
 * 使用示例：
 * await delay(2000);  // 等待 2 秒
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成一个随机延迟（在 min 和 max 之间）
 * 随机延迟比固定延迟更接近人类行为，不容易被检测为爬虫
 * 
 * @param minMs - 最小等待毫秒数
 * @param maxMs - 最大等待毫秒数
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
    // Math.random() 返回 0-1 之间的随机数
    // 乘以范围后加上最小值，得到 min-max 之间的随机值
    const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    console.log(`⏳ 等待 ${(ms / 1000).toFixed(1)} 秒...`);
    return delay(ms);
}

// ============================================================
// 进度管理（断点续传）
// ============================================================

/**
 * 加载采集进度
 * 如果进度文件不存在，返回一个空的初始进度对象
 */
export function loadProgress(): ScrapeProgress {
    try {
        if (fs.existsSync(PROGRESS_FILE)) {
            // 读取文件内容并解析为 JSON 对象
            const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
            return JSON.parse(data) as ScrapeProgress;
        }
    } catch (err) {
        console.warn("⚠️ 读取进度文件失败，将从头开始:", err);
    }

    // 返回空的初始进度
    return {
        completedListPages: [],
        allPostUrls: [],
        completedDetailUrls: [],
        failedDetailUrls: [],
        lastUpdated: new Date().toISOString(),
    };
}

/**
 * 保存采集进度到文件
 * 每次采集一个帖子后都会调用，确保中断后可以续传
 */
export function saveProgress(progress: ScrapeProgress): void {
    progress.lastUpdated = new Date().toISOString();
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

// ============================================================
// 帖子数据文件操作
// ============================================================

/**
 * 从帖子 URL 中提取 ID 作为文件名
 * 
 * 例如：
 * "https://new.web.cafe/tutorial/detail/n3lndzpmfj" → "n3lndzpmfj"
 * "https://new.web.cafe/topic/detail/abc123" → "abc123"
 */
export function getPostIdFromUrl(url: string): string {
    // 去掉末尾的斜杠，然后取最后一段作为 ID
    const cleanUrl = url.replace(/\/$/, "");
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1];
}

/**
 * 保存帖子详情到 JSON 文件
 * 文件名使用帖子 ID
 */
export function savePost(postId: string, data: object): void {
    const filePath = path.join(POSTS_DIR, `${postId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`💾 帖子已保存: ${filePath}`);
}

/**
 * 检查帖子是否已经采集过
 * 用于断点续传时跳过已完成的帖子
 */
export function isPostScraped(postId: string): boolean {
    const filePath = path.join(POSTS_DIR, `${postId}.json`);
    return fs.existsSync(filePath);
}

// ============================================================
// 媒体下载
// ============================================================

/**
 * 下载单个文件（图片或视频）到本地
 * 
 * @param url - 文件的网络URL
 * @param savePath - 本地保存路径
 * @returns 是否下载成功
 * 
 * 工作原理：
 * 1. 根据 URL 协议选择 http 或 https 模块
 * 2. 发送 GET 请求获取文件流
 * 3. 将数据流（stream）写入本地文件
 * 4. 使用 Promise 封装异步操作
 */
export function downloadFile(url: string, savePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            // 选择正确的请求模块
            const client = url.startsWith("https") ? https : http;

            client
                .get(url, (response) => {
                    // 如果服务器返回重定向（301/302），跟随重定向
                    if (
                        response.statusCode &&
                        response.statusCode >= 300 &&
                        response.statusCode < 400 &&
                        response.headers.location
                    ) {
                        console.log(`  ↪ 重定向到: ${response.headers.location}`);
                        downloadFile(response.headers.location, savePath).then(resolve);
                        return;
                    }

                    // 检查是否请求成功（HTTP 200）
                    if (response.statusCode !== 200) {
                        console.warn(`  ❌ 下载失败 (HTTP ${response.statusCode}): ${url}`);
                        resolve(false);
                        return;
                    }

                    // 创建文件写入流，将网络数据直接写入磁盘
                    const fileStream = fs.createWriteStream(savePath);
                    response.pipe(fileStream);  // pipe: 将读取流连接到写入流

                    fileStream.on("finish", () => {
                        fileStream.close();
                        console.log(`  📥 下载完成: ${path.basename(savePath)}`);
                        resolve(true);
                    });

                    fileStream.on("error", (err) => {
                        console.warn(`  ❌ 写入失败: ${err.message}`);
                        fs.unlinkSync(savePath);  // 删除不完整的文件
                        resolve(false);
                    });
                })
                .on("error", (err) => {
                    console.warn(`  ❌ 请求失败: ${err.message}`);
                    resolve(false);
                });
        } catch (err) {
            console.warn(`  ❌ 下载异常: ${err}`);
            resolve(false);
        }
    });
}

/**
 * 从URL中提取文件扩展名
 * 
 * 例如：
 * "https://example.com/photo.jpg?w=800" → ".jpg"
 * "https://example.com/video.mp4" → ".mp4"
 */
export function getExtFromUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        const ext = path.extname(urlObj.pathname);  // 从路径部分提取扩展名
        return ext || ".bin";  // 如果没有扩展名，默认为 .bin
    } catch {
        return ".bin";
    }
}

// ============================================================
// 日志工具
// ============================================================

/**
 * 带时间戳的日志函数
 * 方便在长时间运行的采集过程中追踪进度
 */
export function log(message: string): void {
    const timestamp = new Date().toLocaleTimeString("zh-CN");
    console.log(`[${timestamp}] ${message}`);
}
