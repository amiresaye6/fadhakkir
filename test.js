const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

/**
 * Extract all videos' IDs, descriptions, and hashtags for a specific TikTok user
 * @param {string} username - TikTok username without @
 * @param {number} postCount - Number of posts to fetch (default: 30)
 * @param {string} outputFilePath - Path to save the output JSON file (optional)
 * @returns {Promise<Object>} - Object containing extracted video data
 */
async function getUserVideosData(username, postCount = 30, outputFilePath = null) {
    // API key for RapidAPI
    const apiKey = process.env.TIKTOK_API_KEY;

    try {
        // Step 1: Get user info and secUid
        console.log(`Fetching info for user: ${username}`);
        const userResponse = await axios.request({
            method: 'GET',
            url: 'https://tiktok-api23.p.rapidapi.com/api/user/info',
            params: { uniqueId: username },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            }
        });

        if (!userResponse.data?.userInfo?.user?.secUid) {
            throw new Error('Could not find user or get secUid');
        }

        const userData = userResponse.data;
        const secUid = userData.userInfo.user.secUid;
        console.log(`Found secUid: ${secUid}`);

        // Step 2: Fetch user posts using secUid
        console.log(`Fetching ${postCount} posts for user: ${username}`);
        const postsResponse = await axios.request({
            method: 'GET',
            url: 'https://tiktok-api23.p.rapidapi.com/api/user/posts',
            params: {
                secUid: secUid,
                count: postCount.toString(),
                cursor: '0'
            },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            }
        });

        // Step 3: Extract relevant information from each video
        const extractedVideos = [];

        if (postsResponse.data?.data?.itemList && Array.isArray(postsResponse.data.data.itemList)) {
            postsResponse.data.data.itemList.forEach((video) => {
                const videoObj = {
                    id: video.id,
                    description: video.desc || '',
                    hashtags: video.textExtra ? video.textExtra.map(tag => tag.hashtagName) : [],
                    shareableURL: `https://www.tiktok.com/@${video.author.uniqueId}/video/${video.id}`,
                    createTime: video.createTime,
                    stats: {
                        views: video.stats?.playCount || 0,
                        likes: video.stats?.diggCount || 0,
                        shares: video.stats?.shareCount || 0,
                        comments: video.stats?.commentCount || 0
                    }
                };
                extractedVideos.push(videoObj);
            });
        }

        // Step 4: Create the result object
        const result = {
            user: {
                uniqueId: username,
                secUid: secUid,
                nickname: userData.userInfo?.user?.nickname || '',
                followersCount: userData.userInfo?.stats?.followerCount || 0,
                followingCount: userData.userInfo?.stats?.followingCount || 0,
                videoCount: userData.userInfo?.stats?.videoCount || 0
            },
            videos: extractedVideos,
            totalVideos: extractedVideos.length,
            fetchedAt: new Date().toISOString()
        };

        // Step 5: Save to JSON file if path is provided
        if (outputFilePath) {
            const filename = outputFilePath || `${username}_videos_data.json`;
            fs.writeFileSync(filename, JSON.stringify(result, null, 2));
            console.log(`✅ Data saved successfully to ${filename}`);
        }

        return result;

    } catch (error) {
        console.error('Error fetching TikTok user videos data:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }
        return null;
    }
}

/**
 * Generate a direct download link for a TikTok video using its ID or URL
 * @param {string} videoIdOrUrl - TikTok video ID or complete TikTok URL
 * @returns {Promise<string|null>} - Direct download URL or null if not found
 */
async function getVideoDownloadLink(videoIdOrUrl) {
    // API key for RapidAPI
    const apiKey = process.env.TIKTOK_API_KEY;

    try {
        // Check if input is a URL or just an ID
        let videoUrl = videoIdOrUrl;

        // If it's just the ID, construct a URL
        if (!videoIdOrUrl.startsWith('http')) {
            // We need to determine the username for the URL
            // This will require an additional API call or you can pass the username as a parameter
            // For now, we'll just throw an error suggesting to provide the full URL
            throw new Error('Please provide a full TikTok video URL instead of just the ID');
        }

        // Make the API request to get the download link
        console.log(`Generating download link for: ${videoUrl}`);
        const response = await axios.request({
            method: 'GET',
            url: 'https://tiktok-api23.p.rapidapi.com/api/download/video',
            params: { url: videoUrl },
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': 'tiktok-api23.p.rapidapi.com'
            }
        });

        if (!response.data?.data?.play) {
            throw new Error('Could not generate download link for this video');
        }

        // Return the direct download link
        return response.data.data.play;

    } catch (error) {
        console.error('Error generating download link:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.data);
        }
        return null;
    }
}

// Export the functions
module.exports = {
    getUserVideosData,
    getVideoDownloadLink
};

// Example usage (uncomment to run):
getUserVideosData('11qurran', 50, '11qurran_videos_data.json');
// getVideoDownloadLink('https://www.tiktok.com/@hidiralikaya/video/7502029793823657224')
//   .then(downloadUrl => console.log('Download URL:', downloadUrl));
