import json
import os
from datetime import datetime

# Modifier ici pour utiliser os.path.normpath pour normaliser le chemin
script_dir = os.path.dirname(os.path.abspath(__file__))
source_folder = os.path.normpath(os.path.join(script_dir, '..', 'conversed_texts'))
output_file_path = os.path.join(script_dir, 'combined_data.json')

catalog_labels = {
    '01_ancientName_processed.txt': 'Ancient Name',
    '02_terminology_processed.txt': 'Terminology',
    '03_modernResearcher_processed.txt': 'Modern Researcher'
}

all_entries = []

def process_file(file_name):
    catalog_label = catalog_labels.get(file_name, 'Unknown')
    file_path = os.path.join(source_folder, file_name)

    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                line = line.strip()
                if line:
                    parts = line.split(';')
                    entry = {
                        "ID": f"{file_name.split('_')[0]}-{parts[0]}",
                        "englishName": parts[0],
                        "chineseName": parts[1],
                        "otherNames": parts[2] if len(parts) > 2 else "",
                        "description": parts[3] if len(parts) > 3 else "",
                        "creatersInitial": parts[4] if len(parts) > 4 else "",
                        "entryDate": datetime.now().strftime('%Y-%m-%d'),
                        "catalogLabel": catalog_label,
                        "specialLabel" : "",
                        "lastModifiedDate": datetime.now().strftime('%Y-%m-%d'),
                        "lastModifiedAuthor": "Script"
                    }
                    all_entries.append(entry)
    except FileNotFoundError:
        print(f"File not found: {file_path}")

for file_name in catalog_labels.keys():
    process_file(file_name)

with open(output_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(all_entries, json_file, ensure_ascii=False, indent=4)

print(f"Data has been compiled and saved in {output_file_path}.")
