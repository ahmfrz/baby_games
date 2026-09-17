import fs from 'fs';

async function verify() {
  console.log('Verifying Cloudinary assets...');
  try {
    const manifest = JSON.parse(fs.readFileSync('asset-migration-manifest-release-2.json', 'utf8'));
    let missing = 0;
    
    for (const asset of manifest) {
      if (asset.path.includes('targets.svg')) continue;
      
      const type = asset.mime.includes('video') || asset.mime.includes('audio') ? 'video' : (asset.mime.includes('json') ? 'raw' : 'image');
      const ext = type === 'raw' ? asset.extension : '';
      const publicId = "little-adventures/release-2/$({asset.path.replace(/\.[^/.]+$/, "")"})";
      const url = "https://res.cloudinary.com/orxjbhtb/${type}/upload/${publicId}";
      
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) {
        console.error("Missing: ${url}");
        missing++;
      }
    }
    
    if (missing > 0) {
      console.error("Verification failed: ${missing} missing assets.");
      process.exit(1);
    } else {
      console.log('All required assets verified successfully.');
    }
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(1);
  }
}

verify();
