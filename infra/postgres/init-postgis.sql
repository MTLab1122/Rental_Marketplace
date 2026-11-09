-- Initialize PostGIS extensions for spatial property validation in Peshawar
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log confirmation
DO $$
BEGIN
  RAISE NOTICE 'PostGIS extensions successfully enabled for rental_peshawar database.';
END $$;

