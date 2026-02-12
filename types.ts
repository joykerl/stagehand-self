/**
 * types.ts - Web.Cafe 论坛采集的类型定义
 * 
 * 定义了帖子数据的结构，包括列表页和详情页的数据格式
 */

// ============================================================
// 列表页提取的帖子摘要信息
// ============================================================
export interface PostSummary {
    /** 帖子标题 */
    title: string;
    /** 帖子详情页URL */
    url: string;
    /** 作者名 */
    author: string;
    /** 标签列表 */
    tags: string[];
}

// ============================================================
// 详情页提取的完整帖子内容
// ============================================================
export interface PostDetail {
    /** 帖子详情页URL（唯一标识） */
    url: string;
    /** 帖子标题 */
    title: string;
    /** 作者名 */
    author: string;
    /** 作者头像URL */
    authorAvatar: string;
    /** 标签列表 */
    tags: string[];
    /** 正文内容（HTML格式） */
    content: string;
    /** 发布时间 */
    publishDate: string;
    /** 图片URL列表 */
    images: string[];
    /** 视频URL列表 */
    videos: string[];
    /** 采集时间 */
    scrapedAt: string;
}

// ============================================================
// 采集进度跟踪
// ============================================================
export interface ScrapeProgress {
    /** 已采集的列表页码（用于断点续传） */
    completedListPages: number[];
    /** 所有帖子URL */
    allPostUrls: string[];
    /** 已采集详情的帖子URL */
    completedDetailUrls: string[];
    /** 采集失败的帖子URL */
    failedDetailUrls: string[];
    /** 最后更新时间 */
    lastUpdated: string;
}
