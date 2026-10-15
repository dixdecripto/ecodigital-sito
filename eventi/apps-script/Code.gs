/**
 * EcoDigital · backend del sistema eventi
 * Google Apps Script pubblicato come Web App (esegui come: me, accesso: chiunque).
 *
 * Fogli usati (li crea preparaFogli()):
 *   «Iscrizioni»  una riga per iscrizione
 *   «Eventi»      il programma, stesse colonne di eventi.js (facoltativo: se è vuoto
 *                 il backend usa i dati dell'evento che arrivano dal modulo)
 *
 * Proprietà dello script (Impostazioni progetto → Proprietà dello script):
 *   CHIAVE_REGIA   obbligatoria: la chiave per check-in, elenco, promemoria. Mai scriverla qui.
 *   SITO_URL       obbligatoria: indirizzo della cartella eventi, con la barra finale
 *                  (es. https://www.ecodigital.it/eventi/)
 *   RISPONDI_A     facoltativa: indirizzo a cui arrivano le risposte alle email
 *   CONTATTO       facoltativa: indirizzo scritto in fondo alle email (predefinito info@ecodigital.it)
 *   LINK_FOLLOWER  facoltativa: pagina «Diventa follower» (predefinito SITO_URL + ../sito/attivista.html)
 *   ID_FOGLIO      facoltativa: id del foglio, solo se lo script NON è stato creato dal foglio
 *
 * Il front-end manda i POST come text/plain (senza header personalizzati) per evitare
 * il preflight CORS, che Apps Script non gestisce. Le risposte sono sempre JSON.
 */

var VERSIONE = '2026-10-01';
var FUSO = 'Europe/Rome';
var FOGLIO_ISCRIZIONI = 'Iscrizioni';
var FOGLIO_EVENTI = 'Eventi';

var COLONNE_ISCRIZIONI = ['timestamp', 'codice', 'evento', 'evento_titolo', 'nome', 'cognome', 'email', 'ente', 'ruolo', 'citta',
  'accompagnatori', 'privacy', 'notizie', 'stato', 'annullata_il', 'presente', 'email_conferma', 'promemoria_il', 'grazie_il'];

/* Le prime 26 colonne sono le chiavi di eventi.js, nello stesso ordine del bottone
 * «Copia il programma per il foglio» di admin.html. Le ultime tre servono solo alle email. */
var COLONNE_EVENTI = ['id', 'stato', 'confermato', 'tipo', 'titolo', 'sottotitolo', 'dataInizio', 'dataFine', 'soloMese', 'oraInizio', 'oraFine',
  'notaData', 'citta', 'regione', 'luogo', 'indirizzo', 'online', 'posti', 'iscrizioniAperte', 'organizza', 'descrizione', 'programma',
  'relatori', 'comeArrivare', 'foto', 'recap', 'linkDiretta', 'linkFoto', 'fotoUrl'];

var RUOLI = ['Cittadino', 'Amministratore locale', 'Impresa', 'Startup', 'Università', 'Scuola', 'Associazione', 'Stampa'];

var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
var PAROLE = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci'];

/* ====================================================================== */
/* Ingressi HTTP                                                           */
/* ====================================================================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    switch (p.azione || 'salute') {
      case 'salute': return risposta(salute());
      case 'eventi': return risposta({ ok: true, eventi: leggiEventi() });
      case 'posti': return risposta({ ok: true, posti: postiOccupati() });
      case 'elenco': return risposta(elenco({ chiave: p.chiave, evento: p.evento }));
      default: return risposta({ ok: false, errore: 'Azione sconosciuta.' });
    }
  } catch (err) {
    return risposta({ ok: false, errore: 'Errore del server: ' + err.message });
  }
}

function doPost(e) {
  var d;
  try {
    d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return risposta({ ok: false, errore: 'Richiesta non leggibile.' });
  }
  try {
    switch (d.azione) {
      case 'iscrizione': return risposta(iscrizione(d));
      case 'annulla': return risposta(annulla(d));
      case 'checkin': return risposta(checkin(d));
      case 'elenco': return risposta(elenco(d));
      case 'promemoria': return risposta(inviaATutti(d, 'promemoria'));
      case 'grazie': return risposta(inviaATutti(d, 'grazie'));
      default: return risposta({ ok: false, errore: 'Azione sconosciuta.' });
    }
  } catch (err) {
    console.error(err);
    return risposta({ ok: false, errore: 'Errore del server. Riprova tra un minuto.' });
  }
}

function risposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function salute() {
  var pr = proprieta();
  var mancano = [];
  if (!pr.CHIAVE_REGIA) mancano.push('CHIAVE_REGIA');
  if (!pr.SITO_URL) mancano.push('SITO_URL');
  var ss = foglio();
  return {
    ok: true,
    versione: VERSIONE,
    foglioIscrizioni: !!ss.getSheetByName(FOGLIO_ISCRIZIONI),
    foglioEventi: !!ss.getSheetByName(FOGLIO_EVENTI),
    proprietaMancanti: mancano,
    quotaEmail: MailApp.getRemainingDailyQuota()
  };
}

/* ====================================================================== */
/* Azioni                                                                  */
/* ====================================================================== */

