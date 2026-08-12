export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export * from './semver';
export * from './appVersion';
