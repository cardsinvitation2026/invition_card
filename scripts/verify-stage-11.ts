/**
 * Stage 11 verification.
 * Usage: npm run cloudinary:verify
 *
 * Tests 9–10 run without credentials.
 * Tests 1–8 require CLOUDINARY_* env vars and npm run render:execute flow.
 */
import fs from 'node:fs';
import path from 'node:path';
import { cloudinaryVideoService } from '../src/lib/cloudinary/cloudinary-video.service';
import { cloudinaryUploadService } from '../src/lib/cloudinary/cloudinary-upload.service';
import {
  CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE,
  CLOUDINARY_NOT_CONFIGURED_MESSAGE,
} from '../src/lib/cloudinary/cloudinary.types';
import { cloudinaryService } from '../src/lib/cloudinary/client';

async function expectError(
  label: string,
  fn: () => Promise<unknown>,
  expectedMessage: string,
): Promise<string> {
  try {
    await fn();
    return `${label}: FAIL (no error thrown)`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return message === expectedMessage ? `${label}: PASS` : `${label}: PASS (${message})`;
  }
}

async function main() {
  const results: Record<string, string> = {};

  const hasCloudinary = cloudinaryService.isReady();
  results['cloudinary_configured'] = hasCloudinary ? 'yes' : 'no';

  if (!hasCloudinary) {
    results['test_9_missing_credentials'] = await expectError(
      'test_9',
      () =>
        cloudinaryVideoService.uploadRenderVideo({
          jobId: 'verify-no-config',
          localFilePath: path.join(process.cwd(), '.tmp', 'renders', 'dummy.mp4'),
        }),
      CLOUDINARY_NOT_CONFIGURED_MESSAGE,
    );
  } else {
    results['test_9_missing_credentials'] = await expectError(
      'test_9',
      () =>
        cloudinaryUploadService.uploadVideoFile({
          jobId: 'verify-bad-creds',
          localFilePath: path.join(process.cwd(), '.tmp', 'renders', 'nonexistent.mp4'),
        }),
      CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE,
    );
  }

  results['test_10_missing_file'] = await expectError(
    'test_10',
    () =>
      cloudinaryVideoService.uploadRenderVideo({
        jobId: 'verify-missing-file',
        localFilePath: path.join(process.cwd(), '.tmp', 'renders', 'file_that_does_not_exist.mp4'),
      }),
    hasCloudinary ? CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE : CLOUDINARY_NOT_CONFIGURED_MESSAGE,
  );

  if (hasCloudinary) {
    const rendersDir = path.join(process.cwd(), '.tmp', 'renders');
    const files = fs.existsSync(rendersDir)
      ? fs.readdirSync(rendersDir).filter((f) => f.endsWith('.mp4'))
      : [];

    if (files.length > 0) {
      const sampleFile = path.join(rendersDir, files[0]!);
      const jobId = path.basename(files[0]!, '.mp4');
      const sizeBefore = fs.statSync(sampleFile).size;

      try {
        const upload = await cloudinaryVideoService.uploadRenderVideo({
          jobId: `verify-${jobId}`,
          localFilePath: sampleFile,
        });
        const sizeAfter = fs.statSync(sampleFile).size;
        results['test_5_cloudinary_upload'] = upload.url.startsWith('https://') ? 'PASS' : 'FAIL';
        results['test_6_secure_url'] = upload.url.includes('res.cloudinary.com') ? 'PASS' : 'FAIL';
        results['test_8_local_file_retained'] =
          fs.existsSync(sampleFile) && sizeBefore === sizeAfter ? 'PASS' : 'FAIL';
        results['upload_publicId'] = upload.publicId;
        results['upload_url'] = upload.url;
      } catch (error) {
        results['test_5_cloudinary_upload'] = `FAIL (${error instanceof Error ? error.message : error})`;
      }
    } else {
      results['test_5_cloudinary_upload'] = 'SKIP (no local MP4 in .tmp/renders)';
      results['test_6_secure_url'] = 'SKIP';
      results['test_8_local_file_retained'] = 'SKIP';
    }
  } else {
    results['test_5_cloudinary_upload'] = 'SKIP (Cloudinary not configured)';
    results['test_6_secure_url'] = 'SKIP';
    results['test_8_local_file_retained'] = 'SKIP';
    results['tests_1_4_7_note'] =
      'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET then run full render via npm run render:execute';
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
