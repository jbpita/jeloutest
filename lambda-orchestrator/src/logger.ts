export function logInfo(msg: string, meta?: any) {
  if (meta) console.log(`[INFO] ${msg}`, JSON.stringify(meta));
  else console.log(`[INFO] ${msg}`);
}

export function logError(msg: string, meta?: any) {
  if (meta) console.error(`[ERROR] ${msg}`, JSON.stringify(meta));
  else console.error(`[ERROR] ${msg}`);
}
