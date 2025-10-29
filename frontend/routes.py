import requests
from .api import get_sessions, get_session_info
from flask import render_template, jsonify, request
from . import app

@app.route('/')
def index():
    sessions =  get_sessions()
    session_info = []
    for sid in sessions:
        session_info.append(get_session_info(sid))
    return render_template("index.html", session_info=session_info)