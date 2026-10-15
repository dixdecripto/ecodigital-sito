/* Parte comune di checkin.html e admin.html: chiave regia, scelta dell'evento, elenco iscritti.
 * La chiave regia NON sta in nessun file: si scrive nella pagina e resta in sessionStorage
 * finché la scheda del browser è aperta. Il backend la confronta con la proprietà CHIAVE_REGIA. */
(function () {
  "use strict";
  var CHIAVE = "ed-chiave-regia";

  function chiave() { return ED.leggi(CHIAVE, true) || ""; }
  function salvaChiave(k) { ED.scrivi(CHIAVE, k, true); }
  function esci() { ED.togli(CHIAVE, true); location.reload(); }

  /* Iscritti finti per provare le pagine senza backend. */
  function esempio(eventoId) {
    var base = [
      { codice: "ED-2026-K7QM", nome: "Giulia", cognome: "Esempio", email: "giulia@esempio.it", ente: "Comune di Esempio", ruolo: "Amministratore locale", citta: "Napoli", accompagnatori: 1, notizie: true, stato: "attiva", presente: "" },
      { codice: "ED-2026-3HTP", nome: "Marco", cognome: "Prova", email: "marco@esempio.it", ente: "Startup di prova srl", ruolo: "Startup", citta: "Salerno", accompagnatori: 0, notizie: false, stato: "attiva", presente: "2026-10-01T09:12:00Z" },
      { codice: "ED-2026-W2NA", nome: "Sara", cognome: "Fittizia", email: "sara@esempio.it", ente: "Università di Esempio", ruolo: "Università", citta: "Roma", accompagnatori: 2, notizie: true, stato: "attiva", presente: "" },
      { codice: "ED-2026-9RBE", nome: "Luca", cognome: "Demo", email: "luca@esempio.it", ente: "", ruolo: "Cittadino", citta: "Caserta", accompagnatori: 0, notizie: true, stato: "annullata", presente: "" },
      { codice: "ED-2026-FX4D", nome: "Anna", cognome: "Campione", email: "anna@esempio.it", ente: "Testata di esempio", ruolo: "Stampa", citta: "Napoli", accompagnatori: 0, notizie: false, stato: "attiva", presente: "" }
    ];
    var locali = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("ed-iscrizione-") === 0) {
          var r = JSON.parse(localStorage.getItem(k));
          if (r && r.evento === eventoId) locali.push({ codice: r.codice, nome: r.nome, cognome: r.cognome, email: r.email, ente: "", ruolo: r.ruolo || "", citta: "", accompagnatori: r.accompagnatori || 0, notizie: false, stato: "attiva", presente: "" });
        }
      }
    } catch (e) {}
    return locali.concat(base).map(function (r) { r.evento = eventoId; r.prova = true; r.timestamp = r.timestamp || "2026-10-01T08:00:00Z"; return r; });
  }

  var memoriaProva = {};
  function elenco(eventoId) {
    if (!ED.collegato()) {
      if (!memoriaProva[eventoId]) memoriaProva[eventoId] = esempio(eventoId);
      return Promise.resolve({ ok: true, iscritti: memoriaProva[eventoId], simulato: true });
    }
    return ED.api("elenco", { chiave: chiave(), evento: eventoId });
  }

  function azione(nome, dati) {
    if (!ED.collegato()) return new Promise(function (ok) { setTimeout(function () { ok({ ok: true, simulato: true }); }, 400); });
    return ED.api(nome, Object.assign({ chiave: chiave() }, dati));
  }

  /* Persone attese: iscritto più accompagnatori, solo iscrizioni attive. */
  function conteggi(iscritti) {
    var c = { iscrizioni: 0, persone: 0, presenti: 0, personePresenti: 0, annullate: 0, notizie: 0 };
    iscritti.forEach(function (r) {
      if (r.stato === "annullata") { c.annullate++; return; }
      var p = 1 + (Number(r.accompagnatori) || 0);
      c.iscrizioni++; c.persone += p;
      if (r.notizie === true || r.notizie === "sì" || r.notizie === "TRUE") c.notizie++;
      if (r.presente) { c.presenti++; c.personePresenti += p; }
    });
    return c;
  }

  function normalizza(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* Riempie la select degli eventi: prima i prossimi, poi i passati. */
  function scegliEvento(select, eventi) {
    var prossimi = eventi.filter(function (e) { return e.stato !== "passato"; }).sort(function (a, b) { return ED.chiave(a) < ED.chiave(b) ? -1 : 1; });
    var passati = eventi.filter(function (e) { return e.stato === "passato"; }).sort(function (a, b) { return ED.chiave(a) > ED.chiave(b) ? -1 : 1; });
    function gruppo(nome, lista) {
      var g = document.createElement("optgroup"); g.label = nome;
      lista.forEach(function (e) { var o = document.createElement("option"); o.value = e.id; o.textContent = ED.dataBreve(e) + " · " + e.citta + " · " + e.titolo; g.appendChild(o); });
      select.appendChild(g);
    }
    gruppo("In programma", prossimi);
    gruppo("Passati", passati);
    var scelto = ED.parametro("evento") || ED.leggi("ed-regia-evento", true);
    if (scelto && ED.trova(eventi, scelto)) select.value = scelto;
    select.addEventListener("change", function () { ED.scrivi("ed-regia-evento", select.value, true); });
  }

  /* Schermata della chiave: chiama avvia() quando la chiave c'è. */
  function porta(contenitore, avvia) {
    if (!ED.collegato()) {
      var slot = document.getElementById("avviso-regia") || contenitore;
      slot.insertAdjacentHTML("afterbegin", '<div class="avviso" style="margin-top:20px"><strong>Backend non collegato</strong>Vedi dati di prova (nomi finti, segnati «prova»). Le azioni vengono simulate e non parte nessuna email.</div>');
      return avvia();
    }
    if (chiave()) return avvia();
    contenitore.innerHTML = '<div class="riquadro" style="max-width:460px;margin:40px auto">' +
      '<h2 class="display">Chiave regia</h2><p class="sotto">La trovi nella chat con Dix. Resta salvata solo in questa scheda del browser.</p>' +
      '<form id="f-chiave"><div class="campo"><label for="chiave">Chiave</label><input type="password" id="chiave" autocomplete="off" required></div>' +
      '<button class="btn btn--pieno" type="submit">Entra</button></form></div>';
    document.getElementById("f-chiave").addEventListener("submit", function (e) {
      e.preventDefault();
      var k = document.getElementById("chiave").value.trim();
      if (!k) return;
      salvaChiave(k);
      location.reload();
    });
  }

  /* Se il backend dice che la chiave è sbagliata, la togliamo e si riparte. */
  function erroreChiave(err) {
    var m = (err && err.messaggio) || "";
    if (/chiave/i.test(m)) { ED.togli(CHIAVE, true); }
    return m;
  }

  window.REGIA = { chiave: chiave, esci: esci, elenco: elenco, azione: azione, conteggi: conteggi, normalizza: normalizza, scegliEvento: scegliEvento, porta: porta, erroreChiave: erroreChiave };
})();