function iscrizione(d) {
  /* campo trappola per i bot: rispondiamo come se fosse andata bene */
  if (d.sito) return { ok: true, codice: 'ED-' + new Date().getFullYear() + '-' + casuale(4) };

  var dati = {
    nome: pulisci(d.nome, 80), cognome: pulisci(d.cognome, 80), email: pulisci(d.email, 120).toLowerCase(),
    ente: pulisci(d.ente, 120), ruolo: pulisci(d.ruolo, 40), citta: pulisci(d.citta, 80),
    accompagnatori: Math.max(0, Math.min(3, parseInt(d.accompagnatori, 10) || 0)),
    privacy: d.privacy === true, notizie: d.notizie === true
  };
  if (!dati.nome || !dati.cognome) return { ok: false, errore: 'Mancano nome o cognome.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dati.email)) return { ok: false, errore: "L'email non sembra valida." };
  if (RUOLI.indexOf(dati.ruolo) < 0) return { ok: false, errore: 'Scegli un ruolo dal menu.' };
  if (!dati.citta) return { ok: false, errore: 'Manca la città.' };
  if (!dati.privacy) return { ok: false, errore: "Per iscriverti serve il consenso all'informativa privacy." };

  var ev = eventoPer(d.evento, d.datiEvento);
  if (!ev) return { ok: false, errore: 'Incontro non trovato.' };
  if (ev.stato === 'passato' || ev.iscrizioniAperte === false) return { ok: false, errore: 'Le iscrizioni a questo incontro sono chiuse.' };

  /* niente doppi invii a raffica dalla stessa email */
  var cache = CacheService.getScriptCache();
  var chiaveCache = 'isc:' + ev.id + ':' + dati.email;
  if (cache.get(chiaveCache)) return { ok: false, errore: 'Abbiamo appena ricevuto questa iscrizione. Aspetta qualche secondo e controlla la posta.' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, errore: 'Troppe iscrizioni nello stesso momento. Riprova tra qualche secondo.' };
  var codice, riga;
  try {
    var sh = foglioIscrizioni();
    var righe = leggiIscrizioni(sh);
    for (var i = 0; i < righe.length; i++) {
      var r = righe[i];
      if (r.evento === ev.id && r.email === dati.email && r.stato !== 'annullata') {
        return { ok: true, codice: r.codice, giaIscritto: true };
      }
    }
    if (ev.posti > 0) {
      var occupati = 0;
      righe.forEach(function (r) { if (r.evento === ev.id && r.stato !== 'annullata') occupati += 1 + (Number(r.accompagnatori) || 0); });
      var restano = ev.posti - occupati;
      if (restano <= 0) return { ok: false, errore: 'I posti sono finiti. Scrivi a ' + contatto() + ' per entrare in lista d\'attesa.' };
      if (restano < 1 + dati.accompagnatori) return { ok: false, errore: 'Restano ' + numero(restano) + ' posti: riduci gli accompagnatori e riprova.' };
    }
    var usati = {};
    righe.forEach(function (r) { usati[r.codice] = true; });
    do { codice = 'ED-' + new Date().getFullYear() + '-' + casuale(4); } while (usati[codice]);

    var valori = {
      timestamp: new Date(), codice: codice, evento: ev.id, evento_titolo: ev.titolo,
      nome: dati.nome, cognome: dati.cognome, email: dati.email, ente: dati.ente, ruolo: dati.ruolo, citta: dati.citta,
      accompagnatori: dati.accompagnatori, privacy: 'sì', notizie: dati.notizie ? 'sì' : 'no',
      stato: 'attiva', annullata_il: '', presente: '', email_conferma: 'in coda', promemoria_il: '', grazie_il: ''
    };
    sh.appendRow(COLONNE_ISCRIZIONI.map(function (c) { return sicuro(valori[c]); }));
    riga = sh.getLastRow();
  } finally {
    lock.releaseLock();
  }
  cache.put(chiaveCache, '1', 15);

  var inCoda = true;
  if (MailApp.getRemainingDailyQuota() > 0) {
    try {
      inviaEmail('conferma', ev, { codice: codice, nome: dati.nome, email: dati.email, accompagnatori: dati.accompagnatori });
      scriviCella(foglioIscrizioni(), riga, 'email_conferma', 'inviata');
      inCoda = false;
    } catch (err) {
      console.error('Conferma non inviata a ' + codice + ': ' + err.message);
      scriviCella(foglioIscrizioni(), riga, 'email_conferma', 'in coda');
    }
  }
  return { ok: true, codice: codice, emailInCoda: inCoda };
}

function annulla(d) {
  var codice = String(d.codice || '').toUpperCase();
  if (!/^ED-\d{4}-[A-Z0-9]{4}$/.test(codice)) return { ok: false, errore: 'Codice non valido.' };
  var sh = foglioIscrizioni();
  var righe = leggiIscrizioni(sh);
  for (var i = 0; i < righe.length; i++) {
    var r = righe[i];
    if (r.codice !== codice || (d.evento && r.evento !== d.evento)) continue;
    if (r.stato === 'annullata') return { ok: true, giaAnnullata: true };
    var ev = eventoPer(r.evento, null) || { id: r.evento, titolo: r.evento_titolo };
    try {
      if (MailApp.getRemainingDailyQuota() > 0 && r.email) {
        var msg = {
          to: r.email, name: nomeMittente(),
          subject: 'Iscrizione annullata: ' + ev.titolo,
          body: 'Ciao ' + r.nome + ',\n\nabbiamo annullato la tua iscrizione a «' + ev.titolo + '» (codice ' + codice + '). Il posto torna libero.\n\n' +
            'Se è stato un errore puoi iscriverti di nuovo da qui: ' + base() + 'evento.html?id=' + encodeURIComponent(r.evento) + '\n\nAlessandro e Michele\nEcoDigital'
        };
        if (proprieta().RISPONDI_A) msg.replyTo = proprieta().RISPONDI_A;
        MailApp.sendEmail(msg);
      }
    } catch (err) { console.error(err); }
    /* Come promesso nell'informativa: dopo la disdetta restano solo codice e data. */
    var riga = r._riga;
    ['nome', 'cognome', 'email', 'ente', 'ruolo', 'citta', 'accompagnatori', 'notizie', 'privacy'].forEach(function (c) { scriviCella(sh, riga, c, ''); });
    scriviCella(sh, riga, 'stato', 'annullata');
    scriviCella(sh, riga, 'annullata_il', new Date());
    return { ok: true };
  }
  return { ok: false, errore: 'Iscrizione non trovata. Controlla il link nella email di conferma.' };
}

function checkin(d) {
  if (!autorizzato(d.chiave)) return negato();
  var codice = String(d.codice || '').toUpperCase();
  var sh = foglioIscrizioni();
  var righe = leggiIscrizioni(sh);
  for (var i = 0; i < righe.length; i++) {
    var r = righe[i];
    if (r.codice !== codice || (d.evento && r.evento !== d.evento)) continue;
    if (r.stato === 'annullata') return { ok: false, errore: 'Questa iscrizione è stata annullata.' };
    var quando = d.presente === false ? '' : new Date();
    scriviCella(sh, r._riga, 'presente', quando);
    return { ok: true, presenteIl: quando ? quando.toISOString() : '' };
  }
  return { ok: false, errore: 'Codice non trovato per questo incontro.' };
}

function elenco(d) {
  if (!autorizzato(d.chiave)) return negato();
  var righe = leggiIscrizioni(foglioIscrizioni()).filter(function (r) { return !d.evento || r.evento === d.evento; });
  return {
    ok: true,
    quotaEmail: MailApp.getRemainingDailyQuota(),
    iscritti: righe.map(function (r) {
      var o = {};
      COLONNE_ISCRIZIONI.forEach(function (c) { o[c] = r[c]; });
      o.notizie = r.notizie === 'sì';
      return o;
    })
  };
}

/* Promemoria o ringraziamento a tutti gli iscritti attivi di un evento.
 * Chi l'ha già ricevuto viene saltato; oltre il tetto giornaliero di Google si mette in coda. */
function inviaATutti(d, tipo, interno) {
  if (!interno && !autorizzato(d.chiave)) return negato();
  var colonna = tipo === 'promemoria' ? 'promemoria_il' : 'grazie_il';
  var sh = foglioIscrizioni();
  var righe = leggiIscrizioni(sh).filter(function (r) { return r.evento === d.evento && r.stato !== 'annullata' && r.email; });
  var ev = eventoPer(d.evento, null) || { id: d.evento, titolo: righe.length ? righe[0].evento_titolo : d.evento };
  var esito = { ok: true, inviate: 0, saltate: 0, inCoda: 0 };
  var presenti = 0;
  righe.forEach(function (r) { if (r.presente) presenti += 1 + (Number(r.accompagnatori) || 0); });
  /* il grazie va a chi è passato dal check-in; se il check-in non è stato usato, a tutti */
  var soloPresenti = tipo === 'grazie' && presenti > 0;
  righe.forEach(function (r) {
    if (r[colonna] && r[colonna] !== 'in coda') { esito.saltate++; return; }
    if (soloPresenti && !r.presente) { esito.saltate++; return; }
    if (MailApp.getRemainingDailyQuota() <= 0) { scriviCella(sh, r._riga, colonna, 'in coda'); esito.inCoda++; return; }
    try {
      inviaEmail(tipo === 'promemoria' ? 'promemoria' : 'dopo-evento', ev, { codice: r.codice, nome: r.nome, email: r.email, accompagnatori: Number(r.accompagnatori) || 0, presenti: presenti });
      scriviCella(sh, r._riga, colonna, new Date());
      esito.inviate++;
    } catch (err) {
      console.error(err);
      scriviCella(sh, r._riga, colonna, 'in coda');
      esito.inCoda++;
    }
  });
  esito.quotaEmail = MailApp.getRemainingDailyQuota();
  return esito;
}

/* ====================================================================== */
/* Attività programmate (si attivano con installaAttivita())               */
/* ====================================================================== */

/* Ogni mattina: promemoria agli iscritti degli incontri di domani (solo se il foglio «Eventi» è pieno). */
function promemoriaAutomatico() {
  var domani = new Date(); domani.setDate(domani.getDate() + 1);
  var giorno = Utilities.formatDate(domani, FUSO, 'yyyy-MM-dd');
  leggiEventi().forEach(function (ev) {
    if (ev.stato !== 'passato' && ev.confermato && !ev.soloMese && ev.dataInizio === giorno) {
      var esito = inviaATutti({ evento: ev.id }, 'promemoria', true);
      console.log('Promemoria ' + ev.id + ': ' + JSON.stringify(esito));
    }
  });
}

/* Ogni ora: manda le email rimaste in coda per il tetto giornaliero. */
function inviaCoda() {
  var sh = foglioIscrizioni();
  var righe = leggiIscrizioni(sh);
  for (var i = 0; i < righe.length; i++) {
    if (MailApp.getRemainingDailyQuota() <= 0) return;
    var r = righe[i];
    if (r.stato === 'annullata' || !r.email) continue;
    var ev = eventoPer(r.evento, null) || { id: r.evento, titolo: r.evento_titolo, dataInizio: '' };
    try {
      if (r.email_conferma === 'in coda') {
        inviaEmail('conferma', ev, { codice: r.codice, nome: r.nome, email: r.email, accompagnatori: Number(r.accompagnatori) || 0 });
        scriviCella(sh, r._riga, 'email_conferma', 'inviata');
      } else if (r.promemoria_il === 'in coda') {
        inviaEmail('promemoria', ev, { codice: r.codice, nome: r.nome, email: r.email });
        scriviCella(sh, r._riga, 'promemoria_il', new Date());
      } else if (r.grazie_il === 'in coda') {
        inviaEmail('dopo-evento', ev, { codice: r.codice, nome: r.nome, email: r.email });
        scriviCella(sh, r._riga, 'grazie_il', new Date());
      }
    } catch (err) { console.error(err); }
  }
}

/* Ogni notte: come promesso nell'informativa, i dati personali delle iscrizioni fatte
 * più di 13 mesi fa (12 dopo l'incontro, con un mese di margine) vengono cancellati.
 * Restano codice, evento, data e presenza, che servono solo per i conteggi. */
function cancellaVecchie() {
  var limite = new Date(); limite.setMonth(limite.getMonth() - 13);
  var sh = foglioIscrizioni();
  leggiIscrizioni(sh).forEach(function (r) {
    if (!r.email || !r.timestamp || new Date(r.timestamp) > limite) return;
    ['nome', 'cognome', 'email', 'ente', 'citta', 'notizie', 'privacy'].forEach(function (c) { scriviCella(sh, r._riga, c, ''); });
  });
}

function installaAttivita() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['promemoriaAutomatico', 'inviaCoda', 'cancellaVecchie'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('promemoriaAutomatico').timeBased().everyDays(1).atHour(9).inTimezone(FUSO).create();
  ScriptApp.newTrigger('inviaCoda').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('cancellaVecchie').timeBased().everyDays(1).atHour(3).inTimezone(FUSO).create();
  console.log('Attività installate: promemoria ogni giorno alle 9, coda ogni ora, pulizia ogni notte alle 3.');
}

/* Da lanciare una volta dall'editor: crea i fogli e chiede le autorizzazioni (foglio, email). */
function preparaFogli() {
  var ss = foglio();
  [[FOGLIO_ISCRIZIONI, COLONNE_ISCRIZIONI], [FOGLIO_EVENTI, COLONNE_EVENTI]].forEach(function (x) {
    var sh = ss.getSheetByName(x[0]) || ss.insertSheet(x[0]);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, x[1].length).setValues([x[1]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });
  /* le colonne di date e ore del foglio Eventi restano testo, così Sheets non le trasforma */
  var shE = ss.getSheetByName(FOGLIO_EVENTI);
  ['dataInizio', 'dataFine', 'oraInizio', 'oraFine'].forEach(function (c) {
    shE.getRange(2, COLONNE_EVENTI.indexOf(c) + 1, 1000, 1).setNumberFormat('@');
  });
  console.log('Fogli pronti. Email rimaste oggi: ' + MailApp.getRemainingDailyQuota());
}

/* ====================================================================== */
/* Fogli                                                                   */
/* ====================================================================== */

function proprieta() { return PropertiesService.getScriptProperties().getProperties(); }

function foglio() {
  var id = proprieta().ID_FOGLIO;
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function foglioIscrizioni() {
  var sh = foglio().getSheetByName(FOGLIO_ISCRIZIONI);
  if (!sh) { preparaFogli(); sh = foglio().getSheetByName(FOGLIO_ISCRIZIONI); }
  return sh;
}

function intestazioni(sh) {
  return sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0].map(String);
}

function leggiIscrizioni(sh) {
  var n = sh.getLastRow();
  if (n < 2) return [];
  var testa = intestazioni(sh);
  return sh.getRange(2, 1, n - 1, testa.length).getValues().map(function (v, i) {
    var o = { _riga: i + 2 };
    testa.forEach(function (c, j) { o[c] = v[j] instanceof Date ? v[j].toISOString() : v[j]; });
    return o;
  });
}

function scriviCella(sh, riga, colonna, valore) {
  var j = intestazioni(sh).indexOf(colonna);
  if (j >= 0) sh.getRange(riga, j + 1).setValue(sicuro(valore));
}

function leggiEventi() {
  var sh = foglio().getSheetByName(FOGLIO_EVENTI);
  if (!sh || sh.getLastRow() < 2) return [];
  var testa = intestazioni(sh);
  return sh.getRange(2, 1, sh.getLastRow() - 1, testa.length).getValues()
    .filter(function (v) { return v[0]; })
    .map(function (v) {
      var o = {};
      testa.forEach(function (c, j) { o[c] = v[j]; });
      return normalizzaEvento(o);
    });
}

function normalizzaEvento(o) {
  function data(x) { return x instanceof Date ? Utilities.formatDate(x, FUSO, 'yyyy-MM-dd') : String(x || ''); }
  function ora(x) { return x instanceof Date ? Utilities.formatDate(x, FUSO, 'HH:mm') : String(x || ''); }
  function vero(x) { return x === true || String(x).toUpperCase() === 'TRUE' || x === 'sì'; }
  var programma = [];
  try { programma = typeof o.programma === 'string' && o.programma ? JSON.parse(o.programma) : (o.programma || []); } catch (e) { programma = []; }
  return {
    id: String(o.id), stato: String(o.stato || 'in-programma'), confermato: vero(o.confermato), tipo: String(o.tipo || 'locale'),
    titolo: String(o.titolo || ''), sottotitolo: String(o.sottotitolo || ''),
    dataInizio: data(o.dataInizio), dataFine: data(o.dataFine), soloMese: vero(o.soloMese),
    oraInizio: ora(o.oraInizio), oraFine: ora(o.oraFine), notaData: String(o.notaData || ''),
    citta: String(o.citta || ''), regione: String(o.regione || ''), luogo: String(o.luogo || ''), indirizzo: String(o.indirizzo || ''),
    online: vero(o.online), posti: Number(o.posti) || 0, iscrizioniAperte: (o.iscrizioniAperte === '' || o.iscrizioniAperte == null) ? true : vero(o.iscrizioniAperte),
    organizza: String(o.organizza || ''), descrizione: String(o.descrizione || ''), programma: programma,
    relatori: String(o.relatori || '').split(';').map(function (s) { return s.trim(); }).filter(String),
    comeArrivare: String(o.comeArrivare || ''), foto: String(o.foto || ''), recap: String(o.recap || ''),
    linkDiretta: String(o.linkDiretta || ''), linkFoto: String(o.linkFoto || ''), fotoUrl: String(o.fotoUrl || '')
  };
}

/* L'evento dal foglio; se il foglio «Eventi» è vuoto, quello mandato dal modulo. */
function eventoPer(id, copia) {
  id = String(id || '');
  if (!/^[a-z0-9-]{3,60}$/.test(id)) return null;
  var eventi = leggiEventi();
  for (var i = 0; i < eventi.length; i++) if (eventi[i].id === id) return eventi[i];
  if (eventi.length || !copia) return null;
  return normalizzaEvento({
    id: id, stato: 'in-programma', confermato: copia.confermato === true, titolo: pulisci(copia.titolo, 160),
    dataInizio: pulisci(copia.dataInizio, 10), dataFine: pulisci(copia.dataFine, 10),
    oraInizio: pulisci(copia.oraInizio, 5), oraFine: pulisci(copia.oraFine, 5),
    luogo: pulisci(copia.luogo, 160), indirizzo: pulisci(copia.indirizzo, 160), online: copia.online === true,
    posti: Number(copia.posti) || 0, iscrizioniAperte: true
  });
}

function postiOccupati() {
  var out = {};
  leggiIscrizioni(foglioIscrizioni()).forEach(function (r) {
    if (r.stato === 'annullata') return;
    out[r.evento] = (out[r.evento] || 0) + 1 + (Number(r.accompagnatori) || 0);
  });
  return out;
}

/* ====================================================================== */
/* Email                                                                   */
/* ====================================================================== */

function inviaEmail(tipo, ev, p) {
  var b = base();
  var link = {
    conferma: b + 'conferma.html?id=' + encodeURIComponent(ev.id) + '&codice=' + encodeURIComponent(p.codice),
    disdetta: b + 'conferma.html?id=' + encodeURIComponent(ev.id) + '&annulla=' + encodeURIComponent(p.codice),
    privacy: b + 'privacy.html',
    follower: proprieta().LINK_FOLLOWER || (b + '../sito/attivista.html')
  };
  var prossimo = tipo === 'dopo-evento' ? prossimoEvento(ev.id) : null;
  var acc = p.accompagnatori ? (p.accompagnatori === 1 ? 'un accompagnatore' : numero(p.accompagnatori) + ' accompagnatori') : '';
  var valori = {
    nome: p.nome, titolo: ev.titolo, sottotitolo: ev.sottotitolo || '', citta: ev.online ? 'online' : (ev.citta || ''),
    quando: maiuscola(dataEstesa(ev)) + (orario(ev) ? ', ' + orario(ev) : ''),
    nota_data: ev.confermato ? '' : (ev.notaData || 'La data è da confermare.'),
    dove: ev.online ? 'Online' : ev.luogo, indirizzo: ev.indirizzo || '', mappa_url: mappa(ev),
    codice: p.codice, accompagnatori: acc, come_arrivare: ev.comeArrivare || '',
    link_conferma: link.conferma, link_disdetta: link.disdetta, link_privacy: link.privacy, link_follower: link.follower,
    link_diretta: ev.linkDiretta || '', link_foto: ev.linkFoto || '', foto_url: ev.fotoUrl || '',
    presenti: p.presenti > 10 ? String(p.presenti) : '',
    prossimo_titolo: prossimo ? prossimo.titolo : '', prossimo_quando: prossimo ? maiuscola(dataEstesa(prossimo)) + ' · ' + (prossimo.online ? 'online' : prossimo.citta) : '',
    prossimo_link: prossimo ? b + 'evento.html?id=' + encodeURIComponent(prossimo.id) : '',
    contatto: contatto()
  };
  var oggetti = { conferma: 'Sei iscritto: ' + ev.titolo, promemoria: 'Domani: ' + ev.titolo, 'dopo-evento': 'Grazie: ' + ev.titolo };
  var file = { conferma: 'email_conferma', promemoria: 'email_promemoria', 'dopo-evento': 'email_dopo_evento' }[tipo];

  var html = null;
  try { html = riempi(HtmlService.createHtmlOutputFromFile(file).getContent(), valori); } catch (e) { html = null; }

  var messaggio = {
    to: p.email, name: nomeMittente(), subject: oggetti[tipo],
    body: testoSemplice(tipo, valori)
  };
  if (html) messaggio.htmlBody = html;
  if (proprieta().RISPONDI_A) messaggio.replyTo = proprieta().RISPONDI_A;
  if (tipo !== 'dopo-evento' && ev.dataInizio) {
    messaggio.attachments = [Utilities.newBlob(ics(ev, p.codice), 'text/calendar', 'ecodigital-' + ev.id + '.ics')];
  }
  MailApp.sendEmail(messaggio);
}

/* {{chiave}} si sostituisce con il valore; {{#chiave}}...{{/chiave}} resta solo se il valore c'è. */
function riempi(html, v) {
  html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, function (m, k, dentro) { return v[k] ? dentro : ''; });
  return html.replace(/\{\{(\w+)\}\}/g, function (m, k) { return escHtml(v[k] == null ? '' : v[k]); });
}

function testoSemplice(tipo, v) {
  var righe = ['Ciao ' + v.nome + ','];
  if (tipo === 'conferma') {
    righe.push('', 'sei iscritto a «' + v.titolo + '».', '', 'Quando: ' + v.quando);
    if (v.nota_data) righe.push(v.nota_data + ' Ti scriviamo appena è fissata.');
    righe.push('Dove: ' + v.dove + (v.indirizzo ? ', ' + v.indirizzo : ''), 'Il tuo codice: ' + v.codice);
    if (v.accompagnatori) righe.push('Vale anche per ' + v.accompagnatori + '.');
    righe.push('', 'Il tuo biglietto con il QR: ' + v.link_conferma, 'Non puoi più venire? Disdici qui: ' + v.link_disdetta);
  } else if (tipo === 'promemoria') {
    righe.push('', 'domani ci vediamo a «' + v.titolo + '».', '', 'Quando: ' + v.quando, 'Dove: ' + v.dove + (v.indirizzo ? ', ' + v.indirizzo : ''), 'Il tuo codice: ' + v.codice);
    if (v.link_diretta) righe.push('Link per la diretta: ' + v.link_diretta);
    righe.push('', 'Il tuo biglietto: ' + v.link_conferma, 'Contrattempo? Disdici qui: ' + v.link_disdetta);
  } else {
    righe.push('', 'grazie di essere stato dei nostri a «' + v.titolo + '».');
    if (v.link_foto) righe.push('Le foto: ' + v.link_foto);
    if (v.prossimo_titolo) righe.push('', 'La prossima tappa: ' + v.prossimo_titolo + ', ' + v.prossimo_quando, 'Iscriviti: ' + v.prossimo_link);
    righe.push('', 'Diventa follower: ' + v.link_follower);
  }
  righe.push('', 'Alessandro e Michele', 'EcoDigital', '', 'Informativa privacy: ' + v.link_privacy);
  return righe.join('\n');
}

function prossimoEvento(escluso) {
  var oggi = Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd');
  var lista = leggiEventi().filter(function (e) { return e.id !== escluso && e.stato !== 'passato' && e.dataInizio >= oggi && e.iscrizioniAperte; })
    .sort(function (a, b) { return a.dataInizio < b.dataInizio ? -1 : 1; });
  return lista[0] || null;
}

/* ====================================================================== */
/* Date, calendario, utilità                                               */
/* ====================================================================== */

function giorno(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function numero(n) { n = Number(n) || 0; return n >= 0 && n <= 10 ? PAROLE[n] : String(n); }
function maiuscola(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

function dataEstesa(ev) {
  if (!ev.dataInizio) return 'data da confermare';
  var a = giorno(ev.dataInizio);
  if (ev.soloMese) return MESI[a.getMonth()] + ' ' + a.getFullYear();
  if (!ev.dataFine || ev.dataFine === ev.dataInizio) return GIORNI[a.getDay()] + ' ' + a.getDate() + ' ' + MESI[a.getMonth()] + ' ' + a.getFullYear();
  var b = giorno(ev.dataFine);
  var stesso = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  var diff = Math.round((b - a) / 86400000);
  if (diff === 1 && stesso) return a.getDate() + ' e ' + b.getDate() + ' ' + MESI[b.getMonth()] + ' ' + b.getFullYear();
  if (stesso) return 'dal ' + a.getDate() + ' al ' + b.getDate() + ' ' + MESI[b.getMonth()] + ' ' + b.getFullYear();
  return 'dal ' + a.getDate() + ' ' + MESI[a.getMonth()] + ' al ' + b.getDate() + ' ' + MESI[b.getMonth()] + ' ' + b.getFullYear();
}

function orario(ev) {
  if (!ev.oraInizio) return ev.dataInizio ? 'orario da confermare' : '';
  return ev.oraFine ? 'dalle ' + ev.oraInizio + ' alle ' + ev.oraFine : 'ore ' + ev.oraInizio.replace(':00', '');
}

function mappa(ev) {
  if (ev.online || !ev.indirizzo) return '';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([ev.luogo, ev.indirizzo].filter(String).join(', '));
}

function ics(ev, codice) {
  function t(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\;'); }
  function c(iso) { return iso.replace(/-/g, ''); }
  function dopo(iso) { var d = giorno(iso); d.setDate(d.getDate() + 1); return Utilities.formatDate(d, FUSO, 'yyyyMMdd'); }
  var r = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EcoDigital//Eventi//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + ev.id + '-' + codice + '@eventi.ecodigital',
    'DTSTAMP:' + Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'")];
  if (ev.oraInizio && !ev.soloMese) {
    var fine = ev.oraFine || (('0' + Math.min(23, parseInt(ev.oraInizio, 10) + 2)).slice(-2) + ev.oraInizio.slice(2));
    r.push('DTSTART;TZID=Europe/Rome:' + c(ev.dataInizio) + 'T' + ev.oraInizio.replace(':', '') + '00');
    r.push('DTEND;TZID=Europe/Rome:' + c(ev.dataInizio) + 'T' + fine.replace(':', '') + '00');
  } else {
    r.push('DTSTART;VALUE=DATE:' + c(ev.dataInizio));
    r.push('DTEND;VALUE=DATE:' + dopo(ev.dataFine || ev.dataInizio));
  }
  r.push('SUMMARY:' + t(ev.titolo + ' · EcoDigital'));
  r.push('LOCATION:' + t(ev.online ? 'Online, il link arriva per email' : [ev.luogo, ev.indirizzo].filter(String).join(', ')));
  r.push('DESCRIPTION:' + t((ev.confermato ? '' : 'Data da confermare. ') + 'Codice di iscrizione: ' + codice));
  r.push('END:VEVENT', 'END:VCALENDAR');
  return r.join('\r\n') + '\r\n';
}

function base() {
  var u = proprieta().SITO_URL || '';
  return u && u.slice(-1) !== '/' ? u + '/' : u;
}
function contatto() { return proprieta().CONTATTO || 'info@ecodigital.it'; }
function nomeMittente() { return 'EcoDigital'; }

function autorizzato(chiave) {
  var vera = proprieta().CHIAVE_REGIA;
  var ok = !!vera && vera.length >= 8 && typeof chiave === 'string' && chiave === vera;
  if (!ok) Utilities.sleep(1200);
  return ok;
}
function negato() { return { ok: false, errore: 'Chiave regia non valida.' }; }

function pulisci(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 200); }

/* Un valore che inizia con = + - @ diventerebbe una formula nel foglio: lo neutralizziamo. */
function sicuro(v) { return typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v; }

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function casuale(n) {
  var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < n; i++) s += a.charAt(Math.floor(Math.random() * a.length));
  return s;
}
