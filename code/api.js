/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '685252017363-m0o8903eo8t7d22230vsfkespub5ir29.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB_6gqCBKEYxGUCpAzxLrJbCj23yQmBc2E';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let currentAccessToken = null;

// Asegurate de que existan los elementos con estos ids en tu HTML.
const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const contentEl = document.getElementById('content');

// Register event handlers (pasando la referencia, no llamando la función)
if (authorizeButton) authorizeButton.addEventListener('click', handleAuthClick);
if (signoutButton) signoutButton.addEventListener('click', handleSignoutClick);

// Inicialmente ocultos
if (authorizeButton) authorizeButton.style.visibility = 'hidden';
if (signoutButton) signoutButton.style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 * Si tus script tags tienen id="gapi" y id="gis", asegúrate de usar:
 * <script id="gapi" src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
 * <script id="gis" src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>
 */
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
  try {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  } catch (err) {
    console.error('Error inicializando gapi.client:', err);
    if (contentEl) contentEl.innerText = 'Error inicializando Google API client: ' + err.message;
  }
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    // callback ejecutado cuando se recibe (o falla) el token
    callback: (tokenResponse) => {
      if (tokenResponse.error) {
        console.error('Token error', tokenResponse);
        if (contentEl) contentEl.innerText = 'Error al obtener token: ' + tokenResponse.error;
        return;
      }
      // Guardamos el token y lo seteamos en gapi
      currentAccessToken = tokenResponse.access_token;
      gapi.client.setToken({ access_token: currentAccessToken });

      // Actualizamos UI
      if (authorizeButton) authorizeButton.style.visibility = 'hidden';
      if (signoutButton) signoutButton.style.visibility = 'visible';

      // Llamar a la función que lee la hoja
      listMajors();
    },
  });
  gisInited = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    if (authorizeButton) authorizeButton.style.visibility = 'visible';
  }
}

/**
 * Sign in the user upon button click.
 */
function handleAuthClick() {
  // Si ya tenemos token activo, vamos directo a la API
  if (currentAccessToken) {
    gapi.client.setToken({ access_token: currentAccessToken });
    listMajors();
    return;
  }

  // Pide el token; prompt: 'consent' fuerza ventana para elegir cuenta (útil en dev)
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * Sign out / revoke token
 */
function handleSignoutClick() {
  if (!currentAccessToken) {
    // Nada que hacer
    return;
  }

  // Revocar token con Google Identity Services
  google.accounts.oauth2.revoke(currentAccessToken, () => {
    // Limpiar estado en gapi y UI
    currentAccessToken = null;
    gapi.client.setToken('');
    if (contentEl) contentEl.innerText = 'Sesión cerrada.';
    if (authorizeButton) authorizeButton.style.visibility = 'visible';
    if (signoutButton) signoutButton.style.visibility = 'hidden';
  });
}

/**
 *  Ejemplo: lee datos de una hoja (listMajors)
 */
async function listMajors() {
  let response;
  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      range: 'Class Data!A2:E',
    });
  } catch (err) {
    console.error(err);
    if (contentEl) contentEl.innerText = 'Error en la petición: ' + (err.message || err);
    return;
  }
  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    if (contentEl) contentEl.innerText = 'No values found.';
    return;
  }
  // Flatten to string to display
  const output = range.values.reduce(
      (str, row) => `${str}${row[0]}, ${row[4]}\n`,
      'Name, Major:\n');
  if (contentEl) contentEl.innerText = output;

  // Aquí puedes guardar snapshot en localStorage/IndexedDB para carga instantánea
  try {
    localStorage.setItem('sheet_snapshot', JSON.stringify(range.values));
  } catch (e) {
    // ignore si storage no disponible
  }
}
