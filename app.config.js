require('dotenv').config();

export default {
    ...require('./app.json').expo,
    extra: {
        openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
        openrouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '',
        openrouterModel: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || '',
    },
};