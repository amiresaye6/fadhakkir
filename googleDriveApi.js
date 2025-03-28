const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types"); // Auto-detect MIME types

// Load service account JSON key file
const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json", // 🔹 Path to your downloaded JSON file
    scopes: ["https://www.googleapis.com/auth/drive"],
});

// Create Drive API client
const drive = google.drive({ version: "v3", auth });

async function uploadFile(filePath, folderId = null) {
    const fileName = path.basename(filePath);
    const mimeType = mime.lookup(filePath) || "application/octet-stream"; // Auto-detect MIME type

    const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined, // Only add if folderId exists
    };

    const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath),
    };

    try {
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        });

        const fileId = response.data.id;
        console.log("File uploaded successfully! File ID:", fileId);

        // Generate the public direct download link
        const downloadLink = await generateDirectDownloadLink(fileId);
        console.log("Direct Download Link:", downloadLink);

        return downloadLink;
    } catch (error) {
        console.error("Error uploading file:", error.message);
        throw error;
    }
}


async function generateDirectDownloadLink(fileId) {
    try {
        // Make the file publicly accessible
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });

        // Direct download link format
        const directDownloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
        return directDownloadLink;
    } catch (error) {
        console.error("Error generating download link:", error.message);
        return null;
    }
}

// // Test Upload and Get Direct Download Link
// (async () => {
//     // Example usage: Upload a file & get the link
//     const filePath = "test2.txt"; // Change this to your actual file
//     const folderId = ProcessingInstruction.env.FOLDER_ID; // Change to your Google Drive folder ID
//     await uploadFile(filePath, folderId);

//     // Example: Get download link for an existing file
//     const existingFileId = ProcessingInstruction.env.FOLDER_ID; // Change to a real file ID
//     const link = await generateDirectDownloadLink(existingFileId);
//     console.log("🔗 Existing File Download Link:", link);
// })();

module.exports = {
    uploadFile,
    generateDirectDownloadLink
};
