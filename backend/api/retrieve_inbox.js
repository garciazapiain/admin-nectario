const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'client_secret.json');

// Function to load credentials
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.promises.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// Function to save credentials
async function saveCredentials(client) {
  const content = await fs.promises.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.promises.writeFile(TOKEN_PATH, payload);
}

// Function to authorize and authenticate
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// Function to download attachments
async function downloadAttachment(auth, messageId, attachmentId) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.attachments.get({
    userId: 'me',
    messageId: messageId,
    id: attachmentId,
  });

  const attachmentData = res.data.data;
  const decodedData = Buffer.from(attachmentData, 'base64').toString('utf-8');

  return decodedData; // Return the decoded data
}

const xml2js = require('xml2js');

// Function to get message details and process XML attachments
// Function to get message details and process XML attachments
async function getMessageDetails(auth, messageId) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
  });

  const message = res.data;
  const subject = message.payload.headers.find(header => header.name === 'Subject').value;

  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.filename && part.filename.endsWith('.xml')) {
        const attachmentContent = await downloadAttachment(auth, message.id, part.body.attachmentId);

        // Parse XML content to extract details
        const parsedData = await xml2js.parseStringPromise(attachmentContent, { explicitArray: false });
        const comprobante = parsedData['cfdi:Comprobante'];
        const emisor = comprobante['cfdi:Emisor'].$.Nombre;
        const folio = comprobante.$.Folio;
        const fecha = comprobante.$.Fecha;
        const totalImporte = parseFloat(comprobante.$.Total);

        return {
          subject: subject,
          folio: folio || '',
          fecha: fecha || '',
          emisor: emisor || '',
          totalImporte: totalImporte || 0,
          xmlContent: attachmentContent,
        };
      }
    }
  }
  return null;
}

// Function to list and process messages
async function listAndProcessMessages(req, res) {
  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: 'v1', auth });
    const result = [];

    const resMessages = await gmail.users.messages.list({
      userId: 'me',
      q: '', // Add any search filters here
    });

    const messages = resMessages.data.messages || [];

    for (const message of messages) {
      const xmlDetails = await getMessageDetails(auth, message.id);
      if (xmlDetails) {
        result.push(xmlDetails);
      }
    }

    res.json(result); // Send the JSON response back to the client
  } catch (error) {
    console.error('Error processing messages:', error);
    res.status(500).send('Error processing messages');
  }
}

// Export the router
module.exports = router.get('/', listAndProcessMessages);