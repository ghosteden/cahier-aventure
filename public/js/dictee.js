/* =========================================================
   DICTÉE — lecture vocale (Web Speech API) + correction.
   Le navigateur lit la phrase en français ; l'enfant écrit ;
   on compare mot à mot et on surligne les erreurs.
   ========================================================= */
window.CV = window.CV || {};

CV.Dictee = (function () {
  const synth = window.speechSynthesis || null;
  let voice = null;

  function supported() { return !!synth; }

  function pickVoice() {
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    // On cherche une voix française
    voice = voices.find((v) => /fr(-FR)?/i.test(v.lang) && /female|femme|amelie|virginie|google/i.test(v.name))
         || voices.find((v) => /^fr/i.test(v.lang))
         || voices[0] || null;
    return voice;
  }

  // Les voix se chargent parfois de façon asynchrone
  if (synth) {
    pickVoice();
    synth.onvoiceschanged = pickVoice;
  }

  function speak(text, rate) {
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    u.rate = rate || 0.85;   // un peu lent pour les enfants
    u.pitch = 1.05;
    if (!voice) pickVoice();
    if (voice) u.voice = voice;
    synth.speak(u);
  }

  function stop() { if (synth) synth.cancel(); }

  /* Normalise un mot pour la comparaison souple (on garde les accents
     car ils comptent en dictée, mais on ignore la casse finale et la
     ponctuation collée). */
  function cleanWord(w) {
    return (w || "")
      .toString()
      .replace(/^[«»"'(]+|[.,;:!?»«"')]+$/g, "")
      .trim();
  }

  /* Compare la saisie de l'enfant à la phrase attendue.
     Renvoie un tableau de tokens : {expected, typed, ok}. */
  function correct(expected, typed) {
    const exp = expected.trim().split(/\s+/);
    const got = typed.trim().split(/\s+/).filter((x) => x.length);
    const out = [];
    let correctCount = 0;
    for (let i = 0; i < exp.length; i++) {
      const e = exp[i];
      const g = got[i] || "";
      const ok = cleanWord(e).toLowerCase() === cleanWord(g).toLowerCase()
              && cleanWord(e) === cleanWord(g); // accents + casse interne respectés
      // Tolérance : on accepte la casse de la 1re lettre si le reste est bon
      const okSoft = cleanWord(e).normalize("NFC") === cleanWord(g).normalize("NFC");
      const good = okSoft;
      if (good) correctCount++;
      out.push({ expected: e, typed: g, ok: good });
    }
    return { tokens: out, correct: correctCount, total: exp.length };
  }

  return { supported, speak, stop, correct };
})();
