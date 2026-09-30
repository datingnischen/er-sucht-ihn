"""Erzeugt data/country-maps.json: Landesumriss Deutschland als SVG-Pfad für die Städteübersicht.

Quelle: Natural Earth 1:50m Admin 0 Countries (Public Domain),
https://github.com/nvkelso/natural-earth-vector
Projektion: Plattkarte mit cos(Mittelbreite)-Stauchung – für eine Übersicht genau genug.
Die Städtepunkte rechnet lib/city-map.mjs mit denselben Parametern.

    python scripts/build_country_maps.py
"""

import json
import math
import pathlib
import urllib.request

SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson"
MARKETS = {"de": "DEU"}
WIDTH = 1000
PAD = 30
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "country-maps.json"


def main() -> None:
    with urllib.request.urlopen(SOURCE, timeout=120) as response:
        world = json.load(response)
    features = {f["properties"]["ADM0_A3"]: f for f in world["features"]}
    result = {}
    for market, code in MARKETS.items():
        geometry = features[code]["geometry"]
        polygons = geometry["coordinates"] if geometry["type"] == "MultiPolygon" else [geometry["coordinates"]]
        rings = [poly[0] for poly in polygons if len(poly[0]) > 12]  # nur Außenringe, Kleinstinseln weg
        lons = [p[0] for ring in rings for p in ring]
        lats = [p[1] for ring in rings for p in ring]
        lat0 = (min(lats) + max(lats)) / 2
        k = math.cos(math.radians(lat0))
        min_x, max_x = min(lons) * k, max(lons) * k
        min_y, max_y = -max(lats), -min(lats)
        scale = (WIDTH - 2 * PAD) / (max_x - min_x)
        height = round((max_y - min_y) * scale + 2 * PAD)

        def project(lon: float, lat: float) -> tuple[float, float]:
            return (lon * k - min_x) * scale + PAD, (-lat - min_y) * scale + PAD

        path = []
        for ring in rings:
            points = [project(lon, lat) for lon, lat in ring]
            path.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in points) + "Z")
        result[market] = {
            "width": WIDTH,
            "height": height,
            "path": "".join(path),
            "projection": {"k": k, "minX": min_x, "minY": min_y, "scale": scale, "pad": PAD},
        }
    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(OUT, OUT.stat().st_size, "Bytes")


if __name__ == "__main__":
    main()
