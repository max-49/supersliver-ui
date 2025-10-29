import requests

API_ENDPOINT = "http://localhost:3000/api"

def get_sessions():
    response = requests.get(f"{API_ENDPOINT}/sessions")
    response.raise_for_status()
    data = response.json()
    # Node backend returns array of sessions with ID field
    return [session["ID"] for session in data if isinstance(session, dict) and "ID" in session]

def get_session_info(sid):
    response = requests.get(f"{API_ENDPOINT}/sessions/{sid}/info")
    response.raise_for_status()
    return response.json()

def exec_bulk(cmd: str, session_ids: list[str]):
    """Proxy bulk execution to Node backend.

    Returns JSON: { results: [ { sid, success, exitCode?, error? } ] }
    """
    payload = { "cmd": cmd, "sessionIds": session_ids }
    response = requests.post(f"{API_ENDPOINT}/sessions/exec-bulk", json=payload, timeout=60)
    response.raise_for_status()
    return response.json()

def start_shell(sid: str):
    """Start HTTP-based shell session. Returns { sessionId }"""
    response = requests.post(f"{API_ENDPOINT}/sessions/{sid}/shell/start", json={})
    response.raise_for_status()
    return response.json()

def shell_input(sid: str, session_id: str, data: str):
    """Send input to shell session. data is UTF-8 string."""
    payload = { "sessionId": session_id, "data": data }
    response = requests.post(f"{API_ENDPOINT}/sessions/{sid}/shell/input", json=payload)
    response.raise_for_status()
    return response.json()

def shell_output(sid: str, session_id: str, cursor: int):
    """Fetch output since cursor. Returns { data (base64), encoding, nextCursor, closed }"""
    params = { "sessionId": session_id, "cursor": str(cursor) }
    response = requests.get(f"{API_ENDPOINT}/sessions/{sid}/shell/output", params=params)
    response.raise_for_status()
    return response.json()

def shell_close(sid: str, session_id: str):
    payload = { "sessionId": session_id }
    response = requests.post(f"{API_ENDPOINT}/sessions/{sid}/shell/close", json=payload)
    response.raise_for_status()
    return response.json()