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

        // console.log('Video URL:', {
        //     videoUrl,
        //     userName,
        //     owner_fullname,
        //     caption,
        //     hashtags,
        //     thumbnailUrl,
        // });

        const filePath = path.join(__dirname, 'reelsData.json');
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

// const reels = [
//     "https://www.instagram.com/zil_4x/reel/DHlQLQ5tvAq/",
//     "https://www.instagram.com/zil_4x/reel/DHgOW47tzE3/",
//     "https://www.instagram.com/zil_4x/reel/DHayBY8tUSC/",
//     "https://www.instagram.com/zil_4x/reel/DHYPb9ZN7Ac/",
//     "https://www.instagram.com/zil_4x/reel/DHTNNb_t1Hn/",
//     "https://www.instagram.com/zil_4x/reel/DHLr0Citf8S/",
//     "https://www.instagram.com/zil_4x/reel/DHGf-8wN7vc/",
//     "https://www.instagram.com/zil_4x/reel/DHDycZwtzpa/",
//     "https://www.instagram.com/zil_4x/reel/DG-khtMNABr/",
//     "https://www.instagram.com/zil_4x/reel/DG5n0BCtSSw/",
//     "https://www.instagram.com/zil_4x/reel/DG2z6dDttWr/",
//     "https://www.instagram.com/zil_4x/reel/DG0G6Tstp3H/",
//     "https://www.instagram.com/zil_4x/reel/DGvccGUN8zE/",
//     "https://www.instagram.com/zil_4x/reel/DGqSD5iNu24/",
//     "https://www.instagram.com/zil_4x/reel/DGn30lYtG8J/",
//     "https://www.instagram.com/zil_4x/reel/DGiij_pN7Hj/",
//     "https://www.instagram.com/zil_4x/reel/DGflcJbt8b6/",
//     "https://www.instagram.com/zil_4x/reel/DGTrtmZRWJf/",
//     "https://www.instagram.com/zil_4x/reel/DGIZGX7tf4H/",
//     "https://www.instagram.com/zil_4x/reel/DGD7VAftolD/",
//     "https://www.instagram.com/zil_4x/reel/DGA8Sf4NvQE/",
//     "https://www.instagram.com/zil_4x/reel/DF8MLk2NMUG/",
//     "https://www.instagram.com/zil_4x/reel/DFndgeVtgm0/",
//     "https://www.instagram.com/qr_m26/reel/DGTaABROzgN/",
//     "https://www.instagram.com/qr_m26/reel/DGTXkhGOhhh/",
//     "https://www.instagram.com/qr_m26/reel/DGTRZ37M5Vj/",
//     "https://www.instagram.com/qr_m26/reel/DGQsXtHsbvO/",
//     "https://www.instagram.com/qr_m26/reel/DGOKNPtsvFE/",
//     "https://www.instagram.com/qr_m26/reel/DGL2M-huarz/",
//     "https://www.instagram.com/qr_m26/reel/DGLa_srMa-W/",
//     "https://www.instagram.com/qr_m26/reel/DGJJd8wOkSH/",
//     "https://www.instagram.com/qr_m26/reel/DGI5reGsaGN/",
//     "https://www.instagram.com/qr_m26/reel/DGGj4msOo1Q/",
//     "https://www.instagram.com/qr_m26/reel/DGGZ2TIMCNV/",
//     "https://www.instagram.com/qr_m26/reel/DGD-iFPOVih/",
//     "https://www.instagram.com/qr_m26/reel/DGDvfHKMZVT/",
//     "https://www.instagram.com/qr_m26/reel/DGBUcZzouvc/",
//     "https://www.instagram.com/qr_m26/reel/DGBI6dnosWM/",
//     "https://www.instagram.com/qr_m26/reel/DF-wy1voIge/",
//     "https://www.instagram.com/qr_m26/reel/DF-kxlTo1aM/",
//     "https://www.instagram.com/qr_m26/reel/DF7_Z8co7U-/",
//     "https://www.instagram.com/qr_m26/reel/DF7_X54ov9u/",
//     "https://www.instagram.com/qr_m26/reel/DF5nv3hIy-L/",
//     "https://www.instagram.com/qr_m26/reel/DF5aiWnIS6R/",
//     "https://www.instagram.com/qr_m26/reel/DF3C469IXtP/",
//     "https://www.instagram.com/qr_m26/reel/DF224Pxo2eW/",
//     "https://www.instagram.com/qr_m26/reel/DFx5U5PITtS/",
//     "https://www.instagram.com/qr_m26/reel/DF0SHnKoFTP/",
//     "https://www.instagram.com/qr_m26/reel/DFx3rRIoesR/",
//     "https://www.instagram.com/qr_m26/reel/DFxssdUor1m/",
//     "https://www.instagram.com/qr_m26/reel/DFvabRzOBtS/",
//     "https://www.instagram.com/qr_m26/reel/DFvB2XFM1tB/",
//     "https://www.instagram.com/qr_m26/reel/DFsNaiAOOJB/",
//     "https://www.instagram.com/qr_m26/reel/DFqI3lVulcW/",
//     "https://www.instagram.com/qr_m26/reel/DFqFbwWOKam/",
//     "https://www.instagram.com/qr_m26/reel/DFpzvwUsEcf/",
//     "https://www.instagram.com/qr_m26/reel/DFpjLqkOuMn/",
//     "https://www.instagram.com/qr_m26/reel/DFn5Vhhu0xl/",
//     "https://www.instagram.com/qr_m26/reel/DFk5LRPOu5i/",
//     "https://www.instagram.com/qr_m26/reel/DFdL0S8MPAd/",
//     "https://www.instagram.com/qr_m26/reel/DFdHgBKMbwS/",
//     "https://www.instagram.com/qr_m26/reel/DFavbMZucAc/",
//     "https://www.instagram.com/qr_m26/reel/DFYKxe3OXDD/",
//     "https://www.instagram.com/qr_m26/reel/DFVbjQMOieE/",
//     "https://www.instagram.com/qr_m26/reel/DFSxG2msoow/",
//     "https://www.instagram.com/qr_m26/reel/DFQEfhju2Vh/",
//     "https://www.instagram.com/qr_m26/reel/DFNtdyss267/"
// ]

// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// (async () => {
//     for (let i = 0; i < reels.length; i++) {
//         await getReelData(reels[i]);
//         await delay(3000); // Add a 3-second delay between each request

//         if ((i + 1) % 10 === 0) {
//             console.log(`Processed ${i + 1} reels, waiting for 10 seconds...`);
//             await delay(10000); // Add a 10-second delay after every 10 requests
//         }
//     }
// })();

module.exports = getReelData;
