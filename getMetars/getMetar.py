import requests

def get_metar(station_code):
    url = f"https://aviationweather.gov/api/data/metar/{station_code}"
    response = requests.get(url)
    
    if response.status_code == 200:
        return response.text
    else:
        print("Failed to retrieve METAR data")
        print(response.status_code)
        return None

station_code = input("Enter the 4-letter station code (e.g., 'KLAX' for Los Angeles): ").upper()
metar_data = get_metar(station_code)

if metar_data:
    print("METAR Data:")
    print(metar_data)
