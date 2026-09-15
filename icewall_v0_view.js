// Fast viewer for the exported asset (no recomputation, no AOI edge).
var cls = ee.Image('projects/icewall-ad/assets/icewall_v0_classified');
Map.setOptions('SATELLITE');
Map.centerObject(cls, 10);
Map.addLayer(cls, {min: 1, max: 3, palette: ['9ecae1', 'ff3300', 'ffff00']}, 'Ice walls');
