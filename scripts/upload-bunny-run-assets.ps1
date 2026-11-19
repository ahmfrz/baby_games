$ErrorActionPreference = 'Stop'

# Uploads all Bunny Run art assets to Cloudinary under:
# little-adventures/release-2/games/bunny-run/art/<name>

$artDir = 'assets/games/bunny-run/art'
if (-not (Test-Path $artDir)) { throw "Art directory not found: $artDir" }

$files = Get-ChildItem -Path $artDir -File | Where-Object { $_.Extension -in @('.png', '.svg') }

Write-Host "Found $($files.Count) assets to upload..."

$failed = 0
$uploaded = 0

foreach ($file in $files) {
    $baseName = $file.BaseName
    $publicId = "little-adventures/release-2/games/bunny-run/art/$baseName"
    Write-Host "Uploading $($file.Name) -> $publicId ..."
    
    cld uploader upload $file.FullName "public_id=$publicId" "resource_type=image" "overwrite=true"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to upload $($file.Name)"
        $failed++
    } else {
        $uploaded++
    }
}

Write-Host "Upload complete: $uploaded succeeded, $failed failed."
if ($failed -gt 0) {
    exit 1
}
