from mvc_flask import Router

Router.get("/", "home#index")
Router.get("/api/data", "home#hello")
