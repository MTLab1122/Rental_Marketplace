export interface AppEnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  API_PREFIX: string;
  LOG_LEVEL: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  STORAGE_PROVIDER: 's3' | 'cloudinary' | 'local';
  S3_ENDPOINT?: string;
  S3_BUCKET?: string;
  S3_ACCESS_KEY_ID?: string;
  S3_SECRET_ACCESS_KEY?: string;
  S3_REGION?: string;
  S3_FORCE_PATH_STYLE?: boolean;
  MAP_PROVIDER: 'google' | 'osm';
  GOOGLE_MAPS_API_KEY?: string;
  FCM_SERVER_KEY_OR_SERVICE_ACCOUNT?: string;
  WEB_URL: string;
  ADMIN_URL: string;
  MOBILE_DEEP_LINK_SCHEME: string;
  ENFORCE_PESHAWAR_BOUNDARY: boolean;
}

/**
 * Validates and normalizes environment variables.
 */
export function validateEnvironment(config: Record<string, unknown>): AppEnvironmentConfig {
  const nodeEnv = (config['NODE_ENV'] as string) || 'development';
  const port = Number(config['PORT'] || 4000);
  const apiPrefix = (config['API_PREFIX'] as string) || '/api/v1';
  const logLevel = ((config['LOG_LEVEL'] as string) || 'info') as AppEnvironmentConfig['LOG_LEVEL'];

  const databaseUrl =
    (config['DATABASE_URL'] as string) ||
    'postgresql://postgres:postgres@localhost:5432/rental_peshawar?schema=public';
  const redisUrl = (config['REDIS_URL'] as string) || 'redis://localhost:6379';

  const jwtAccessSecret =
    (config['JWT_ACCESS_SECRET'] as string) || 'dev_jwt_access_secret_min_32_characters_long_12345';
  const jwtRefreshSecret =
    (config['JWT_REFRESH_SECRET'] as string) ||
    'dev_jwt_refresh_secret_min_32_characters_long_12345';
  const jwtAccessExpiresIn = (config['JWT_ACCESS_EXPIRES_IN'] as string) || '15m';
  const jwtRefreshExpiresIn = (config['JWT_REFRESH_EXPIRES_IN'] as string) || '7d';

  const webUrl = (config['WEB_URL'] as string) || 'http://localhost:3000';
  const adminUrl = (config['ADMIN_URL'] as string) || 'http://localhost:3001';
  const mobileDeepLinkScheme = (config['MOBILE_DEEP_LINK_SCHEME'] as string) || 'rentalpeshawar';

  const mapProvider = ((config['MAP_PROVIDER'] as string) || 'osm') as 'google' | 'osm';
  const storageProvider = ((config['STORAGE_PROVIDER'] as string) || 's3') as
    's3' | 'cloudinary' | 'local';

  return {
    NODE_ENV: nodeEnv as AppEnvironmentConfig['NODE_ENV'],
    PORT: port,
    API_PREFIX: apiPrefix,
    LOG_LEVEL: logLevel,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresIn,
    JWT_REFRESH_EXPIRES_IN: jwtRefreshExpiresIn,
    CLOUDINARY_CLOUD_NAME: config['CLOUDINARY_CLOUD_NAME'] as string | undefined,
    CLOUDINARY_API_KEY: config['CLOUDINARY_API_KEY'] as string | undefined,
    CLOUDINARY_API_SECRET: config['CLOUDINARY_API_SECRET'] as string | undefined,
    STORAGE_PROVIDER: storageProvider,
    S3_ENDPOINT: config['S3_ENDPOINT'] as string | undefined,
    S3_BUCKET: (config['S3_BUCKET'] as string) || 'peshawar-rental-media',
    S3_ACCESS_KEY_ID: config['S3_ACCESS_KEY_ID'] as string | undefined,
    S3_SECRET_ACCESS_KEY: config['S3_SECRET_ACCESS_KEY'] as string | undefined,
    S3_REGION: (config['S3_REGION'] as string) || 'us-east-1',
    S3_FORCE_PATH_STYLE:
      config['S3_FORCE_PATH_STYLE'] === 'true' || config['S3_FORCE_PATH_STYLE'] === true,
    MAP_PROVIDER: mapProvider,
    GOOGLE_MAPS_API_KEY: config['GOOGLE_MAPS_API_KEY'] as string | undefined,
    FCM_SERVER_KEY_OR_SERVICE_ACCOUNT: config['FCM_SERVER_KEY_OR_SERVICE_ACCOUNT'] as
      string | undefined,
    WEB_URL: webUrl,
    ADMIN_URL: adminUrl,
    MOBILE_DEEP_LINK_SCHEME: mobileDeepLinkScheme,
    ENFORCE_PESHAWAR_BOUNDARY: config['ENFORCE_PESHAWAR_BOUNDARY'] !== 'false',
  };
}
