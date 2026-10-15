---
type: consegna
status: bozza
updated: 2026-10-01
progetto: ecodigital
aliases:
  - Spazio amministratori EcoDigital
  - Database RTD
---

# Spazio per gli amministratori e database dei RTD

Il database dei Responsabili per la Transizione Digitale di tutta Italia, preso dagli open data dell'IPA, e la pagina «Per gli amministratori» con le mozioni tipo, la tappa, la vetrina, la lettera mensile e tre email pronte. Nessuna email è stata mandata.

## I numeri del database

Fonte: open data dell'Indice delle Pubbliche Amministrazioni, indicepa.gov.it/ipa-dati, licenza CC BY 4.0. Dataset «responsabili-della-transizione-al-digitale», «enti» e «amministrazioni», aggiornati dall'IPA il 1° ottobre 2026 alle 03:16 e scaricati lo stesso giorno alle 22:57.

**Italia**: 23.752 enti nell'IPA, 20.968 con un RTD nominato. Di questi, 12.344 hanno un'email a cui si può scrivere (11.140 sul dominio dell'ente, 1.204 su gmail, tiscali, libero e simili), 572 hanno registrato una PEC come email del RTD, 7.939 sono scuole statali con il RTD unico del Ministero (rtd@istruzione.it, inutile per noi) e 113 hanno l'email vuota o finta.

**Comuni italiani**: 7.893, di cui 7.768 con RTD nominato e 7.426 con un'email a cui si può scrivere.

Nelle cinque regioni dove EcoDigital è attiva:

| Regione | Enti | Con RTD | Email scrivibile | Comuni | Comuni con email scrivibile |
|---|---|---|---|---|---|
| Campania | 1.989 | 1.797 | 776 | 550 | 480 |
| Sicilia | 1.866 | 1.595 | 789 | 391 | 378 |
| Puglia | 1.272 | 1.104 | 451 | 257 | 226 |
| Calabria | 971 | 872 | 471 | 404 | 328 |
| Basilicata | 355 | 318 | 208 | 131 | 127 |
| **Sud** | **6.453** | **5.686** | **2.695** | **1.733** | **1.539** |

La differenza fra «con RTD» e «email scrivibile» sono soprattutto le scuole (2.736 al Sud, tutte con l'email del Ministero) e le PEC. Dei 1.539 comuni del Sud con email scrivibile, 1.258 usano il dominio del comune e 281 un dominio generico. Per 1.552 comuni del Sud l'IPA riporta anche il nome del sindaco, senza email: si raggiunge tramite il RTD o l'indirizzo generale del comune.

Attenzione all'età dei dati: dei 1.700 RTD dei comuni del Sud, 665 sono stati aggiornati nell'ultimo anno e 411 non lo sono dal 2023 o prima. Qualche nome sarà cambiato: per questo le email salutano per nome ma parlano all'ufficio.

## I file

- `../../database-rtd/dati/rtd-italia.csv`: tutti gli enti, 23.752 righe.
- `../../database-rtd/dati/rtd-sud.csv`: Campania, Sicilia, Puglia, Calabria, Basilicata, 6.453 righe.
- `../../database-rtd/dati/rtd-comuni-campania.csv`: i 550 comuni campani.
- `../../database-rtd/dati/numeri.json`: tutti i conteggi, anche per tipologia e per le altre regioni.
- Colonne: codice IPA, denominazione, tipologia (comune, unione di comuni, provincia, città metropolitana, regione, università, ASL, azienda ospedaliera, scuola, consorzio, altro), comune, provincia, regione, nome e cognome del RTD, email del RTD con il suo stato (ok, dominio generico, pec, centrale ministero, mancante, non valida), quanti altri enti condividono la stessa email, PEC dell'ente, sindaco o legale rappresentante, sito, data di aggiornamento del RTD e dell'ente.
- `../../database-rtd/strumenti/ipa-rtd.py`: rifà tutto da capo con `python3 database-rtd/strumenti/ipa-rtd.py`. Usa l'API del portale (CKAN), tre download in fila con pause, nessuna ricerca web. I file grezzi restano in `../../database-rtd/dati/fonte/`, fuori da git.
- `strumenti/mozioni.py`: dal testo delle mozioni genera i file da scaricare in `mozioni/` e i dati della pagina.
- `strumenti/apps-script-ramo-enti.gs`: il pezzo da aggiungere al Web App del sistema eventi per ricevere i due moduli della pagina.

## Il pacchetto in quattro cose

La pagina è `index.html`, con lo stile del kit e i moduli che partono verso l'indirizzo in `config.js` (vuoto: finché resta vuoto i moduli dicono «pagina in prova» e non mandano nulla).

1. **Le proposte del mese da adottare.** Dieci delle 18 proposte del mazzo diventano mozioni tipo per il consiglio comunale, una pagina ciascuna, in [[deliverables/2026-10-01_ecodigital-nuova-identita/amministratori/proposte-per-i-comuni|Mozioni tipo]]: telefono vecchio, computer riparati, dati aperti in 30 giorni, registro degli algoritmi, etichetta per l'IA, tecnico condiviso per i piccoli comuni, un numero prima e dopo, prima si rigenera, muretti a secco, 30% di mare protetto. Le norme non le abbiamo inventate: dove serve una citazione c'è scritto [riferimento da verificare].
2. **Ospitare una tappa.** Il comune mette sala, data e due relatori locali; noi comunicazione, locandina, copertura e iscrizioni dal sito con il sistema eventi.
3. **La vetrina della buona pratica.** Modulo con ente, referente, email e la pratica in 300 caratteri. Prima di pubblicare si manda il testo all'ente.
4. **La lettera mensile.** Tre buone pratiche copiabili, le scadenze utili del mese e la proposta del mese con la sua mozione.

Il modulo di adesione chiede ente, ruolo, nome, email istituzionale, interessi e consenso, e parte con l'azione `adesione-ente`, come il sistema eventi. La vetrina usa l'azione `buona-pratica`.

Le email sono in `email/`: presentazione, proposta del mese (dati aperti in 30 giorni), ospita una tappa. Tra 127 e 162 parole di corpo, firma di Alessandro Di Capua e Michele D'Orso e riga finale per non ricevere altro.

## Nota legale, in parole semplici

- Gli indirizzi dell'IPA sono dati pubblici: la legge chiede agli enti di pubblicarli proprio perché chiunque possa contattarli sui temi del loro ruolo.
- Scrivere a un RTD o a un comune per proporre una mozione, una tappa o una buona pratica è lecito: è un contatto istituzionale su un tema del suo ruolo e la base è il legittimo interesse (articolo 6, paragrafo 1, lettera f del GDPR).
- Valgono quattro regole: mittente chiaro con nome e cognome di chi scrive; in ogni email il modo per non riceverne altre, e chi risponde «stop» esce dalla lista subito e per sempre; niente profilazione, niente tracciamento delle aperture e nessun incrocio con altri dati; solo email istituzionali.
- Le email su gmail, tiscali e simili vanno guardate a occhio prima dell'invio: se il nome della casella è quello del comune è la casella dell'ufficio, se è un nome di persona è meglio scrivere alla PEC o all'indirizzo generale del comune.
- Le PEC servono per le comunicazioni formali, per esempio la trasmissione di una mozione approvata. Per la lettera mensile e per le presentazioni non si usano.
- Chi aderisce dalla pagina dà il consenso esplicito: da quel momento la base è il consenso e vale la casella spuntata.
- Prima del primo invio serve una breve informativa privacy sul sito, con chi tratta i dati e come chiederne la cancellazione.

## Cosa serve da Dix

- **Ok sui testi delle tre email** e sulle mozioni tipo. Le mozioni parlano a nome della rete, quindi vanno lette anche da Pecoraro.
- **Il mittente**: Alessandro e Michele firmano; serve decidere da quale indirizzo parte: info@ecodigital.it, già citato nel mazzo, oppure un indirizzo nuovo.
- **Lo strumento di invio**: Gmail da info@ fino a 100 email al giorno, cioè la Campania in cinque giorni lavorativi; oppure Brevo gratuito, con il link per disiscriversi automatico, per lotti più grandi. Con Brevo il tracciamento delle aperture va spento.
- **Il primo lotto**: consigliamo i 480 comuni campani con email scrivibile, poi Sicilia, Calabria, Puglia, Basilicata.
- **Dove vive la pagina**: dentro il sito v4 come `amministratori.html`, con la voce nel menu.
- **Il collegamento dei moduli**: incollare l'indirizzo del Web App in `config.js` e aggiungere il ramo `apps-script-ramo-enti.gs` al Web App del sistema eventi.

## Cosa non è stato fatto

- Nessuna email è stata mandata e nessun contatto è stato caricato su Gmail, Brevo o altri servizi.
- Nessuna ricerca automatica sul portale IPA: solo i tre file open data.
- Le norme nelle mozioni non sono state verificate: sono segnate [riferimento da verificare].
- La lettera mensile non ha ancora un primo numero: le scadenze dei bandi vanno cercate mese per mese, nella pagina c'è solo un esempio con Ecomondo (Rimini, dal 3 al 6 novembre 2026).
- I moduli della pagina non sono collegati a nessun foglio.
