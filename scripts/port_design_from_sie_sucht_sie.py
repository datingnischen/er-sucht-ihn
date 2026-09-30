"""Farbport Sunset (sie-sucht-sie) -> Dusk (er-sucht-ihn) für CSS/TSX-Dateien.

Das Designsystem von er-sucht-ihn ist ein Port des Sunset-Looks von sie-sucht-sie (Commit 83617cf dort).
Dieses Skript übersetzt Variablen (--plum -> --navy, --sunset -> --dusk …), das Venus-Paar-Maskenbild
und alle warmen Hex-/rgba-Farben in die Dusk-Palette. Damit lassen sich spätere Änderungen an den
Stylesheets von sie-sucht-sie erneut übernehmen:

    python scripts/port_design_from_sie_sucht_sie.py ../sie-sucht-sie/app/theme.css app/theme.css

Texte, Icons (Mars-Paar) und Komponentenlogik werden nicht übersetzt – nur Farben und Variablennamen.
"""
import re, sys, pathlib

VARS = [("var(--plum-deep)","var(--navy-deep)"),("var(--plum)","var(--navy)"),("var(--berry)","var(--ocean)"),
        ("var(--magenta)","var(--azure)"),("var(--coral)","var(--teal)"),("var(--peach)","var(--mint)"),("var(--sunset)","var(--dusk)"),
        ("--sc-venus-mask","--sc-mars-mask")]
