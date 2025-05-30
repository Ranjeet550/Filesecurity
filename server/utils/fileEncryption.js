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
      encryptedBase64
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
 * @returns {string} - HTML template
 */
function createSelfExtractingHtml(fileName, mimeType, encryptedBase64) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <meta name="robots" content="noindex, nofollow">
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
      <input
        type="password"
        id="password"
        placeholder="Enter the file password"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
      >
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

        // Update progress
        progressBarElement.style.width = '100%';

        // Show success message
        successElement.textContent = 'File decrypted successfully!';
        successElement.style.display = 'block';

        // Hide the form and show the file content
        setTimeout(() => {
          document.querySelector('.container').style.display = 'none';
          displayFileContent(blob, fileName, mimeType);

          // Clear the password field for security
          document.getElementById('password').value = '';
        }, 500);
      } catch (error) {
        console.error('Decryption error:', error);
        // Show error message for invalid password or decryption failure
        errorElement.textContent = 'Invalid password. Please check your password and try again.';
        errorElement.style.display = 'block';
        progressElement.style.display = 'none';
        progressBarElement.style.width = '0%';
        successElement.style.display = 'none';

        // Clear the password field for security
        document.getElementById('password').value = '';
      }
    });

    // Function to display file content based on type
    function displayFileContent(blob, fileName, mimeType) {
      // Create viewer container
      const viewerContainer = document.createElement('div');
      viewerContainer.id = 'file-viewer';
      viewerContainer.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #f5f5f5;
        z-index: 1000;
        overflow: auto;
        padding: 20px;
        box-sizing: border-box;
      \`;

      // Create header with file info and download button
      const header = document.createElement('div');
      header.style.cssText = \`
        background: white;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
        @media (max-width: 768px) {
          padding: 16px;
          flex-direction: column;
          align-items: stretch;
        }
      \`;

      const fileInfo = document.createElement('div');
      fileInfo.innerHTML = \`
        <h2 style="margin: 0; color: #1a2141; font-size: 20px;">\${fileName}</h2>
        <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Type: \${mimeType}</p>
      \`;

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText = 'display: flex; gap: 12px; align-items: center;';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = \`
        background: linear-gradient(90deg, #00BF96 0%, #00A080 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s ease;
      \`;
      closeBtn.onmouseover = () => closeBtn.style.transform = 'translateY(-1px)';
      closeBtn.onmouseout = () => closeBtn.style.transform = 'translateY(0)';
      closeBtn.onclick = () => {
        document.body.removeChild(viewerContainer);
        document.querySelector('.container').style.display = 'block';
        // Reset form
        document.getElementById('password').value = '';
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('progress').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
      };

      buttonContainer.appendChild(closeBtn);
      header.appendChild(fileInfo);
      header.appendChild(buttonContainer);

      // Create content area
      const contentArea = document.createElement('div');
      contentArea.style.cssText = \`
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        min-height: 400px;
      \`;

      viewerContainer.appendChild(header);
      viewerContainer.appendChild(contentArea);

      // Display content based on file type
      if (mimeType.startsWith('image/')) {
        displayImage(contentArea, blob);
      } else if (mimeType === 'application/pdf') {
        displayPDF(contentArea, blob);
      } else if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('xml')) {
        displayText(contentArea, blob);
      } else if (mimeType.startsWith('video/')) {
        displayVideo(contentArea, blob);
      } else if (mimeType.startsWith('audio/')) {
        displayAudio(contentArea, blob);
      } else {
        displayGeneric(contentArea, fileName, mimeType);
      }

      document.body.appendChild(viewerContainer);
    }

    // Display functions for different file types
    function displayImage(container, blob) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.style.cssText = \`
        max-width: 100%;
        max-height: 80vh;
        display: block;
        margin: 20px auto;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      \`;
      img.onload = () => URL.revokeObjectURL(img.src);
      container.appendChild(img);
    }

    function displayPDF(container, blob) {
      const iframe = document.createElement('iframe');
      iframe.src = URL.createObjectURL(blob);
      iframe.style.cssText = \`
        width: 100%;
        height: 80vh;
        border: none;
      \`;
      container.appendChild(iframe);
    }

    function displayText(container, blob) {
      blob.text().then(text => {
        const pre = document.createElement('pre');
        pre.style.cssText = \`
          padding: 20px;
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
          background: #f8f9fa;
          color: #333;
          max-height: 80vh;
          overflow: auto;
        \`;
        pre.textContent = text;
        container.appendChild(pre);
      });
    }

    function displayVideo(container, blob) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(blob);
      video.controls = true;
      video.style.cssText = \`
        max-width: 100%;
        max-height: 80vh;
        display: block;
        margin: 20px auto;
      \`;
      container.appendChild(video);
    }

    function displayAudio(container, blob) {
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(blob);
      audio.controls = true;
      audio.style.cssText = \`
        width: 100%;
        margin: 20px auto;
        display: block;
      \`;
      container.appendChild(audio);
    }

    function displayGeneric(container, fileName, mimeType) {
      const message = document.createElement('div');
      message.style.cssText = \`
        text-align: center;
        padding: 60px 20px;
        color: #666;
      \`;
      message.innerHTML = \`
        <div style="font-size: 48px; margin-bottom: 20px; color: #ccc;">📄</div>
        <h3 style="margin: 0 0 10px 0; color: #333;">File Decrypted Successfully</h3>
        <p style="margin: 0 0 10px 0;">This file type cannot be previewed in the browser.</p>
        <p style="margin: 0; font-size: 14px; color: #999;">The file has been decrypted and is ready for viewing.</p>
      \`;
      container.appendChild(message);
    }
  </script>
</body>
</html>
  `;
}
