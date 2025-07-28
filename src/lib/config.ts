/**
 * Environment Configuration Helper
 * Centralizes all environment variable access with type safety
 */

interface AppConfig {
  // Application Settings
  nodeEnv: string;
  appUrl: string;
  baseUrl: string;
  
  // Database Settings
  mongodbUri: string;
  mongodbDatabase: string;
  collections: {
    users: string;
    branches: string;
    chats: string;
    applications: string;
    management: string;
  };
  
  // Security Settings  
  jwtSecret: string;
  jwtExpiresIn: string;
  adminCredentials: {
    username: string;
    password: string;
  };
  
  // Real-time Settings
  refreshInterval: number;
  chatRefreshInterval: number;
  
  // API Settings
  apiRateLimit: number;
  apiTimeout: number;
  
  // Session Settings
  sessionTimeout: number;
  sessionHeartbeat: number;
  
  // Feature Flags
  features: {
    realTimeNotifications: boolean;
    queryHistory: boolean;
    bulkUpload: boolean;
    advancedSearch: boolean;
    debugMode: boolean;
  };
  
  // Performance Settings
  cache: {
    queryTtl: number;
    userTtl: number;
  };
  
  // Security Settings
  security: {
    enableHeaders: boolean;
    corsOrigins: string[];
  };
  
  // File Upload Settings
  fileUpload: {
    maxSize: number;
    allowedTypes: string[];
  };
  
  // Logging Settings
  logging: {
    level: string;
    enableApiLogging: boolean;
    enableConsoleLogging: boolean;
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value.toLowerCase() === 'true' : defaultValue;
};

export const config: AppConfig = {
  // Application Settings
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  appUrl: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  baseUrl: getEnvVar('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
  
  // Database Settings
  mongodbUri: getEnvVar('MONGODB_URI'),
  mongodbDatabase: getEnvVar('MONGODB_DATABASE', 'querymodel'),
  collections: {
    users: getEnvVar('MONGODB_USERS_COLLECTION', 'users').replace(/"/g, ''),
    branches: getEnvVar('MONGODB_BRANCHES_COLLECTION', 'branches').replace(/"/g, ''),
    chats: getEnvVar('MONGODB_CHAT_COLLECTION', 'chats').replace(/"/g, ''),
    applications: getEnvVar('MONGODB_APPLICATIONS_COLLECTION', 'applications').replace(/"/g, ''),
    management: getEnvVar('MONGODB_MANAGEMENT_COLLECTION', 'management_users').replace(/"/g, ''),
  },
  
  // Security Settings
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN', '24h'),
  adminCredentials: {
    username: getEnvVar('ADMIN_USERNAME', 'admin'),
    password: getEnvVar('ADMIN_PASSWORD', 'admin123'),
  },
  
  // Real-time Settings
  refreshInterval: getEnvNumber('NEXT_PUBLIC_REFRESH_INTERVAL', 5000),
  chatRefreshInterval: getEnvNumber('NEXT_PUBLIC_CHAT_REFRESH_INTERVAL', 3000),
  
  // API Settings
  apiRateLimit: getEnvNumber('API_RATE_LIMIT', 100),
  apiTimeout: getEnvNumber('API_TIMEOUT', 30000),
  
  // Session Settings
  sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 3600000), // 1 hour
  sessionHeartbeat: getEnvNumber('SESSION_HEARTBEAT_INTERVAL', 300000), // 5 minutes
  
  // Feature Flags
  features: {
    realTimeNotifications: getEnvBoolean('ENABLE_REAL_TIME_NOTIFICATIONS', true),
    queryHistory: getEnvBoolean('ENABLE_QUERY_HISTORY', true),
    bulkUpload: getEnvBoolean('ENABLE_BULK_UPLOAD', true),
    advancedSearch: getEnvBoolean('ENABLE_ADVANCED_SEARCH', true),
    debugMode: getEnvBoolean('ENABLE_DEBUG_MODE', false),
  },
  
  // Performance Settings
  cache: {
    queryTtl: getEnvNumber('QUERY_CACHE_TTL', 300000), // 5 minutes
    userTtl: getEnvNumber('USER_CACHE_TTL', 600000), // 10 minutes
  },
  
  // Security Settings
  security: {
    enableHeaders: getEnvBoolean('ENABLE_SECURITY_HEADERS', true),
    corsOrigins: getEnvVar('CORS_ORIGINS', 'http://localhost:3000').split(','),
  },
  
  // File Upload Settings
  fileUpload: {
    maxSize: getEnvNumber('MAX_FILE_SIZE', 10485760), // 10MB
    allowedTypes: getEnvVar('ALLOWED_FILE_TYPES', 'jpg,jpeg,png,pdf,doc,docx').split(','),
  },
  
  // Logging Settings
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    enableApiLogging: getEnvBoolean('ENABLE_API_LOGGING', true),
    enableConsoleLogging: getEnvBoolean('ENABLE_CONSOLE_LOGGING', false),
  },
};

// Development helper functions
export const isDevelopment = () => config.nodeEnv === 'development';
export const isProduction = () => config.nodeEnv === 'production';
export const isTest = () => config.nodeEnv === 'test';

// Database helper
export const getDbUrl = () => {
  if (process.env.BUILDING === 'true') {
    return 'mongodb://localhost:27017/mockdb';
  }
  return config.mongodbUri;
};

// API helper
export const getApiUrl = (endpoint: string) => {
  const baseUrl = config.baseUrl || config.appUrl;
  return `${baseUrl}/api/${endpoint.replace(/^\//, '')}`;
};

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof AppConfig['features']): boolean => {
  return config.features[feature];
};

// Logging helper
export const shouldLog = (level: 'error' | 'warn' | 'info' | 'debug'): boolean => {
  const levels = ['error', 'warn', 'info', 'debug'];
  const currentLevel = levels.indexOf(config.logging.level);
  const targetLevel = levels.indexOf(level);
  return targetLevel <= currentLevel;
};

export default config;
