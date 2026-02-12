import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { publishPost } from './publish-util.js';
import { log } from './utils.js';

const POSTS_DIR = path.join(process.cwd(), 'data', 'posts');
const SENT_DIR = path.join(process.cwd(), 'data', 'posts', 'sent');
const FAILED_DIR = path.join(process.cwd(), 'data', 'posts', 'failed');

// Ensure directories exist
[POSTS_DIR, SENT_DIR, FAILED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

async function watchAndPublish() {
    log("🚀 Starting Watch-and-Publish Service...");
    log(`📂 Monitoring: ${POSTS_DIR}`);

    let totalSuccess = 0;
    let totalFailed = 0;

    while (true) {
        try {
            const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.json'));

            if (files.length > 0) {
                log(`🔍 Found ${files.length} new posts. Processing...`);

                for (const file of files) {
                    const filePath = path.join(POSTS_DIR, file);
                    let post;

                    try {
                        const content = fs.readFileSync(filePath, 'utf-8');
                        post = JSON.parse(content);
                    } catch (e) {
                        log(`❌ Failed to parse ${file}: ${e}`);
                        // Move to failed
                        fs.renameSync(filePath, path.join(FAILED_DIR, file));
                        totalFailed++;
                        continue;
                    }

                    log(`📤 Publishing: ${post.title} (${file})...`);
                    const result = await publishPost(post);

                    if (result.success) {
                        log(`  ✅ Success: ${result.status}`);
                        // Move to sent
                        fs.renameSync(filePath, path.join(SENT_DIR, file));
                        totalSuccess++;
                    } else {
                        log(`  ❌ Failed: ${result.status} - ${result.error}`);
                        // Move to failed (or keep to retry? better move to avoid blocking)
                        // For now, move to failed to keep queue clean.
                        fs.renameSync(filePath, path.join(FAILED_DIR, file));
                        totalFailed++;
                    }
                }

                log(`📊 Stats: Success ${totalSuccess}, Failed ${totalFailed}`);
            }
        } catch (err) {
            log(`❌ Watcher Error: ${err}`);
        }

        // Wait 10 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}

watchAndPublish().catch(console.error);
