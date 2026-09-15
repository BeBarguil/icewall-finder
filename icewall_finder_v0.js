// ---- ICE WALL FINDER v0 — Nepal/Tibet border (Rasuwa / Trishuli) ----
// Area of interest: Nepal–Tibet border, close to Rasuwagadhi (includes Langtang valley).
var aoi = ee.Geometry.Rectangle([85.0, 28.0, 86.0, 28.7]);
Map.centerObject(aoi, 10);

// 1) Sentinel-2 (optical, 10 m). Post-monsoon = fewer clouds and less fresh snow.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2025-09-15', '2025-11-15')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(aoi);

// 2) NDSI = (Green - SWIR) / (Green + SWIR). Snow/ice > ~0.4
var ndsi = s2.normalizedDifference(['B3', 'B11']).rename('ndsi');
var ice = ndsi.gt(0.4);

// 3) Terrain: elevation and slope (SRTM 30 m)
var dem = ee.Image('USGS/SRTMGL1_003').clip(aoi);
var slope = ee.Terrain.slope(dem);

// 4) "Ice wall" = ice + steep slope + high altitude
var steep = slope.gt(35);          // degrees — adjust 30–45
var high  = dem.gt(4500);          // avoids low seasonal snow
var iceWall    = ice.and(steep).and(high).selfMask();
var iceWallHot = ice.and(slope.gt(45)).and(high).selfMask();

// 5) Layers (order matters: later layers draw on top)
Map.addLayer(s2, {bands: ['B4','B3','B2'], min: 0, max: 3000}, 'Sentinel-2 RGB');
Map.addLayer(ice.selfMask(), {palette: ['9ecae1']}, 'Snow/ice (NDSI)', false);
Map.addLayer(iceWall,    {palette: ['ff3300']}, 'ICE WALL candidates > 35°');
Map.addLayer(iceWallHot, {palette: ['ffff00']}, 'ICE WALL priority > 45°');

// 6) Area (km²) of candidates and of the >45° priority set
function areaKm2(img, label) {
  var a = img.multiply(ee.Image.pixelArea()).divide(1e6)
    .reduceRegion({reducer: ee.Reducer.sum(), geometry: aoi, scale: 30, maxPixels: 1e9});
  print(label, a);
}
areaKm2(iceWall,    'Ice-wall candidates > 35° (km²):');
areaKm2(iceWallHot, 'Ice-wall priority  > 45° (km²):');

// 7) Export: one classified image, bigger box, computed once
var aoiBig = ee.Geometry.Rectangle([84.3, 27.6, 86.7, 29.0]);   // Manaslu → Langtang → Rolwaling
var s2Big = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoiBig)
  .filterDate('2025-09-15', '2025-11-15')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median();
var demBig   = ee.Image('USGS/SRTMGL1_003');
var slopeBig = ee.Terrain.slope(demBig);
var iceBig   = s2Big.normalizedDifference(['B3','B11']).gt(0.4);
var highBig  = demBig.gt(4500);
// 1 = snow/ice, 2 = ice wall >35°, 3 = ice wall >45°
var classified = iceBig
  .add(iceBig.and(slopeBig.gt(35)).and(highBig))
  .add(iceBig.and(slopeBig.gt(45)).and(highBig))
  .selfMask().rename('class').toByte();
Export.image.toAsset({
  image: classified, description: 'icewall_v0_classified',
  assetId: 'projects/icewall-ad/assets/icewall_v0_classified',
  region: aoiBig, scale: 30, maxPixels: 1e9
});
