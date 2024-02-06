import os

# Name of the folder to exclude from the search
exclude_folder = 'sample_folder'
target_directory = "parsing/conversed_texts"
full_target_path = os.path.join(os.getcwd(), target_directory)

def read_and_process_file(file_path, folder_name):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    processed_lines = []
    for line in lines:
        line = line.strip()  # Clean whitespace and newline characters
        if line:  # Skip empty lines
            processed_line = f"{line};{folder_name}\n"  # Append the folder name at the end
            processed_lines.append(processed_line)
    return processed_lines

def main():
    # Traverse subfolders of the current directory
    for root, dirs, files in os.walk(full_target_path, topdown=True):
        dirs[:] = [d for d in dirs if d != exclude_folder]  # Exclude the specified folder
        if root != full_target_path:
            print(f"Processing files in: {root}")
            for name in files:
                if name.endswith('.txt'):
                    folder_name = os.path.basename(root)  # Name of the folder containing the file
                    file_path = os.path.join(root, name)
                    processed_data = read_and_process_file(file_path, folder_name)
                    # Construct the output file name based on the original file name
                    output_file_name = f"{os.path.splitext(name)[0]}_processed.txt"
                    output_file_path = os.path.join(full_target_path, output_file_name)
                    # Write the sorted data to the output file
                    with open(output_file_path, 'a', encoding='utf-8') as output_file:
                        output_file.writelines(processed_data)

    print("Data processing and file creation completed.")

def sort_and_check_duplicates(lines, file_path):
    # Trier les lignes par le premier élément
    lines.sort(key=lambda x: x.split(';')[0])
    file_name = os.path.basename(file_path)
    # Vérifier les doublons basés sur le premier élément
    previous_first_element = None
    for line in lines:
        current_first_element = line.split(';')[0]
        if current_first_element == previous_first_element:
            print(f"Duplicate entry found: {line.strip()} in {file_name}")
        previous_first_element = current_first_element

    return lines

def sort_and_rewrite_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Trier les données et vérifier les doublons
    sorted_lines = sort_and_check_duplicates(lines, file_path)

    # Réécrire le fichier avec les données triées
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(sorted_lines)


def transform_names(line):
    elements = line.split(';')
    name = elements[0]
    # Vérifier si le nom est dans le format "Nom, Prénom"
    if ',' not in name:
        parts = name.split(' ')
        if len(parts) == 2:  # Simple split by space for demonstration
            transformed_name = f"{parts[1]}, {parts[0]}"
            elements[0] = transformed_name
            return ';'.join(elements)
        if len(parts) == 3:
            transformed_name = f"{parts[2]}, {parts[0]} {parts[1]}"
            elements[0] = transformed_name
            return ';'.join(elements)
    return line

def process_modern_researcher_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    # Transformer les noms si nécessaire
    transformed_lines = [transform_names(line) for line in lines]

    # Trier les données transformées
    transformed_lines.sort(key=lambda x: x.split(';')[0])
    # Réécrire le fichier avec les données transformées et triées
    sorted_lines = sort_and_check_duplicates(transformed_lines, file_path)
    
    # Réécrire le fichier avec les données triées
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(sorted_lines)


if __name__ == "__main__":
    main()

    all_processed_files = ["01_ancientName_processed.txt", "02_terminology_processed.txt", "03_modernResearcher_processed.txt"]
    for file_name in all_processed_files:
        full_path = os.path.join(full_target_path, file_name)
        if file_name == "03_modernResearcher_processed.txt":
            process_modern_researcher_file(full_path)
        else:
            sort_and_rewrite_file(full_path)

