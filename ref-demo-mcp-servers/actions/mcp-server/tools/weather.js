/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { z } = require('zod')

// Example weather API tool - demonstrates external API calls
module.exports = {
    name: 'weather',
    description: 'Get current weather information for any city. This tool demonstrates how to integrate with external APIs and handle real-time data.',
    schema: {
        city: z.string().describe('Name of the city to get weather for (e.g., "San Francisco", "New York", "London")')
    },
    handler: async ({ city = 'Unknown City' }) => {
        try {
            // CUSTOMIZE: Replace this section with actual API calls
            // Example API integrations:
            // - OpenWeatherMap API
            // - WeatherAPI.com
            // - AccuWeather API
            //
            // For now, we'll return realistic mock data with random variations

            // Generate realistic spring weather with random variations (always in Celsius)
            const baseTemp = 18 // Spring baseline in Celsius
            const tempVariation = (Math.random() - 0.5) * 20 // ±10 degrees variation
            const temperature = Math.round((baseTemp + tempVariation) * 10) / 10

            const conditions = [
                'Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain',
                'Scattered Showers', 'Clear', 'Overcast', 'Drizzle'
            ]
            const currentCondition = conditions[Math.floor(Math.random() * conditions.length)]

            const humidity = Math.floor(Math.random() * 40) + 40 // 40-80%
            const windSpeed = Math.floor(Math.random() * 15) + 5 // 5-20 km/h
            const pressure = Math.floor(Math.random() * 30) + 1000 // 1000-1030 hPa

            // Create realistic weather response
            const weatherData = {
                city,
                country: 'Sample Country', // In real API, this would come from the response
                current: {
                    temperature,
                    condition: currentCondition,
                    humidity: `${humidity}%`,
                    wind_speed: `${windSpeed} km/h`,
                    pressure: `${pressure} hPa`,
                    visibility: `${Math.floor(Math.random() * 5) + 10} km`,
                    uv_index: Math.floor(Math.random() * 8) + 1
                },
                last_updated: new Date().toISOString(),
                source: 'Mock Weather Service (replace with real API)'
            }

            // Format response for display
            let responseText = `🌤️ Weather for ${city}\n`
            responseText += '⚠️ **EXAMPLE DATA - NOT REAL WEATHER** ⚠️\n\n'
            responseText += `🌡️ Temperature: ${temperature}°C\n`
            responseText += `☁️ Conditions: ${currentCondition}\n`
            responseText += `💧 Humidity: ${humidity}%\n`
            responseText += `💨 Wind: ${windSpeed} km/h\n`
            responseText += `📊 Pressure: ${pressure} hPa\n`
            responseText += `👁️ Visibility: ${weatherData.current.visibility}\n`
            responseText += `☀️ UV Index: ${weatherData.current.uv_index}\n`
            responseText += `\n⏰ Last Updated: ${new Date().toLocaleString()}`
            responseText += '\n\n💡 Note: This is mock/example data for demonstration purposes only. Replace with real weather API calls in production.'

            return {
                content: [
                    {
                        type: 'text',
                        text: responseText
                    }
                ],
                // Optional: Include structured data
                metadata: {
                    source: 'mock-weather-service',
                    city,
                    timestamp: new Date().toISOString(),
                    raw_data: weatherData
                }
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Weather Error: Unable to fetch weather data for ${city}.\n\nError: ${error.message}\n\nThis could happen due to:\n- Invalid city name\n- API service unavailable\n- Network connectivity issues\n- API rate limiting\n\nPlease try again with a valid city name.`
                    }
                ]
            }
        }
    }
}
