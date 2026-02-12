console.log("🔍 Loading scraper.ts modules...");
/**
 * scraper.ts - Web.Cafe 论坛采集主脚本
 * 
 * 功能：
 * 1. 阶段一：遍历列表页，采集所有帖子链接
 * 2. 阶段二：逐条访问详情页，提取完整内容（标题、作者、标签、正文、图片、视频）
 * 3. 支持断点续传（中断后可继续）
 * 
 * 使用方法：
 *   npx tsx scraper.ts           # 全量采集（83页）
 *   npx tsx scraper.ts --test    # 测试模式（只采集2页 + 3篇帖子）
 */

import "dotenv/config";                          // 加载 .env 环境变量
import { Stagehand } from "@browserbasehq/stagehand"; // Stagehand 浏览器自动化
import { z } from "zod";                         // 数据校验库（用于 extract 的 schema）
import path from "path";
import { uploadToOSS } from "./oss-upload.js";

import type { PostDetail, PostSummary } from "./types.js";
import {
    parseCookies,
    initDataDirs,
    loadProgress,
    saveProgress,
    savePost,
    getPostIdFromUrl,
    isPostScraped,
    randomDelay,
    downloadFile,
    getExtFromUrl,
    IMAGES_DIR,
    VIDEOS_DIR,
    log,
} from "./utils.js";

// ============================================================
// 配置常量
// ============================================================

/** 论坛基础URL */
const BASE_URL = "https://new.web.cafe";
/** 列表页总页数 */
const TOTAL_PAGES = 83;
/** 每次请求之间的最小等待时间（毫秒） */
const MIN_DELAY = 2000;
/** 每次请求之间的最大等待时间（毫秒） */
const MAX_DELAY = 4000;

/**
 * 遍历所有列表页，从 Next.js RSC 数据流中提取帖子 UID
 * 
 * 技术背景：
 *   Web.Cafe 是 Next.js RSC（React Server Components）应用。
 *   帖子数据通过 self.__next_f.push() 内联在 <script> 标签中，
 *   JSON 使用转义引号 \" 格式。
 *   每个帖子有 uid 字段，详情页统一使用 /tutorial/detail/{uid} 路径。
 * 
 * @param stagehand - Stagehand 实例
 * @param testMode - 是否为测试模式（只采集2页）
 */
