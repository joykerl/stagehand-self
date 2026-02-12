/**
 * debug-detail-dom.ts - 检查帖子详情页的 DOM 结构
 * 用于确定 page.evaluate() 中使用的 CSS 选择器
 */

import "dotenv/config";
import { Stagehand } from "@browserbasehq/stagehand";
import { parseCookies } from "./utils.js";

const BASE_URL = "https://new.web.cafe";

async function main() {
    const stagehand = new Stagehand({
        env: "LOCAL",
        model: {
            modelName: "google/gemini-2.0-flash",
            apiKey: process.env.GOOGLE_API_KEY,
        },
    });

    await stagehand.init();
    const page = stagehand.context.pages()[0];

    // 注入 Cookie
    const cookieString = process.env.WEBCAFE_COOKIE!;
    const cookies = parseCookies(cookieString, "new.web.cafe");
    await page.goto(`${BASE_URL}`, { waitUntil: "domcontentloaded" });
    for (const c of cookies) {
        await page.sendCDP("Network.setCookie", {
            name: c.name, value: c.value, domain: c.domain,
            path: c.path, secure: c.secure, httpOnly: c.httpOnly,
            sameSite: c.secure ? "None" : "Lax",
            expires: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });
    }

    // 访问一个已知的帖子详情页
    const testUrl = `${BASE_URL}/tutorial/detail/liu7r1wxjv`;
    console.log(`\n=== 访问详情页: ${testUrl} ===\n`);
    await page.goto(testUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // ====== 1. 页面标题区域 ======
    const titleInfo = await page.evaluate(() => {
        // 检查 h1, h2, h3 等标题
        const h1 = document.querySelector('h1');
        const h2 = document.querySelector('h2');
        const allHeaders = document.querySelectorAll('h1, h2, h3');

        return {
            h1: h1 ? { text: h1.textContent?.trim(), className: h1.className, parent: h1.parentElement?.className } : null,
            h2: h2 ? { text: h2.textContent?.trim(), className: h2.className } : null,
            headerCount: allHeaders.length,
            allHeaders: Array.from(allHeaders).slice(0, 5).map(h => ({
                tag: h.tagName,
                text: h.textContent?.trim().slice(0, 80),
                className: (h.className || '').toString().slice(0, 80),
            })),
        };
    });
    console.log("=== 标题信息 ===");
    console.log(JSON.stringify(titleInfo, null, 2));

    // ====== 2. 主要内容区域 ======
    const contentInfo = await page.evaluate(() => {
        // 检查常见内容容器
        const selectors = [
            'article', '.content', '.post-content', '.article-content',
            '[class*="content"]', '[class*="article"]', '[class*="body"]',
            'main', '.prose', '.markdown-body', '.ql-editor',
            '[class*="detail"]', '[class*="post-body"]',
        ];

        const found: Array<{ selector: string; tag: string; className: string; textLength: number; htmlLength: number; sampleHTML: string }> = [];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                if ((el as HTMLElement).offsetHeight > 100 && el.textContent!.length > 100) {
                    found.push({
                        selector: sel,
                        tag: el.tagName,
                        className: (el.className || '').toString().slice(0, 100),
                        textLength: el.textContent!.length,
                        htmlLength: el.innerHTML.length,
                        sampleHTML: el.innerHTML.slice(0, 300),
                    });
                }
            }
        }

        return found.slice(0, 10);
    });
    console.log("\n=== 内容区域 ===");
    for (const c of contentInfo) {
        console.log(`  [${c.selector}] <${c.tag} class="${c.className}"> text=${c.textLength} html=${c.htmlLength}`);
        console.log(`    ${c.sampleHTML.slice(0, 200)}`);
    }

    // ====== 3. 作者和日期 ======
    const metaInfo = await page.evaluate(() => {
        // 搜索包含日期格式的元素
        const allElements = document.querySelectorAll('p, span, time, div');
        const datePattern = /\d{4}[-.\/]\d{1,2}[-.\/]\d{1,2}/;
        const dates: Array<{ tag: string; className: string; text: string }> = [];
        const possibleAuthors: Array<{ tag: string; className: string; text: string }> = [];

        for (const el of allElements) {
            const text = (el.textContent || '').trim();
            if (datePattern.test(text) && text.length < 50) {
                dates.push({
                    tag: el.tagName,
                    className: (el.className || '').toString().slice(0, 80),
                    text,
                });
            }
        }

        // 面包屑导航
        const breadcrumbs = document.querySelectorAll('nav a, ol a, [class*="breadcrumb"] a');
        const bcList = Array.from(breadcrumbs).map(a => ({
            text: a.textContent?.trim(),
            href: (a as HTMLAnchorElement).href,
        }));

        return {
            dates: dates.slice(0, 5),
            breadcrumbs: bcList.slice(0, 10),
        };
    });
    console.log("\n=== 日期元素 ===");
    for (const d of metaInfo.dates) {
        console.log(`  <${d.tag} class="${d.className}"> "${d.text}"`);
    }
    console.log("\n=== 面包屑 ===");
    for (const b of metaInfo.breadcrumbs) {
        console.log(`  "${b.text}" → ${b.href}`);
    }

    // ====== 4. 标签 ======
    const tagInfo = await page.evaluate(() => {
        // 搜索标签相关元素
        const selectors = ['[class*="tag"]', '[class*="label"]', '[class*="badge"]'];
        const tags: Array<{ selector: string; tag: string; className: string; text: string; href?: string }> = [];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            for (const el of els) {
                const text = (el.textContent || '').trim();
                if (text.length > 0 && text.length < 30) {
                    tags.push({
                        selector: sel,
                        tag: el.tagName,
                        className: (el.className || '').toString().slice(0, 80),
                        text,
                        href: (el as HTMLAnchorElement).href || undefined,
                    });
                }
            }
        }

        return tags.slice(0, 15);
    });
    console.log("\n=== 标签 ===");
    for (const t of tagInfo) {
        console.log(`  [${t.selector}] <${t.tag} class="${t.className}"> "${t.text}" ${t.href ? `→ ${t.href}` : ''}`);
    }

    // ====== 5. 图片 ======
    const imageInfo = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        return Array.from(imgs)
            .filter(img => {
                // 排除小图标、头像
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                return (w > 50 && h > 50) || img.src.includes('upload') || img.src.includes('image');
            })
            .map(img => ({
                src: img.src.slice(0, 200),
                alt: img.alt,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
                parentClass: (img.parentElement?.className || '').toString().slice(0, 60),
            }));
    });
    console.log("\n=== 图片 ===");
    for (const img of imageInfo) {
        console.log(`  ${img.width}x${img.height} ${img.alt ? `alt="${img.alt}"` : ''} parent="${img.parentClass}"`);
        console.log(`    src: ${img.src}`);
    }

    // ====== 6. 视频 ======
    const videoInfo = await page.evaluate(() => {
        const videos = document.querySelectorAll('video, iframe[src*="video"], [class*="video"]');
        return Array.from(videos).map(v => ({
            tag: v.tagName,
            src: (v as HTMLVideoElement).src || (v as HTMLIFrameElement).src || '',
            className: (v.className || '').toString().slice(0, 60),
        }));
    });
    console.log("\n=== 视频 ===");
    if (videoInfo.length === 0) console.log("  无视频");
    for (const v of videoInfo) {
        console.log(`  <${v.tag} class="${v.className}"> src="${v.src}"`);
    }

    // ====== 7. 作者信息 ======
    const authorInfo = await page.evaluate(() => {
        // 看帖子元数据的区域（通常在标题下方）
        const allP = document.querySelectorAll('p, span');
        // 从 RSC 数据中找用户名
        const scripts = document.querySelectorAll('script');
        let authorFromRSC = '';
        let dateFromRSC = '';
        for (const script of scripts) {
            const text = script.textContent || '';
            if (text.includes('user_name')) {
                const unescaped = text.replace(/\\"/g, '"');
                const nameMatch = unescaped.match(/"user_name":"([^"]+)"/);
                if (nameMatch) authorFromRSC = nameMatch[1];
                const dateMatch = unescaped.match(/"created_at":"\$D([^"]+)"/);
                if (dateMatch) dateFromRSC = dateMatch[1];
            }
        }
        return { authorFromRSC, dateFromRSC };
    });
    console.log("\n=== RSC 中的作者和日期 ===");
    console.log(`  author: ${authorInfo.authorFromRSC}`);
    console.log(`  date: ${authorInfo.dateFromRSC}`);

    // ====== 8. 完整页面结构快照 ======
    const pageStructure = await page.evaluate(() => {
        // 获取 body 下的第一层和第二层结构
        const body = document.body;
        const structure: string[] = [];

        function describe(el: Element, depth: number) {
            if (depth > 2) return;
            const tag = el.tagName;
            const cls = (el.className || '').toString().slice(0, 60);
            const text = (el.textContent || '').trim().slice(0, 40);
            const childCount = el.children.length;
            structure.push(`${'  '.repeat(depth)}<${tag} class="${cls}"> children=${childCount} text="${text}"`);
            if (depth < 2) {
                for (const child of el.children) {
                    describe(child, depth + 1);
                }
            }
        }

        for (const child of body.children) {
            describe(child, 0);
        }
        return structure.slice(0, 40);
    });
    console.log("\n=== 页面结构 ===");
    for (const line of pageStructure) {
        console.log(line);
    }

    await stagehand.close();
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
