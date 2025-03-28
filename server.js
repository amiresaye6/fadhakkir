const { postReel } = require("./postReelToInstagram");
const reels = require("./reels.json");
require("dotenv").config(); // Load environment variables from .env file

async function uploadReels() {

  if (!process.env.PAGE_ACCESS_TOKEN || !process.env.INSTAGRAM_BUSINESS_ID) {
    console.error('Required environment variables are missing. Please check your .env file.');
    return;
  }

  // Process reels sequentially
  for (const reel of reels) {
    const { videoUrl, userName, owner_fullname, caption, hashtags } = reel;

    try {
      // Validate required fields
      if (!videoUrl || !userName || !owner_fullname) {
        console.error(`Skipping reel due to missing required fields:`, reel);
        continue;
      }

      console.log(`Uploading reel...`);
      const result = await postReel(
        videoUrl,
        caption || '', // Default to empty string if undefined
        userName,
        owner_fullname,
        hashtags || [] // Default to empty array if undefined
      );

      if (result.success) {
        console.log(`Successfully uploaded reel:`, {
          containerId: result.containerId,
          mediaId: result.publishedMediaId,
        });
      } else {
        console.error(`Failed to upload reel:`, result.error);
      }
    } catch (error) {
      console.error(`Error uploading reel:`, error.message);
    }
  }
}

// Run the function and handle any top-level errors
uploadReels().catch((error) => {
  console.error('Critical error in uploading reels:', error);
});
