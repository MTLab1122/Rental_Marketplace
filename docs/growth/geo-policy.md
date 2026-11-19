# Geographic Search & Locality Policy (GEO)

## 1. Scope & Municipal Boundaries

The platform exclusively serves properties within the verified Peshawar Municipal & District boundaries.

- **Bounding Box**:
  - Minimum Latitude: `33.9000° N`
  - Maximum Latitude: `34.1500° N`
  - Minimum Longitude: `71.4000° E`
  - Maximum Longitude: `71.7000° E`
- Properties outside these coordinates are flagged during onboarding and prevented from generating programmatic locality landing pages.

## 2. Locality Partitioning & Hierarchy

Peshawar is partitioned into standardized geographic clusters to prevent keyword cannibalization and boundary overlap:

1. **Hayatabad**: Phases 1 through 7, Industrial Estate, Jamrud Road access.
2. **University Town**: Main University Road, Canal Road, Circular Road, Jamrud Road corridor.
3. **Warsak Road**: Defense Colony, Babu Garhi, Prime Hospital area, Warsak boundary.
4. **Saddar / Cantt**: Mall Road, Fakhr-e-Alam Road, Sadar Bazaar, Sunheri Masjid Road.
5. **Gulbahar / Ring Road**: Gulbahar 1-4, Charsadda Road junction, Ring Road bypass.
6. **Dalazak Road**: Dalazak Road settlements, Ring Road interchange.
7. **Charsadda Road**: Northern Peshawar suburban corridors.
8. **Kohat Road**: Southern Peshawar industrial and commercial zones.

## 3. PostGIS Integration & Proximity Calculations

- All locality records store polygon boundaries or geographic centroids in EPSG:4326.
- Property location queries calculate distance to major Peshawar landmarks using `ST_DWithin` and `ST_DistanceSphere`:
  - **BRT Stations**: Station distance in walking minutes (assuming 80 meters/minute).
  - **Universities**: UOP, Islamia College, CECOS, IM|Sciences, KMU.
  - **Hospitals**: KTH, HMC, LRH, Northwest General Hospital.
- Structured data must reflect these proximity landmarks in `geoContains` or descriptive schema fields.

## 4. Local Landmarks & BRT Corridors

Search landing pages highlight transit proximity:

- Proximity to BRT Corridor (Green Line) is a major ranking and discovery factor.
- Listings within 1 km of a BRT feeder route or station are tagged with the specific station identifier (e.g., "BS-14 University of Peshawar").

## 5. Duplicate & Doorway Page Prevention

- Never generate thin locality pages without at least 1 verified property or an active local community guide.
- Sub-locality pages (e.g., Phase 1 vs Phase 2) must include distinct neighborhood descriptions, local amenities, school/market access, and verified rent statistics.
