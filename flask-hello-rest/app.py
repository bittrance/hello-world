import os, time

from flask import Flask

app = Flask(__name__)

request_delay = float(os.environ.get('HELLO_REST_REQUEST_DELAY', 1.0))

@app.route("/")
def hello_world():
    time.sleep(request_delay)
    return "Hello, World!"
