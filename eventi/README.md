---
type: consegna
status: bozza
updated: 2026-10-01
progetto: ecodigital
aliases:
  - "Sistema eventi EcoDigital"
  - "Iscrizioni agli incontri EcoDigital"
---
# Sistema eventi EcoDigital

Le iscrizioni agli incontri dentro il sito, stile Eventbrite ma nostro: elenco, pagina dell'incontro con il modulo, biglietto con QR, check-in, pannello iscritti, email. I dati e le email restano in un foglio Google nostro.

## Come funziona, in cinque passi

1. **Iscrizione.** Chi visita `index.html` sceglie un incontro, compila il modulo in `evento.html` e riceve subito il suo codice (`ED-2026-XXXX`) e il bottone «Aggiungi al calendario».
2. **Email di conferma.** Il backend salva la riga nel foglio e manda la conferma con il file del calendario allegato e il link al biglietto (`conferma.html`, con il QR e il link per disdire).
3. **Promemoria.** Il giorno prima parte da solo alle 9 se l'incontro è nel foglio «Eventi» con data confermata; altrimenti Ale e Michele lo mandano da `admin.html`, con conferma in pagina.
4. **Check-in.** All'ingresso, da un telefono: `checkin.html`, si cerca per nome o codice, «Presente», il contatore degli ingressi sale.
5. **Dopo.** Da `admin.html` «Manda il grazie»: foto, prossima tappa, «Diventa follower». Va a chi è passato dal check-in.

## File

- `index.html` elenco degli incontri, filtri per regione e tipo
- `evento.html?id=...` pagina dell'incontro e modulo
- `conferma.html` biglietto con QR, istruzioni, disdetta (`?id=...&annulla=CODICE`)
- `checkin.html` e `admin.html` per la regia, protette dalla chiave regia (si scrive in pagina, resta solo nella scheda del browser)
- `privacy.html` informativa per le iscrizioni, con i dati del titolare tra parentesi quadre
- `eventi.js` il programma: cinque incontri in programma con data da confermare (Ecomondo, COP31, Giornata degli alberi, intergruppo ARS, incontro nazionale a Napoli) e otto incontri passati veri, dal sito v3
- `config.js` l'indirizzo del backend (`ENDPOINT`), vuoto finché non si pubblica lo script
- `app.js`, `regia.js`, `eventi.css` codice e stile comuni; i colori e i caratteri arrivano da `../css/brand.css`
- `email/` i tre modelli: conferma, promemoria, dopo l'incontro
- `apps-script/` il backend (`Code.gs`) e le istruzioni passo passo per metterlo in piedi

## Come si prova in locale

- Si apre `index.html` con un doppio clic. Funziona tutto senza server.
- Senza `ENDPOINT` il modulo mostra l'avviso «backend non collegato» e simula l'invio: codice di prova, riquadro di conferma, file del calendario, biglietto con QR.
- `checkin.html` e `admin.html` mostrano iscritti finti segnati «prova» (più quelli simulati dallo stesso browser) e simulano check-in e promemoria. Nessuna email parte.
- Il QR si disegna con `qrcode-generator` 1.4.4 da cdnjs: offline al suo posto compare il codice in grande.

## Cosa serve da Dix

- **Account per il foglio**: confermare info@11-11stud.io (come la Sedia d'Oro) e se è un account Workspace (1.500 email al giorno) o gratuito (100). Poi i passi di `apps-script/README.md`.
- **Titolare della privacy**: nome dell'ente, indirizzo ed email per le richieste, da scrivere in `privacy.html`. Probabilmente SOS Terra ETS, da decidere con Pecoraro.
- **Dominio del sito**: serve per `SITO_URL` (i link nelle email) e per pubblicare le pagine. Per avere un mittente @ecodigital.it serve un account Google su quel dominio.
- **Chiave regia**: la sceglie Dix, la si mette nelle proprietà dello script e la si passa ad Ale e Michele in chat.
- **Indirizzo per le risposte** (`RISPONDI_A`): quello di Ale e Michele o info@ecodigital.it.

## Limiti e alternative se si cresce

- Tetto di Google: 100 email al giorno con un account gratuito, 1.500 con Workspace. Oltre, le email vanno in coda e partono da sole nelle ore successive.
- Il foglio regge senza problemi qualche migliaio di iscrizioni. Oltre le 10.000 righe conviene un foglio per anno.
- Le **notizie di EcoDigital** (chi mette la spunta) non vanno mandate da qui: si esporta il CSV filtrato e si carica su **Brevo** (gratuito fino a 300 email al giorno, gestisce da solo le cancellazioni). Lo stesso Brevo può mandare i promemoria degli incontri grandi.
- Se gli incontri diventano a pagamento serve un vero servizio di biglietteria: questo sistema non gestisce pagamenti.

## Aperto

- Le date degli incontri in programma sono tutte da confermare con Pecoraro e i territori: si cambiano in `eventi.js` (o nel foglio «Eventi»).
- Gli incontri di Ravello e Venezia non hanno l'elenco completo di chi è intervenuto: lo si aggiunge quando arriva.
- Il sito v4 deve linkare `eventi/index.html` dalla pagina delle tappe e dal menu.
- Mai provato contro un Apps Script vero: la prima iscrizione reale va fatta subito dopo il deploy (passo 9 delle istruzioni).