async function scrapeListPages(
    stagehand: Stagehand,
    testMode: boolean = false,
    maxPagesOverride?: number
): Promise<string[]> {
    log("📋 阶段一：开始采集列表页...");

    const progress = loadProgress();
    const maxPage = maxPagesOverride || (testMode ? 2 : TOTAL_PAGES);
    const page = stagehand.context.pages()[0];

    for (let pageNum = 1; pageNum <= maxPage; pageNum++) {
        // 断点续传：跳过已采集的页码
        if (progress.completedListPages.includes(pageNum)) {
            log(`⏭️ 跳过已采集的第 ${pageNum} 页`);
            continue;
        }

        const listUrl = `${BASE_URL}/all/${pageNum}`;
        log(`📄 正在采集第 ${pageNum}/${maxPage} 页: ${listUrl}`);
        await page.goto(listUrl, { waitUntil: "networkidle" });

        // 从 Next.js RSC 内联 <script> 中提取帖子 UID
        // 数据在 self.__next_f.push() 的字符串参数里，包含 topicListInit 对象
        // 每个帖子以 "id":"数字","uid":"xxx" 格式存在
        try {
            const postUids = await page.evaluate(() => {
                const scripts = document.querySelectorAll('script');
                const results: string[] = [];

                for (const script of scripts) {
                    const text = script.textContent || '';
                    if (!text.includes('topicListInit')) continue;

                    // 反转义：将 \" 变回 " 以便正则匹配
                    const unescaped = text.replace(/\\"/g, '"');

                    // 匹配帖子对象开头：id 为纯数字，uid 为字母数字
                    // 这样可以精确匹配帖子，排除标签等其他实体
                    const postPattern = /"id":"\d+","uid":"([a-z0-9]+)"/g;
                    let match;
                    while ((match = postPattern.exec(unescaped)) !== null) {
                        if (!results.includes(match[1])) {
                            results.push(match[1]);
                        }
                    }
                }
                return results;
            });

            if (postUids && postUids.length > 0) {
                // 构造详情页 URL：统一使用 /tutorial/detail/{uid}
                for (const uid of postUids) {
                    const postUrl = `${BASE_URL}/tutorial/detail/${uid}`;
                    if (!progress.allPostUrls.includes(postUrl)) {
                        progress.allPostUrls.push(postUrl);
                    }
                }
                log(`  ✅ 第 ${pageNum} 页提取到 ${postUids.length} 个帖子`);
            } else {
                log(`  ⚠️ 第 ${pageNum} 页未提取到帖子数据`);
            }
        } catch (err) {
            log(`  ❌ 第 ${pageNum} 页提取失败: ${err}`);
        }

        // 标记当前页已完成并保存进度
        progress.completedListPages.push(pageNum);
        saveProgress(progress);

        // 随机延迟，避免请求过快
        if (pageNum < maxPage) {
            await randomDelay(MIN_DELAY, MAX_DELAY);
        }
    }

    log(`📋 列表页采集完成！共采集到 ${progress.allPostUrls.length} 个帖子链接`);
    return progress.allPostUrls;
}


/**
 * 逐条访问帖子详情页，通过 DOM 直接提取完整内容
 * 
 * 不再使用 AI 的 extract()，改为 page.evaluate() 直接读取 DOM，
 * 好处：
 *   - 不受 AI token 长度限制（长文帖子也能完整提取）
 *   - 速度更快（无需 AI 推理）
 *   - 不消耗 API token（省钱）
 * 
 * DOM 选择器说明：
 *   - 标题：<h1>
 *   - 正文：div.custom-html.prose（或 .prose）
 *   - 日期：span.text-gray-500（格式如 "2026-02-11 15:36"）
 *   - 作者/标签：从 Next.js RSC 内联脚本提取
 *   - 图片：正文区域内的 <img>
 *   - 视频：正文区域内的 <video> 或 <iframe>
 * 
 * @param stagehand - Stagehand 实例
 * @param postUrls - 帖子URL列表
 * @param testMode - 是否为测试模式（只采集3篇）
 */
async function scrapePostDetails(
    stagehand: Stagehand,
    postUrls: string[],
    testMode: boolean = false
): Promise<void> {
    log("📝 阶段二：开始采集帖子详情...");

    const progress = loadProgress();
    const page = stagehand.context.pages()[0];

    // 测试模式只采集前3篇
    const urlsToScrape = testMode ? postUrls.slice(0, 3) : postUrls;
    let completed = 0;
    const total = urlsToScrape.length;

    for (const postUrl of urlsToScrape) {
        // 从URL提取帖子ID（即 uid）
        const postId = getPostIdFromUrl(postUrl);

        // 断点续传：跳过已采集的帖子
        if (
            progress.completedDetailUrls.includes(postUrl) ||
            isPostScraped(postId)
        ) {
            completed++;
            log(`⏭️ [${completed}/${total}] 跳过已采集: ${postId}`);
            continue;
        }

        completed++;
        log(`📝 [${completed}/${total}] 正在采集: ${postUrl}`);

        try {
            // 访问帖子详情页
            await page.goto(postUrl, { waitUntil: "networkidle" });

            // 等待页面内容加载完成
            await page.waitForTimeout(2000);

            // 通过 DOM 直接提取帖子数据（一次 evaluate 获取所有字段）
            const postData = await page.evaluate(() => {
                // --- 1. 标题：从 <h1> 标签提取 ---
                const h1 = document.querySelector('h1');
                const title = h1?.textContent?.trim() || '';

                // --- 2. 正文HTML：从 .prose 容器提取 ---
                // .custom-html.prose 是帖子正文的容器
                const proseEl = document.querySelector('div.custom-html.prose')
                    || document.querySelector('.prose');
                const content = proseEl?.innerHTML?.trim() || '';

                // --- 3. 发布日期：从 span.text-gray-500 提取 ---
                // 日期格式如 "2026-02-11 15:36"
                const dateSpans = document.querySelectorAll('span.text-gray-500');
                let publishDate = '';
                const datePattern = /\d{4}-\d{1,2}-\d{1,2}/;
                for (const span of dateSpans) {
                    const text = span.textContent?.trim() || '';
                    if (datePattern.test(text)) {
                        publishDate = text;
                        break;
                    }
                }

                // --- 4. 作者和标签：从 RSC 内联脚本提取 ---
                // Next.js RSC 数据包含完整帖子信息
                let author = '';
                let tags: string[] = [];
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const text = script.textContent || '';
                    if (!text.includes('user_name')) continue;

                    // 反转义 \" → "
                    const unescaped = text.replace(/\\"/g, '"');

                    // 提取作者名
                    const authorMatch = unescaped.match(/"user_name":"([^"]+)"/);
                    if (authorMatch) author = authorMatch[1];

                    // 提取标签：tag_list 数组中每个对象的 name 字段
                    const tagPattern = /"tag_list":\[([^\]]*)\]/;
                    const tagListMatch = unescaped.match(tagPattern);
                    if (tagListMatch) {
                        const tagNamePattern = /"name":"([^"]+)"/g;
                        let tagMatch;
                        while ((tagMatch = tagNamePattern.exec(tagListMatch[1])) !== null) {
                            if (!tags.includes(tagMatch[1])) {
                                tags.push(tagMatch[1]);
                            }
                        }
                    }

                    // 只需要处理第一个匹配的脚本
                    if (author) break;
                }

                // --- 5. 作者头像：查找作者名附近的图片 ---
                let authorAvatar = '';
                if (author) {
                    // 查找包含作者名的元素
                    const authorEls = Array.from(document.querySelectorAll('p, span, div'))
                        .filter(el => el.textContent?.trim() === author);

                    for (const el of authorEls) {
                        // 向上找父级容器，再在其中找图片
                        let parent = el.parentElement;
                        for (let i = 0; i < 3; i++) { // 最多向上找3层
                            if (!parent) break;
                            const imgs = parent.querySelectorAll('img');
                            for (const img of imgs) {
                                // 排除非常小的图标（如16x16），或者根据类名判断
                                // 通常头像会有 rounded-full 类，或者是正方形
                                const w = img.naturalWidth || img.width;
                                if (w > 20) {
                                    authorAvatar = img.src;
                                    break;
                                }
                            }
                            if (authorAvatar) break;
                            parent = parent.parentElement;
                        }
                        if (authorAvatar) break;
                    }
                }

                // --- 6. 图片：从正文区域内的 <img> 提取 ---
                const images: string[] = [];
                if (proseEl) {
                    const imgs = proseEl.querySelectorAll('img');
                    for (const img of imgs) {
                        const src = img.src || img.getAttribute('data-src') || '';
                        if (src && !images.includes(src)) {
                            images.push(src);
                        }
                    }
                }

                // --- 7. 视频：从正文区域内的 <video> 和 <iframe> 提取 ---
                const videos: string[] = [];
                if (proseEl) {
                    // video 标签
                    const videoEls = proseEl.querySelectorAll('video');
                    for (const v of videoEls) {
                        const src = v.src || v.querySelector('source')?.src || '';
                        if (src && !videos.includes(src)) {
                            videos.push(src);
                        }
                    }
                    // iframe（如 YouTube 嵌入）
                    const iframes = proseEl.querySelectorAll('iframe');
                    for (const iframe of iframes) {
                        const src = iframe.src || '';
                        if (src && !videos.includes(src)) {
                            videos.push(src);
                        }
                    }
                }

                return { title, content, publishDate, author, authorAvatar, tags, images, videos };
            });

            // 构建完整的帖子数据对象
            const fullPost: PostDetail = {
                url: postUrl,
                title: postData.title || "",
                author: postData.author || "",
                authorAvatar: postData.authorAvatar || "",
                tags: postData.tags || [],
                content: postData.content || "",
                publishDate: postData.publishDate || "",
                images: postData.images || [],
                videos: postData.videos || [],
                scrapedAt: new Date().toISOString(),  // 记录采集时间
            };

            // ---- 处理作者头像 (下载 -> 上传OSS -> 更新链接) ----
            if (fullPost.authorAvatar) {
                log(`  👤 处理作者头像...`);
                let ext = getExtFromUrl(fullPost.authorAvatar);
                if (!ext || ext === '.bin') ext = '.jpg';
                const fileName = `${postId}_avatar${ext}`;
                const savePath = path.join(IMAGES_DIR, fileName);

                const success = await downloadFile(fullPost.authorAvatar, savePath);
                if (success) {
                    const ossUrl = await uploadToOSS(savePath);
                    if (ossUrl) {
                        fullPost.authorAvatar = ossUrl;
                    }
                }
            }

            // ---- 处理图片 (下载 -> 上传OSS -> 替换内容链接) ----
            if (fullPost.images.length > 0) {
                log(`  🖼️ 处理 ${fullPost.images.length} 张图片...`);
                for (let i = 0; i < fullPost.images.length; i++) {
                    const imgUrl = fullPost.images[i];
                    const ext = getExtFromUrl(imgUrl);
                    // 文件名格式: 帖子ID_img序号.扩展名
                    const fileName = `${postId}_img${i + 1}${ext}`;
                    const savePath = path.join(IMAGES_DIR, fileName);

                    // 1. 下载到本地
                    const success = await downloadFile(imgUrl, savePath);

                    if (success) {
                        // 2. 上传到 OSS
                        const ossUrl = await uploadToOSS(savePath);

                        // 3. 替换内容中的链接
                        if (ossUrl) {
                            // 使用全局替换 (split+join) 避免正则转义问题
                            fullPost.content = fullPost.content.split(imgUrl).join(ossUrl);
                            // 更新 images 数组中的链接
                            fullPost.images[i] = ossUrl;
                        }
                    }
                }
            }

            // ---- 处理视频 (下载 -> 上传OSS -> 替换内容链接) ----
            if (fullPost.videos.length > 0) {
                log(`  🎬 处理 ${fullPost.videos.length} 个视频...`);
                for (let i = 0; i < fullPost.videos.length; i++) {
                    const videoUrl = fullPost.videos[i];
                    const ext = getExtFromUrl(videoUrl);
                    const fileName = `${postId}_video${i + 1}${ext}`;
                    const savePath = path.join(VIDEOS_DIR, fileName);

                    // 1. 下载到本地
                    const success = await downloadFile(videoUrl, savePath);

                    if (success) {
                        // 2. 上传到 OSS
                        const ossUrl = await uploadToOSS(savePath);

                        // 3. 替换内容中的链接
                        if (ossUrl) {
                            fullPost.content = fullPost.content.split(videoUrl).join(ossUrl);
                            fullPost.videos[i] = ossUrl;
                        }
                    }
                }
            }

            // 保存帖子数据到本地 JSON 文件
            savePost(postId, fullPost);

            // 更新进度
            progress.completedDetailUrls.push(postUrl);
            // 如果之前失败过，从失败列表中移除
            progress.failedDetailUrls = progress.failedDetailUrls.filter(
                (u) => u !== postUrl
            );
            saveProgress(progress);

            log(`  ✅ 采集成功: ${fullPost.title}`);
        } catch (err) {
            log(`  ❌ 采集失败: ${postUrl} - ${err}`);

            // 记录失败的URL，方便后续重试
            if (!progress.failedDetailUrls.includes(postUrl)) {
                progress.failedDetailUrls.push(postUrl);
            }
            saveProgress(progress);
        }

        // 随机延迟
        await randomDelay(MIN_DELAY, MAX_DELAY);
    }

    // 输出采集统计
    const finalProgress = loadProgress();
    log("=".repeat(50));
    log("📊 采集统计：");
    log(`  总帖子数: ${total}`);
    log(`  成功: ${finalProgress.completedDetailUrls.length}`);
    log(`  失败: ${finalProgress.failedDetailUrls.length}`);
    log("=".repeat(50));
}


