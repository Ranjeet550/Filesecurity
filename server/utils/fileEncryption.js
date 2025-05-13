/**
 * File encryption utilities for server-side encryption and decryption
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

/**
 * Encrypts a file with a password and creates a self-extracting HTML file
 * @param {string} filePath - Path to the file to encrypt
 * @param {string} password - Password to encrypt the file with
 * @param {string} originalName - Original name of the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} - Path to the encrypted file
 */
exports.encryptFile = async (filePath, password, originalName, mimeType) => {
  try {
    // Read the file
    const fileData = await readFileAsync(filePath);

    // Create a buffer for encryption
    const iv = crypto.randomBytes(16);

    // Derive key from password using SHA-256 (to match browser's crypto.subtle API)
    const hash = crypto.createHash('sha256').update(password).digest();
    const key = hash.slice(0, 32); // Use first 32 bytes for AES-256

    // Encrypt the file
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encryptedData = Buffer.concat([
      iv,
      cipher.update(fileData),
      cipher.final()
    ]);

    // Convert encrypted data to base64
    const encryptedBase64 = encryptedData.toString('base64');

    // Create a self-extracting HTML file
    const htmlFilePath = path.join(
      path.dirname(filePath),
      `${path.basename(originalName, path.extname(originalName))}_protected.html`
    );

    // Create the HTML template with embedded encrypted data
    const htmlTemplate = createSelfExtractingHtml(
      originalName,
      mimeType,
      encryptedBase64,
      password
    );

    // Write the HTML file
    await writeFileAsync(htmlFilePath, htmlTemplate);

    return htmlFilePath;
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Creates a self-extracting HTML template with embedded encrypted data
 * @param {string} fileName - Original name of the file
 * @param {string} mimeType - MIME type of the file
 * @param {string} encryptedBase64 - Base64-encoded encrypted file data
 * @param {string} correctPassword - The correct password for verification
 * @returns {string} - HTML template
 */
function createSelfExtractingHtml(fileName, mimeType, encryptedBase64, correctPassword) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Protected File - ${fileName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #00BF96;
      margin-top: 0;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
    input[type="password"] {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }
    button {
      background: linear-gradient(135deg, #00BF96 0%, #00A080 100%);
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    button:hover {
      opacity: 0.9;
    }
    .error {
      color: #ff4d4f;
      margin-top: 10px;
    }
    .info {
      margin-top: 20px;
      padding: 10px;
      background-color: #fff7e6;
      border: 1px solid #ffe7ba;
      border-radius: 4px;
      color: #d46b08;
    }
    .progress {
      margin-top: 15px;
      height: 10px;
      background-color: #f0f0f0;
      border-radius: 5px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #00BF96 0%, #00A080 100%);
      width: 0%;
      transition: width 0.3s ease;
    }
    .success {
      color: #00BF96;
      margin-top: 15px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Password Protected File</h1>
    <p>This file is password protected. Enter the password to open it.</p>

    <div class="form-group">
      <label for="password">Password:</label>
      <input type="password" id="password" placeholder="Enter the file password">
    </div>

    <button id="decrypt-btn">Open File</button>

    <div id="error-message" class="error" style="display: none;"></div>
    <div id="progress" class="progress" style="display: none;">
      <div id="progress-bar" class="progress-bar"></div>
    </div>
    <div id="success-message" class="success"></div>

    <div class="info">
      <strong>File Information:</strong>
      <div>Name: ${fileName}</div>
      <div>Type: ${mimeType}</div>
    </div>
  </div>

  <script>
    // Store the encrypted data and file information
    const encryptedData = "${encryptedBase64}";
    const fileName = "${fileName}";
    const mimeType = "${mimeType}";
    const correctPassword = "${correctPassword}";

    // Decrypt and open the file when the button is clicked
    document.getElementById('decrypt-btn').addEventListener('click', async () => {
      const password = document.getElementById('password').value;
      const errorElement = document.getElementById('error-message');
      const progressElement = document.getElementById('progress');
      const progressBarElement = document.getElementById('progress-bar');
      const successElement = document.getElementById('success-message');

      if (!password) {
        errorElement.textContent = 'Please enter a password';
        errorElement.style.display = 'block';
        return;
      }

      try {
        // Verify the password
        if (password !== correctPassword) {
          throw new Error('Invalid password');
        }

        // Hide error and show progress
        errorElement.style.display = 'none';
        progressElement.style.display = 'block';
        progressBarElement.style.width = '10%';

        // Convert base64 to binary
        const binaryString = atob(encryptedData);
        const bytes = new Uint8Array(binaryString.length);

        // Update progress
        progressBarElement.style.width = '30%';

        // Convert binary string to bytes
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Update progress
        progressBarElement.style.width = '50%';

        // Extract the IV from the first 16 bytes
        const iv = bytes.slice(0, 16);

        // The rest is the encrypted data
        const data = bytes.slice(16);

        // Update progress
        progressBarElement.style.width = '70%';

        // Derive key from password
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const hash = await window.crypto.subtle.digest('SHA-256', passwordData);
        const key = await window.crypto.subtle.importKey(
          'raw',
          hash.slice(0, 32),
          { name: 'AES-CBC' },
          false,
          ['decrypt']
        );

        // Update progress
        progressBarElement.style.width = '80%';

        // Decrypt the data
        const decryptedData = await window.crypto.subtle.decrypt(
          { name: 'AES-CBC', iv },
          key,
          data
        );

        // Update progress
        progressBarElement.style.width = '90%';

        // Create a blob with the decrypted data
        const blob = new Blob([decryptedData], { type: mimeType });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);

        // Update progress
        progressBarElement.style.width = '100%';

        // Show success message
        successElement.textContent = 'File decrypted successfully! Downloading...';
        successElement.style.display = 'block';

        // Trigger download
        setTimeout(() => {
          a.click();

          // Clean up
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 500);
      } catch (error) {
        console.error('Decryption error:', error);
        errorElement.textContent = 'Invalid password or corrupted file';
        errorElement.style.display = 'block';
        progressElement.style.display = 'none';
        progressBarElement.style.width = '0%';
        successElement.style.display = 'none';
      }
    });
  </script>
</body>
</html>
  `;
}
