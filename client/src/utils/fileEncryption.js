/**
 * File encryption utilities for client-side encryption and decryption
 * This module provides functions to encrypt and decrypt files using the password
 */

/**
 * Encrypts a file blob with a password
 * @param {Blob} fileBlob - The file blob to encrypt
 * @param {string} password - The password to use for encryption
 * @returns {Promise<Blob>} - A promise that resolves to the encrypted file blob
 */
export const encryptFile = async (fileBlob, password) => {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await fileBlob.arrayBuffer();
    
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple XOR encryption with password
    const encryptedArray = xorEncrypt(uint8Array, password);
    
    // Create a new blob with the encrypted data
    const encryptedBlob = new Blob([encryptedArray], { type: 'application/octet-stream' });
    
    return encryptedBlob;
  } catch (error) {
    console.error('Error encrypting file:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Decrypts a file blob with a password
 * @param {Blob} encryptedBlob - The encrypted file blob
 * @param {string} password - The password to use for decryption
 * @param {string} originalType - The original MIME type of the file
 * @returns {Promise<Blob>} - A promise that resolves to the decrypted file blob
 */
export const decryptFile = async (encryptedBlob, password, originalType = 'application/octet-stream') => {
  try {
    // Read the encrypted file as an ArrayBuffer
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    
    // Convert ArrayBuffer to Uint8Array
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // XOR decryption with password (same as encryption since XOR is symmetric)
    const decryptedArray = xorEncrypt(uint8Array, password);
    
    // Create a new blob with the decrypted data and original type
    const decryptedBlob = new Blob([decryptedArray], { type: originalType });
    
    return decryptedBlob;
  } catch (error) {
    console.error('Error decrypting file:', error);
    throw new Error('Failed to decrypt file');
  }
};

/**
 * XOR encryption/decryption implementation
 * @param {Uint8Array} data - The data to encrypt/decrypt
 * @param {string} password - The password to use
 * @returns {Uint8Array} - The encrypted/decrypted data
 */
const xorEncrypt = (data, password) => {
  // Convert password to a repeating key of the same length as the data
  const key = generateKeyFromPassword(password, data.length);
  
  // Create a new Uint8Array for the result
  const result = new Uint8Array(data.length);
  
  // XOR each byte with the corresponding byte in the key
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key[i % key.length];
  }
  
  return result;
};

/**
 * Generates a key from a password
 * @param {string} password - The password to use
 * @param {number} length - The desired length of the key
 * @returns {Uint8Array} - The generated key
 */
const generateKeyFromPassword = (password, length) => {
  // Convert password to UTF-8 bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Create a key of the desired length by repeating the password bytes
  const key = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    key[i] = passwordBytes[i % passwordBytes.length];
  }
  
  return key;
};

/**
 * Creates a self-extracting HTML file that contains the encrypted file and decryption logic
 * @param {Blob} encryptedBlob - The encrypted file blob
 * @param {string} fileName - The original file name
 * @param {string} fileType - The original file type
 * @returns {Promise<Blob>} - A promise that resolves to the self-extracting HTML file
 */
export const createSelfExtractingFile = async (encryptedBlob, fileName, fileType) => {
  // Convert the encrypted blob to a base64 string
  const reader = new FileReader();
  
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      
      // Create the HTML template with embedded data and decryption logic
      const htmlTemplate = `
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
    
    <div class="info">
      <strong>File Information:</strong>
      <div>Name: ${fileName}</div>
      <div>Type: ${fileType}</div>
    </div>
  </div>

  <script>
    // Embedded encrypted file data
    const encryptedData = "${base64Data}";
    const fileName = "${fileName}";
    const fileType = "${fileType}";
    
    // Decrypt and open the file when the button is clicked
    document.getElementById('decrypt-btn').addEventListener('click', async () => {
      const password = document.getElementById('password').value;
      const errorElement = document.getElementById('error-message');
      
      if (!password) {
        errorElement.textContent = 'Please enter a password';
        errorElement.style.display = 'block';
        return;
      }
      
      try {
        errorElement.style.display = 'none';
        
        // Convert base64 to binary
        const binaryString = atob(encryptedData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Decrypt the file
        const decryptedData = xorEncrypt(bytes, password);
        
        // Create a blob and download it
        const blob = new Blob([decryptedData], { type: fileType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Decryption error:', error);
        errorElement.textContent = 'Invalid password or corrupted file';
        errorElement.style.display = 'block';
      }
    });
    
    // XOR encryption/decryption function
    function xorEncrypt(data, password) {
      // Generate key from password
      const key = generateKeyFromPassword(password, data.length);
      
      // Create result array
      const result = new Uint8Array(data.length);
      
      // XOR each byte
      for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length];
      }
      
      return result;
    }
    
    // Generate key from password
    function generateKeyFromPassword(password, length) {
      // Convert password to UTF-8 bytes
      const passwordBytes = new TextEncoder().encode(password);
      
      // Create a key of the desired length
      const key = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        key[i] = passwordBytes[i % passwordBytes.length];
      }
      
      return key;
    }
  </script>
</body>
</html>
      `;
      
      // Create a blob with the HTML content
      const htmlBlob = new Blob([htmlTemplate], { type: 'text/html' });
      resolve(htmlBlob);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read encrypted file data'));
    };
    
    reader.readAsDataURL(encryptedBlob);
  });
};
