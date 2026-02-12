/**
 * debug-links.ts v6 - 最终诊断：
 * 1. 从 RSC 提取完整帖子数据（包括 section 字段）
 * 2. 点击帖子后等待页面变化，检查弹窗/路由
 * 3. 用浏览器测试 detail URL 模式
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

    await page.goto(`${BASE_URL}/all/1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // ====== 提取 RSC 数据的关键字段 ======
    console.log("\n=== 完整 RSC 帖子数据（第一个帖子） ===\n");

    const fullPostData = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script');

        for (const script of scripts) {
            const text = script.textContent || '';
            if (!text.includes('topicListInit')) {
                continue;
            }

            // 反转义
            const unescaped = text.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            // 提取 topicListInit 后面的 data 数组中第一个对象的所有字段
            // 尝试用更宽泛的模式提取第一个完整的帖子对象
            const dataStart = unescaped.indexOf('"data":[{');
            if (dataStart === -1) return { error: 'data array not found' };

            // 从 data 开始提取前 2000 字符，以便看到完整的第一个对象
            const snippet = unescaped.slice(dataStart, dataStart + 2000);

            // 尝试提取第一个对象（从 [{ 到第一个 },{ 或 }]）
            const objMatch = snippet.match(/\[\{(.*?)\},\{/s);
            const firstObj = objMatch ? objMatch[1] : snippet.slice(0, 800);

            return {
                firstObjectRaw: firstObj.slice(0, 1000),
                dataSnippet: snippet.slice(0, 1500),
            };
        }
        return { error: 'topicListInit not found' };
    });

    console.log(JSON.stringify(fullPostData, null, 2));

    // ====== 在浏览器中测试各种 detail URL ======
    console.log("\n\n=== 在浏览器中测试 detail URL（带Cookie） ===\n");

    const testUid = 'liu7r1wxjv'; // 第一个帖子的 uid
    const testUrls = [
        `/topic/detail/${testUid}`,
        `/topics/detail/${testUid}`,
        `/experience/detail/${testUid}`,
        `/tutorial/detail/${testUid}`,
        `/all/detail/${testUid}`,
        `/post/${testUid}`,
        `/post/detail/${testUid}`,
    ];

    for (const path of testUrls) {
        const url = `${BASE_URL}${path}`;
        try {
            const result = await page.evaluate(async (testUrl) => {
                const res = await fetch(testUrl, { credentials: 'include' });
                const text = await res.text();
                // 检查是否包含帖子标题
                const hasTitle = text.includes('2.11小白成长记录');
                const title = text.match(/<title>([^<]*)<\/title>/)?.[1] || '';
                return {
                    status: res.status,
                    hasTitle,
                    pageTitle: title,
                    length: text.length,
                };
            }, url);
            console.log(`  ${path}: [${result.status}] title="${result.pageTitle}" hasContent=${result.hasTitle} length=${result.length}`);
        } catch (err) {
            console.log(`  ${path}: ERROR - ${err}`);
        }
    }

    // ====== 点击帖子并观察 DOM 变化 ======
    console.log("\n\n=== 点击帖子卡片（整个div） ===\n");

    // 回到列表页
    await page.goto(`${BASE_URL}/all/1`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 先获取帖子卡片 div 的准确选择器
    const cardCount = await page.evaluate(() => {
        return document.querySelectorAll('div[class*="cursor-pointer"][class*="justify-between"]').length;
    });
    console.log(`找到 ${cardCount} 个帖子卡片`);

    // 用 evaluate 直接点击第一个卡片
    const clickResult = await page.evaluate(() => {
        const cards = document.querySelectorAll<HTMLElement>('div[class*="cursor-pointer"][class*="justify-between"]');
        if (cards.length > 0) {
            cards[0].click();
            return 'clicked';
        }
        return 'no card found';
    });
    console.log(`点击结果: ${clickResult}`);

    // 等待可能的路由变化/弹窗
    await page.waitForTimeout(3000);

    // 检查 URL
    const currentUrl = await page.evaluate(() => window.location.href);
    console.log(`当前 URL: ${currentUrl}`);

    // 检查是否出现了弹窗/模态框
    const modalCheck = await page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="popup"], [class*="overlay"], [class*="drawer"]');
        return Array.from(modals).map(m => ({
            tag: m.tagName,
            className: (m.className || '').toString().slice(0, 100),
            visible: (m as HTMLElement).offsetHeight > 0,
            innerHTML: m.innerHTML.slice(0, 300),
        }));
    });
    console.log(`\n弹窗/模态框: ${modalCheck.length} 个`);
    for (const m of modalCheck) {
        console.log(`  <${m.tag} class="${m.className}"> visible=${m.visible}`);
        console.log(`  content: ${m.innerHTML.slice(0, 200)}`);
    }

    // 检查页面上是否出现了帖子详情内容
    const pageContent = await page.evaluate(() => {
        // 看看 body 中是否出现了完整的帖子正文
        const html = document.body.innerHTML;
        return {
            bodyLength: html.length,
            hasDetailContent: html.includes('2.11小白成长记录'),
            // 尝试找到新出现的大块文本区域
            largeTextAreas: Array.from(document.querySelectorAll('div, article, section'))
                .filter(el => (el as HTMLElement).offsetHeight > 300 && el.textContent!.length > 500)
                .map(el => ({
                    tag: el.tagName,
                    className: (el.className || '').toString().slice(0, 80),
                    text: el.textContent!.slice(0, 200),
                })),
        };
    });
    console.log(`\n页面内容: bodyLength=${pageContent.bodyLength}, hasDetail=${pageContent.hasDetailContent}`);
    console.log(`大块文本区域: ${pageContent.largeTextAreas.length}`);
    for (const area of pageContent.largeTextAreas.slice(0, 3)) {
        console.log(`  <${area.tag} class="${area.className}"> text="${area.text.slice(0, 100)}"`);
    }

    await stagehand.close();
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
