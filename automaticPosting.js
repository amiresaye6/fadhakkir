const { postReel } = require("./postReelToInstagram");
const sendMessage = require("./sendMessage");
const fs = require("fs").promises;
require("dotenv").config();
const axios = require("axios");

// Import our TikTok API functions
const { getUserVideosData, getVideoDownloadLink } = require("./tiktok-api");

const TRACKER_FILE = "tracker.json";
const TIKTOK_DATA_FILE = "tiktok_videos_data.json";
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "11qurran"; // Default or from env

/**
 * Posts the next TikTok video to Instagram as a Reel
 * Designed to be run by cron job, once or twice daily
 */
async function postNextTikTokReel() {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`[${timestamp}] Starting TikTok to Instagram post process`);
  await sendMessage(`🔄 TikTok to Instagram automation started at ${timestamp}`);

  // Ensure required environment variables exist
  if (!process.env.PAGE_ACCESS_TOKEN?.trim() || !process.env.INSTAGRAM_BUSINESS_ID?.trim()) {
    const errorMsg = "⚠️ Missing environment variables: PAGE_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ID";
    console.error(errorMsg);
    await sendMessage(errorMsg);
    return;
  }

  // Load tracker file for progress tracking
  let tracker;
  try {
    const trackerData = await fs.readFile(TRACKER_FILE, "utf8");
    tracker = JSON.parse(trackerData);
  } catch (error) {
    console.log("No tracker file found, creating new one");
    tracker = { lastPostedIndex: -1 };
  }
  
  // Attempt to load the TikTok videos data file
  let videosData;
  try {
    const data = await fs.readFile(TIKTOK_DATA_FILE, "utf8");
    videosData = JSON.parse(data);
  } catch (error) {
    const errorMsg = `❌ No TikTok videos data file found (${TIKTOK_DATA_FILE}).\nPlease create one by running: node fetchTikTokVideos.js`;
    console.error(errorMsg);
    await sendMessage(errorMsg);
    return;
  }

  // Determine which video to post next
  const nextIndex = tracker.lastPostedIndex + 1;
  if (!videosData.videos || nextIndex >= videosData.videos.length) {
    await sendMessage(`⚠️ All videos in current batch have been posted (${videosData.videos?.length || 0} videos).\nPlease run: node fetchTikTokVideos.js to get fresh videos.`);
    return;
  }

  // Get the next video to post
  const video = videosData.videos[nextIndex];
  await sendMessage(`📋 Processing video ${nextIndex + 1}/${videosData.videos.length}`);
  
  try {
    // Get download link for the video
    const videoUrl = await getVideoDownloadLink(video.shareableURL);
    if (!videoUrl) {
      throw new Error("Failed to get video download link");
    }
    
    // Prepare caption and hashtags for Instagram
    const userName = videosData.user.nickname || videosData.user.uniqueId;
    const owner_fullname = videosData.user.nickname || "TikTok Creator";
    const caption = video.description;
    const hashtags = video.hashtags || [];

    // Post the reel to Instagram
    console.log(`Uploading video ID: ${video.id}`);
    const result = await postReel(videoUrl, caption, userName, owner_fullname, hashtags);
    if (!result.success) throw new Error(result.error);

    // Get Instagram permalink
    const mediaId = result.publishedMediaId;
    const permalinkResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        params: {
          fields: "permalink",
          access_token: process.env.PAGE_ACCESS_TOKEN,
        },
      }
    );
    const reelUrl = permalinkResponse.data.permalink;

    // Update tracker file
    tracker.lastPostedIndex = nextIndex;
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));

    // Send success notification with complete details
    const successMessage = `
✅ TikTok Reel posted successfully!
📱 Video ${nextIndex + 1}/${videosData.videos.length}
🕒 Posted at: ${new Date().toISOString().replace('T', ' ').substr(0, 19)}
📊 TikTok stats: ${video.stats?.views || 0} views, ${video.stats?.likes || 0} likes
🔗 Instagram URL: ${reelUrl}
📝 Caption: ${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}
🏷️ Hashtags: ${hashtags.join(', ')}
`;

    await sendMessage(successMessage);
    console.log(`Successfully posted video ${nextIndex + 1}/${videosData.videos.length}`);

  } catch (error) {
    const errorMessage = `❌ ERROR: Failed to post video ${nextIndex + 1}:\n${error.message}`;
    console.error(errorMessage);
    await sendMessage(errorMessage);
  }
}

// Create a companion script to fetch videos (to be run separately when needed)
// Save as fetchTikTokVideos.js
async function fetchTikTokVideos() {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  console.log(`[${timestamp}] Fetching TikTok videos for future posting`);
  await sendMessage(`🔄 Fetching fresh batch of TikTok videos from @${TIKTOK_USERNAME}`);
  
  try {
    // Fetch 50 videos (about 1-2 months of daily posts)
    const videosData = await getUserVideosData(TIKTOK_USERNAME, 50, TIKTOK_DATA_FILE);
    
    if (!videosData || !videosData.videos || videosData.videos.length === 0) {
      await sendMessage(`❌ Failed to fetch TikTok videos or no videos available.`);
      return;
    }
    
    // Reset tracker to start with the first video in the new batch
    const tracker = { lastPostedIndex: -1 };
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    
    await sendMessage(`✅ Successfully fetched ${videosData.videos.length} new videos from @${TIKTOK_USERNAME}.\n📋 Ready for posting.`);
  } catch (error) {
    await sendMessage(`❌ Error fetching TikTok videos: ${error.message}`);
    console.error("Error:", error);
  }
}

// Export the functions so they can be used separately
module.exports = {
  postNextTikTokReel,
  fetchTikTokVideos
};

// If this script is run directly, post the next reel
if (require.main === module) {
  postNextTikTokReel().catch(async (error) => {
    const criticalErrorMsg = `💥 CRITICAL ERROR: ${error.message}`;
    console.error(criticalErrorMsg);
    await sendMessage(criticalErrorMsg);
  });
}
