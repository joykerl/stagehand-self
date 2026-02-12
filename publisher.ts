import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Load API config
const API_ENDPOINT = process.env.API_ENDPOINT;
const API_COOKIE = process.env.API_COOKIE;

if (!API_ENDPOINT || !API_COOKIE) {
    console.error("❌ Missing API_ENDPOINT or API_COOKIE in .env");
    process.exit(1);
}

const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');
const SENT_DIR = path.join(process.cwd(), 'data', 'posts', 'sent');

// Ensure sent directory exists
if (!fs.existsSync(SENT_DIR)) {
    fs.mkdirSync(SENT_DIR, { recursive: true });
}

async function publishPosts() {
    console.log("🚀 Starting publisher...");
    console.log(`📡 Endpoint: ${API_ENDPOINT}`);

    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} posts to publish.`);

    let successCount = 0;
    let failCount = 0;

    for (const file of files) {
        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        let post;
        try {
            post = JSON.parse(content);
        } catch (e) {
            console.error(`❌ Failed to parse ${file}: ${e}`);
            failCount++;
            continue;
        }

        // Construct payload
        // API Requirement:
        // {
        //     "show_title": "Article with Auto-Created Author",
        //     "article_content": "This article will be posted by a new user if the ID is not found.",
        //     "source_channel": "SEO",
        //     "author_user_id": "", 
        //     "author_name": "New Author Name",
        //     "author_avatar": "https://example.com/avatar.png",
        //     "tags": "AutoUser,Test",
        //     "menu_ids": ""
        // }

        const payload = {
            show_title: post.title,
            article_content: post.content,
            source_channel: "SEO",
            author_user_id: "",
            author_name: post.author,
            author_avatar: post.authorAvatar || "",
            tags: post.tags ? post.tags.join(",") : "",
            menu_ids: ""
        };

        try {
            console.log(`📤 Publishing: ${post.title} (${file})...`);
            const response = await fetch(API_ENDPOINT!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': API_COOKIE!
                },
                body: JSON.stringify(payload)
            });

            const responseText = await response.text();
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = responseText;
            }

            if (response.ok) {
                console.log(`  ✅ Success: ${response.status}`);
                // Move to sent folder
                const sentPath = path.join(SENT_DIR, file);
                fs.renameSync(filePath, sentPath);
                successCount++;
            } else {
                console.error(`  ❌ Failed: ${response.status} - ${JSON.stringify(responseData)}`);
                failCount++;
            }
        } catch (error) {
            console.error(`  ❌ Network Error: ${error}`);
            failCount++;
        }

        // Rate limit logging/delay if needed
    }

    console.log("=".repeat(50));
    console.log(`📊 Publish Summary:`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log("=".repeat(50));
}

publishPosts().catch(console.error);
