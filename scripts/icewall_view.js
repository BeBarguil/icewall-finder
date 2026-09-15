// ---- ICE WALL FINDER — viewer ----
// Displays the classified asset exported by icewall_finder_v1 (Export.image.toAsset).
// Use this for demos and screenshots: whole big box, no recomputation, no AOI edge.
var cls = ee.Image('projects/icewall-ad/assets/icewall_v1_classified');
Map.setOptions('SATELLITE');
Map.centerObject(cls, 10);
Map.addLayer(cls, {min: 1, max: 3, palette: ['9ecae1', 'ff3300', 'ffff00']}, 'Ice walls');
