/* Configurazione della pagina «Per gli amministratori» di EcoDigital.
 *
 * ENDPOINT: l'indirizzo del Web App di Google Apps Script che finisce con /exec.
 * Può essere lo stesso del sistema eventi (../eventi/config.js): il Web App
 * riconosce le richieste dal campo «azione».
 *   azione "adesione-ente"  modulo di adesione dell'ente
 *   azione "buona-pratica"  modulo della vetrina
 * Finché resta vuoto la pagina funziona in prova: i moduli simulano l'invio
 * e mostrano l'avviso «collegamento non ancora attivo». Nessun dato parte.
 *
 * Qui NON vanno chiavi o password.
 */
const ENDPOINT = "";

/* Indirizzo a cui scrivere per domande, mozioni approvate e tappe. */
const CONTATTO_EMAIL = "info@ecodigital.it";
