const axios = require('axios');
const { safeReply } = require('../utils/replyHelper');

module.exports = {
    name: 'weather',
    description: 'Fetches current weather for a given location',
    enabled: true, // You can toggle this in the plugin manager later

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (args.length === 0) {
            return safeReply(sock, jid, "❌ Please provide a location to check the weather.\nExample: !weather London");
        }

        const location = args.join(' ');
        const apiKey = '8ae508915944c17f82e68860fb562bd7'; // Replace with ENV or config for security
        const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

        try {
            const res = await axios.get(apiUrl);
            const weather = res.data;

            const info = `
🌤️ *Weather in ${weather.name}, ${weather.sys.country}:*
🌡️ Temp: ${weather.main.temp}°C
🌬️ ${weather.weather[0].main} - ${weather.weather[0].description}
💧 Humidity: ${weather.main.humidity}%
🌪️ Wind: ${weather.wind.speed} m/s
`;

            return safeReply(sock, jid, info.trim());
        } catch (err) {
            console.error("Weather Fetch Error:", err.message);
            return safeReply(sock, jid, "❌ Could not fetch weather data. Please check the city name.");
        }
    }
};
