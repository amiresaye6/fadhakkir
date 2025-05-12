const axios = require('axios');
const cheerio = require('cheerio');

async function getTikTokVideoLink(tiktokUrl) {
  try {
    // Validate TikTok URL
    if (!tiktokUrl.includes('tiktok.com') || !tiktokUrl.includes('/video/')) {
      throw new Error('Invalid TikTok URL');
    }

    // Use ssstik.io as the downloader service
    const downloaderUrl = 'https://ssstik.io/abc';
    const payload = {
      id: tiktokUrl,
      locale: 'en',
      tt: Math.random().toString(36).substring(2) // Random token
    };

    // Send POST request to ssstik.io
    const response = await axios.post(downloaderUrl, new URLSearchParams(payload), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://ssstik.io/'
      }
    });

    // Load HTML response into cheerio
    const $ = cheerio.load(response.data);

    // Extract the direct download link
    const videoLink = $('a.download_link.without_watermark').attr('href') || '';
    
    if (!videoLink) {
      throw new Error('Could not find the video download link.');
    }

    // Extract additional metadata
    const title = $('h2').text() || 'No title found';
    const description = $('p.maintext').text() || 'No description found';

    // Construct full URL if relative
    const fullVideoLink = videoLink.startsWith('http') ? videoLink : `https://ssstik.io${videoLink}`;

    // Return object with video link and metadata
    return {
      videoLink: fullVideoLink,
      title,
      description,
      videoId: tiktokUrl.split('/video/')[1] || 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching TikTok video link:', error.message);
    return null;
  }
}

// Example usage
const tiktokUrl = 'https://www.tiktok.com/@11qurran/video/7498344802539408648';
getTikTokVideoLink(tiktokUrl)
  .then(result => {
    if (result) {
      console.log('Direct video link:', result.videoLink);
      console.log('Title:', result.title);
      console.log('Description:', result.description);
      console.log('Video ID:', result.videoId);
    } else {
      console.log('Failed to retrieve video link.');
    }
  });
