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
      return h("button", { class: "btn good block mt", onclick: () => {
        const ok = body._lastOk;
        next(ok);
      } }, idx + 1 >= steps.length ? "Terminer ✅" : "Continuer →");
    }

    function showFeedback(good, text) {
      body._lastOk = good;
      const fb = h("div", { class: "feedback show " + (good ? "ok" : "ko") },
        h("strong", {}, good ? "Bravo ! ✅  " : "Presque ! ❌  "),
        text || "");
      body.appendChild(fb);
      body.appendChild(footerContinue());
    }

    function render() {
      markCur(idx);
      body.innerHTML = "";
      body._lastOk = false;
      const step = steps[idx];
      switch (step.type) {
        case "qcm":        return renderChoices(step, step.choices, step.answer);
        case "truefalse":  return renderChoices(step, ["Vrai", "Faux"], step.answer ? 0 : 1);
        case "calcul":     return renderInput(step, true);
        case "fill":       return renderInput(step, false);
        case "match":      return renderMatch(step);
        case "logic":      return renderLogic(step);
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

      // Saisie tactile (écriture au stylet/doigt), repliée par défaut.
      const padHost = h("div");
      let padOpen = false;
      const toggle = h("button", { class: "btn ghost small mt", type: "button", onclick: () => {
        if (body._validated) return;
        padOpen = !padOpen;
        padHost.innerHTML = "";
        if (padOpen) {
          padHost.appendChild(handwritingPad(numeric, (t) => {
            input.value = numeric ? t : ((input.value ? input.value.replace(/\s+$/, "") + " " : "") + t);
          }));
          toggle.textContent = "⌨️ Cacher l'écriture";
        } else {
          toggle.textContent = "✍️ Écrire à la main";
        }
      } }, "✍️ Écrire à la main");
      body.appendChild(toggle);
      body.appendChild(padHost);

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
        toggle.disabled = true;
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
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const slot = target && target.closest ? target.closest(".logic-slot") : null;
        if (slot) { const toIdx = +slot.getAttribute("data-idx"); if (toIdx !== fromIdx && !isNaN(toIdx)) { const t = order[fromIdx]; order[fromIdx] = order[toIdx]; order[toIdx] = t; } }
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

    /* ---- Dictée (une phrase) : lecture vocale + clavier + écriture au stylet ---- */
    function renderDictee(step) {
      body.appendChild(h("div", { class: "question" }, "🎧 " + (step.q || "Écris la phrase que tu entends.")));
      body.appendChild(h("div", { class: "rotate-hint muted center" },
        "📱 Astuce : tourne ton téléphone en paysage pour écrire plus à l'aise."));
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

      // Zone texte (clavier) — toujours modifiable
      const ta = h("textarea", { class: "text-input dictee", rows: "2",
        placeholder: "Ta phrase (clavier, ou via l'écriture au stylet)…",
        autocapitalize: "sentences", spellcheck: "false" });

      // Zone d'écriture au stylet (canvas)
      const canvas = h("canvas", { class: "hw-canvas" });
      const hwSupported = !!navigator.createHandwritingRecognizer;
      const convertBtn = h("button", { class: "btn good small", onclick: () => convert() },
        hwSupported ? "✅ Convertir en lettres" : "✅ Convertir (clavier requis)");
      const hwTools = h("div", { class: "hw-tools" },
        convertBtn,
        h("button", { class: "btn ghost small", onclick: () => undo() }, "↩️ Annuler"),
        h("button", { class: "btn ghost small", onclick: () => clearCanvas() }, "🧽 Effacer"));

      const grid = h("div", { class: "dictee-screen" },
        h("div", {}, h("div", { class: "dictee-pane-label" }, "📝 Ta phrase"), ta),
        h("div", {}, h("div", { class: "dictee-pane-label" }, "✍️ Écris au stylet (ou au doigt)"), canvas, hwTools)
      );
      body.appendChild(grid);

      // --- Logique du canvas ---
      let strokes = [];   // chaque trait = liste de {x,y,t}
      let cur = null, drawing = false, cx = null;

      function initCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width) return;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        cx = canvas.getContext("2d");
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx.lineWidth = 3; cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#1c1340";
        redraw();
      }
      function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      function redraw() {
        if (!cx) return;
        cx.clearRect(0, 0, canvas.width, canvas.height);
        strokes.forEach((s) => {
          cx.beginPath();
          s.forEach((p, i) => { if (i === 0) cx.moveTo(p.x, p.y); else cx.lineTo(p.x, p.y); });
          cx.stroke();
        });
      }
      function clearCanvas() { strokes = []; redraw(); }
      function undo() { strokes.pop(); redraw(); }

      canvas.addEventListener("pointerdown", (e) => {
        if (!cx) initCanvas();
        drawing = true; cur = []; strokes.push(cur);
        const p = pos(e); cur.push({ x: p.x, y: p.y, t: Date.now() });
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        e.preventDefault();
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!drawing || !cx) return;
        const p = pos(e); const last = cur[cur.length - 1];
        cur.push({ x: p.x, y: p.y, t: Date.now() });
        cx.beginPath(); if (last) cx.moveTo(last.x, last.y); cx.lineTo(p.x, p.y); cx.stroke();
        e.preventDefault();
      });
      const endDraw = () => { drawing = false; };
      canvas.addEventListener("pointerup", endDraw);
      canvas.addEventListener("pointercancel", endDraw);
      canvas.addEventListener("pointerleave", endDraw);
      window.addEventListener("resize", initCanvas);
      setTimeout(initCanvas, 60);

      // Reconnaissance d'écriture (API navigateur, si disponible)
      async function convert() {
        if (!strokes.length) { CV.UI.toast("Écris d'abord quelque chose ✍️"); return; }
        if (!navigator.createHandwritingRecognizer) {
          CV.UI.toast("La reconnaissance d'écriture n'est pas dispo sur cet appareil — écris au clavier 🙂");
          return;
        }
        try {
          const rec = await navigator.createHandwritingRecognizer({ languages: ["fr"] });
          const draw = rec.startDrawing({ languages: ["fr"] });
          strokes.forEach((s) => draw.addStroke({ points: s.map((p) => ({ x: p.x, y: p.y, t: p.t })) }));
          const pred = await draw.getPrediction();
          if (rec.finish) try { rec.finish(); } catch (_) {}
          const text = pred && pred.length ? (pred[0].text || "") : "";
          if (text) {
            ta.value = (ta.value ? ta.value.replace(/\s+$/, "") + " " : "") + text;
            clearCanvas();
            CV.UI.toast("Ajouté ✅ (tu peux corriger au clavier)");
          } else {
            CV.UI.toast("Je n'ai pas réussi à lire 😅 réessaie ou écris au clavier");
          }
        } catch (err) {
          CV.UI.toast("Reconnaissance indisponible — écris au clavier 🙂");
        }
      }

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
