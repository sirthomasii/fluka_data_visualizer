from flask import Flask
from mvc_flask import FlaskMVC
from os import path, environ
from dotenv import load_dotenv
from extensions import db, migrate, oauth
from flask_socketio import SocketIO
from app import routes
import os
from flask_cors import CORS

from engineio.payload import Payload

Payload.max_decode_packets = 500

socketio = SocketIO(engineio_logger=True, async_mode='eventlet')

def create_app():
    basedir = path.abspath(path.dirname(__file__))


    load_dotenv(path.join(basedir, 'env.env'))
    dir_path = path.dirname(path.realpath(__file__))
    # Init Flask App
    app = Flask(__name__, static_url_path='/static', root_path=os.path.dirname(dir_path))
    # Add these lines to enable debug mode
    app.config['DEBUG'] = True
    app.config['PROPAGATE_EXCEPTIONS'] = True
    # Init MVC module
    FlaskMVC(app)
    CORS(app)  # This allows all domains to access your Flask app

    # Compile Static Assets
    # sass.compile(dirname=(path.join(dir_path, 'assets'), 'static/css'))

    # app.config['SQLALCHEMY_DATABASE_URI'] = environ.get('SQLALCHEMY_DATABASE_URI')
    # silence the deprecation warning
    # app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = environ.get('SQLALCHEMY_TRACK_MODIFICATIONS')

    app.config['UPLOAD_FOLDER'] = 'static/img/user_upload'

    app.config['MAX_CONTENT_PATH'] = 2e+6

    # App Secret
    app.secret_key = environ.get('SECRET_KEY')
    # bind SqlAlchemy with app context
    db.init_app(app)
    # bind  flask_migrate with app and db context
    migrate.init_app(app, db)
    # bind AuthLib with app context
    oauth.init_app(app)
    socketio.init_app(app)

    app.url_map.strict_slashes = False
    return app