// ============================================================
// 主函数
// ============================================================

async function main() {
    // 检查命令行参数是否包含 --test
    const testMode = process.argv.includes("--test");
    if (testMode) {
        log("🧪 测试模式：只采集少量数据");
    }

    // 1. 初始化数据目录
    initDataDirs();

    // 2. 初始化 Stagehand
    log("🚀 正在启动 Stagehand 浏览器...");
    const stagehand = new Stagehand({
        env: "LOCAL",                     // 使用本地 Chrome 浏览器
        // 使用 Google Gemini 模型驱动 AI 提取
        // model 格式: { modelName: "provider/model-name", apiKey: "..." }
        model: {
            modelName: "google/gemini-2.0-flash",
            apiKey: process.env.GOOGLE_API_KEY,
        },
    });

    await stagehand.init();
    log("✅ 浏览器启动成功");

    // 3. 注入 Cookie（登录态）
    // Stagehand V3 使用 CDP（Chrome DevTools Protocol）
    // Network.setCookie 是页面级方法，需要通过 page.sendCDP() 调用
    // 步骤：先导航到目标域名 → 注入Cookie → reload使Cookie生效
    log("🍪 正在注入 Cookie...");
    const cookieString = process.env.WEBCAFE_COOKIE;

    if (!cookieString) {
        throw new Error("❌ 未找到 WEBCAFE_COOKIE 环境变量！请在 .env 文件中配置");
    }

    // 解析 Cookie 字符串
    const cookies = parseCookies(cookieString, "new.web.cafe");

    // 先获取页面并导航到目标域名（需要在目标域名下才能设置 Cookie）
    const page = stagehand.context.pages()[0];
    await page.goto(`${BASE_URL}`, { waitUntil: "domcontentloaded" });

    // 通过页面级 CDP 逐条注入每个 Cookie
    // page.sendCDP() 发送到页面的 CDP session（而非根浏览器连接）
    // Network.setCookie（单数）是 CDP 标准方法，每次设置一个 Cookie
    for (const c of cookies) {
        await page.sendCDP("Network.setCookie", {
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path,
            secure: c.secure,
            httpOnly: c.httpOnly,
            // HTTPS 站点需要 sameSite 设置
            sameSite: c.secure ? "None" : "Lax",
            // 设置过期时间为30天后（Unix 时间戳，单位秒）
            expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });
    }
    log(`✅ 已通过 CDP 注入 ${cookies.length} 个 Cookie`);

    // 4. reload 页面使 Cookie 生效，然后验证登录状态
    await page.goto(`${BASE_URL}`, { waitUntil: "networkidle" });

    // 用 extract 检测是否已登录
    const loginCheck = await stagehand.extract(
        "检查页面上是否显示了用户头像或用户名，表明当前已登录。如果看到登录按钮则表示未登录。",
        z.object({
            isLoggedIn: z.boolean().describe("是否已登录"),
            userName: z.string().optional().describe("用户名（如果已登录）"),
        })
    );

    if (!loginCheck.isLoggedIn) {
        log("⚠️ Cookie 可能已过期，未检测到登录状态。继续尝试采集...");
    } else {
        log(`✅ 登录验证成功！当前用户: ${loginCheck.userName || "未知"}`);
    }

    // 解析 --max-pages 参数
    let maxPagesOverride: number | undefined;
    const maxPagesArg = process.argv.find(arg => arg.startsWith("--max-pages="));
    if (maxPagesArg) {
        maxPagesOverride = parseInt(maxPagesArg.split("=")[1], 10);
        log(`🔧 设置最大采集页数: ${maxPagesOverride}`);
    }

    // 5. 阶段一：采集列表页
    const postUrls = await scrapeListPages(stagehand, testMode, maxPagesOverride);

    if (postUrls.length === 0) {
        log("❌ 未采集到任何帖子链接，请检查 Cookie 是否有效");
        await stagehand.close();
        return;
    }

    // 6. 阶段二：采集帖子详情
    await scrapePostDetails(stagehand, postUrls, testMode);

    // 7. 关闭浏览器
    await stagehand.close();
    log("🎉 采集完成！");
}

// ============================================================
// 启动
// ============================================================
main().catch((err) => {
    console.error("💥 脚本执行出错:", err);
    process.exit(1);
});
