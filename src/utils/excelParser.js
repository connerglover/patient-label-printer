import * as SheetJS from 'xlsx';

// SheetJS's ESM and CJS builds hang their exports off different objects, and
// only one of them carries SSF. Resolve once so date parsing works in the
// browser bundle and in Node (tests, scripts) alike.
const XLSX = SheetJS.SSF ? SheetJS : SheetJS.default;

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
    if (dob === null || dob === undefined || dob === "") {
      return "N/A";
    }

    const text = dob.toString().trim();
    if (!text) {
      return "N/A";
    }

    // A date cell with no date format reaches us as a bare serial — as a number
    // when read raw, or as an all-digit string when read formatted. Either way,
    // printing "29000" as a date of birth on a specimen label is unacceptable,
    // so convert anything in the plausible serial range. No real date of birth
    // is written as a bare integer, which keeps this from firing by mistake.
    const isBareSerial = /^\d{1,5}$/.test(text) && Number(text) >= 1 && Number(text) <= 60000;
    if (typeof dob === 'number' || isBareSerial) {
      const serial = Number(text);
      try {
        const date = XLSX.SSF.parse_date_code(serial);
        if (date && date.y && date.m && date.d) {
          const month = date.m.toString().padStart(2, '0');
          const day = date.d.toString().padStart(2, '0');
          return `${month}/${day}/${date.y}`;
        }
      } catch (e) {
        console.warn(`Could not convert Excel date ${serial}:`, e);
      }
      return text;
    }

    return text;
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
        throw new Error("That workbook has no worksheets in it.");
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (data.length === 0) {
        throw new Error("The first worksheet is empty.");
      }

      this.patients = this.parsePatientData(data);
      
      if (this.patients.length === 0) {
        throw new Error(
          "No patient rows found. Confirm this is the daily summary report — names with bracketed IDs belong in column B and dates of birth in column D of the first worksheet."
        );
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