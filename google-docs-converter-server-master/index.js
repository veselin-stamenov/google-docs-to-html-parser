const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const path = require('path');
const CronJob = require('cron').CronJob;
const config = require('./config/config.json');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, 'config', 'token.json');

// Load client secrets from a local file.
fs.readFile(path.join(__dirname, 'config', 'credentials.json'), (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.


  authorize(JSON.parse(content), updateDocument);


// update contents every hour
  new CronJob('1 */2 * * *', function() {
    authorize(JSON.parse(content), updateDocument);
  }, null, true, 'America/Los_Angeles');

});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Replaces the content of the executive.html file in the root directory
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function updateDocument(auth, spreadsheetId, fileName) {
  const drive = google.drive({version: 'v3', auth});
  config.files.map(function (file) {
  var fileId = file.spreadsheetId;
  drive.files.export({
    fileId: fileId,
    mimeType: 'text/html'
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    var regex = /<\/style>/g;
    var verticalAlign = /vertical-align:super/g;
    var data = res.data.replace(regex, 'p{padding:0 0 5px 0 !important;line-height:20px !important;} @media only screen and (max-width: 850px) {body{padding: 0 !important}}</style>');
    var newdata = data.replace(verticalAlign, 'vertical-align:super;font-size:9px !important;line-height:10px !important').replace(/<div[^>]*>((.|[\n\r])*)<\/div>/g, '').replace('max-width:468pt', '');
    fs.writeFile(path.join(__dirname, 'output', file.fileName), newdata, function(err) {
      if(err) {
        return console.log(err);
      }

      console.log("The file was saved!");
    });
  });
});
}



