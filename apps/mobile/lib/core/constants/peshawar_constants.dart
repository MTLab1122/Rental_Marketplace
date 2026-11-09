class PeshawarConstants {
  static const String appName = 'Rental Peshawar';
  static const String defaultApiBaseUrl = 'http://10.0.2.2:3000/api/v1';

  static const List<String> localities = [
    'University Town',
    'Hayatabad',
    'University Road',
    'Saddar',
    'Gulbahar',
    'Tehkal',
    'Board Bazaar',
    'Warsak Road',
    'Ring Road',
    'Dalazak Road',
    'Regi Model Town',
    'Peshawar Cantt',
    'Danish Abad',
    'Nasir Bagh Road',
    'WAPDA Town',
  ];

  /// Peshawar Service Boundary Polygon (WGS84 [lng, lat])
  static const List<List<double>> boundaryPolygon = [
    [71.35, 33.92],
    [71.42, 33.91],
    [71.55, 33.92],
    [71.68, 33.96],
    [71.72, 34.04],
    [71.69, 34.12],
    [71.58, 34.16],
    [71.42, 34.14],
    [71.36, 34.08],
    [71.35, 33.92],
  ];

  /// Point-in-polygon verification for Peshawar municipal boundary
  static bool isWithinPeshawarBoundary(double latitude, double longitude) {
    bool isInside = false;
    for (int i = 0, j = boundaryPolygon.length - 1; i < boundaryPolygon.length; j = i++) {
      final pointI = boundaryPolygon[i];
      final pointJ = boundaryPolygon[j];

      final xi = pointI[0];
      final yi = pointI[1];
      final xj = pointJ[0];
      final yj = pointJ[1];

      final intersect = ((yi > latitude) != (yj > latitude)) &&
          (longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi);

      if (intersect) {
        isInside = !isInside;
      }
    }
    return isInside;
  }
}
