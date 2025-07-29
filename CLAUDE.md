# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GreenwayXLS2Label is a Python utility that converts patient data from Excel (.xls) files into printable PDF labels. The application reads patient information from an Excel spreadsheet and generates custom-sized PDF labels suitable for medical/healthcare use.

## Architecture

The codebase follows a simple three-class architecture:

- **Patient** (`src/main.py:8-18`): Data model representing patient information (name, ID, date of birth)
- **Reader** (`src/main.py:20-43`): Handles Excel file parsing using xlrd, extracts patient data with regex pattern matching
- **LabelGenerator** (`src/main.py:45-86`): Creates PDF labels using ReportLab with rotated text layout for label printing

## Key Dependencies

- **xlrd**: Excel file reading (legacy .xls format support)
- **reportlab**: PDF generation and canvas drawing
- **PySide6**: GUI framework for the graphical interface

## Common Commands

### Installing Dependencies
```bash
pip install -r requirements.txt
```

### Running the Application

#### GUI Mode (Default)
```bash
python src/main.py
# or
python run_gui.py
```

#### Command Line Mode
```bash
python src/main.py --cli <path_to_excel_file>
python src/main.py --cli patient_data.xls -o output.pdf --pages 3
```

## Data Processing Logic

The Reader class uses specific regex patterns to extract patient data:
- Patient names: Extracted from text before `[` bracket using `r"^(.+?)\s*\["`
- Patient IDs: Extracted from brackets using `"\\[(\\d+)\\]$"`
- Filters out "Surgery, Surgery [37222]" entries specifically

## PDF Generation Details

- Default label size: 1.125" x 3.5"
- Text is rotated 90 degrees for label orientation
- Generates 2 copies per patient by default
- Output saved to user's Desktop directory
- Uses Helvetica font at 10pt size

## GUI Features

The PySide6 GUI (`src/gui.py`) provides:
- **File Selection**: Browse and select Excel files with validation
- **Patient Preview**: Real-time preview of parsed patient data in a table
- **Configuration Panel**: Quick settings for labels per patient and font size
- **Advanced Settings**: Detailed configuration dialog for dimensions, fonts, and spacing
- **Progress Tracking**: Real-time progress dialog during PDF generation
- **Error Handling**: User-friendly error messages and validation
- **Theming System**: Automatic system theme detection with manual light/dark mode options
- **Modern UI**: Professional styling with proper focus states and hover effects

## Important Notes

- The application supports both .xls and .xlsx Excel formats
- Patient data parsing relies on specific formatting patterns in the Excel file
- Labels are designed for physical label printers with the specified dimensions
- GUI mode provides better user experience with visual feedback and error handling