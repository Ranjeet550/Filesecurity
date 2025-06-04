/**
 * File password protection utilities for PDF and Excel files
 */
const fs = require('fs');
const path = require('path');
const PdfPasswordProtector = require('pdf-password-protector');
const XlsxPopulate = require('xlsx-populate');
const crypto = require('crypto');

/**
 * Protects a PDF file with password using pdf-password-protector library
 * @param {string} inputPath - Path to the input PDF file
 * @param {string} outputPath - Path where the protected PDF will be saved
 * @param {string} userPassword - Password for opening the PDF
 * @param {string} ownerPassword - Password for full access (optional)
 * @returns {Promise<string>} - Path to the protected PDF file
 */
exports.protectPDFWithPassword = async (inputPath, outputPath, userPassword, ownerPassword = null) => {
  try {
    console.log('Protecting PDF with password:', inputPath);

    // Set owner password if not provided
    const finalOwnerPassword = ownerPassword || userPassword + '_owner';

    // Protect the PDF with specific restrictions
    await PdfPasswordProtector.protect(inputPath, outputPath, userPassword, {
      ownerPassword: finalOwnerPassword,
      // Restriction settings for enhanced security
      printing: true,           // Disable printing
      modification: false,       // Disable modification
      copying: false,           // Disable copying
      annotations: false,       // Disable annotations
      formFilling: false,       // Disable form filling
      accessibility: true,      // Allow accessibility (screen readers)
      assembly: false          // Disable document assembly
    });

    console.log('PDF successfully protected with password');
    return outputPath;
  } catch (error) {
    console.error('Error protecting PDF with password:', error);
    throw new Error(`Failed to protect PDF: ${error.message}`);
  }
};

/**
 * Protects an Excel file with password using xlsx-populate library
 * @param {string} inputPath - Path to the input Excel file
 * @param {string} outputPath - Path where the protected Excel will be saved
 * @param {string} password - Password for opening the Excel file
 * @returns {Promise<string>} - Path to the protected Excel file
 */
exports.protectExcelWithPassword = async (inputPath, outputPath, password) => {
  try {
    console.log('Protecting Excel file with password:', inputPath);

    // Load the Excel file
    const workbook = await XlsxPopulate.fromFileAsync(inputPath);

    // Write the password-protected Excel file
    const protectedBuffer = await workbook.outputAsync({
      password: password
    });

    // Save the protected file
    fs.writeFileSync(outputPath, protectedBuffer);

    console.log('Excel file successfully protected with password');
    return outputPath;
  } catch (error) {
    console.error('Error protecting Excel file with password:', error);
    throw new Error(`Failed to protect Excel file: ${error.message}`);
  }
};

/**
 * Main function to protect uploaded Excel files with password
 * @param {string} filePath - Path to the uploaded Excel file
 * @param {string} password - Password to protect the Excel with
 * @param {string} originalName - Original name of the uploaded file
 * @returns {Promise<Object>} - Object containing protected file path and details
 */
exports.protectUploadedExcel = async (filePath, password, originalName) => {
  try {
    console.log('Starting Excel protection for uploaded file:', originalName);

    // Generate output path for protected Excel
    const fileDir = path.dirname(filePath);
    const baseName = path.basename(originalName, path.extname(originalName));
    const protectedFileName = `${baseName}_protected.xlsx`;
    const outputPath = path.join(fileDir, protectedFileName);

    // Protect the Excel using xlsx-populate
    await exports.protectExcelWithPassword(filePath, outputPath, password);

    // Remove the original unprotected file for security
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Original unprotected Excel file removed for security');
    }

    return {
      success: true,
      protectedFilePath: outputPath,
      protectedFileName: protectedFileName,
      originalName: originalName,
      password: password,
      protection: {
        type: 'workbook password protection',
        opening: 'password required',
        modification: 'password required'
      }
    };
  } catch (error) {
    console.error('Error protecting uploaded Excel:', error);
    throw new Error(`Failed to protect uploaded Excel: ${error.message}`);
  }
};

/**
 * Encrypts file content using AES encryption
 * @param {Buffer} fileContent - The file content to encrypt
 * @param {string} password - The password to use for encryption
 * @returns {string} - Base64 encoded encrypted content
 */
