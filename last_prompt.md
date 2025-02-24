Now ensure all colors are according to @brand_doc.md 

1. The dashboard layout
2. The logo from public is added on top right
3. Experience page, edits
4. pricing, items, images

All areas to have our brand design


Console Error

Error: Failed to upload image

Source
src\app\dashboard\experiences\[id]\images\page.tsx (145:17) @ handleSave

  143 |         if (!uploadResult.success || !uploadResult.data) {
  144 |           console.error('Upload failed:', uploadResult.error);
> 145 |           throw new Error(uploadResult.error || 'Failed to upload image');
      |                 ^
  146 |         }
  147 |
  148 |         // Add to database


Console Error

Upload failed: "Failed to upload image"

Source
src\app\dashboard\experiences\[id]\images\page.tsx (144:19) @ error

  142 |
  143 |         if (!uploadResult.success || !uploadResult.data) {
> 144 |           console.error('Upload failed:', uploadResult.error);
      |                   ^
  145 |           throw new Error(uploadResult.error || 'Failed to upload image');
  146 |         }
  147 |
Show ignored frames


Two errors when terying to upload image. Check how are we doing these operations

