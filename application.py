import os 

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

class CustomFlask(Flask):
    jinja_options = Flask.jinja_options.copy()
    jinja_options.update(dict(
        variable_start_string='%%',  # Default is '{{', I'm changing this because Vue.js uses '{{' / '}}'
        variable_end_string='%%',
    ))

app = CustomFlask(__name__)  # This replaces your existing "app = Flask(__name__)"
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

votes = {"yes": 0, "no": 0, "maybe": 0}
channels = ["#default", "#cs50-web"]
messages = { "#default": [{ "id": 0, "user": "thibot", "msg": "Welcome to this channel" }] }

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("init votes")
def init_votes():
    emit("vote totals", votes, broadcast=True)

@socketio.on("submit vote")
def vote(data):
    selection = data["selection"]
    votes[selection] += 1
    emit("vote totals", votes, broadcast=True)

@socketio.on("get channels")
def get_channels():
    emit("update channels", channels, broadcast=True)

@socketio.on("add channel")
def add_channel(data):
    channel = data["channel"]
    if channel in channels:
        return
    channels.append(channel)
    emit("update channels", channels, broadcast=True)

@socketio.on("delete channel")
def delete_channel(data):
    channel = data["channel"]
    channels.remove(channel)
    emit("update channels", channels, broadcast=True)

@socketio.on("get all messages")
def get_last_messages(data):
    channel = data["channel"]
    join_room(channel)
    if channel in [key for key in messages]:
        emit('update all messages', messages[channel])
    else:
        emit('update all messages', [{ "id": 0, "user": "bot", "msg": f"No message yet in {channel}" }], room=channel)

@socketio.on("leave channel")
def leave_channel(data):
    channel = data["channel"]
    leave_room(channel)

@socketio.on("send message")
def send_message(data):
    user = data["user"]["name"]
    channel = data["channel"]
    msg = data["message"]
    id = 0
    if channel in messages and len(messages[channel]) > 0:
        id = max([msg["id"] for msg in messages[channel]]) + 1

    message = {
        "id": id,
        "user": user,
        "msg": msg,
    }
    if channel not in messages:
        messages[channel] = []
    messages[channel].append(message)

    emit("new message", message, room=channel)