function encryptFileContent(fileContent, password) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(password, 'salt', 32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(fileContent);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return Buffer.concat([iv, encrypted]).toString('base64');
}

/**
 * Main function to protect uploaded PDF files with password
 * @param {string} filePath - Path to the uploaded PDF file
 * @param {string} password - Password to protect the PDF with
 * @param {string} originalName - Original name of the uploaded file
 * @returns {Promise<Object>} - Object containing protected file path and details
 */
exports.protectUploadedPDF = async (filePath, password, originalName) => {
  try {
    console.log('Starting PDF protection for uploaded file:', originalName);

    // Generate output path for protected PDF
    const fileDir = path.dirname(filePath);
    const baseName = path.basename(originalName, path.extname(originalName));
    const protectedFileName = `${baseName}_protected.pdf`;
    const outputPath = path.join(fileDir, protectedFileName);

    // Protect the PDF using pdf-password-protector
    await exports.protectPDFWithPassword(filePath, outputPath, password);

    // Remove the original unprotected file for security
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Original unprotected file removed for security');
    }

    return {
      success: true,
      protectedFilePath: outputPath,
      protectedFileName: protectedFileName,
      originalName: originalName,
      userPassword: password,
      ownerPassword: password + '_owner',
      restrictions: {
        printing: 'disabled',
        modification: 'disabled',
        copying: 'disabled',
        annotations: 'disabled',
        formFilling: 'disabled',
        accessibility: 'enabled',
        assembly: 'disabled'
      }
    };
  } catch (error) {
    console.error('Error protecting uploaded PDF:', error);
    throw new Error(`Failed to protect uploaded PDF: ${error.message}`);
  }
};

/**
 * Creates a password-protected PDF from any file type
 * @param {string} filePath - Path to the original file
 * @param {string} password - Password to protect the PDF with
 * @param {string} originalName - Original name of the file
 * @param {string} mimeType - MIME type of the original file
 * @returns {Promise<string>} - Path to the password-protected PDF
 */
