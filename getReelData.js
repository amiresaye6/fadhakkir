const { instagramGetUrl } = require("instagram-url-direct");
const fs = require('fs');
const path = require('path');

const getReelData = async (reelUrl) => {
    try {
        let data = await instagramGetUrl(reelUrl);

        const videoUrl = data.media_details[0].url;
        const userName = data.post_info.owner_username;
        const owner_fullname = data.post_info.owner_fullname;
        const caption = data.post_info.caption;
        const hashtags = (caption.match(/#[\w\u0600-\u06FF]+/g) || []); // Extract hashtags and join into a single string
        // const hashtags = (caption.match(/#[\w\u0600-\u06FF]+/g) || []).join(' '); // Extract hashtags and join into a single string
        const thumbnailUrl = data.media_details[0].thumbnail; // Thumbnail URL

        const filePath = path.join(__dirname, 'StoredReelsData.json');
        let reelsData = [];

        // Check if the file exists
        if (fs.existsSync(filePath)) {
            // Read the existing file
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            reelsData = JSON.parse(fileContent);
        }

        const result = {
            originalReelLink: reelUrl,
            videoUrl,
            userName,
            owner_fullname,
            caption,
            hashtags,
            thumbnailUrl,
        }

        // Append the new data
        reelsData.push(result);

        // Write back to the file
        fs.writeFileSync(filePath, JSON.stringify(reelsData, null, 2), 'utf-8');

        return result;

    } catch (error) {
        console.error('Error getting Reel data:', error);
    }
};

module.exports = getReelData;
