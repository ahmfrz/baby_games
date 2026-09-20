$ErrorActionPreference = 'Stop'

# Requires the Cloudinary CLI to be authenticated/configured in the environment.
# The destination public IDs match AssetService.js:
# little-adventures/release-2/games/language-adventures/video/<name>

$files = @(
  @{ Local = 'games/language-adventures/video/park-adventure.mp4'; PublicId = 'little-adventures/release-2/games/language-adventures/video/park-adventure' },
  @{ Local = 'games/language-adventures/video/school-adventure.mp4'; PublicId = 'little-adventures/release-2/games/language-adventures/video/school-adventure' },
  @{ Local = 'games/language-adventures/video/world-adventure.mp4'; PublicId = 'little-adventures/release-2/games/language-adventures/video/world-adventure' }
)

foreach ($file in $files) {
  if (-not (Test-Path $file.Local)) { throw "Missing video: $($file.Local)" }
  Write-Host "Uploading $($file.Local)..."
  # Cloudinary CLI expects upload parameters as positional key=value arguments.
  cld uploader upload $file.Local "public_id=$($file.PublicId)" "resource_type=video" "overwrite=true"
  if ($LASTEXITCODE -ne 0) { throw "Cloudinary upload failed for $($file.Local) (exit code $LASTEXITCODE)" }
}

Write-Host 'Little Adventures videos uploaded.'
