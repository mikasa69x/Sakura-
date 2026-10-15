const axios = require("axios");

module.exports = {
  config: {
    name: "weather",
    aliases: ["w"],
    author: "xiyam",
    countDown: 5,
    role: 0,
    category: "utility",
    shortDescription: {
      en: "Get weather information for any city",
    },
    guide: {
      en: "{pn} <city name>\nExample: /weather London",
    },
  },

  onStart: async function ({ args, api, event }) {
    try {
      if (args.length === 0) {
        return api.sendMessage(
          "Please provide a city name!",
          event.threadID,
          event.messageID
        );
      }

      const city = args.join(" ");
      
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = response.data;

      const current = data.current_condition[0];
      const location = data.nearest_area[0];
      
      const temp_c = current.temp_C;
      const temp_f = current.temp_F;
      const feels_c = current.FeelsLikeC;
      const feels_f = current.FeelsLikeF;
      const humidity = current.humidity;
      const windSpeed = current.windspeedKmph;
      const windDir = current.winddir16Point;
      const description = current.weatherDesc[0].value;
      const uvIndex = current.uvIndex;
      const visibility = current.visibility;
      const pressure = current.pressure;

      const locationName = location.areaName[0].value;
      const country = location.country[0].value;

      let weatherEmoji = "🌡️";
      const desc = description.toLowerCase();
      if (desc.includes("sunny") || desc.includes("clear")) weatherEmoji = "☀️";
      else if (desc.includes("cloud")) weatherEmoji = "☁️";
      else if (desc.includes("rain")) weatherEmoji = "🌧️";
      else if (desc.includes("storm") || desc.includes("thunder")) weatherEmoji = "⛈️";
      else if (desc.includes("snow")) weatherEmoji = "❄️";
      else if (desc.includes("fog") || desc.includes("mist")) weatherEmoji = "🌫️";

      const result = `
     ${weatherEmoji} WEATHER REPORT ${weatherEmoji}


📍 Location: ${locationName}, ${country}

🌡️ Temperature:
   ${temp_c}°C / ${temp_f}°F
   Feels like: ${feels_c}°C / ${feels_f}°F

☁️ Condition: ${description}

━━━━━━━━━━━━━━━━━━━━━━

💧 Humidity: ${humidity}%
🌬️ Wind: ${windSpeed} km/h ${windDir}
👁️ Visibility: ${visibility} km
🔆 UV Index: ${uvIndex}
⏲️ Pressure: ${pressure} mb

━━━━━━━━━━━━━━━━━━━━━━
📅 Updated: Just now
      `.trim();

      return api.sendMessage(result, event.threadID, event.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage(
        "❌ Unable to fetch weather data!\nPlease check the city name and try again.",
        event.threadID,
        event.messageID
      );
    }
  },
};
