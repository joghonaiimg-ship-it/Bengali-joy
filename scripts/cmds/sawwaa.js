const axios = require("axios");
const fs = require('fs-extra');
const path = require('path');

const baseApiUrl = async () => {
    const base = await axios.get(`https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json`);
    return base.data.mahmud;
};

module.exports = {
    config: {
        name: "sawwaa",
        version: "1.0",
        author: "MahMUD",
        countDown: 5,
        role: 0,
        description: {
            bn: "একটি নির্দিষ্ট অডিও গান পাঠান",
            en: "Send a specific audio song",
            vi: "Gửi một bài hát âm thanh cụ thể"
        },
        category: "music",
        guide: {
            bn: '{pn}',
            en: '{pn}',
            vi: '{pn}'
        }
    },

    onStart: async function ({ api, event }) {
        const { threadID, messageID } = event;
        const targetUrl = "https://youtube.com/shorts/TvL4jovCkqA";
        
        // ভিডিও আইডি বের করা (এক্ষেত্রে '0')
        const videoID = "0"; 

        try {
            api.setMessageReaction("⌛", messageID, () => {}, true);
            const apiUrl = await baseApiUrl();
            
            // অডিও ডাউনলোড করার ফাংশন কল করা
            await handleDirectDownload(api, threadID, messageID, videoID, apiUrl);
        } catch (e) {
            return api.sendMessage(`❌ | সমস্যা হয়েছে: ${e.message}`, threadID, messageID);
        }
    }
};

async function handleDirectDownload(api, threadID, messageID, videoID, apiUrl) {
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const filePath = path.join(cacheDir, `sawwaa_${Date.now()}.mp3`);

    try {
        // API থেকে অডিও লিঙ্ক নেওয়া
        const res = await axios.get(`${apiUrl}/api/ytb/get?id=${videoID}&type=audio`);
        
        if (!res.data || !res.data.data || !res.data.data.downloadLink) {
            return api.sendMessage("❌ | ফাইলটি খুঁজে পাওয়া যায়নি!", threadID, messageID);
        }

        const { title, downloadLink } = res.data.data;
        
        // ফাইলটি ডাউনলোড করা
        const response = await axios({ 
            url: downloadLink, 
            method: 'GET', 
            responseType: 'stream' 
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `✅ | আপনার অনুরোধ করা অডিও: ${title}`,
                attachment: fs.createReadStream(filePath)
            }, threadID, () => { 
                api.setMessageReaction("✅", messageID, () => {}, true);
                // পাঠানোর পর ফাইল মুছে ফেলা
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            }, messageID);
        });

        writer.on('error', (err) => {
            api.sendMessage(`❌ | ফাইল রাইটিং এরর: ${err.message}`, threadID, messageID);
        });

    } catch (e) {
        api.sendMessage("❌ | ডাউনলোড করতে ব্যর্থ হয়েছি!", threadID, messageID);
    }
}
