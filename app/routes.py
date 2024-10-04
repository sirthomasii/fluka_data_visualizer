from mvc_flask import Router

Router.get("/", "home#index")
Router.get("/api/data", "home#hello")
Router.get("/api/get_fluka_files", "home#get_fluka_files")
