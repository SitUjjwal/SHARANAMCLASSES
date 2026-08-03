/**
 * Structured application logging — levels, categories, file store, rotation.
 *
 * Files (under LOG_DIR):
 *   app-YYYY-MM-DD.log      — all levels
 *   error-YYYY-MM-DD.log    — errors only
 *   access-YYYY-MM-DD.log   — API requests
 *
 * Rotation via rotating-file-stream (daily + size cap + retention).
 */
import fs from 'node:fs';
import path from 'node:path';

import { createStream, type RotatingFileStream } from 'rotating-file-stream';

import { env } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Business / operational categories required by the logging system */
export type LogCategory =
  | 'error'
  | 'warning'
  | 'payment'
  | 'auth'
  | 'admin'
  | 'api'
  | 'system';

export type LogFields = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLogDir(): string {
  const configured = env.LOG_DIR.trim() || 'logs';
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
}

function shouldLogToConsole(): boolean {
  if (env.LOG_TO_CONSOLE !== undefined) return env.LOG_TO_CONSOLE;
  return env.NODE_ENV !== 'production';
}

function createRotatingStream(filenamePrefix: string): RotatingFileStream {
  const logDir = resolveLogDir();
  fs.mkdirSync(logDir, { recursive: true });

  return createStream(
    (time: number | Date, index?: number) => {
      if (!time) return `${filenamePrefix}.log`;
      const d = time instanceof Date ? time : new Date(time);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const stamp = `${yyyy}-${mm}-${dd}`;
      return index
        ? `${filenamePrefix}-${stamp}.${index}.log`
        : `${filenamePrefix}-${stamp}.log`;
    },
    {
      path: logDir,
      interval: '1d',
      intervalBoundary: true,
      size: env.LOG_MAX_SIZE,
      maxFiles: env.LOG_MAX_FILES,
    },
  );
}

let appStream: RotatingFileStream | null = null;
let errorStream: RotatingFileStream | null = null;
let accessStream: RotatingFileStream | null = null;
let initialized = false;

function ensureStreams(): void {
  if (initialized) return;
  initialized = true;
  try {
    appStream = createRotatingStream('app');
    errorStream = createRotatingStream('error');
    accessStream = createRotatingStream('access');
    appStream.on('error', (err) => {
      process.stderr.write(`[logger] app stream error: ${String(err)}\n`);
    });
    errorStream.on('error', (err) => {
      process.stderr.write(`[logger] error stream error: ${String(err)}\n`);
    });
    accessStream.on('error', (err) => {
      process.stderr.write(`[logger] access stream error: ${String(err)}\n`);
    });
  } catch (err) {
    process.stderr.write(`[logger] failed to open log streams: ${String(err)}\n`);
  }
}

function writeLine(stream: RotatingFileStream | null, line: string): void {
  if (!stream) return;
  try {
    stream.write(`${line}\n`);
  } catch {
    // never throw from logger
  }
}

function redact(fields: LogFields): LogFields {
  const blocked = new Set([
    'password',
    'new_password',
    'current_password',
    'confirm_password',
    'temporary_password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'razorpay_signature',
    'razorpay_key_secret',
    'secret',
  ]);
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (blocked.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
      continue;
    }
    out[key] = value;
  }
  return out;
}

function emit(
  level: LogLevel,
  category: LogCategory,
  message: string,
  fields: LogFields = {},
): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[env.LOG_LEVEL]) {
    return;
  }

  ensureStreams();

  const entry = {
    ts: new Date().toISOString(),
    level,
    category,
    message,
    ...redact(fields),
    env: env.NODE_ENV,
  };

  const line = JSON.stringify(entry);

  writeLine(appStream, line);
  if (level === 'error' || category === 'error') {
    writeLine(errorStream, line);
  }
  if (category === 'api') {
    writeLine(accessStream, line);
  }

  if (shouldLogToConsole()) {
    const prefix = `[${entry.ts}] ${level.toUpperCase()} [${category}]`;
    if (level === 'error') {
      console.error(prefix, message, fields);
    } else if (level === 'warn') {
      console.warn(prefix, message, fields);
    } else {
      console.log(prefix, message, Object.keys(fields).length ? fields : '');
    }
  }
}

export const logger = {
  debug(message: string, fields?: LogFields, category: LogCategory = 'system') {
    emit('debug', category, message, fields);
  },
  info(message: string, fields?: LogFields, category: LogCategory = 'system') {
    emit('info', category, message, fields);
  },
  warn(message: string, fields?: LogFields, category: LogCategory = 'warning') {
    emit('warn', category, message, fields);
  },
  error(message: string, fields?: LogFields, category: LogCategory = 'error') {
    emit('error', category, message, fields);
  },

  /** Domain helpers */
  auth(message: string, fields?: LogFields, level: LogLevel = 'info') {
    emit(level, 'auth', message, fields);
  },
  payment(message: string, fields?: LogFields, level: LogLevel = 'info') {
    emit(level, 'payment', message, fields);
  },
  admin(message: string, fields?: LogFields, level: LogLevel = 'info') {
    emit(level, 'admin', message, fields);
  },
  api(message: string, fields?: LogFields, level: LogLevel = 'info') {
    emit(level, 'api', message, fields);
  },

  /** Absolute log directory (for ops docs / health). */
  getLogDir(): string {
    return resolveLogDir();
  },
};

export function initLogger(): void {
  ensureStreams();
  logger.info('Logger initialized', {
    log_dir: resolveLogDir(),
    level: env.LOG_LEVEL,
    max_files: env.LOG_MAX_FILES,
    max_size: env.LOG_MAX_SIZE,
  });
}