RGBA = {  # (r,g,b) alt -> neu
 (214,51,122):(47,143,216), (59,18,64):(20,40,75), (34,10,39):(11,23,48), (255,148,102):(46,196,182), (255,138,92):(46,196,182),
 (142,75,198):(111,91,214), (122,79,201):(111,91,214), (163,23,95):(27,94,143), (244,88,122):(46,196,182), (10,0,14):(3,8,20),
 (20,0,25):(3,8,20), (255,154,192):(143,198,255), (255,170,190):(143,198,255), (255,227,212):(217,244,239), (246,90,112):(46,196,182),
 (236,82,107):(61,136,176), (107,31,99):(30,58,110), (20,4,24):(5,12,30), (255,201,220):(185,220,255), (255,179,204):(167,216,255), (255,180,143):(46,196,182), (255,208,222):(207,230,250), (255,143,180):(143,198,255), (255,248,245):(244,248,252), (201,51,80):(42,111,151), (241,221,227):(216,227,239), (255,255,255):(255,255,255),
}
HEX = {
 "#ffd0dc":"#cfe6fa","#efc7d3":"#bfd6ea","#3d2d40":"#2a3648","#fff4f1":"#eef5fc","#ffc2d1":"#a7d8ff","#f4e6ef":"#e6edf7","#d9c4d2":"#c3cfe0",
 "#ff9ac0":"#8fc6ff","#b9a1b3":"#93a3bd","#ffd9e4":"#d6ecff","#ffb48f":"#7fe7dc","#ff8fb4":"#8fc6ff","#d9b6ff":"#c9b8ff","#f1dcea":"#d9e6f5",
 "#e9d3e2":"#cbdaee","#fff7f5":"#f3f8fd","#d4541f":"#0e8f83","#d4622f":"#0e8f83","#f6e3ee":"#dfe9f6","#ffc2d6":"#a7d8ff","#fff1ea":"#eaf6fb",
 "#5a1b58":"#1e3a6e","#ecd6e5":"#d3e0f0","#ffb0c6":"#a7d8ff","#ffc9d8":"#b9dcff","#f2dfea":"#dbe7f4","#ffe6ef":"#e5f0fb","#f0e9ff":"#ece8ff",
 "#ffb3c6":"#a7d8ff","#4a3a4d":"#2f3a4f","#fbe9ee":"#e3eef7","#fffaf8":"#f7fbfe","#ffe3d4":"#dceefb","#efb3c3":"#9fc4e3","#d6337a":"#2f8fd8",
 "#7a4fc9":"#6f5bd6","#f65a70":"#2ec4b6","#c3345c":"#2a6f97","#ffe8ee":"#e3f0fa","#ffe6f1":"#e9ebfd","#ffeadf":"#dcf5f1","#8e4bc6":"#6f5bd6",
 "#f3eafc":"#efeaff","#a3175f":"#1b5e8f","#fbe6f0":"#e3eef7","#ec526b":"#3d88b0","#fff0f2":"#e8f3fa","#fff8f5":"#f4f8fc","#fdf0ee":"#eaf1f9",
 "#f1dde3":"#d8e3ef","#2b1a2f":"#101a2e","#6c5a6f":"#5a6478","#3b1240":"#14284b","#220a27":"#0b1730","#ff8a5c":"#2ec4b6","#b69cf2":"#a99cf0",
 "#f2ecff":"#efeaff","#c93350":"#2a6f97","#fff0f3":"#e8f3fa","#f5cbd3":"#bfd6ea","#f0a8b5":"#9fc4e3","#f0b9c4":"#9fc4e3","#efafba":"#9fc4e3",
 "#f0a8b6":"#9fc4e3","#ffdce6":"#d6ecff","#ff9466":"#2ec4b6","#f4587a":"#2f8fd8","#8e4bc6":"#7b4fd0","#fff5f7":"#f3f8fd","#f1dce1":"#d8e3ef",
 "#642c3a":"#14284b","#dcc6d6":"#c9d6e6","#efb4c6":"#b9d4ec","#fbe4f0":"#e3eef7","#fbe7f2":"#e3eef7","#ffd0de":"#cfe6fa","#ffe6f0":"#e8f3fa","#5b36a3":"#4f63e6","#a6919f":"#7b889c","#a8949f":"#7b889c","#b8471a":"#0e8f83","#fff0e8":"#e6f7f5","#f0c3d2":"#b9d4ec","#f6e3e9":"#e3eef7","#f6e7ec":"#e3eef7","#f7e3ea":"#e3eef7","#3b2b3f":"#2a3648","#9a8a9c":"#7b889c","#d9c8d3":"#c9d6e6","#e8c3b1":"#bfe6e1","#efafc2":"#b9d4ec","#efd3dc":"#dbe6f3","#f0d6df":"#dbe6f3","#f3dce9":"#dbe6f3","#f3dfe6":"#dbe6f3","#f3e1ec":"#dbe6f3","#f0b8c8":"#b9d4ec","#fbe9f6":"#e8f0f9","#fbeef6":"#e8f0f9","#fce7f1":"#e8f0f9","#ffe1ea":"#d6ecff","#ffe9dc":"#dcf5f1","#fff6f3":"#f7fbfe","#fffaf4":"#f7fbfe","#fffdfb":"#f7fbfe","#6b1f63":"#1e3a6e","#8a7690":"#6b7a94","#b0287a":"#2f8fd8","#d8572a":"#0e8f83","#d9c2d4":"#c3cfe0","#d9c8f6":"#cfd8f8","#e2c8db":"#cfdcec","#eed7e6":"#dbe6f3","#f0d3dc":"#d6e4f2","#f2d9e7":"#dce7f4","#f3bfd0":"#b9d4ec","#fdeeee":"#eef5fc","#ffb3cc":"#a7d8ff","#ffc9dc":"#b9dcff","#ffd0b8":"#b5ece6","#efd9e3":"#d8e3ef","#f9e4ec":"#e8f0f9","#fbe3ea":"#e3eef7","#e8d5e6":"#d4e0ee","#6b3143":"#14284b","#7a3047":"#1e3a6e","#35141f":"#0b1730","#26091a":"#0b1730",
}
VENUS_MASK = "%3Ccircle cx='8.6' cy='9' r='4.6'/%3E%3Ccircle cx='15.4' cy='9' r='4.6'/%3E%3Cpath d='M8.6 13.6v7M5.8 18h5.6M15.4 13.6v7M12.6 18h5.6'/%3E"
MARS_MASK = "%3Ccircle cx='8.2' cy='14.2' r='4.3'/%3E%3Cpath d='m11.3 11.1 3.5-3.5M11.4 7.6h3.4V11'/%3E%3Ccircle cx='14.6' cy='16.4' r='4.3'/%3E%3Cpath d='m17.7 13.3 3.5-3.5M17.8 9.8h3.4v3.4'/%3E"

def rgba_sub(m):
    r,g,b = int(m.group(1)),int(m.group(2)),int(m.group(3))
    n = RGBA.get((r,g,b))
    if not n: return m.group(0)
    sep = ", " if ", " in m.group(0) else ","
    return f"rgba({n[0]}{sep}{n[1]}{sep}{n[2]}{sep}{m.group(4)})"

def port(text):
    for a,b in VARS: text = text.replace(a,b)
    text = text.replace(VENUS_MASK, MARS_MASK)
    text = re.sub(r"rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)", rgba_sub, text)
    def hex_sub(m):
        h = m.group(0).lower()
        return HEX.get(h, m.group(0))
    text = re.sub(r"#[0-9a-fA-F]{6}\b", hex_sub, text)
    return text

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    text = pathlib.Path(src).read_text(encoding="utf-8")
    out = port(text)
    pathlib.Path(dst).write_text(out, encoding="utf-8", newline="\n")
    left = sorted(set(re.findall(r"#[0-9a-fA-F]{6}\b|rgba\([^)]*\)", out)))
    known = {"#fff","#ffffff"}
    print(dst, "->", [c for c in left if c.lower() not in HEX.values() and not c.startswith("rgba(255, 255, 255") and not c.startswith("rgba(255,255,255") and not c.startswith("rgba(0")])
