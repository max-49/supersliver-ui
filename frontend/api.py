import requests

API_ENDPOINT = "http://localhost:3000/api"

def get_sessions():
    response = requests.get(f"{API_ENDPOINT}/sessions")
    print(response)
    response.raise_for_status()
    data = response.json()
    # Node backend returns array of sessions with ID field
    return [session["u"][0] for session in data if ["u"][0]]

def get_session_info(sid):
    response = requests.get(f"{API_ENDPOINT}/sessions/{sid}/info")
    data = response.json()
    response.raise_for_status()
    return response.json()