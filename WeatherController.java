// In a real Spring Boot application, you would need to set up the project 
// with Spring Web dependencies (e.g., in pom.xml or build.gradle).
package com.weatherapp.api;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.MediaType;

@RestController
@CrossOrigin(origins = "*") // Allows cross-origin requests from the web frontend
public class WeatherController {

    /**
     * Endpoint to fetch current, hourly, and 7-day forecast data for a specified city.
     * In a production application, this method would:
     * 1. Validate the 'city' parameter.
     * 2. Use an HTTP client (e.g., RestTemplate, WebClient) to call a real weather API (e.g., OpenWeatherMap, AccuWeather).
     * 3. Parse the external API's response into Java objects.
     * 4. Serialize the Java objects into a structured JSON string expected by the frontend.
     *
     * @param city The city name provided by the client (e.g., "Delhi" or "Amritpur").
     * @return A JSON string containing current, hourly, and daily forecast data.
     */
    @GetMapping(value = "/api/weather", produces = MediaType.APPLICATION_JSON_VALUE)
    public String getWeather(@RequestParam(defaultValue = "Amritpur, Uttarakhand") String city) {
        
        // --- NOTE: This is MOCK DATA SIMULATION ---
        // It provides structured data that matches the JSON schema expected by script.js.
        // Replace this entire block with actual weather API calls in a real server environment.
        
        System.out.println("Received request for city: " + city);

        // Simple mock data adjustment based on city name for demonstration
        String baseCondition = city.toLowerCase().contains("delhi") ? "Sunny" : "Light rain";
        int baseTemp = city.toLowerCase().contains("delhi") ? 35 : 30;

        String jsonResponse = String.format("""
        {
          "current": {
            "temp": %d,
            "condition": "%s",
            "precip": "30%%",
            "humidity": "83%%",
            "wind": "6 kph"
          },
          "hourly": [
            { "time": "7 AM", "temp": %d, "precip": "2%%", "condition": "Cloudy" },
            { "time": "8 AM", "temp": %d, "precip": "5%%", "condition": "Cloudy" },
            { "time": "9 AM", "temp": %d, "precip": "10%%", "condition": "%s" },
            { "time": "10 AM", "temp": %d, "precip": "15%%", "condition": "Cloudy" },
            { "time": "11 AM", "temp": %d, "precip": "5%%", "condition": "Partly sunny" },
            { "time": "12 PM", "temp": %d, "precip": "0%%", "condition": "Sunny" },
            { "time": "1 PM", "temp": %d, "precip": "0%%", "condition": "Sunny" },
            { "time": "2 PM", "temp": %d, "precip": "0%%", "condition": "Sunny" }
          ],
          "daily": [
            { "date": "2025-09-29", "high": %d, "low": %d, "condition": "%s" },
            { "date": "2025-09-30", "high": %d, "low": %d, "condition": "Partly sunny" },
            { "date": "2025-10-01", "high": %d, "low": %d, "condition": "Sunny" },
            { "date": "2025-10-02", "high": %d, "low": %d, "condition": "Light rain" },
            { "date": "2025-10-03", "high": %d, "low": %d, "condition": "Rain" },
            { "date": "2025-10-04", "high": %d, "low": %d, "condition": "Cloudy" },
            { "date": "2025-10-05", "high": %d, "low": %d, "condition": "Sunny" }
          ]
        }
        """,
        // Current
        baseTemp, baseCondition,
        // Hourly
        baseTemp - 2, baseTemp - 1, baseTemp, baseCondition, baseTemp + 1, baseTemp + 2, baseTemp + 3, baseTemp + 4, baseTemp + 5,
        // Daily
        baseTemp, baseTemp - 5, baseCondition,
        baseTemp + 1, baseTemp - 4,
        baseTemp + 2, baseTemp - 3,
        baseTemp - 1, baseTemp - 6,
        baseTemp - 2, baseTemp - 7,
        baseTemp, baseTemp - 5,
        baseTemp + 1, baseTemp - 4
        );

        return jsonResponse;
    }
}
