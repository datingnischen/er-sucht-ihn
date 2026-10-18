import summaries from "../data/audio-summaries.json" with { type: "json" };

// Audio-Kurzfassungen (ElevenLabs, scripts/audio-summaries.mjs). Die Zuordnung Seitenpfad → MP3 liegt außerhalb
// des Import-Snapshots, damit ein neuer Import sie nicht verliert. MP3s liegen unter public/magazine/media und
// werden wie alle Medien über absolutizeAssetUrls/staticAsset vom Asset-Host geladen.

/** Kurzfassung zu einem Seitenpfad („/lexikon/…“, „/magazin/…“, ohne Slash am Ende) oder undefined. */
export function audioSummaryFor(path) {
  const key = path.replace(/\/+$/, "");
  return summaries[key];
}

/** „0:58“ – Dauer für die Beschriftung. */
export function audioDurationLabel(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Setzt den Audio-Block (gleiches Markup wie die importierten Beiträge mit Audio) an den Anfang des Artikels.
 * Beiträge, die schon ein Audio enthalten, bleiben unverändert.
 */
export function withAudioSummary(path, html) {
  const summary = audioSummaryFor(path);
  if (!summary || /<audio\b/i.test(html)) return html;
  return `<h2>Artikel kurz anhören</h2> <p>Die wichtigsten Punkte kurz und verständlich zusammengefasst (${audioDurationLabel(summary.seconds)} Min.).</p> <p><audio controls="" preload="none"><source src="${summary.src}" type="audio/mpeg"/>Dein Browser unterstützt das Audio-Element nicht.</audio></p> ${html}`;
}
