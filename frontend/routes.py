import requests
from flask import render_template, jsonify, request
from . import app

@app.route('/')
def index():
    return render_template("index.html")