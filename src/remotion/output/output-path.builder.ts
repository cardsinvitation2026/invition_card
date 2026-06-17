import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR_NAME = '.tmp';
const RENDERS_SUBDIR = 'renders';

export function getRenderOutputDirectory(): string {
  return path.join(process.cwd(), OUTPUT_DIR_NAME, RENDERS_SUBDIR);
}

export function buildRenderOutputPath(jobId: string): string {
  const dir = getRenderOutputDirectory();
  fs.mkdirSync(dir, { recursive: true });
  const safeId = jobId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(dir, `${safeId}.mp4`);
}
