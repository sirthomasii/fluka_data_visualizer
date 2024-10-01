from flask import redirect, url_for, request
import app.controllers.globals as globals
from flask import jsonify

spaces_url = r"https://vitrotem-data.ams3.digitaloceanspaces.com/vitroserver/"

class HomeController:
    #before_request = ["redirect_to_hi"]

    def index(self, view, request):
        return view("index.html")

    def hello(self, view, request):
        return jsonify({'message': 'Hello from Flask!'})

    def redirect_to_hi(self):
        if request.endpoint == "home.index":
            return redirect(url_for(".hello"))
