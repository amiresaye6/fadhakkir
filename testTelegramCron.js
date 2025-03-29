const sendMessage = require("./sendMessage");
require("dotenv").config();

async function sendTestMessage() {
    if (!process.env.TELEGRAM_BOT_TOKEN?.trim() || !process.env.TELEGRAM_CHAT_ID?.trim()) {
        console.error("Required Telegram environment variables are missing. Check your .env file.");
        process.exit(1);
    }

    try {
        const date = new Date().toLocaleString();
        const testMessage = `Test message from server!\nDate: ${date}\nStatus: Everything is working fine!`;
        await sendMessage(testMessage);
        console.log(`Test message sent successfully at ${date}`);
    } catch (error) {
        console.error("Error sending test message:", error.stack);
        process.exit(1);
    }
}

sendTestMessage().catch((error) => {
    console.error("Critical error:", error.stack);
    process.exit(1);
});
