# Ice Wall Finder

Mapping steep, ice-covered slopes ("ice walls") in the Himalaya from open satellite data — a first step toward an inventory of a hazard category that current glacial risk maps don't cover.

**Status:** prototype v0 (September 2026). Deterministic filter, not yet validated. Feedback welcome.

## Why

Glacial lakes in Nepal are catalogued and monitored. The events that have caused the most far-reaching damage in recent years — Nepal–Tibet border (Aug 2026), Chamoli (2021), Langtang (2015) — started not in a lake but on a frozen slope above one. A lake is easy to see from orbit; a steep frozen face is not. As far as I can tell, there is no equivalent inventory of ice walls.

## What it does

Google Earth Engine script that combines:

- **Sentinel-2 L2A** (10 m) → NDSI = (B3 − B11)/(B3 + B11) → snow/ice mask (NDSI > 0.4)
- **SRTM 30 m** → elevation and slope
- Rule: `ice AND slope > 35° AND elevation > 4500 m` → *candidate ice wall*; `slope > 45°` → *priority*

Output is a 3-class raster (1 = snow/ice, 2 = candidate, 3 = priority) exported as an Earth Engine asset.

## Preliminary numbers (v1 — 1° × 0.7° box on the Nepal–Tibet border, ~8,600 km², post-monsoon 2025, cloud-masked)

| Rule | Area | Share of all snow/ice |
|---|---|---|
| snow/ice (NDSI > 0.4) | ≈ 3,419 km² | 100% |
| ice on slopes > 35°, > 4500 m — *candidates* | ≈ 905 km² | 26% |
| ice on slopes > 45°, > 4500 m — *priority* | ≈ 441 km² | 13% |

v0 (no per-pixel cloud mask) gave 901 / 439 km² — the result is stable under cloud masking.

<img width="1917" height="1000" alt="langtang_region_v1" src="https://github.com/user-attachments/assets/40409fd5-2f3a-42ea-a2be-edef68f4a763" />


Red: candidates > 35°. Yellow: priority > 45°. Kathmandu is at the bottom of the frame — roughly the distance the August 2026 debris flow travelled.

## Scripts

| File | Purpose |
|---|---|
| `scripts/icewall_finder_v1.js` | **Current.** Parameters block, per-pixel cloud mask (SCL), single `iceWalls(region)` function, area stats, export |
| `scripts/icewall_view.js` | Fast viewer for the exported asset — use for demos and screenshots |
| `scripts/icewall_finder_v0.js` | Original prototype, kept for reference |

Run in the [Earth Engine Code Editor](https://code.earthengine.google.com/) (free for non-commercial use). The export step writes to your own Cloud project — change `assetId` accordingly.

## Known limitations

- NDSI does not separate permanent ice from fresh snow → next step is a multi-year time series.
- "Steep and icy" ≠ "unstable": no information yet on permafrost state, deformation (InSAR) or seismicity.
- SRTM at 30 m under-estimates slope on near-vertical faces; Copernicus DEM should be compared.
- Thresholds (35°, 45°, 4500 m, NDSI 0.4) are starting points, not calibrated.
- Not yet validated against the source slopes of the three known events.

## Next steps

1. Validate against Chamoli 2021, Langtang 2015 and the Aug 2026 event.
2. Time series 2018–2025 to isolate permanent ice.
3. Add triggers: seismic zones (USGS) and ice-loss trend.
4. Add exposure: what is downstream of each wall (settlements, rivers, roads) → ranked list, not just a map.
5. Only then: machine learning, with labels from the validation.

## Credits

Contains modified Copernicus Sentinel data (2025). SRTM courtesy of NASA/USGS. Built with Google Earth Engine.
Idea prompted by a public analysis of the August 2026 Nepal event; method reviewed by the geologist Ivo Karmann (thank you).
