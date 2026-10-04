# Visitor map prototype sources

The watercolor palette and small building/leaf drawings in `public/field-guide/map-art.js` are original Venice Sideways code artwork. The map still uses the OpenFreeMap Positron vector style, tiles, glyphs and sprite. The color transform does not change street, bridge, canal or building geometry. Positron remains the fallback if the transform cannot be fetched. The map's normal MapLibre attribution is retained.

The two small garden polygons in `public/field-guide/gardens.json` were extracted on 2026-10-04 from OpenStreetMap ways [174476472 (Giardini Papadopoli)](https://www.openstreetmap.org/way/174476472) and [4715855 (Parco Savorgnan)](https://www.openstreetmap.org/way/4715855). The file contains their original ring coordinates, names and OSM way IDs. It is derived from OpenStreetMap data and is distributed under [ODbL 1.0](https://www.openstreetmap.org/copyright); the map source supplies visible contributor attribution. Both ways were tagged `leisure=park` at retrieval. OpenFreeMap's 2026-09-27 z14 Venice tile independently included both names as `poi` park features, but omitted their polygons from its `park` vector layer. That is why the prototype uses this small OSM extract for the two highlighted boundaries.

The "Show on map" view points for the two gardens use the corresponding named park POIs in that OpenFreeMap tile. They lie within the OSM boundaries; they are view centers, not separate stop markers.

The [Venice municipality public-green inventory](https://www.comune.venezia.it/sites/default/files/flex/files/0/b/1/D.9ff7577cba13929cb8e6/REPORT_RENDICONTAZIONE_VERDE_PUBBLICO_2014.pdf) lists both spaces, and its [garden information](https://www.comune.venezia.it/it/node/44238) warns that access varies. The inventory is from 2014. Municipal geometry was not copied, because its reuse terms were not established. The map card asks visitors to check current access locally and does not promise entry or exact hours.

Three small building drawings are positioned at the existing Main Walk visit coordinates for Venezia Santa Lucia, Ponte dell'Accademia, and Punta della Dogana. These are route anchors, not surveyed building centroids. No third-party photography or AI imagery is included; place cards explicitly state that no photograph is available.

Sources: [OpenFreeMap licensing and attribution](https://openfreemap.org/), [OpenStreetMap copyright and ODbL](https://www.openstreetmap.org/copyright), [MapLibre style layers and collisions](https://maplibre.org/maplibre-style-spec/layers/).
