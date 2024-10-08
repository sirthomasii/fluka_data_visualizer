import os
import json
import logging
from collections import defaultdict

# Set up basic logging
logging.basicConfig(level=logging.INFO)

def generate_fluka_list():
    logging.info("Starting to generate fluka_list.json")
    
    # Change to the directory of the script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    logging.info(f"Changed to script directory: {script_dir}")

    # Clear the existing fluka_list.json file
    if os.path.exists('fluka_list.json'):
        os.remove('fluka_list.json')
        logging.info("Cleared existing fluka_list.json")

    fluka_params = {
        'BEAM_ENERGY': set(),
        'BEAM_SIZE': set(),
        'MATERIAL': set(),
        'files': {}
    }

    # New: Track available combinations
    combinations = defaultdict(lambda: defaultdict(set))

    for filename in os.listdir(script_dir):  # Changed from current_dir to script_dir
        if '.csv' in filename:
            logging.debug(f"Processing file: {filename}")
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

            # Update combinations
            combinations[file_params.get('MATERIAL', '')][file_params.get('BEAM_ENERGY', '')].add(file_params.get('BEAM_SIZE', ''))

    # New: Find common beam energies and sizes across all materials
    common_beam_energies = set.intersection(*[set(energies.keys()) for energies in combinations.values()])
    common_beam_sizes = set.intersection(*[set(size for sizes in material.values() for size in sizes) for material in combinations.values()])

    # Update fluka_params with common values
    fluka_params['BEAM_ENERGY'] = sorted(list(common_beam_energies))
    fluka_params['BEAM_SIZE'] = sorted(list(common_beam_sizes))
    fluka_params['MATERIAL'] = sorted(list(combinations.keys()))

    # Update files dictionary to include only valid combinations
    fluka_params['files'] = {
        f"{energy}_{size}_{material}": fluka_params['files'].get(f"{energy}_{size}_{material}")
        for energy in common_beam_energies
        for size in common_beam_sizes
        for material in fluka_params['MATERIAL']
        if f"{energy}_{size}_{material}" in fluka_params['files']
    }

    # Create a TypeScript-friendly structure
    ts_friendly_data = {
        'BEAM_ENERGY': fluka_params['BEAM_ENERGY'],
        'BEAM_SIZE': fluka_params['BEAM_SIZE'],
        'MATERIAL': fluka_params['MATERIAL'],
        'files': [
            {
                'key': key,
                'filename': value
            } for key, value in fluka_params['files'].items()
        ]
    }

    # Write the JSON file
    with open('fluka_list.json', 'w') as json_file:
        json.dump(ts_friendly_data, json_file, indent=2)

    logging.info("Successfully created fluka_list.json")

if __name__ == "__main__":
    generate_fluka_list()