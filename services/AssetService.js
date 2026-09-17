/**
 * Runtime asset resolver.
 *
 * Logical paths are independent of where the files are hosted.
 * Local development uses the files in this repository; production can point
 * VITE_ASSET_BASE_URL at Cloudinary's shared CDN.
 *
 * Cloudinary delivery uses the resource type implied by the file extension:
 *   image -> images/SVG
 *   video -> MP4 and audio (WAV)
 */
const RAW_BASE = (import.meta.env?.VITE_ASSET_BASE_URL || '').trim();
const EXTERNAL_ASSETS = /^https?:\/\//i.test(RAW_BASE);
const CLOUDINARY_CLOUD_NAME = (import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'orxjbhtb').trim();
const CLOUDINARY_PREFIX = 'little-adventures/release-2';

const trimSlashes = (value) => String(value || '').replace(/^\/+|\/+$/g, '');
const LOCAL_PREFIXES = [
  ['games/language-adventures/video/', 'games/language-adventures/video/'],
  ['shared/', 'assets/shared/'],
  ['games/strawberry-garden/', 'assets/games/strawberry-garden/'],
  ['games/alphabet-learner/', 'games/alphabet-learner/assets/'],
  ['games/comic-stories/', 'games/comic-stories/assets/'],
  ['games/fruit-color/', 'games/fruit-color/assets/'],
  ['games/language-adventures/', 'games/language-adventures/assets/'],
];

const VIDEO_AUDIO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v', '.mp3', '.wav', '.ogg', '.flac', '.m4a']);
const RAW_EXTENSIONS = new Set(['.json']);

function extensionOf(path) {
  const match = String(path).toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match ? match[1] : '';
}

function cloudinaryResourceType(path) {
  const ext = extensionOf(path);
  if (VIDEO_AUDIO_EXTENSIONS.has(ext)) return 'video';
  if (RAW_EXTENSIONS.has(ext)) return 'raw';
  return 'image';
}

function cloudinaryPublicId(logicalPath) {
  const normalized = trimSlashes(logicalPath);
  const resourceType = cloudinaryResourceType(normalized);
  // Image/video public IDs should not contain the source extension. Raw assets
  // (e.g. JSON manifests) retain their extension.
  const publicName = resourceType === 'raw'
    ? normalized
    : normalized.replace(/\.[a-z0-9]+$/i, '');
  return `${CLOUDINARY_PREFIX}/${publicName}`;
}

function localPath(logicalPath) {
  const normalized = trimSlashes(logicalPath);
  const match = LOCAL_PREFIXES.find(([logicalPrefix]) => normalized.startsWith(logicalPrefix));
  if (match) return match[1] + normalized.slice(match[0].length);
  return normalized;
}

export function assetUrl(logicalPath = '') {
  const normalized = trimSlashes(logicalPath);
  if (!EXTERNAL_ASSETS) {
    return new URL(`./${localPath(normalized)}`, document.baseURI).href;
  }

  const resourceType = cloudinaryResourceType(normalized);
  const publicId = cloudinaryPublicId(normalized);
  const extension = extensionOf(normalized);

  // Preserve SVG/PNG/etc. for deterministic game behavior. Cloudinary can
  // still cache and deliver these through its shared CDN without a transform.
  return `${RAW_BASE.replace(/\/+$/, '')}/${resourceType}/upload/${publicId}${resourceType === 'raw' ? '' : extension}`;
}

export function assetDirectoryUrl(logicalPath = '', resourceType = 'image') {
  const normalized = trimSlashes(logicalPath);
  if (!EXTERNAL_ASSETS) {
    return new URL(`./${localPath(normalized)}/`, document.baseURI).href;
  }

  const type = String(resourceType || 'image').trim() || 'image';
  return `${RAW_BASE.replace(/\/+$/, '')}/${type}/upload/${CLOUDINARY_PREFIX}/${normalized}/`;
}

export function assetBaseUrl() {
  return EXTERNAL_ASSETS
    ? `${RAW_BASE.replace(/\/+$/, '')}/`
    : new URL('./', document.baseURI).href;
}

export function assetCssUrl(logicalPath) {
  return `url("${assetUrl(logicalPath).replace(/"/g, '%22')}")`;
}

export function configureAssetCssVariables() {
  const root = document.documentElement;
  const variables = {
    '--asset-shared-bg-abc-garden': 'shared/art/backgrounds/learning/abc-garden.svg',
    '--asset-shared-bg-art-studio': 'shared/art/backgrounds/learning/art-studio.svg',
    '--asset-shared-bg-pencil-playground': 'shared/art/backgrounds/learning/pencil-playground.svg',
    '--asset-shared-bg-storybook-room': 'shared/art/backgrounds/learning/storybook-room.svg',
    '--asset-shared-bg-nest-garden': 'shared/art/backgrounds/nest-garden.svg',
  };
  for (const [name, path] of Object.entries(variables)) {
    root.style.setProperty(name, assetCssUrl(path));
  }
}

export const ASSET_HOSTING = EXTERNAL_ASSETS ? 'cloudinary' : 'local';
export const ASSET_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
