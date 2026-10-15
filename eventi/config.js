/* Configurazione del sistema eventi EcoDigital.
 *
 * ENDPOINT: l'indirizzo del Web App di Google Apps Script, quello che finisce con /exec.
 * Si copia dalla finestra «Deployment» di Apps Script (vedi apps-script/README.md, passo 7).
 * Finché resta vuoto le pagine funzionano in prova: il modulo simula l'invio
 * e mostra l'avviso «backend non collegato».
 *
 * Qui NON vanno chiavi o password. La chiave regia sta solo nelle proprietà
 * dello script e si scrive a mano nelle pagine checkin e admin.
 */
const ENDPOINT = "";

/* Indirizzo a cui scrivere per domande sugli incontri. */
const CONTATTO_EMAIL = "info@ecodigital.it";

/* Se true, le pagine leggono il programma dal foglio «Eventi» invece che da eventi.js.
 * Lascialo false finché il foglio non è stato riempito (admin.html, «Copia il programma per il foglio»). */
const EVENTI_DAL_FOGLIO = false;
