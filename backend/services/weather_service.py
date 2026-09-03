import time
import httpx
from typing import Dict, Any, Optional

# Cache store: key -> (timestamp, data)
WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 900 # 15 minutes cache TTL

WMO_WEATHER_CODES = {
  0: {"en": "Clear Sky", "hi": "साफ आसमान"},
  1: {"en": "Mainly Clear", "hi": "मुख्यतः साफ"},
  2: {"en": "Partly Cloudy", "hi": "आंशिक बादल"},
  3: {"en": "Overcast", "hi": "घने बादल"},
  45: {"en": "Foggy", "hi": "कोहरा"},
  48: {"en": "Depositing Rime Fog", "hi": "सघन कोहरा"},
  51: {"en": "Light Drizzle", "hi": "हल्की बूंदाबांदी"},
  53: {"en": "Moderate Drizzle", "hi": "मध्यम बूंदाबांदी"},
  55: {"en": "Dense Drizzle", "hi": "तेज बूंदाबांदी"},
  61: {"en": "Slight Rain", "hi": "हल्की बारिश"},
  63: {"en": "Moderate Rain", "hi": "मध्यम बारिश"},
  65: {"en": "Heavy Rain", "hi": "भारी बारिश"},
  80: {"en": "Rain Showers", "hi": "वर्षा बौछार"},
  81: {"en": "Moderate Showers", "hi": "मध्यम वर्षा बौछार"},
  82: {"en": "Violent Showers", "hi": "मुसलाधार बारिश"},
  95: {"en": "Thunderstorm", "hi": "आंधी तूफान"}
}

async def fetch_real_weather(lat: float, lng: float) -> Optional[Dict[str, Any]]:
    """
    Fetch REAL current weather and forecast for a given latitude and longitude
    using Open-Meteo Free Weather API.
    """
    cache_key = f"{round(lat, 3)}_{round(lng, 3)}"
    now_time = time.time()

    if cache_key in WEATHER_CACHE:
        cache_time, cached_data = WEATHER_CACHE[cache_key]
        if now_time - cache_time < CACHE_TTL_SECONDS:
            return cached_data

    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m"
        f"&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,rain"
        f"&timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"Weather API HTTP Error: {response.status_code}")
                return None

            data = response.json()
            current = data.get("current", {})
            hourly = data.get("hourly", {})

            wcode = current.get("weather_code", 0)
            condition = WMO_WEATHER_CODES.get(wcode, {"en": "Clear", "hi": "साफ"})

            parsed_weather = {
                "latitude": lat,
                "longitude": lng,
                "temperature": current.get("temperature_2m"),
                "feels_like": current.get("apparent_temperature"),
                "humidity": current.get("relative_humidity_2m"),
                "precipitation_mm": current.get("precipitation", 0.0),
                "rain_mm": current.get("rain", 0.0),
                "cloud_cover_pct": current.get("cloud_cover", 0),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "weather_code": wcode,
                "condition_en": condition["en"],
                "condition_hi": condition["hi"],
                "observation_time": current.get("time"),
                "hourly_forecast": {
                    "time": hourly.get("time", [])[:24],
                    "temperature": hourly.get("temperature_2m", [])[:24],
                    "humidity": hourly.get("relative_humidity_2m", [])[:24],
                    "rain": hourly.get("rain", [])[:24],
                    "precipitation_prob": hourly.get("precipitation_probability", [])[:24]
                }
            }

            WEATHER_CACHE[cache_key] = (now_time, parsed_weather)
            return parsed_weather

    except Exception as e:
        print("Error fetching real weather data:", e)
        return None

