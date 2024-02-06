import os
import re


def transform_data(file_path, output_file_path):
    # Open the source file for reading
    with open(file_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    # Open the destination file for writing
    with open(output_file_path, "w", encoding="utf-8") as output_file:
        for line in lines:
            # Strip white spaces and skip empty lines
            line = line.strip()
            if not line:
                continue

            # Split the line elements
            elements = line.split(';')
            # Reverse the elements if needed and add empty fields for 'OtherNames' and 'Description'
            if len(elements) == 2:
                # Reversing 'ChineseName' and 'EnglishName', adding ';' for 'OtherNames' and 'Description'
                new_line = f"{elements[1]};{elements[0]};;;\n"
            else:
                # If the structure is not as expected, keep the line as is or handle it differently
                new_line = line + '\n'

            # Write the new line to the output file
            output_file.write(new_line)

print("Transformation completed.")

def read_txt_in_folder(folder_path, output_folder_path):
    """
    Reads all Word documents in the specified folder and prints their content.

    Parameters:
        folder_path (str): The path to the folder containing Word documents.
    """
    # Iterate over all files in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            file_path = os.path.join(folder_path, filename)
            output_file_path = os.path.join(output_folder_path, filename)
            print(f"Reading {filename} content...")
            transform_data(file_path, output_file_path)

input_path = "parsing/extracted_texts"
output_path = "parsing/conversed_texts"

read_txt_in_folder(input_path, output_path)