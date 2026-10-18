#!/usr/bin/env node
// Erzeugt Audio-Kurzfassungen (ElevenLabs) für Lexikon- und Magazinseiten und trägt sie in data/audio-summaries.json ein.
// Aufruf: node --env-file=../dich-mit-stich/.env.local scripts/audio-summaries.mjs [--force]
//
// Sprechtexte stehen in docs/audio-summaries/texte.json: { "<seitenpfad>": { "file": "<name>.mp3", "text": "…" } }.
// Vorhandene MP3s in public/magazine/media/ werden nicht neu erzeugt (spart Credits), außer mit --force.
// Die Zuordnung liegt bewusst außerhalb des Import-Snapshots (data/pages.json, data/magazine.json),
// damit ein neuer Import die Audios nicht verliert; eingebunden wird sie in lib/audio-summaries.mjs.
import fs from "node:fs";
import path from "node:path";

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "mDRP1h6KfUD1XAUJxqr0"; // Doreen – Clear and Dynamic
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v4"; // seit 2026-09-28 Standard (Christian)
const MEDIA_PATH = "/magazine/media/";
const BITRATE = 128000; // mp3_44100_128, konstante Bitrate → Dauer aus der Dateigröße

const force = process.argv.includes("--force");
const texts = JSON.parse(fs.readFileSync("docs/audio-summaries/texte.json", "utf8"));
const indexFile = path.join("data", "audio-summaries.json");
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, "utf8")) : {};

for (const [pagePath, { file, text }] of Object.entries(texts)) {
  const target = path.join("public", ...MEDIA_PATH.split("/").filter(Boolean), file);
  if (force || !fs.existsSync(target)) {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY fehlt (--env-file=../dich-mit-stich/.env.local)");
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: MODEL_ID, language_code: "de" }),
    });
    if (!response.ok) { console.log(pagePath, "– ElevenLabs", response.status, (await response.text()).slice(0, 200)); continue; }
    fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    console.log(pagePath, `– MP3 erzeugt (${MODEL_ID}):`, target);
  } else {
    console.log(pagePath, "– MP3 vorhanden:", target);
  }
  const seconds = Math.round((fs.statSync(target).size * 8) / BITRATE);
  index[pagePath] = { src: `${MEDIA_PATH}${file}`, seconds };
}

const sorted = Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(indexFile, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(Object.keys(sorted).length, "Einträge in", indexFile);
