from flask import redirect, url_for, request, current_app
import app.controllers.globals as globals
from flask import jsonify
import os
import traceback
import logging

spaces_url = r"https://vitrotem-data.ams3.digitaloceanspaces.com/vitroserver/"

# Set up basic logging
logging.basicConfig(level=logging.INFO)

class HomeController:
    #before_request = ["redirect_to_hi"]

    def index(self, view, request):
        return view("index.html")

    def hello(self, view, request):
        return jsonify({'message': 'Hello from Flask!'})
    
    def get_fluka_files(self, view, request):
        logging.info("Entering get_fluka_files method")
        try:
            # Get the directory of the current script
            current_dir = os.path.dirname(os.path.abspath(__file__))
            # Construct the absolute path to the fluka_data directory
            fluka_data_dir = os.path.abspath(os.path.join(current_dir, '..', '..', 'next-frontend', 'public', 'fluka_data'))
            logging.info(f"Fluka data directory: {fluka_data_dir}")
            
            if not os.path.exists(fluka_data_dir):
                logging.error(f"Directory not found: {fluka_data_dir}")
                return jsonify({"error": "Fluka data directory not found"}), 404

            fluka_params = {
                'BEAM_ENERGY': set(),
                'BEAM_SIZE': set(),
                'MATERIAL': set(),
                'files': {}
            }

            for filename in os.listdir(fluka_data_dir):
                logging.debug(f"Processing file: {filename}")
                if '.csv' in filename:
                    param_string, _ = filename.split('.csv', 1)
                    params = param_string.split('__')
                    
                    file_params = {}
                    for i in range(0, len(params), 2):
                        if i + 1 < len(params):
                            key, value = params[i], params[i + 1]
                            file_params[key] = value
                            if key in fluka_params:
                                fluka_params[key].add(value)

                    file_key = f"{file_params.get('BEAM_ENERGY', '')}_{file_params.get('BEAM_SIZE', '')}_{file_params.get('MATERIAL', '')}"
                    fluka_params['files'][file_key] = filename

            for key in ['BEAM_ENERGY', 'BEAM_SIZE', 'MATERIAL']:
                fluka_params[key] = sorted(list(fluka_params[key]))

            logging.info("Successfully processed all files")
            return jsonify(fluka_params)
        except Exception as e:
            logging.error(f"Error in get_fluka_files: {str(e)}")
            # Handle the exception appropriately
        
        # Return statement or further processing...

    def redirect_to_hi(self):
        if request.endpoint == "home.index":
            return redirect(url_for(".hello"))
