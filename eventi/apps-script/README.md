---
type: consegna
status: bozza
updated: 2026-10-01
progetto: ecodigital
aliases:
  - "Backend eventi EcoDigital"
---
# Backend eventi EcoDigital: come si mette in piedi

Un foglio Google e uno script Apps Script sull'account info@11-11stud.io, come per la Sedia d'Oro. Venti minuti la prima volta.

## Prima volta

1. **Crea il foglio.** Su Drive di info@11-11stud.io (Chrome, profilo u/3): Nuovo → Fogli Google. Nome: «EcoDigital · iscrizioni eventi».
2. **Apri l'editor.** Nel foglio: Estensioni → Apps Script. Rinomina il progetto in «EcoDigital eventi · backend».
3. **Incolla il codice.** Cancella quello che c'è in `Code.gs` e incolla tutto il file `Code.gs` di questa cartella.
4. **Aggiungi le tre email.** Nell'editor: + → HTML, tre volte, con questi nomi esatti, e dentro il contenuto dei file della cartella `email/`:
   - `email_conferma` ← `email/conferma.html`
   - `email_promemoria` ← `email/promemoria.html`
   - `email_dopo_evento` ← `email/dopo-evento.html`
   Se mancano, le email partono lo stesso in solo testo.
5. **Imposta le proprietà.** Impostazioni progetto (ingranaggio) → Proprietà dello script → Aggiungi:
   - `CHIAVE_REGIA`: una frase lunga almeno otto caratteri, inventata sul momento. La si scrive solo qui e in chat con Dix, **mai nei file del vault**.
   - `SITO_URL`: l'indirizzo della cartella eventi pubblicata, con la barra finale (es. `https://www.ecodigital.it/eventi/`). Serve per i link nelle email.
   - facoltative: `RISPONDI_A` (dove arrivano le risposte alle email, es. l'indirizzo di Ale e Michele), `CONTATTO` (predefinito info@ecodigital.it), `LINK_FOLLOWER` (pagina «Diventa follower»).
6. **Prepara i fogli e autorizza.** Nell'editor scegli la funzione `preparaFogli` e premi Esegui. Google chiede i permessi (foglio, invio email, servizi esterni): Consenti. Nascono i fogli «Iscrizioni» ed «Eventi». Poi esegui `installaAttivita` una volta: promemoria automatico ogni mattina alle 9, coda email ogni ora, pulizia dei dati vecchi ogni notte.
7. **Pubblica.** Deploy → Nuovo deployment → tipo «App web». Esegui come: **me**. Chi ha accesso: **Chiunque**. Copia l'URL che finisce con `/exec`.
8. **Collega le pagine.** In `eventi/config.js` metti l'URL in `ENDPOINT`. Da quel momento l'avviso «backend non collegato» sparisce e il modulo scrive davvero.
9. **Prova.** Apri `ENDPOINT?azione=salute` nel browser: deve rispondere `"ok":true` e `proprietaMancanti: []`. Poi fai un'iscrizione vera con la tua email, guarda la riga nel foglio e la email arrivata.

## Quando si cambia il codice

Si incolla il nuovo `Code.gs`, poi Deploy → **Gestisci deployment** → matita sul deployment esistente → Versione: **Nuova versione** → Deploy. L'URL resta lo stesso, `config.js` non si tocca. Se invece si fa «Nuovo deployment» nasce un URL nuovo e va aggiornato `config.js`.

## Cosa sa fare

- `iscrizione`: controlla i campi, i posti e i doppioni (stessa email allo stesso incontro restituisce il codice già dato), crea il codice `ED-2026-XXXX`, salva la riga, manda la conferma con il file del calendario allegato.
- `annulla`: dal link nella email. Manda una riga di conferma e poi cancella i dati personali dalla riga, lasciando codice e data come dice l'informativa.
- `checkin`, `elenco`, `promemoria`, `grazie`: solo con la chiave regia, confrontata con la proprietà `CHIAVE_REGIA`.
- In lettura (GET): `?azione=salute`, `?azione=eventi` (il programma dal foglio), `?azione=posti` (persone iscritte per evento).
- Il grazie va solo a chi è passato dal check-in; se il check-in non è stato usato, a tutti.
- Il promemoria automatico parte solo per gli incontri con data confermata scritti nel foglio «Eventi». Senza foglio «Eventi» si usa il bottone in `admin.html`.

## Note tecniche

- Il browser manda i POST come `text/plain`, senza header personalizzati: è una «richiesta semplice» e non parte il preflight CORS, che Apps Script non sa gestire. Non aggiungere `Content-Type: application/json` in `app.js`.
- I valori che iniziano con `=`, `+`, `-` o `@` vengono salvati come testo, così nessuno può infilare formule nel foglio.
- Il foglio «Eventi» ha le stesse colonne di `eventi.js` più tre per le email: `linkDiretta` (webinar), `linkFoto` e `fotoUrl` (email di ringraziamento). Per riempirlo: `admin.html` → «Copia il programma per il foglio» → incolla in A1.

## Limiti di invio di Google

- Account Gmail gratuito: **100 destinatari al giorno**. Google Workspace: **1.500 al giorno**. Il contatore si azzera 24 ore dopo il primo invio, non a mezzanotte.
- info@11-11stud.io va verificato: se è Workspace il tetto è 1.500.
- Quando il tetto è raggiunto le email non si perdono: la riga resta «in coda» e la funzione `inviaCoda` le manda ogni ora appena c'è spazio. `admin.html` mostra quante email restano oggi prima di mandare il promemoria.
- Quando un incontro supera il tetto (per esempio 200 iscritti a un webinar su un account gratuito): mandare il promemoria due giorni prima invece di uno, così la coda si smaltisce in tempo; oppure passare l'invio a un servizio di email dedicato (vedi il README della cartella eventi, voce Brevo).
- Il mittente che vede chi riceve è l'account che ha pubblicato lo script, con nome «EcoDigital». Per un mittente @ecodigital.it serve un account Google su quel dominio che pubblichi lo script.
