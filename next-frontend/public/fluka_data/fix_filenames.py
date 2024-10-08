import os
import sys

# Change the working directory to the script's directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Get the list of all files in the current directory
for filename in os.listdir('.'):
    # Check if the filename contains '##'
    if '##' in filename:
        # Get the portion of the filename before '##'
        new_filename = filename.split('##')[0] + '.csv'
        
        # Rename the file
        os.rename(filename, new_filename)
        print(f"Renamed: {filename} -> {new_filename}")
