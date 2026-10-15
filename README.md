---
type: consegna
status: bozza
updated: 2026-10-01
progetto: ecodigital
aliases:
  - Sito EcoDigital v4
  - Sito EcoDigital nuova identità
---

# Sito EcoDigital v4, la v3 con la nuova identità

Il sito v3 rivestito con il Brand Book approvato nella call del 01/10/2026: stesse pagine, stessi testi, pelle nuova, logo istituzionale, «relatori» al posto di «politici», menu con Eventi e Amministratori.

Le regole di struttura e di copy restano quelle del [[deliverables/2026-09-10_ecodigital-dossier-treno/BRIEF-SITO-V3|brief della v3]]. Le novità della call stanno nel [[deliverables/2026-10-01_ecodigital-nuova-identita/BRIEF-COMUNE|brief comune]].

## Cosa è cambiato rispetto alla v3

**La pelle**
- Foglio nuovo `css/site-v4.css`, nato dal vecchio `site-v2.css` (tolto da qui, l'originale resta nella cartella della v3).
- In testa carica `css/brand.css`, la copia del kit, dentro un livello CSS basso: le regole del sito vincono sempre.
- Fondo bianco, inchiostro #14161F, blu #293B8E al posto del verde foresta, verde #09693A per gli stati positivi, giallo #F7B807 come accento e per il bottone «Diventa follower», rosso #C0202F solo nelle barre del logo.
- Titoli in Archivo esteso maiuscolo, testo in Montserrat. Font in `fonts/`, niente rete e niente CDN.
- Header bianco con il logo istituzionale. Footer blu con il logo in negativo e la barra verde, bianca e rossa.
- Sfumatura di brand su due superfici: la copertina della home sopra il muro dei volti e la chiusura «Diventa follower» (home e tutti gli editoriali), con il wordmark bianco.
- Corretti a mano tutti i colori fissi fuori dai token, nelle pagine e negli editoriali. Ridotte le misure dei titoli che con il carattere largo andavano a capo dentro le parole (manifesto, Alfonso, blog, crediti, news, press, territori).
- Gli editoriali hanno un foglio di correzione loro, `css/blog-v4.css`.
- Tutti i link ai fogli e allo script del manifesto hanno `?v=20261001`.

**Il logo**
- Ovunque il logo istituzionale SVG: positivo nell'header, negativo nel footer, bianco sulla sfumatura. Favicon `tondo-blu.svg`.
- I vecchi PNG del logo stanno in `img/logo/_vecchi/`. `partner.jpg` e `sostegno.png` sono rimasti.
- Nella pagina Press i download sono i loghi nuovi (SVG e PNG da 2000 px in `img/logo/png/`).

**Relatori**
- In `rete.html` la sezione diventa «I relatori ecodigital nelle istituzioni», con la riga «Sono intervenuti come relatori agli incontri della rete». Ancora `#relatori`.
- Corretti anche i crediti fotografici. «Politiche agricole» resta: è il nome del ministero.

**Menu e footer**
- Rete · Manifesto · Territori · Eventi · Notizie · Blog · Press · Amministratori · Impatto, più «Diventa follower». Uguale in tutte le 14 pagine e nei 15 editoriali.
- Nel footer: «Le tappe fatte», «Prossimi incontri e iscrizioni», «Per gli amministratori».
- Sotto i 1060 px il menu passa su una seconda riga che scorre.

**Le due pagine nuove collegate**
- «Eventi» punta a `eventi/index.html`, «Amministratori» a `amministratori/index.html`. Le due cartelle le costruiscono altri agenti in `../eventi/` e `../amministratori/`: vanno spostate dentro `sito/`, finché non ci sono quei link danno pagina mancante.
- `eventi.html` diventa «Le tappe fatte»: in testa il riquadro «Prossimi incontri e iscrizioni», e nel blocco «Le prossime due» il bottone «Iscriviti agli incontri».
- Home: nuova fascia blu «Per gli amministratori» (tre righe e bottone). La vecchia «Prossime tappe» è diventata «Prossimi incontri» con i bottoni «Iscriviti agli incontri» e «Le tappe fatte». «Chi lo fa» resta com'era.

**Movimento**
- Muro dei volti, scritta ECODIGITAL che si compone (ora in corsivo largo con le due barre sotto, come il logo) e salto a schermate del manifesto funzionano come prima. `js/` non è cambiato.

## Come si apre

- Doppio clic su `index.html`: funziona offline.
- Controlli fatti il 01/10: catture headless a 1440 e 390 px di home, rete, manifesto, eventi e un editoriale, più una passata sulle altre pagine; zero trattini lunghi o medi nei file HTML; zero file con #1B4332, #2D9963 o Bricolage; nessun link rotto a parte le due cartelle da spostare.

## Cosa resta aperto

- Spostare `../eventi/` e `../amministratori/` dentro `sito/` e controllare che usino lo stesso header.
- Go-live: dominio ecodigital.it, hosting (green hosting da scegliere), chi tiene le credenziali.
- Backend eventi: Apps Script e foglio delle iscrizioni da attivare (vedi il README degli eventi).
- Font in TTF, circa 2,8 MB: prima di andare online vanno convertiti in WOFF2 e tenuti solo i pesi usati.
- Restano tutte le cose aperte della v3: ritratti di Iorio e Di Girolamo, foto dei nove relatori senza ritratto, consenso delle persone ritratte, citazione di Pecoraro Scanio da approvare, moduli che non inviano nulla.
