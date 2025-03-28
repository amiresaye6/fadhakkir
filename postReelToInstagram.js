const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_BUSINESS_ID;

async function createMediaContainer(video_url, caption, userName, owner_fullname, hashtags) {
  if (!video_url) throw new Error('Video URL is required');
  if (!userName) throw new Error('Username is required');
  if (!owner_fullname) throw new Error('Owner full name is required');
  if (!hashtags || !Array.isArray(hashtags)) throw new Error('Hashtags must be an array');

  try {
    const CAPTION = `Original owner of the Reel: ${owner_fullname}\n@${userName}\n${hashtags.join(' ')}`;
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media`,
      {
        media_type: 'REELS',
        video_url,
        caption: CAPTION,
        share_to_feed: true,
      },
      {
        params: {
          access_token: ACCESS_TOKEN,
        },
      }
    );
    return response.data.id;
  } catch (error) {
    console.error('Error creating container:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function publishReel(containerId) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: containerId,
      },
      {
        params: {
          access_token: ACCESS_TOKEN,
        },
      }
    );
    console.log('Reel published! Media ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('Error publishing Reel:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function postReel(video_url, caption = '', userName, owner_fullname, hashtags = []) {
  try {
    const containerId = await createMediaContainer(
      video_url,
      caption,
      userName,
      owner_fullname,
      hashtags
    );
    console.log('Container created with ID:', containerId);

    // Wait 10 seconds before first publish attempt
    await new Promise((resolve) => setTimeout(resolve, 20000));

    let publishedMediaId;
    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        publishedMediaId = await publishReel(containerId);
        break; // Exit loop if successful
      } catch (error) {
        attempts++;
        if (attempts === maxAttempts) {
          throw new Error('Failed to publish after 5 attempts');
        }
        // Wait 5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 20000));
      }
    }

    return {
      success: true,
      containerId,
      publishedMediaId
    };
  } catch (error) {
    console.error('Failed to post Reel:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions
module.exports = {
  createMediaContainer,
  publishReel,
  postReel,
};
