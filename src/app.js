// Global variables
let patients = [];
let selectedPatients = new Set();

// Configuration defaults
const config = {
    labelsPerPatient: 2,
    filename: 'Patient_Labels.pdf',
    labelWidth: 1.125,
    labelHeight: 3.5,
    fontSize: 10,
    fontFamily: 'helvetica'
};

// Constants from original Python app
const EXCLUDED_ENTRIES = ['Surgery, Surgery [37222]'];
const NAME_REGEX = /^(.+?)\s*\[/;
const ID_REGEX = /\[(\d+)\]$/;

// DOM elements
const fileInput = document.getElementById('fileInput');
const fileButton = document.getElementById('fileButton');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const messages = document.getElementById('messages');
const configSection = document.getElementById('configSection');
const patientSection = document.getElementById('patientSection');
const actionSection = document.getElementById('actionSection');
const patientList = document.getElementById('patientList');
const patientCount = document.getElementById('patientCount');
const selectAllBtn = document.getElementById('selectAllBtn');
const removeSelectedBtn = document.getElementById('removeSelectedBtn');
const printBtn = document.getElementById('printBtn');
const clearBtn = document.getElementById('clearBtn');
const printText = document.getElementById('printText');
const printSpinner = document.getElementById('printSpinner');

// Initialize the application
function init() {
    setupEventListeners();
    updateConfigFromInputs();
}

// Event listeners
function setupEventListeners() {
    // File upload
    fileButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Configuration inputs
    document.getElementById('labelsPerPatient').addEventListener('input', updateConfig);
    document.getElementById('filename').addEventListener('input', updateConfig);
    document.getElementById('labelWidth').addEventListener('input', updateConfig);
    document.getElementById('labelHeight').addEventListener('input', updateConfig);
    document.getElementById('fontSize').addEventListener('input', updateConfig);
    document.getElementById('fontFamily').addEventListener('change', updateConfig);
    
    // Action buttons
    selectAllBtn.addEventListener('click', toggleSelectAll);
    removeSelectedBtn.addEventListener('click', removeSelectedPatients);
    printBtn.addEventListener('click', printPDF);
    clearBtn.addEventListener('click', clearAll);
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Process Excel file
async function processFile(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.xls') && 
        !file.name.toLowerCase().endsWith('.xlsx')) {
        showMessage('Please select a valid Excel file (.xls or .xlsx)', 'error');
        return;
    }
    
    showMessage('Processing file...', 'info', 2000);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
            throw new Error('Excel file contains no worksheets');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        if (data.length === 0) {
            throw new Error('Excel sheet is empty');
        }
        
        const parsedPatients = parsePatientData(data);
        
        if (parsedPatients.length === 0) {
            throw new Error('No valid patient data found in the Excel file');
        }
        
        patients = parsedPatients;
        selectedPatients.clear();
        
        showMessage(`Successfully loaded ${patients.length} patients from ${file.name}`, 'success', 4000);
        showFileInfo(file);
        updatePatientList();
        showSections();
        
    } catch (error) {
        console.error('Error processing file:', error);
        showMessage(`Error parsing file: ${error.message}`, 'error');
    }
}

// Parse patient data from Excel
function parsePatientData(data) {
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
            if (!isPatientRow(cellStr)) {
                continue;
            }
            
            // Extract patient information
            const patient = extractPatientInfo(rowIndex, cellStr, row[3]); // Column D (index 3)
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

// Check if a row contains patient data
function isPatientRow(cellStr) {
    // Must contain comma and brackets for patient format
    if (!cellStr.includes(',') || !cellStr.includes('[') || !cellStr.includes(']')) {
        return false;
    }
    
    // Exclude specific entries
    if (EXCLUDED_ENTRIES.includes(cellStr)) {
        return false;
    }
    
    return true;
}

// Extract patient information from a cell string
function extractPatientInfo(rowIndex, cellStr, dobCell) {
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
        let dob = dobCell || 'N/A';
        
        // Handle Excel date numbers
        if (typeof dobCell === 'number') {
            try {
                const date = XLSX.SSF.parse_date_code(dobCell);
                dob = `${String(date.m).padStart(2, '0')}/${String(date.d).padStart(2, '0')}/${date.y}`;
            } catch (e) {
                console.warn(`Could not convert Excel date ${dobCell}:`, e);
                dob = dobCell.toString();
            }
        } else if (dobCell) {
            dob = dobCell.toString().trim();
        }
        
        return {
            name: validateName(name),
            id: validateId(patientId),
            dob: dob
        };
        
    } catch (error) {
        console.warn(`Failed to extract patient info from row ${rowIndex + 1}:`, error.message);
        return null;
    }
}

