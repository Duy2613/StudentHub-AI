# StudentHub AI — Private Screenshot Storage Contract

**Status:** PREPARED_FOR_REVIEW / NOT_DEPLOYED  
**Canonical bucket:** trust-screenshots-private  
**Maximum object size:** 8 MiB  
**Allowed MIME types:** image/png, image/jpeg, image/webp

## Object identity

Every object key is generated server-side as:

owner UUID / opaque object UUID.extension

Original filenames are never persisted as object keys or metadata. The owner prefix is required by Storage RLS and is not a substitute for authentication.

## Access boundary

- Bucket is private.
- Anonymous read, insert, and delete are denied.
- Authenticated upload is limited to the caller's owner UUID prefix.
- Authenticated read and delete are limited to the caller's owner UUID prefix.
- Expert, moderator, and admin access is not implicit; it requires a separately authorized server route.
- Screenshot metadata writes are service-controlled so clients cannot forge ownership, case linkage, hash, size, or retention fields.

## Metadata

public.screenshot_objects stores owner, optional Trust case, fixed bucket, opaque object key, MIME type, byte size, SHA-256, creation time, expiry, and deletion marker. It deliberately does not store an original filename or screenshot body.

## Required application workflow

1. Authenticate the user through the server session boundary.
2. Validate MIME, byte size, and image decoding before accepting the object.
3. Generate the owner-scoped opaque key.
4. Upload to the private bucket.
5. Compute and persist metadata through the server boundary.
6. Return only a short-lived controlled or signed retrieval URL.
7. Delete both object and metadata through an owner-authorized operation.

The review migration is database/migrations/202609010001_private_screenshot_storage.sql. It has not been executed against any remote project.
