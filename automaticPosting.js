const { postReel } = require("./postReelToInstagram");
const reels = require("./links.json");
const getReelData = require("./getReelData");
const sendMessage = require("./sendMessage");
const fs = require("fs").promises;
require("dotenv").config();
const axios = require("axios");

const TRACKER_FILE = "tracker.json";

async function uploadReels() {
  if (!process.env.PAGE_ACCESS_TOKEN?.trim() || !process.env.INSTAGRAM_BUSINESS_ID?.trim()) {
    console.error("Required environment variables are missing or empty.");
    return;
  }

  let tracker;
  try {
    const trackerData = await fs.readFile(TRACKER_FILE, "utf8");
    tracker = JSON.parse(trackerData);
  } catch (error) {
    tracker = { lastPostedIndex: -1 };
  }

  const nextIndex = tracker.lastPostedIndex + 1;
  if (nextIndex >= reels.length) {
    console.log("All reels posted.");
    tracker.lastPostedIndex = process.env.RESET_ON_COMPLETE === "true" ? -1 : nextIndex;
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    return;
  }

  const reel = reels[nextIndex];
  const { videoUrl, userName, owner_fullname, caption, hashtags } = await getReelData(reel);

  if (!videoUrl || !userName || !owner_fullname) {
    console.error(`Skipping reel at index ${nextIndex} due to missing fields:`, reel);
    tracker.lastPostedIndex = nextIndex;
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    return;
  }

  try {
    console.log(`Uploading reel at index ${nextIndex}...`);
    const result = await postReel(videoUrl, caption || "", userName, owner_fullname, hashtags || []);
    if (!result.success) throw new Error(result.error);

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

    console.log(`Successfully uploaded reel:`, {
      containerId: result.containerId,
      mediaId,
      reelUrl,
    });

    // Send Telegram message with the Reel URL
    const date = new Date().toLocaleString();
    const progress = `${nextIndex}/${reels.length}`;
    const daysCounter = `Day ${nextIndex}`;
    const telegramMessage = `Reel uploaded successfully!\nDate: ${date}\nProgress: ${progress}\n${daysCounter}\nContainer ID: ${result.containerId}\nMedia ID: ${mediaId}\nReel URL: ${reelUrl}`;

    await sendMessage(telegramMessage);

    tracker.lastPostedIndex = nextIndex;
    await fs.writeFile(TRACKER_FILE, JSON.stringify(tracker, null, 2));
  } catch (error) {
    console.error(`Error uploading reel at index ${nextIndex}:`, error.stack);
  }
}

uploadReels().catch((error) => console.error("Critical error:", error.stack));
