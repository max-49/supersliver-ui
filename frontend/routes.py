import base64
import requests
from .api import get_sessions, get_session_info, exec_bulk, start_shell, shell_input, shell_output, shell_close
from flask import render_template, jsonify, request
from . import app
from urllib.parse import urlparse

@app.route('/')
def index():
    sessions =  get_sessions()
    session_info = []
    for sid in sessions:
        session_info.append(get_session_info(sid))
    return render_template("index.html", session_info=session_info)

@app.route('/actions/exec-bulk', methods=['POST'])
def actions_exec_bulk():
    data = request.get_json(silent=True) or {}
    cmd = (data.get('cmd') or '').strip()
    session_ids = data.get('sessionIds') or []
    if not cmd or not isinstance(session_ids, list) or len(session_ids) == 0:
        return jsonify({ 'error': 'Expected body { cmd: string, sessionIds: string[] }' }), 400
    try:
        result = exec_bulk(cmd, session_ids)
        return jsonify(result)
    except requests.RequestException as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/actions/shell/ws-url')
def actions_shell_ws_url():
    sid = (request.args.get('sid') or '').strip()
    if not sid:
        return jsonify({ 'error': 'Missing sid' }), 400
    # Derive WS base from Node API endpoint
    from .api import API_ENDPOINT
    api = urlparse(API_ENDPOINT)
    # API_ENDPOINT like http://localhost:3000/api -> ws://localhost:3000/ws/shell
    ws_scheme = 'wss' if api.scheme == 'https' else 'ws'
    netloc = api.netloc
    ws_url = f"{ws_scheme}://{netloc}/ws/shell?sid={sid}"
    return jsonify({ 'wsUrl': ws_url })

# HTTP-based shell actions (no WebSockets)
@app.route('/actions/shell/start', methods=['POST'])
def actions_shell_start():
    body = request.get_json(silent=True) or {}
    sid = (request.args.get('sid') or body.get('sid') or '').strip()
    if not sid:
        return jsonify({ 'error': 'Missing sid' }), 400
    try:
        resp = start_shell(sid)
        return jsonify(resp)
    except requests.RequestException as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/actions/shell/input', methods=['POST'])
def actions_shell_input():
    data = request.get_json(silent=True) or {}
    sid = (data.get('sid') or '').strip()
    session_id = (data.get('sessionId') or '').strip()
    chunk = data.get('data') or ''
    if not sid or not session_id:
        return jsonify({ 'error': 'Missing sid/sessionId' }), 400
    try:
        resp = shell_input(sid, session_id, chunk)
        return jsonify(resp)
    except requests.RequestException as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/actions/shell/output')
def actions_shell_output():
    sid = (request.args.get('sid') or '').strip()
    session_id = (request.args.get('sessionId') or '').strip()
    cursor = int(request.args.get('cursor') or '0')
    if not sid or not session_id:
        return jsonify({ 'error': 'Missing sid/sessionId' }), 400
    try:
        resp = shell_output(sid, session_id, cursor)
        return jsonify(resp)
    except requests.RequestException as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/actions/shell/close', methods=['POST'])
def actions_shell_close():
    data = request.get_json(silent=True) or {}
    sid = (data.get('sid') or '').strip()
    session_id = (data.get('sessionId') or '').strip()
    if not sid or not session_id:
        return jsonify({ 'error': 'Missing sid/sessionId' }), 400
    try:
        resp = shell_close(sid, session_id)
        return jsonify(resp)
    except requests.RequestException as e:
        return jsonify({ 'error': str(e) }), 500