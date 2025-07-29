import * as XLSX from 'xlsx';

const EXCLUDED_ENTRIES = ["Surgery, Surgery [37222]"];
const NAME_REGEX = /^(.+?)\s*\[/;
const ID_REGEX = /\[(\d+)\]$/;

export class Patient {
  constructor(name, patientId, dob) {
    this.name = this.validateName(name);
    this.id = this.validateId(patientId);
    this.dob = this.validateDob(dob);
  }

  validateName(name) {
    if (!name || !name.trim()) {
      throw new Error("Patient name cannot be empty");
    }
    const cleaned = name.trim();
    return cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
  }

  validateId(patientId) {
    if (!patientId || !patientId.trim()) {
      throw new Error("Patient ID cannot be empty");
    }
    return patientId.trim();
  }

  validateDob(dob) {
    if (!dob) {
      return "N/A";
    }
    
    // Handle Excel date numbers
    if (typeof dob === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(dob);
        return `${(date.m).toString().padStart(2, '0')}/${date.d.toString().padStart(2, '0')}/${date.y}`;
      } catch (e) {
        console.warn(`Could not convert Excel date ${dob}:`, e);
        return dob.toString();
      }
    }
    
    return dob.toString().trim();
  }

  toString() {
    return `Name: ${this.name}\nID: ${this.id}\nDate of Birth: ${this.dob}`;
  }
}

export class ExcelParser {
  constructor(file) {
    this.file = file;
    this.patients = [];
  }

  async parseFile() {
    try {
      const arrayBuffer = await this.file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        throw new Error("Excel file contains no worksheets");
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (data.length === 0) {
        throw new Error("Excel sheet is empty");
      }

      this.patients = this.parsePatientData(data);
      
      if (this.patients.length === 0) {
        throw new Error("No valid patient data found in the Excel file");
      }

      return this.patients;
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw error;
    }
  }

  parsePatientData(data) {
    const patients = [];
    const errors = [];

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      try {
        const row = data[rowIndex];
        
        // Check if row has enough columns (need at least columns B and D, indices 1 and 3)
        if (!row || row.length < 4) {
          continue;
        }

        const cellValue = row[1]; // Column B (index 1)
        
        // Skip empty cells
        if (!cellValue) {
          continue;
        }

        const cellStr = cellValue.toString().trim();
        
        // Check if this looks like patient data
        if (!this.isPatientRow(cellStr)) {
          continue;
        }

        // Extract patient information
        const patient = this.extractPatientInfo(rowIndex, cellStr, row[3]); // Column D (index 3)
        if (patient) {
          patients.push(patient);
        }
      } catch (error) {
        const errorMsg = `Error processing row ${rowIndex + 1}: ${error.message}`;
        errors.push(errorMsg);
        console.warn(errorMsg);
      }
    }

    if (errors.length > 0) {
      console.warn(`Encountered ${errors.length} errors during parsing:`, errors);
    }

    console.log(`Successfully parsed ${patients.length} patients`);
    return patients;
  }

  isPatientRow(cellStr) {
    // Must contain comma and brackets for patient format
    if (!cellStr.includes(",") || !cellStr.includes("[") || !cellStr.includes("]")) {
      return false;
    }

    // Exclude specific entries
    if (EXCLUDED_ENTRIES.includes(cellStr)) {
      return false;
    }

    return true;
  }

  extractPatientInfo(rowIndex, cellStr, dobCell) {
    try {
      // Extract name
      const nameMatch = NAME_REGEX.exec(cellStr);
      if (!nameMatch) {
        throw new Error(`Could not extract name from: ${cellStr}`);
      }
      const name = nameMatch[1].trim();

      // Extract ID
      const idMatch = ID_REGEX.exec(cellStr);
      if (!idMatch) {
        throw new Error(`Could not extract ID from: ${cellStr}`);
      }
      const patientId = idMatch[1].trim();

      // Extract date of birth
      const dob = dobCell || "";

      return new Patient(name, patientId, dob);
    } catch (error) {
      console.warn(`Failed to extract patient info from row ${rowIndex + 1}:`, error.message);
      return null;
    }
  }
}

export default ExcelParser;