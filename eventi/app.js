/* Funzioni comuni del sistema eventi EcoDigital.
 * Servono config.js ed eventi.js caricati prima di questo file. */
(function () {
  "use strict";

  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var MESI_BREVI = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var PAROLE = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove", "dieci"];

  var TIPI = {
    nazionale: "Incontro nazionale",
    locale: "Tappa locale",
    webinar: "Webinar",
    intergruppo: "Intergruppo"
  };

  var RUOLI = ["Cittadino", "Amministratore locale", "Impresa", "Startup", "Università", "Scuola", "Associazione", "Stampa"];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function giorno(iso) {
    var p = String(iso).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /* Numeri: in lettere fino a dieci, in cifre sopra. */
  function numero(n) {
    n = Number(n) || 0;
    return n >= 0 && n <= 10 ? PAROLE[n] : String(n);
  }

  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* «martedì 3 novembre 2026», «dal 3 al 6 novembre 2026», «11 e 12 dicembre 2026», «novembre 2026» */
  function dataEstesa(ev, conGiorno) {
    var a = giorno(ev.dataInizio);
    if (ev.soloMese) return MESI[a.getMonth()] + " " + a.getFullYear();
    if (!ev.dataFine || ev.dataFine === ev.dataInizio) {
      return (conGiorno === false ? "" : GIORNI[a.getDay()] + " ") + a.getDate() + " " + MESI[a.getMonth()] + " " + a.getFullYear();
    }
    var b = giorno(ev.dataFine);
    var diff = Math.round((b - a) / 86400000);
    var stessoMese = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (diff === 1 && stessoMese) return a.getDate() + " e " + b.getDate() + " " + MESI[b.getMonth()] + " " + b.getFullYear();
    if (stessoMese) return "dal " + a.getDate() + " al " + b.getDate() + " " + MESI[b.getMonth()] + " " + b.getFullYear();
    return "dal " + a.getDate() + " " + MESI[a.getMonth()] + " al " + b.getDate() + " " + MESI[b.getMonth()] + " " + b.getFullYear();
  }

  /* Chiave per ordinare: se si conosce solo il mese, l'evento va in fondo al mese. */
  function chiave(ev) { return ev.soloMese ? ev.dataInizio.slice(0, 8) + "32" : ev.dataInizio; }

  function dataBreve(ev) {
    var a = giorno(ev.dataInizio);
    if (ev.soloMese) return MESI_BREVI[a.getMonth()] + " " + a.getFullYear();
    return String(a.getDate()).padStart(2, "0") + "." + String(a.getMonth() + 1).padStart(2, "0") + "." + a.getFullYear();
  }

  /* Blocco data grande delle schede: { num, mese, nota } */
  function bloccoData(ev) {
    var a = giorno(ev.dataInizio);
    if (ev.soloMese) return { num: MESI_BREVI[a.getMonth()], mese: String(a.getFullYear()), nota: "giorno da fissare" };
    var nota = "";
    if (ev.dataFine && ev.dataFine !== ev.dataInizio) {
      var b = giorno(ev.dataFine);
      nota = "fino al " + b.getDate() + (b.getMonth() !== a.getMonth() ? " " + MESI_BREVI[b.getMonth()] : "");
    }
    return { num: String(a.getDate()), mese: MESI_BREVI[a.getMonth()] + " " + a.getFullYear(), nota: nota };
  }

  function orario(ev) {
    if (!ev.oraInizio) return ev.stato === "passato" ? "" : "orario da confermare";
    var s = "ore " + ev.oraInizio.replace(":00", "");
    if (ev.oraFine) s = "dalle " + ev.oraInizio + " alle " + ev.oraFine;
    return s;
  }

  function mappa(ev) {
    if (ev.online || !ev.indirizzo) return "";
    var q = [ev.luogo, ev.indirizzo].filter(Boolean).join(", ");
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  /* ---------- memoria locale (può mancare: navigazione privata, anteprime) ---------- */
  function leggi(chiave, sessione) {
    try {
      var v = (sessione ? sessionStorage : localStorage).getItem(chiave);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }
  function scrivi(chiave, valore, sessione) {
    try { (sessione ? sessionStorage : localStorage).setItem(chiave, JSON.stringify(valore)); } catch (e) {}
  }
  function togli(chiave, sessione) {
    try { (sessione ? sessionStorage : localStorage).removeItem(chiave); } catch (e) {}
  }

  /* ---------- backend ---------- */
  function collegato() { return typeof ENDPOINT === "string" && /^https:\/\//.test(ENDPOINT); }

  /* POST al Web App di Apps Script.
   * Il corpo è una stringa JSON SENZA header personalizzati: il browser la manda
   * come text/plain, che è una «richiesta semplice» e non fa partire il preflight
   * CORS (Apps Script non risponde alle OPTIONS). Non aggiungere Content-Type. */
  function api(azione, dati) {
    if (!collegato()) return Promise.reject({ simulato: true, messaggio: "Backend non collegato." });
    var corpo = Object.assign({ azione: azione }, dati || {});
    return fetch(ENDPOINT, { method: "POST", body: JSON.stringify(corpo), redirect: "follow" })
      .then(function (r) {
        if (!r.ok) throw { messaggio: "Il server ha risposto con un errore (" + r.status + "). Riprova tra un minuto." };
        return r.json();
      }, function () {
        throw { messaggio: "Non riusciamo a raggiungere il server. Controlla la connessione e riprova." };
      })
      .then(function (j) {
        if (!j || j.ok !== true) throw { messaggio: (j && j.errore) || "Qualcosa non è andato. Riprova tra un minuto." };
        return j;
      });
  }

  function apiGet(parametri) {
    if (!collegato()) return Promise.reject({ simulato: true });
    var q = Object.keys(parametri).map(function (k) { return k + "=" + encodeURIComponent(parametri[k]); }).join("&");
    return fetch(ENDPOINT + "?" + q).then(function (r) { return r.json(); });
  }

  /* Programma: da eventi.js oppure, se richiesto in config.js, dal foglio «Eventi». */
  function caricaEventi() {
    var locali = (typeof EVENTI !== "undefined" ? EVENTI : []).slice();
    if (typeof EVENTI_DAL_FOGLIO !== "undefined" && EVENTI_DAL_FOGLIO && collegato()) {
      return apiGet({ azione: "eventi" }).then(function (j) {
        return j && j.ok && j.eventi && j.eventi.length ? j.eventi : locali;
      }).catch(function () { return locali; });
    }
    return Promise.resolve(locali);
  }

  /* Posti occupati per evento, se il backend è collegato: { id: persone } */
  function caricaPosti() {
    if (!collegato()) return Promise.resolve({});
    return apiGet({ azione: "posti" }).then(function (j) { return (j && j.posti) || {}; }).catch(function () { return {}; });
  }

  function trova(eventi, id) {
    for (var i = 0; i < eventi.length; i++) if (eventi[i].id === id) return eventi[i];
    return null;
  }

  function parametro(nome) {
    try { return new URLSearchParams(location.search).get(nome) || ""; } catch (e) { return ""; }
  }

  /* Codice di prova quando il backend non è collegato */
  function codiceProva() {
    var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < 4; i++) s += a.charAt(Math.floor(Math.random() * a.length));
    return "ED-" + new Date().getFullYear() + "-" + s;
  }

  /* ---------- calendario (.ics) ---------- */
  function icsTesto(s) {
    return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");
  }
  function icsPiega(riga) {
    var out = [];
    while (riga.length > 74) { out.push(riga.slice(0, 74)); riga = " " + riga.slice(74); }
    out.push(riga);
    return out.join("\r\n");
  }
  function compatta(iso) { return iso.replace(/-/g, ""); }
  function giornoDopo(iso) {
    var d = giorno(iso); d.setDate(d.getDate() + 1);
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  }

  function ics(ev, codice) {
    var righe = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EcoDigital//Eventi//IT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT"];
    var ora = new Date();
    var stamp = ora.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    righe.push("UID:" + ev.id + (codice ? "-" + codice : "") + "@eventi.ecodigital");
    righe.push("DTSTAMP:" + stamp);
    if (ev.oraInizio && !ev.soloMese) {
      var t = ev.oraInizio.replace(":", "") + "00";
      var tf = (ev.oraFine || "").replace(":", "") + "00";
      if (!ev.oraFine) {
        var h = Math.min(23, parseInt(ev.oraInizio, 10) + 2);
        tf = String(h).padStart(2, "0") + ev.oraInizio.slice(3, 5) + "00";
      }
      righe.push("DTSTART;TZID=Europe/Rome:" + compatta(ev.dataInizio) + "T" + t);
      righe.push("DTEND;TZID=Europe/Rome:" + compatta(ev.dataInizio) + "T" + tf);
    } else {
      righe.push("DTSTART;VALUE=DATE:" + compatta(ev.dataInizio));
      righe.push("DTEND;VALUE=DATE:" + giornoDopo(ev.dataFine || ev.dataInizio));
    }
    righe.push("SUMMARY:" + icsTesto(ev.titolo + " · EcoDigital"));
    var luogo = ev.online ? "Online, il link arriva per email" : [ev.luogo, ev.indirizzo].filter(Boolean).join(", ");
    righe.push("LOCATION:" + icsTesto(luogo));
    var desc = (ev.sottotitolo || "") + "\n" + (ev.confermato ? "" : "Data da confermare: " + (ev.notaData || "") + "\n") + (codice ? "Codice di iscrizione: " + codice : "");
    righe.push("DESCRIPTION:" + icsTesto(desc.trim()));
    righe.push("END:VEVENT", "END:VCALENDAR");
    return righe.map(icsPiega).join("\r\n") + "\r\n";
  }

  function scaricaIcs(ev, codice) {
    var blob = new Blob([ics(ev, codice)], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ecodigital-" + ev.id + ".ics";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- CSV ---------- */
  function csv(righe, colonne) {
    function cella(v) {
      v = v == null ? "" : String(v);
      if (/^[=+\-@]/.test(v)) v = "'" + v;
      return /[";\n,]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }
    var out = [colonne.map(function (c) { return cella(c.titolo); }).join(";")];
    righe.forEach(function (r) { out.push(colonne.map(function (c) { return cella(r[c.chiave]); }).join(";")); });
    return "\ufeff" + out.join("\r\n");
  }

  /* ---------- logo: se il file del kit non c'è ancora, wordmark in testo ---------- */
  function sistemaLoghi() {
    Array.prototype.forEach.call(document.querySelectorAll("img.logo"), function (img) {
      function rimpiazza() {
        var s = document.createElement("span");
        s.className = "wordmark" + (img.classList.contains("logo--bianco") ? " wordmark--bianco" : "");
        s.setAttribute("role", "img");
        s.setAttribute("aria-label", "EcoDigital");
        s.innerHTML = "<span>ECODIGITAL</span><i class='wm-v'></i><i class='wm-r'></i>";
        img.replaceWith(s);
      }
      if (img.complete && img.naturalWidth === 0) rimpiazza();
      else img.addEventListener("error", rimpiazza);
    });
  }
  document.addEventListener("DOMContentLoaded", sistemaLoghi);

  window.ED = {
    TIPI: TIPI, RUOLI: RUOLI, MESI: MESI,
    esc: esc, giorno: giorno, numero: numero, cap: cap,
    chiave: chiave, dataEstesa: dataEstesa, dataBreve: dataBreve, bloccoData: bloccoData, orario: orario, mappa: mappa,
    leggi: leggi, scrivi: scrivi, togli: togli,
    collegato: collegato, api: api, apiGet: apiGet, caricaEventi: caricaEventi, caricaPosti: caricaPosti,
    trova: trova, parametro: parametro, codiceProva: codiceProva,
    ics: ics, scaricaIcs: scaricaIcs, csv: csv
  };
})();
