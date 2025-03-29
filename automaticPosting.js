const { postReel } = require("./postReelToInstagram");
const reels = require("./links.json");
const getReelData = require("./getReelData");
const sendMessage = require("./sendMessage");
const fs = require("fs").promises; // For file operations
require("dotenv").config();

const TRACKER_FILE = "posted_tracker.json"; // File to track posted index

async function uploadReels() {
  if (!process.env.PAGE_ACCESS_TOKEN || !process.env.INSTAGRAM_BUSINESS_ID) {
    console.error("Required environment variables are missing. Please check your .env file.");
    return;
  }

  // Load or initialize the tracker
  let tracker;
  try {
    const trackerData = await fs.readFile(TRACKER_FILE, "utf8");
    tracker = JSON.parse(trackerData);
  } catch (error) {
    // If file doesn’t exist or is invalid, start from index 0
    tracker = { lastPostedIndex: -1 };
  }

  // Determine the next reel to post
  const nextIndex = tracker.lastPostedIndex + 1;
  if (nextIndex >= reels.length) {
    console.log("All reels have been posted. Resetting or stopping.");
    // Optionally reset to 0 to loop, or exit
    tracker.lastPostedIndex = -1; // Reset to start over (comment out if you want to stop)
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    return;
  }

  const reel = reels[nextIndex];
  const { videoUrl, userName, owner_fullname, caption, hashtags } = await getReelData(reel);

  try {
    // Validate required fields
    if (!videoUrl || !userName || !owner_fullname) {
      console.error(`Skipping reel at index ${nextIndex} due to missing required fields:`, reel);
      // Move to next index even if invalid, to avoid stalling
      tracker.lastPostedIndex = nextIndex;
      await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
      return;
    }

    console.log(`Uploading reel at index ${nextIndex}...`);
    const result = await postReel(
      videoUrl,
      caption || "",
      userName,
      owner_fullname,
      hashtags || []
    );

    if (result.success) {
      console.log(`Successfully uploaded reel:`, {
        containerId: result.containerId,
        mediaId: result.publishedMediaId,
      });

      // send confirmation message to telegram
      const date = new Date().toLocaleString();
      const progress = `${nextIndex + 1}/${reels.length}`;
      const daysCounter = `Day ${nextIndex + 1}`;
      const telegramMessage = `Reel uploaded successfully!\nDate: ${date}\nProgress: ${progress}\n${daysCounter}\nContainer ID: ${result.containerId}\nMedia ID: ${result.publishedMediaId}`;

      await sendMessage(telegramMessage);

      // Update tracker only on success
      tracker.lastPostedIndex = nextIndex;
      await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    } else {
      console.error(`Failed to upload reel:`, result.error);
      // Don’t update tracker on failure, so it retries next time
    }
  } catch (error) {
    console.error(`Error uploading reel at index ${nextIndex}:`, error.message);
    // Don’t update tracker on error, so it retries next time
  }
}

// Run the function and handle top-level errors
uploadReels().catch((error) => {
  console.error("Critical error in uploading reels:", error);
});
