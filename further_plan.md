# CMS Completion Plan

## 1. Service Client Updates (Priority)
- Create admin Supabase client using service key for privileged operations
- Update services to use admin client for CRUD operations

## 2. Storage Setup
- Create storage buckets in Supabase:
  - `location-images` (exists in code)
  - `experience-images` (needs implementation)
- Configure CORS for both buckets

## 3. Image Handling Implementation
- Add `ExperienceImage` type
- Implement experience image operations in `ExperiencesService`:
  - Upload
  - Add to database
  - Delete
  - Update order

## 4. UI Updates
- Add image upload components to experience forms
- Update experience edit/create forms to handle images
- Add image preview/delete functionality

## Implementation Order
1. Admin client setup (enables CRUD)
2. Storage configuration
3. Experience image handling
4. UI components

## Success Criteria
- [x] Environment variables configured
- [ ] CRUD operations working
- [ ] Image upload working for both locations and experiences
- [ ] Clean UI for image management 