// Validation functions
function validateName(name) {
    if (!name || !name.trim()) {
        throw new Error('Patient name cannot be empty');
    }
    const cleaned = name.trim();
    return cleaned.length > 100 ? cleaned.substring(0, 100) : cleaned;
}

function validateId(patientId) {
    if (!patientId || !patientId.trim()) {
        throw new Error('Patient ID cannot be empty');
    }
    return patientId.trim();
}

// UI functions
function showMessage(text, type, duration = null) {
    const messageDiv = document.createElement('div');
    let className = `message ${type}`;
    
    // Add progress bar for info and success messages with auto-removal
    const shouldAutoRemove = (type === 'info' || type === 'success') && duration !== null;
    if (shouldAutoRemove) {
        className += ' with-progress';
        const actualDuration = duration || (type === 'info' ? 3000 : 4000);
        messageDiv.style.setProperty('--duration', `${actualDuration}ms`);
    }
    
    messageDiv.className = className;
    messageDiv.innerHTML = `
        ${text}
        <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    messages.appendChild(messageDiv);
    
    // Auto-remove messages with progress bar
    if (shouldAutoRemove) {
        const actualDuration = duration || (type === 'info' ? 3000 : 4000);
        setTimeout(() => {
            if (messageDiv.parentElement) {
                messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageDiv.style.opacity = '0';
                messageDiv.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (messageDiv.parentElement) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, actualDuration);
    }
}

function showFileInfo(file) {
    fileInfo.innerHTML = `
        <strong>Selected file:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)
    `;
    fileInfo.classList.remove('hidden');
}

function showSections() {
    configSection.classList.remove('hidden');
    patientSection.classList.remove('hidden');
    actionSection.classList.remove('hidden');
}

function updatePatientList() {
    patientCount.textContent = patients.length;
    
    if (patients.length === 0) {
        patientList.innerHTML = '<p class="text-center">No patients loaded.</p>';
        return;
    }
    
    patientList.innerHTML = patients.map((patient, index) => `
        <div class="patient-item ${selectedPatients.has(index) ? 'selected' : ''}" data-index="${index}">
            <input type="checkbox" class="patient-checkbox" ${selectedPatients.has(index) ? 'checked' : ''}
                   onchange="togglePatientSelection(${index})">
            <div class="patient-info">
                <div class="patient-field">
                    <label>Name</label>
                    <span>${escapeHtml(patient.name)}</span>
                </div>
                <div class="patient-field">
                    <label>Patient ID</label>
                    <span>${escapeHtml(patient.id)}</span>
                </div>
                <div class="patient-field">
                    <label>Date of Birth</label>
                    <span>${escapeHtml(patient.dob)}</span>
                </div>
            </div>
            <div class="patient-actions">
                <button class="remove-btn" onclick="removePatient(${index})" title="Remove patient">
                    &times;
                </button>
            </div>
        </div>
    `).join('');
    
    updateSelectionUI();
}

function updateSelectionUI() {
    const hasSelected = selectedPatients.size > 0;
    removeSelectedBtn.classList.toggle('hidden', !hasSelected);
    
    if (hasSelected) {
        removeSelectedBtn.textContent = `Remove Selected (${selectedPatients.size})`;
    }
    
    selectAllBtn.textContent = selectedPatients.size === patients.length ? 'Deselect All' : 'Select All';
}

function togglePatientSelection(index) {
    if (selectedPatients.has(index)) {
        selectedPatients.delete(index);
    } else {
        selectedPatients.add(index);
    }
    updatePatientList();
}

function toggleSelectAll() {
    if (selectedPatients.size === patients.length) {
        selectedPatients.clear();
    } else {
        selectedPatients = new Set(patients.map((_, index) => index));
    }
    updatePatientList();
}

function removePatient(index) {
    patients.splice(index, 1);
    selectedPatients.clear();
    updatePatientList();
    
    if (patients.length === 0) {
        configSection.classList.add('hidden');
        patientSection.classList.add('hidden');
        actionSection.classList.add('hidden');
    }
}

function removeSelectedPatients() {
    const indicesToRemove = Array.from(selectedPatients).sort((a, b) => b - a);
    indicesToRemove.forEach(index => patients.splice(index, 1));
    selectedPatients.clear();
    updatePatientList();
    
    if (patients.length === 0) {
        configSection.classList.add('hidden');
        patientSection.classList.add('hidden');
        actionSection.classList.add('hidden');
    }
}

function clearAll() {
    patients = [];
    selectedPatients.clear();
    messages.innerHTML = '';
    fileInfo.classList.add('hidden');
    configSection.classList.add('hidden');
    patientSection.classList.add('hidden');
    actionSection.classList.add('hidden');
    fileInput.value = '';
}

// Configuration management
function updateConfig() {
    config.labelsPerPatient = parseInt(document.getElementById('labelsPerPatient').value) || 2;
    config.filename = document.getElementById('filename').value || 'Patient_Labels.pdf';
    config.labelWidth = parseFloat(document.getElementById('labelWidth').value) || 1.125;
    config.labelHeight = parseFloat(document.getElementById('labelHeight').value) || 3.5;
    config.fontSize = parseInt(document.getElementById('fontSize').value) || 10;
    config.fontFamily = document.getElementById('fontFamily').value || 'helvetica';
    
    updatePreview();
    updatePrintButton();
}

function updateConfigFromInputs() {
    document.getElementById('labelsPerPatient').value = config.labelsPerPatient;
    document.getElementById('filename').value = config.filename;
    document.getElementById('labelWidth').value = config.labelWidth;
    document.getElementById('labelHeight').value = config.labelHeight;
    document.getElementById('fontSize').value = config.fontSize;
    document.getElementById('fontFamily').value = config.fontFamily;
    
    updatePreview();
}

function updatePreview() {
    const preview = document.getElementById('labelPreview');
    const sampleLabel = preview.querySelector('.sample-label');
    
    if (sampleLabel) {
        const needsRotation = config.labelHeight > config.labelWidth;
        const isSquare = config.labelHeight === config.labelWidth;
        
        // Use a fixed scale for consistent preview sizing
        const scale = 80; // pixels per inch
        
        // Calculate display dimensions
        let displayWidth, displayHeight;
        
        if (needsRotation && !isSquare) {
            // For tall labels that will have rotated text, flip the preview dimensions
            // so we see it as it should be read (with text right-side up)
            displayWidth = config.labelHeight * scale; // height becomes width
            displayHeight = config.labelWidth * scale; // width becomes height
        } else {
            // For wide or square labels, use normal dimensions
            displayWidth = config.labelWidth * scale;
            displayHeight = config.labelHeight * scale;
        }
        
        // Set the dimensions
        sampleLabel.style.width = `${displayWidth}px`;
        sampleLabel.style.height = `${displayHeight}px`;
        
        // Set font size - scale it with the label size
        const fontSize = Math.max(8, Math.min(config.fontSize, 14));
        sampleLabel.style.fontSize = `${fontSize}px`;
        
        // Set font family
        const fontFamily = config.fontFamily === 'helvetica' ? 'Arial, sans-serif' :
                          config.fontFamily === 'times' ? 'Times, serif' :
                          'Courier, monospace';
        sampleLabel.style.fontFamily = fontFamily;
        
        // No transform needed - text is already positioned correctly
        sampleLabel.style.transform = 'none';
        
        // Update preview info
        const previewSection = document.querySelector('.preview-section');
        let previewInfo = previewSection.querySelector('.preview-info');
        
        if (!previewInfo) {
            previewInfo = document.createElement('p');
            previewInfo.className = 'preview-info';
            previewInfo.style.fontSize = '12px';
            previewInfo.style.color = '#ffffff';
            previewInfo.style.marginTop = '10px';
            previewInfo.style.textAlign = 'center';
            previewInfo.style.textShadow = '0 1px 3px rgba(0, 0, 0, 0.3)';
            previewInfo.style.fontWeight = '500';
            previewSection.appendChild(previewInfo);
        }
        
        if (needsRotation && !isSquare) {
            previewInfo.textContent = `${config.labelWidth}" × ${config.labelHeight}" - Preview flipped to show text orientation`;
        } else {
            previewInfo.textContent = `${config.labelWidth}" × ${config.labelHeight}" - Normal orientation`;
        }
    }
}

function updatePrintButton() {
    if (patients.length > 0) {
        const totalLabels = patients.length * config.labelsPerPatient;
        printText.textContent = `Print PDF Labels (${totalLabels} labels)`;
    }
}

// PDF Generation and Printing
async function printPDF() {
    if (patients.length === 0) {
        showMessage('No patients to print labels for. Please upload an Excel file first.', 'error');
        return;
    }
    
    setPrinting(true);
    
    try {
        const { jsPDF } = window.jspdf;
        
        // Convert inches to points (72 points per inch)
        const finalWidth = config.labelWidth * 72;
        const finalHeight = config.labelHeight * 72;
        
        // Create PDF with custom page size
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: [finalWidth, finalHeight]
        });
        
        const totalPages = patients.length * config.labelsPerPatient;
        console.log(`Generating ${totalPages} labels for ${patients.length} patients...`);
        
        let pageCount = 0;
        let isFirstPage = true;
        
        for (let i = 0; i < patients.length; i++) {
            const patient = patients[i];
            
            for (let copy = 0; copy < config.labelsPerPatient; copy++) {
                if (!isFirstPage) {
                    pdf.addPage([finalWidth, finalHeight]);
                }
                isFirstPage = false;
                
                createLabelPage(pdf, patient);
                pageCount++;
                
                // Progress feedback
                if (pageCount % 10 === 0 || pageCount === totalPages) {
                    console.log(`Generated ${pageCount}/${totalPages} labels...`);
                }
            }
        }
        
        // Open print dialog instead of downloading
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Create a hidden iframe for printing
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
        
        // Set up print event handlers
        let printDialogClosed = false;
        
        const handleAfterPrint = () => {
            if (!printDialogClosed) {
                printDialogClosed = true;
                showMessage(`Print job completed for ${totalPages} labels`, 'success');
                
                // Clean up after a longer delay to ensure print job completes
                setTimeout(() => {
                    if (document.body.contains(printFrame)) {
                        document.body.removeChild(printFrame);
                    }
                    URL.revokeObjectURL(pdfUrl);
                }, 3000);
            }
        };
        
        const handleBeforePrint = () => {
            showMessage(`Print dialog opened for ${totalPages} labels`, 'success');
        };
        
        // Wait for PDF to load, then print
        printFrame.onload = function() {
            try {
                // Add event listeners to the iframe's content window
                const frameWindow = printFrame.contentWindow;
                if (frameWindow) {
                    frameWindow.addEventListener('beforeprint', handleBeforePrint);
                    frameWindow.addEventListener('afterprint', handleAfterPrint);
                    
                    // Focus the iframe and trigger print after a longer delay
                    setTimeout(() => {
                        try {
                            frameWindow.focus();
                            frameWindow.print();
                        } catch (error) {
                            console.warn('Print via iframe failed, trying alternative method:', error);
                            // Fallback: open in new window for printing
                            const printWindow = window.open(pdfUrl, '_blank');
                            if (printWindow) {
                                printWindow.onload = function() {
                                    setTimeout(() => {
                                        printWindow.print();
                                        printWindow.onafterprint = function() {
                                            printWindow.close();
                                            handleAfterPrint();
                                        };
                                    }, 1000);
                                };
                            } else {
                                // Final fallback to download
                                pdf.save(config.filename);
                                showMessage(`Print dialog blocked. Downloaded ${config.filename} instead.`, 'success');
                                handleAfterPrint();
                            }
                        }
                    }, 1000);
                }
            } catch (error) {
                console.error('Error setting up print:', error);
                // Fallback to download if printing fails
                pdf.save(config.filename);
                showMessage(`Print not available. Downloaded ${config.filename} instead.`, 'success');
                handleAfterPrint();
            }
        };
        
        // Set the PDF source
        printFrame.src = pdfUrl;
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showMessage(`Error generating PDF: ${error.message}`, 'error');
    } finally {
        setPrinting(false);
    }
}

function createLabelPage(pdf, patient) {
    const leftMargin = 0.2 * 72; // 0.2 inches from left edge
    const lineHeight = 0.22 * 72; // Convert to points
    
    const pageWidth = config.labelWidth * 72;
    const pageHeight = config.labelHeight * 72;
    
    // Check if we need to rotate based on dimensions
    const needsRotation = config.labelHeight > config.labelWidth;
    const isSquare = config.labelHeight === config.labelWidth;
    
    // Set font
    pdf.setFont(config.fontFamily, 'normal');
    pdf.setFontSize(config.fontSize);
    
    const labels = [
        `Name: ${patient.name}`,
        `ID: ${patient.id}`,
        `Date of Birth: ${patient.dob}`
    ];
    
    if (needsRotation && !isSquare) {
        // Height > Width: Rotate text 90 degrees
        
        // Position rotated text with same margin as left margin (0.2" from bottom)
        const totalTextHeight = labels.length * lineHeight;
        const centerX = pageWidth / 2; // Center horizontally on the label
        const startY = pageHeight - leftMargin; // 0.2" from bottom (matches left margin)
        
        labels.forEach((label, index) => {
            const xPos = centerX - (totalTextHeight / 2) + (index * lineHeight); // Spread horizontally from center
            const yPos = startY; // Same Y position for all
            pdf.text(label, xPos, yPos, { angle: 90 });
        });
        
    } else {
        // Width >= Height or Square: Print normally (no rotation)
        
        // Position text with 0.2" margin from top (matching left margin)
        const startY = leftMargin + lineHeight; // 0.2" from top + line height for proper positioning
        
        labels.forEach((label, index) => {
            const xPos = leftMargin; // 0.2 inches from left
            const yPos = startY + (index * lineHeight); // Start from top margin, spread down
            pdf.text(label, xPos, yPos);
        });
    }
}

function setPrinting(isPrinting) {
    printBtn.disabled = isPrinting;
    printText.classList.toggle('hidden', isPrinting);
    printSpinner.classList.toggle('hidden', !isPrinting);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);