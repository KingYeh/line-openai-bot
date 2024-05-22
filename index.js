const express = require('express');
const bodyParser = require('body-parser');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise.all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    // 發送請求給OpenAI API
    const openAIResponse = await axios.post('https://api.openai.com/v1/completions', {
        model: "text-davinci-003",
        prompt: userMessage,
        max_tokens: 150
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    const openAIMessage = openAIResponse.data.choices[0].text.trim();

    return client.replyMessage(replyToken, {
        type: 'text',
        text: openAIMessage
    });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
