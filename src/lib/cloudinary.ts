import { v2 as cloudinary } from 'cloudinary';

let configured = false;

/** Returns a configured Cloudinary client, or throws if env is missing. */
export function getCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured (CLOUDINARY_* env vars missing).');
  }

  if (!configured) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    configured = true;
  }
  return cloudinary;
}

export interface SignedUpload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  resourceType: 'image';
}

/**
 * Produce a signed upload payload the browser uses to upload DIRECTLY to
 * Cloudinary (the file never passes through our server).
 *
 * The signature pins `resource_type` to `image` and the folder must live under
 * the `nsdc/` root, so a leaked payload cannot be used to upload arbitrary
 * file types anywhere else in the Cloudinary account.
 */
export function signUpload(folder: string): SignedUpload {
  const c = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const params: Record<string, string | number> = {
    timestamp,
    folder,
    resource_type: 'image',
  };
  const signature = c.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET as string
  );
  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY as string,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
    folder,
    resourceType: 'image',
  };
}
