// ---- ICE WALL FINDER v1 — parametrized, cloud-masked, no duplication ----

// ---------- Parameters ----------
var P = {
  dateStart: '2025-09-15', dateEnd: '2025-11-15',  // post-monsoon window
  maxCloud: 20,          // scene-level cloud filter (%)
  ndsiMin: 0.4,          // snow/ice threshold
  slopeCand: 35,         // candidate ice wall (degrees)
  slopeHot: 45,          // priority ice wall (degrees)
  minElev: 4500          // metres — avoids low seasonal snow
};
var aoi    = ee.Geometry.Rectangle([85.0, 28.0, 86.0, 28.7]);   // v0 box (Langtang)
var aoiBig = ee.Geometry.Rectangle([84.3, 27.6, 86.7, 29.0]);   // Manaslu → Rolwaling

// ---------- Helpers ----------
// Per-pixel cloud/shadow mask using the L2A Scene Classification band.
// SCL: 3 = cloud shadow, 8 = cloud medium, 9 = cloud high, 10 = cirrus. (11 = snow — keep!)
function maskClouds(img) {
  var scl = img.select('SCL');
  var bad = scl.eq(3).or(scl.eq(8)).or(scl.eq(9)).or(scl.eq(10));
  return img.updateMask(bad.not());
}

// Build the classified ice-wall image for any region.
// Bands: B4,B3,B2, ndsi, slope, elev, class (1 = ice, 2 = >slopeCand, 3 = >slopeHot)
function iceWalls(region) {
  var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(region)
    .filterDate(P.dateStart, P.dateEnd)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', P.maxCloud))
    .map(maskClouds)
    .median()
    .clip(region);

  var ndsi  = s2.normalizedDifference(['B3', 'B11']).rename('ndsi');
  var dem   = ee.Image('USGS/SRTMGL1_003').clip(region).rename('elev');
  var slope = ee.Terrain.slope(dem).rename('slope');

  var ice  = ndsi.gt(P.ndsiMin);
  var high = dem.gt(P.minElev);
  var cand = ice.and(slope.gt(P.slopeCand)).and(high);
  var hot  = ice.and(slope.gt(P.slopeHot)).and(high);

  var cls = ice.add(cand).add(hot).rename('class').toByte();   // 0..3
  return s2.select(['B4','B3','B2']).addBands([ndsi, slope, dem, cls]);
}

// Area in km² of pixels where class >= level
function areaKm2(img, level, region) {
  return img.select('class').gte(level)
    .multiply(ee.Image.pixelArea()).divide(1e6)
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: region, scale: 30, maxPixels: 1e9})
    .get('class');
}

// ---------- Run on the v0 box ----------
var res = iceWalls(aoi);
Map.setOptions('SATELLITE');   // basemap does the job of the RGB layer
Map.centerObject(aoi, 10);
Map.addLayer(res, {bands: ['B4','B3','B2'], min: 0, max: 3000}, 'Sentinel-2 RGB', false);  // off by default (heavy)
Map.addLayer(res.select('class').gte(1).selfMask(), {palette: ['9ecae1']}, 'Snow/ice (NDSI)', false);
Map.addLayer(res.select('class').gte(2).selfMask(), {palette: ['ff3300']}, 'ICE WALL candidates > ' + P.slopeCand + '°');
Map.addLayer(res.select('class').gte(3).selfMask(), {palette: ['ffff00']}, 'ICE WALL priority > ' + P.slopeHot + '°');

print('Snow/ice total (km²):',      areaKm2(res, 1, aoi));
print('Ice-wall candidates (km²):', areaKm2(res, 2, aoi));
print('Ice-wall priority (km²):',   areaKm2(res, 3, aoi));

// ---------- Export the big box (run once; then use icewall_view) ----------
Export.image.toAsset({
  image: iceWalls(aoiBig).select('class').selfMask(),
  description: 'icewall_v1_classified',
  assetId: 'projects/icewall-ad/assets/icewall_v1_classified',
  region: aoiBig, scale: 30, maxPixels: 1e9
});
