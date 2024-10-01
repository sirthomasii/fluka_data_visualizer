import eventlet
eventlet.monkey_patch()

from os import path, environ
from app import create_app, socketio
# import sass
from dotenv import load_dotenv
from extensions import db, migrate, oauth
import os

# env_name = os.getenv('FLASK_ENV')

# def gunicorn_start():
#     app = create_app()
#     # socketio.run(app,host=os.environ["SERVER_IP"], port=8080,debug=False)
#     return app

if __name__ == "__main__":
    app = create_app()
    # socketio.run(app,host=os.environ["SERVER_IP"], port=8080,debug=False)
    socketio.run(app,host="localhost", port=5000,log_output=True,debug=True)
