/**
 * debug-avatar.ts - 专门用于查找帖子详情页的作者头像
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

    // 访问一个已知的帖子详情页 (qs4ntkvf81 - 乐舒)
    const testUrl = `${BASE_URL}/tutorial/detail/qs4ntkvf81`;
    console.log(`\n=== 访问详情页: ${testUrl} ===\n`);
    await page.goto(testUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // 提取头像信息
    const avatarInfo = await page.evaluate(() => {
        // 1. 从 DOM 查找
        // 策略A：查找 rounded-full 的图片
        const roundedImgs = Array.from(document.querySelectorAll('img.rounded-full, .rounded-full img'));

        // 策略B：查找作者名附近的图片
        // 先找到作者名 "乐舒"
        const authorElements = Array.from(document.querySelectorAll('p, span, div')).filter(el => el.textContent?.trim() === '乐舒');
        const authorNearImgs: any[] = [];
        for (const el of authorElements) {
            // 向上找父级，再找图片
            let parent = el.parentElement;
            for (let i = 0; i < 3; i++) {
                if (!parent) break;
                const imgs = parent.querySelectorAll('img');
                for (const img of imgs) {
                    authorNearImgs.push({
                        src: img.src,
                        distance: i,
                        parentClass: parent.className
                    });
                }
                parent = parent.parentElement;
            }
        }

        // 2. 从 RSC 数据查找
        let rscAvatar = '';
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent || '';
            if (text.includes('user_name')) {
                const unescaped = text.replace(/\\"/g, '"');
                // 尝试查找 avatar 相关的字段
                const avatarMatch = unescaped.match(/"avatar":"([^"]+)"/) ||
                    unescaped.match(/"avatar_url":"([^"]+)"/) ||
                    unescaped.match(/"user_avatar":"([^"]+)"/) ||
                    unescaped.match(/"picture":"([^"]+)"/);

                if (avatarMatch) {
                    rscAvatar = avatarMatch[1];
                    // 打印一部分 RSC 数据用于分析
                    const nameIdx = unescaped.indexOf('"user_name"');
                    console.log('RSC Sample around user_name:', unescaped.substring(nameIdx - 100, nameIdx + 300));
                }
            }
        }

        return {
            roundedImgs: roundedImgs.map(img => ({
                src: img.src,
                className: img.className,
                parentClass: img.parentElement?.className
            })),
            authorNearImgs,
            rscAvatar
        };
    });

    console.log("=== DOM 中找到的 Rounded 图片 ===");
    console.log(JSON.stringify(avatarInfo.roundedImgs, null, 2));

    console.log("\n=== 作者名附近的图片 ===");
    console.log(JSON.stringify(avatarInfo.authorNearImgs, null, 2));

    console.log("\n=== RSC 数据中的头像 ===");
    console.log(avatarInfo.rscAvatar || "Not Found in RSC regex");

    await stagehand.close();
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