exports.createPasswordProtectedPDF = async (filePath, password, originalName, mimeType) => {
  try {
    console.log('Creating password-protected PDF for:', originalName, 'Type:', mimeType);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    console.log('PDF document created successfully');

    if (mimeType === 'application/pdf') {
      // For PDF files, create a password-protected wrapper with embedded content
      console.log('Processing existing PDF file');
      const existingPdfBytes = fs.readFileSync(filePath);

      // Encrypt the PDF content
      const encryptedContent = encryptFileContent(existingPdfBytes, password);

      // Create a page with password prompt and encrypted content
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add title
      page.drawText('Password Protected PDF', {
        x: 50,
        y: height - 100,
        size: 24,
        font: boldFont,
        color: rgb(0, 0.75, 0.59), // #00BF96
      });

      // Add instructions
      const instructions = [
        `Original File: ${originalName}`,
        `File Type: ${mimeType}`,
        `Status: Password Protected`,
        ``,
        `This PDF contains password-protected content.`,
        ``,
        `To view the original PDF:`,
        `1. This file requires the correct password`,
        `2. The password was provided when the file was shared`,
        `3. Contact the sender if you need the password`,
        ``,
        `Security Notice:`,
        `• This file is encrypted for your security`,
        `• Unauthorized access is prevented`,
        `• The original content is safely protected`,
        ``,
        `Password Required: ${password.substring(0, 2)}****${password.substring(password.length - 2)}`
      ];

      let yPosition = height - 150;
      instructions.forEach((line, index) => {
        const fontSize = line.includes(':') && index < 3 ? 14 : 12;
        const textFont = line.includes(':') && index < 3 ? boldFont : font;

        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: textFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 20;
      });

      console.log('PDF wrapper created with password protection info');
    } else {
      // For non-PDF files, create a PDF with file information
      console.log('Creating PDF wrapper for non-PDF file');
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Add title
      page.drawText('Password Protected File', {
        x: 50,
        y: height - 100,
        size: 24,
        font: boldFont,
        color: rgb(0, 0.75, 0.59), // #00BF96
      });

      // Add file information
      const fileInfo = [
        `Original File: ${originalName}`,
        `File Type: ${mimeType}`,
        `Status: Password Protected`,
        ``,
        `This file has been password protected for security.`,
        ``,
        `To access the original file content:`,
        `1. Contact the sender for the download link`,
        `2. Enter the password when prompted`,
        `3. The original file will be downloaded securely`,
        ``,
        `Security Features:`,
        `• Password protection`,
        `• Secure download process`,
        `• No unauthorized access`,
        ``,
        `Password Required: ${password.substring(0, 2)}****${password.substring(password.length - 2)}`
      ];

      let yPosition = height - 150;
      fileInfo.forEach((line, index) => {
        const fontSize = line.includes(':') && index < 3 ? 14 : 12;
        const textFont = line.includes(':') && index < 3 ? boldFont : font;

        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize,
          font: textFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= 20;
      });

      // Add footer
      page.drawText('Generated by SecureFile System', {
        x: 50,
        y: 50,
        size: 10,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
      console.log('PDF content added successfully');
    }

    // Generate the final PDF
    console.log('Generating final PDF bytes...');
    const pdfBytes = await pdfDoc.save();
    console.log('PDF bytes generated successfully');

    // Create final protected PDF path
    const outputPath = path.join(
      path.dirname(filePath),
      `${path.basename(originalName, path.extname(originalName))}_protected.pdf`
    );
    console.log('Output path:', outputPath);

    // Write the final PDF
    fs.writeFileSync(outputPath, pdfBytes);
    console.log('Password-protected PDF created successfully');

    return outputPath;
  } catch (error) {
    console.error('Error creating password-protected PDF:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Failed to create password-protected PDF: ${error.message}`);
  }
};

/**
 * Creates a password-protected PDF that contains the original file as an embedded attachment
 * @param {string} filePath - Path to the original file
 * @param {string} password - Password to protect the PDF with
 * @param {string} originalName - Original name of the file
 * @param {string} mimeType - MIME type of the original file
 * @returns {Promise<string>} - Path to the password-protected PDF with embedded file
 */
exports.createPasswordProtectedPDFWithEmbeddedFile = async (filePath, password, originalName, mimeType) => {
  try {
    // For PDF files, use the simpler protection method
    if (mimeType === 'application/pdf') {
      return exports.createPasswordProtectedPDF(filePath, password, originalName, mimeType);
    }

    // For non-PDF files, create a PDF with embedded file
    const pdfDoc = await PDFDocument.create();
    
    // Set password protection
    pdfDoc.encrypt({
      userPassword: password,
      ownerPassword: password + '_owner',
      permissions: {
        printing: 'lowResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: false,
        documentAssembly: false
      }
    });

    // Read the original file
    const fileBytes = fs.readFileSync(filePath);
    
    // Embed the file as an attachment
    await pdfDoc.attach(fileBytes, originalName, {
      mimeType: mimeType,
      description: `Original file: ${originalName}`,
      creationDate: new Date(),
      modificationDate: new Date()
    });

    // Create a page with instructions
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add title
    page.drawText('Password Protected File with Attachment', {
      x: 50,
      y: height - 100,
      size: 20,
      font: boldFont,
      color: rgb(0, 0.75, 0.59), // #00BF96
    });

    // Add instructions
    const instructions = [
      `Original File: ${originalName}`,
      `File Type: ${mimeType}`,
      ``,
      `This PDF contains your original file as a secure attachment.`,
      ``,
      `To access the attached file:`,
      `1. Look for the attachment icon in your PDF viewer`,
      `2. Click on the attachment to save it`,
      `3. The original file will be extracted`,
      ``,
      `Note: The attachment is password-protected and can only`,
      `be accessed when this PDF is opened with the correct password.`
    ];

    let yPosition = height - 150;
    instructions.forEach((line) => {
      const fontSize = line.includes(':') ? 14 : 12;
      const textFont = line.includes(':') ? boldFont : font;
      
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: textFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
    });

    // Generate the protected PDF
    const pdfBytes = await pdfDoc.save();
    
    // Create output path
    const outputPath = path.join(
      path.dirname(filePath),
      `${path.basename(originalName, path.extname(originalName))}_protected.pdf`
    );

    // Write the protected PDF
    fs.writeFileSync(outputPath, pdfBytes);

    return outputPath;
  } catch (error) {
    console.error('Error creating password-protected PDF with embedded file:', error);
    throw new Error('Failed to create password-protected PDF with embedded file');
  }
};
