import 'dotenv/config';

// Load API config
const API_ENDPOINT = process.env.API_ENDPOINT;
const API_COOKIE = process.env.API_COOKIE;

if (!API_ENDPOINT || !API_COOKIE) {
    console.warn("⚠️ Missing API_ENDPOINT or API_COOKIE in .env. Publishing will be skipped.");
}

export async function publishPost(post: any): Promise<{ success: boolean; status?: number; error?: string }> {
    if (!API_ENDPOINT || !API_COOKIE) {
        return { success: false, error: "Configuration missing" };
    }

    const payload = {
        show_title: post.title,
        article_content: post.content,
        // Ensure source_channel is explicitly set to SEO as requested
        source_channel: "SEO",
        author_user_id: "",
        author_name: post.author,
        author_avatar: post.authorAvatar || "",
        tags: post.tags ? post.tags.join(",") : "",
        menu_ids: ""
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': API_COOKIE
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        if (response.ok) {
            return { success: true, status: response.status };
        } else {
            return { success: false, status: response.status, error: responseText.substring(0, 200) };
        }
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
