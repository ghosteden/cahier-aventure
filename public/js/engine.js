/* =========================================================
   ENGINE — affiche et corrige les exercices, un par un.
   Types : qcm, truefalse, calcul, fill, match, dictee.
   Appelle opts.onComplete({correct, total}) à la fin.
   ========================================================= */
window.CV = window.CV || {};

/* Petit utilitaire de création de DOM (utilisé partout). */
CV.h = function (tag, props) {
  const e = document.createElement(tag);
  const kids = Array.prototype.slice.call(arguments, 2);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
    else if (k.indexOf("on") === 0 && typeof v === "function") e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  kids.flat().forEach((c) => {
    if (c == null || c === false) return;
    e.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
  });
  return e;
};

CV.Engine = (function () {
  const h = CV.h;

  function norm(s) {
    return (s || "").toString().trim().toLowerCase()
      .normalize("NFC").replace(/\s+/g, " ").replace(/[.!?;:]+$/, "");
  }

  /* Pad d'écriture manuscrite réutilisable (texte ou nombres).
     onText(text) est appelé quand l'enfant convertit son écriture. */
  function handwritingPad(numeric, onText) {
    const wrap = h("div", { class: "hw-pad", style: { marginTop: "10px" } });
    const canvas = h("canvas", { class: "hw-canvas", style: { height: "150px" } });
    const tools = h("div", { class: "hw-tools" },
      h("button", { class: "btn good small", type: "button", onclick: () => convert() }, "✅ Convertir"),
      h("button", { class: "btn ghost small", type: "button", onclick: () => undo() }, "↩️"),
      h("button", { class: "btn ghost small", type: "button", onclick: () => clearC() }, "🧽 Effacer"));
    wrap.appendChild(canvas); wrap.appendChild(tools);

    let strokes = [], cur = null, drawing = false, cx = null;
    function init() {
      const dpr = window.devicePixelRatio || 1; const r = canvas.getBoundingClientRect();
      if (!r.width) return;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      cx = canvas.getContext("2d"); cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.lineWidth = 3; cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#1c1340"; redraw();
    }
    function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function redraw() { if (!cx) return; cx.clearRect(0, 0, canvas.width, canvas.height); strokes.forEach((s) => { cx.beginPath(); s.forEach((p, i) => i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y)); cx.stroke(); }); }
    function clearC() { strokes = []; redraw(); }
    function undo() { strokes.pop(); redraw(); }
    canvas.addEventListener("pointerdown", (e) => { if (!cx) init(); drawing = true; cur = []; strokes.push(cur); const p = pos(e); cur.push({ x: p.x, y: p.y, t: Date.now() }); try { canvas.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
    canvas.addEventListener("pointermove", (e) => { if (!drawing || !cx) return; const p = pos(e); const last = cur[cur.length - 1]; cur.push({ x: p.x, y: p.y, t: Date.now() }); cx.beginPath(); if (last) cx.moveTo(last.x, last.y); cx.lineTo(p.x, p.y); cx.stroke(); e.preventDefault(); });
    const endDraw = () => { drawing = false; };
    canvas.addEventListener("pointerup", endDraw); canvas.addEventListener("pointercancel", endDraw); canvas.addEventListener("pointerleave", endDraw);
    setTimeout(init, 60); window.addEventListener("resize", init);

    async function convert() {
      if (!strokes.length) { CV.UI.toast("Écris d'abord quelque chose ✍️"); return; }
      if (!navigator.createHandwritingRecognizer) { CV.UI.toast("La reconnaissance n'est pas dispo sur cet appareil — écris au clavier 🙂"); return; }
      try {
        const rec = await navigator.createHandwritingRecognizer({ languages: ["fr"] });
        const draw = rec.startDrawing({ languages: ["fr"] });
        strokes.forEach((s) => draw.addStroke({ points: s.map((p) => ({ x: p.x, y: p.y, t: p.t })) }));
        const pred = await draw.getPrediction();
        if (rec.finish) try { rec.finish(); } catch (_) {}
        let text = pred && pred.length ? (pred[0].text || "") : "";
        if (numeric) text = text.replace(/[^0-9,.\-]/g, "");
        if (text) { onText(text); clearC(); CV.UI.toast("Ajouté ✅"); }
        else CV.UI.toast("Je n'ai pas réussi à lire 😅 réessaie ou écris au clavier");
      } catch (e) { CV.UI.toast("Reconnaissance indisponible — écris au clavier 🙂"); }
    }
    return wrap;
  }

  function run(container, exercises, opts) {
    opts = opts || {};
    // 1) On "déplie" les dictées en une étape par phrase.
    const steps = [];
    exercises.forEach((ex) => {
      if (ex.type === "dictee") {
        (ex.sentences || []).forEach((s) => steps.push({ type: "dictee", sentence: s, q: ex.q }));
      } else {
        steps.push(ex);
      }
    });

    const results = [];
    let idx = 0;

    const dots = h("div", { class: "ex-progress" },
      steps.map(() => h("div", { class: "ex-dot" })));
    const body = h("div");
    container.innerHTML = "";
    if (!opts.compact) container.appendChild(dots);
    container.appendChild(body);

    function setDot(i, ok) {
      const d = dots.children[i];
      if (!d) return;
      d.classList.remove("cur");
      d.classList.add(ok ? "ok" : "ko");
    }
    function markCur(i) {
      Array.from(dots.children).forEach((d, j) => d.classList.toggle("cur", j === i && !d.classList.contains("ok") && !d.classList.contains("ko")));
    }

    function next(ok) {
      results.push(!!ok);
      setDot(idx, ok);
      idx++;
      if (idx >= steps.length) {
        const correct = results.filter(Boolean).length;
        opts.onComplete && opts.onComplete({ correct, total: steps.length });
      } else {
        render();
      }
    }

    function footerContinue() {
      // Après une erreur, le bouton ne sert qu'à accuser réception de la correction.
      const label = !body._lastOk ? "J'ai compris 👍"
        : (idx + 1 >= steps.length ? "Terminer ✅" : "Continuer →");
      return h("button", { class: "btn good block mt", onclick: () => next(body._lastOk) }, label);
    }

    function showFeedback(good, text) {
      body._lastOk = good;
      const fb = h("div", { class: "feedback show " + (good ? "ok" : "ko") },
        h("strong", {}, good ? "Bravo ! ✅  " : "Presque ! ❌  "),
        text || "");
      body.appendChild(fb);
      // Bonne réponse : on enchaîne tout seul, le clic de confirmation n'apprend rien.
      // Mauvaise réponse : on garde le bouton, pour laisser le temps de LIRE la correction.
      clearTimeout(body._nextT);
      if (good) body._nextT = setTimeout(() => next(true), 900);
      else body.appendChild(footerContinue());
    }

    function render() {
      markCur(idx);
      clearTimeout(body._nextT);   // coupe l'enchaînement auto en cours, sinon il sauterait une question
      body.innerHTML = "";
      body._lastOk = false;
      body._validated = false; // IMPORTANT : réarmer la validation à chaque nouvelle question
      const step = steps[idx];
      switch (step.type) {
        case "qcm":        return renderChoices(step, step.choices, step.answer);
        case "truefalse":  return renderChoices(step, ["Vrai", "Faux"], step.answer ? 0 : 1);
        case "calcul":     return renderInput(step, true);
        case "fill":       return renderInput(step, false);
        case "match":      return renderMatch(step);
        case "logic":      return renderLogic(step);
        case "place":      return renderPlace(step);
        case "dictee":     return renderDictee(step);
        default:           return next(true);
      }
    }

    /* ---- QCM / Vrai-Faux ---- */
    function renderChoices(step, choices, answerIdx) {
      if (step._from) body.appendChild(h("div", { class: "pill" }, step._from));
      body.appendChild(h("div", { class: "question", html: step.q }));
      const wrap = h("div", { class: "choices" });
      choices.forEach((c, i) => {
        const btn = h("button", { class: "choice", onclick: () => {
          if (wrap._locked) return;
          wrap._locked = true;
          Array.from(wrap.children).forEach((b) => b.classList.add("disabled"));
          const good = i === answerIdx;
          btn.classList.add(good ? "correct" : "wrong");
          if (!good) wrap.children[answerIdx].classList.add("correct");
          showFeedback(good, step.explain);
        } }, c);
        wrap.appendChild(btn);
      });
      body.appendChild(wrap);
    }

    /* ---- Calcul (nombre) / Texte à trous ---- */
    function renderInput(step, numeric) {
      if (step._from) body.appendChild(h("div", { class: "pill" }, step._from));
      body.appendChild(h("div", { class: "question", html: step.q }));
      const input = h("input", {
        class: "text-input", type: numeric ? "text" : "text",
        inputmode: numeric ? "numeric" : "text",
        autocomplete: "off", autocorrect: "off", spellcheck: "false",
        placeholder: numeric ? "Ta réponse (nombre)" : "Écris ta réponse"
      });
      body.appendChild(input);

      const validate = () => {
        if (body._validated) return;
        const val = input.value;
        let good;
        if (numeric) {
          good = parseFloat(String(val).replace(",", ".")) === Number(step.answer);
        } else {
          const accepted = (Array.isArray(step.answer) ? step.answer : [step.answer]).map(norm);
          good = accepted.includes(norm(val));
        }
        body._validated = true;
        input.disabled = true;
        btn.style.display = "none";        // la réponse est jouée : « Valider » n'a plus de sens
        input.style.borderColor = good ? "var(--good)" : "var(--bad)";
        const corr = Array.isArray(step.answer) ? step.answer[0] : step.answer;
        showFeedback(good, (step.explain || "") + (good ? "" : "  → Réponse : " + corr));
      };
      const btn = h("button", { class: "btn block mt", onclick: validate }, "Valider");
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") validate(); });
      body.appendChild(btn);
      setTimeout(() => input.focus(), 50);
    }

    /* ---- Associations (paires) ---- */
    function renderMatch(step) {
      if (step._from) body.appendChild(h("div", { class: "pill" }, step._from));
      body.appendChild(h("div", { class: "question", html: step.q }));
      const left = step.pairs.map((p) => p[0]);
      const right = shuffle(step.pairs.map((p) => p[1]));
      const map = {}; step.pairs.forEach((p) => (map[p[0]] = p[1]));

      let sel = null, linked = 0, mistakes = 0;
      const cols = h("div", { class: "match-cols" });
      const colL = h("div", { class: "match-col" });
      const colR = h("div", { class: "match-col" });
      cols.appendChild(colL); cols.appendChild(colR);

      left.forEach((t) => colL.appendChild(h("div", { class: "match-item", "data-l": t,
        onclick: function () { if (this.classList.contains("linked")) return; clearSel(); sel = this; this.classList.add("sel"); } }, t)));

      right.forEach((t) => colR.appendChild(h("div", { class: "match-item", "data-r": t,
        onclick: function () {
          if (!sel || this.classList.contains("linked")) return;
          const want = map[sel.getAttribute("data-l")];
          if (want === t) {
            sel.classList.remove("sel"); sel.classList.add("linked"); this.classList.add("linked");
            linked++; sel = null;
            if (linked === left.length) finish();
          } else {
            mistakes++;
            const me = this; me.classList.add("linked-ko");
            setTimeout(() => me.classList.remove("linked-ko"), 500);
          }
        } }, t)));

      function clearSel() { Array.from(colL.children).forEach((c) => c.classList.remove("sel")); }
      function finish() { showFeedback(mistakes === 0, step.explain + (mistakes ? "" : "  Tout bon du premier coup !")); }

      body.appendChild(cols);
    }

    /* ---- Jeu de logique : lire la consigne, ranger les briques en drag-and-drop ---- */
    function renderLogic(step) {
      if (step._from) body.appendChild(h("div", { class: "pill" }, step._from));
      body.appendChild(h("div", { class: "question" }, step.q || "Range dans le bon ordre."));
      if (step.instruction) body.appendChild(h("div", { class: "logic-instr", html: "📋 " + step.instruction }));

      const tokById = (id) => step.tokens.find((t) => t.id === id);
      const ids = step.tokens.map((t) => t.id);
      // ordre de départ mélangé (différent de la solution si possible)
      let order = shuffle(ids);
      for (let tryc = 0; tryc < 8; tryc++) {
        const keys = order.map((id) => String(tokById(id).key));
        if (!keys.every((k, i) => k === String(step.solutionKeys[i]))) break;
        order = shuffle(ids);
      }

      const slotsWrap = h("div", { class: "logic-slots" });
      let dragging = null, clone = null, fromIdx = null;

      function tokenEl(t) {
        const el = h("div", { class: "logic-tok" + (t.w ? " brick" : "") });
        if (t.w) { el.style.width = t.w + "px"; if (t.color) el.style.background = t.color; }
        if (t.label) el.appendChild(h("span", {}, t.label));
        return el;
      }
      function moveClone(e) { if (!clone) return; clone.style.left = (e.clientX - clone.offsetWidth / 2) + "px"; clone.style.top = (e.clientY - clone.offsetHeight / 2) + "px"; }
      function cleanup() { if (clone) { clone.remove(); clone = null; } if (dragging) dragging.style.opacity = ""; dragging = null; fromIdx = null; }
      function drop(e) {
        // Dépôt tolérant : on prend la case la PLUS PROCHE du doigt.
        let best = null, bd = 1e9;
        Array.from(slotsWrap.children).forEach((slot) => {
          const r = slot.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
          if (d < bd) { bd = d; best = slot; }
        });
        if (best && bd < 170) { const toIdx = +best.getAttribute("data-idx"); if (toIdx !== fromIdx && !isNaN(toIdx)) { const t = order[fromIdx]; order[fromIdx] = order[toIdx]; order[toIdx] = t; } }
        cleanup(); renderSlots();
      }
      function attachDrag(te, idx) {
        te.addEventListener("pointerdown", (e) => {
          if (body._validated) return;
          dragging = te; fromIdx = idx;
          const r = te.getBoundingClientRect();
          clone = te.cloneNode(true); clone.classList.add("logic-drag");
          clone.style.width = r.width + "px"; clone.style.height = r.height + "px";
          document.body.appendChild(clone);
          te.style.opacity = ".25"; moveClone(e);
          try { te.setPointerCapture(e.pointerId); } catch (_) {}
          e.preventDefault();
        });
        te.addEventListener("pointermove", (e) => { if (dragging === te) moveClone(e); });
        te.addEventListener("pointerup", (e) => { if (dragging === te) drop(e); });
        te.addEventListener("pointercancel", () => cleanup());
      }
      function renderSlots() {
        slotsWrap.innerHTML = "";
        order.forEach((id, idx) => {
          const slot = h("div", { class: "logic-slot", "data-idx": idx });
          const te = tokenEl(tokById(id));
          attachDrag(te, idx);
          slot.appendChild(te);
          slotsWrap.appendChild(slot);
        });
      }
      renderSlots();
      body.appendChild(slotsWrap);
      body.appendChild(h("div", { class: "muted center", style: { fontSize: "13px", marginTop: "6px" } }, "↔️ Fais glisser les briques pour les échanger."));

      const validate = () => {
        if (body._validated) return; body._validated = true;
        const keys = order.map((id) => String(tokById(id).key));
        const good = keys.every((k, i) => k === String(step.solutionKeys[i]));
        Array.from(slotsWrap.children).forEach((slot, i) => slot.classList.add(keys[i] === String(step.solutionKeys[i]) ? "ok" : "ko"));
        showFeedback(good, step.explain || (good ? "" : "Regarde bien l'ordre demandé."));
      };
      body.appendChild(h("button", { class: "btn block mt", onclick: validate }, "Valider"));
    }

    /* ---- Placement : glisser des étiquettes vers des cases (suite / tableau double entrée) ---- */
    function renderPlace(step) {
      if (step._from) body.appendChild(h("div", { class: "pill" }, step._from));
      body.appendChild(h("div", { class: "question" }, step.q || "Place au bon endroit."));
      if (step.instruction) body.appendChild(h("div", { class: "logic-instr", html: "📋 " + step.instruction }));

      const pieceById = (id) => step.pieces.find((p) => p.id === id);
      const placed = {}; step.zones.forEach((z) => (placed[z.id] = null));
      let tray = step.pieces.map((p) => p.id);

      const boardHost = h("div");
      const trayEl = h("div", { class: "place-tray" });
      body.appendChild(boardHost);
      body.appendChild(h("div", { class: "muted center", style: { fontSize: "13px", margin: "6px 0" } }, "⬇️ Fais glisser les étiquettes dans les bonnes cases."));
      body.appendChild(trayEl);

      let dragPid = null, clone = null;
      function glyphSpan(g, color, size) { const s = h("span", {}, g); s.style.fontSize = (size || 24) + "px"; if (color) s.style.color = color; return s; }
      function makePiece(pid) {
        const p = pieceById(pid);
        const el = h("div", { class: "place-piece", "data-pid": pid });
        if (p.glyph) el.appendChild(glyphSpan(p.glyph, p.color, 26));
        else { if (p.color) { el.classList.add("brick"); el.style.background = p.color; } el.appendChild(h("span", {}, p.label || "")); }
        attachDrag(el, pid);
        return el;
      }
      function moveClone(e) { if (!clone) return; clone.style.left = (e.clientX - clone.offsetWidth / 2) + "px"; clone.style.top = (e.clientY - clone.offsetHeight / 2) + "px"; }
      function cleanup() { if (clone) { clone.remove(); clone = null; } dragPid = null; }
      function detach(pid) { tray = tray.filter((x) => x !== pid); for (const z in placed) if (placed[z] === pid) placed[z] = null; }
      function attachDrag(el, pid) {
        el.addEventListener("pointerdown", (e) => {
          if (body._validated) return;
          dragPid = pid;
          const r = el.getBoundingClientRect();
          clone = el.cloneNode(true); clone.classList.add("place-drag");
          clone.style.width = r.width + "px"; clone.style.height = r.height + "px";
          document.body.appendChild(clone); el.style.opacity = ".25"; moveClone(e);
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
          e.preventDefault();
        });
        el.addEventListener("pointermove", (e) => { if (dragPid === pid) moveClone(e); });
        el.addEventListener("pointerup", (e) => { if (dragPid === pid) drop(e); });
        el.addEventListener("pointercancel", () => { cleanup(); render(); });
      }
      function drop(e) {
        const pid = dragPid;
        // Dépôt tolérant : la case la plus proche du doigt (sinon retour au bac).
        let best = null, bd = 1e9;
        boardHost.querySelectorAll(".place-zone[data-zid]").forEach((z) => {   // que les vraies zones (pas les cases fixes/vides)
          const r = z.getBoundingClientRect();
          const d = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY);
          if (d < bd) { bd = d; best = z; }
        });
        if (best && bd < 150) { const zid = best.getAttribute("data-zid"); detach(pid); if (placed[zid]) tray.push(placed[zid]); placed[zid] = pid; }
        else { detach(pid); if (tray.indexOf(pid) < 0) tray.push(pid); }
        cleanup(); render();
      }
      function zoneCell(z) {
        const el = h("div", { class: "place-zone", "data-zid": z.id });
        if (placed[z.id]) el.appendChild(makePiece(placed[z.id]));
        else if (z.label) el.appendChild(h("span", { class: "muted" }, z.label));
        return el;
      }
      function hdr(c) {
        if (c.glyph) return glyphSpan(c.glyph, c.color, 22);
        if (c.color && !c.label) { const sw = h("div", { class: "pg-swatch" }); sw.style.background = c.color; return sw; }
        return h("span", {}, c.label || "");
      }
      function renderSequence() {
        const row = h("div", { class: "place-seq" });
        step.sequence.forEach((item) => {
          if (item.zoneId) row.appendChild(zoneCell(step.zones.find((z) => z.id === item.zoneId)));
          else row.appendChild(h("div", { class: "place-fixed" }, item.glyph ? glyphSpan(item.glyph, item.color, 26) : (item.label || "")));
        });
        return row;
      }
      function renderGrid() {
        const g = step.grid;
        const fixedAt = (ri, ci) => (g.fixed || []).find((f) => f.row === ri && f.col === ci);
        const tbl = h("div", { class: "place-grid" });
        const head = h("div", { class: "pg-row" });
        if (g.rowHeaders) head.appendChild(h("div", { class: "pg-corner" }));
        (g.colHeaders || []).forEach((c) => head.appendChild(h("div", { class: "pg-head" }, hdr(c))));
        if (g.colHeaders) tbl.appendChild(head);
        const nRows = g.rowHeaders ? g.rowHeaders.length : g.rows;
        for (let ri = 0; ri < nRows; ri++) {
          const row = h("div", { class: "pg-row" });
          if (g.rowHeaders) row.appendChild(h("div", { class: "pg-head" }, hdr(g.rowHeaders[ri])));
          const nCols = g.colHeaders ? g.colHeaders.length : g.cols;
          for (let ci = 0; ci < nCols; ci++) {
            const zone = step.zones.find((z) => z.row === ri && z.col === ci);
            const fx = fixedAt(ri, ci);
            if (zone) {
              const cell = zoneCell(zone);
              if (g.axisCol != null && ci === g.axisCol) cell.classList.add("pg-axis");
              row.appendChild(cell);
            } else if (fx) {                              // case modèle, non déplaçable (symétrie)
              const cell = h("div", { class: "place-zone fixed" }, hdr(fx));
              if (g.axisCol != null && ci === g.axisCol) cell.classList.add("pg-axis");
              row.appendChild(cell);
            } else {
              row.appendChild(h("div", { class: "place-zone empty" }));  // case vide décorative
            }
          }
          tbl.appendChild(row);
        }
        return tbl;
      }
      function render() {
        boardHost.innerHTML = "";
        boardHost.appendChild(step.layout === "grid" ? renderGrid() : renderSequence());
        trayEl.innerHTML = "";
        tray.forEach((pid) => trayEl.appendChild(makePiece(pid)));
      }
      render();

      const validate = () => {
        if (body._validated) return;
        if (!step.zones.every((z) => placed[z.id])) { CV.UI.toast("Place toutes les étiquettes d'abord 🙂"); return; }
        body._validated = true;
        let good = true;
        step.zones.forEach((z) => {
          const ok = String(pieceById(placed[z.id]).key) === String(z.expect);
          if (!ok) good = false;
          const el = boardHost.querySelector('.place-zone[data-zid="' + z.id + '"]');
          if (el) el.classList.add(ok ? "ok" : "ko");
        });
        showFeedback(good, step.explain || (good ? "" : "Regarde bien la consigne."));
      };
      body.appendChild(h("button", { class: "btn block mt", onclick: validate }, "Valider"));
    }

    /* ---- Dictée (une phrase) : lecture vocale + clavier + écriture au stylet ---- */
    function renderDictee(step) {
      body.appendChild(h("div", { class: "question" }, "🎧 " + (step.q || "Écris la phrase que tu entends.")));
      if (!CV.Dictee.supported()) {
        body.appendChild(h("div", { class: "feedback show ko" },
          "La lecture vocale n'est pas disponible sur ce navigateur. Voici la phrase à recopier : « " + step.sentence + " »"));
      }

      // Boutons audio
      body.appendChild(h("div", { class: "dictee-controls" },
        h("button", { class: "btn", onclick: () => CV.Dictee.speak(step.sentence, 0.85) }, "🔊 Écouter"),
        h("button", { class: "btn ghost small", onclick: () => CV.Dictee.speak(step.sentence, 0.6) }, "🐢 Plus lentement"),
        h("button", { class: "btn ghost small", onclick: () => CV.Dictee.stop() }, "⏹️ Stop")
      ));

      const ta = h("textarea", { class: "text-input dictee", rows: "2",
        placeholder: "Écris la phrase au clavier…", autocapitalize: "sentences", spellcheck: "false" });
      body.appendChild(ta);

      // --- Correction ---
      const validate = () => {
        if (body._validated) return;
        const res = CV.Dictee.correct(step.sentence, ta.value);
        body._validated = true; ta.disabled = true;
        const good = res.correct === res.total;
        const passable = res.correct / res.total >= 0.7;
        const corr = h("div", { class: "dictee-correction" });
        res.tokens.forEach((tk) => {
          if (tk.ok) corr.appendChild(h("span", { class: "w-ok" }, tk.expected + " "));
          else {
            corr.appendChild(h("span", { class: "w-ko" }, (tk.typed || "·") + " "));
            corr.appendChild(h("span", { class: "w-fix" }, tk.expected));
            corr.appendChild(document.createTextNode(" "));
          }
        });
        body.appendChild(h("div", { class: "feedback show " + (passable ? "ok" : "ko") },
          h("strong", {}, good ? "Parfait, aucune faute ! 🌟  " : (res.correct + " / " + res.total + " mots justes.  ")),
          "Voici la correction :"));
        body.appendChild(corr);
        body._lastOk = passable;
        body.appendChild(footerContinue());
      };
      body.appendChild(h("button", { class: "btn block mt", onclick: validate }, "Corriger ✍️"));
    }

    function shuffle(a) {
      a = a.slice();
      // mélange déterministe simple basé sur l'index (pas de Math.random requis)
      for (let i = a.length - 1; i > 0; i--) {
        const j = (i * 7 + 3) % (i + 1);
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    render();
  }

  return { run };
})();
