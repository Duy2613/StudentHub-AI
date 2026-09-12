# Community Media and Source Safety

Public source references accept only bounded `http`/`https` URLs without
credentials, loopback/private/link-local destinations, or tracking parameters
that carry identifiers. Canonicalization is deterministic and strips known
tracking keys. A source cluster groups likely copies; it does not establish
independence or truth by itself.

Private uploads stay in the existing private file-object flow. Binary magic,
extension, dimensions, OCR, QR, EXIF/location, visible identifiers, and
identity-document checks run before publication. Original object keys,
provider tokens, raw OCR, QR content, and private metadata never enter public
DTOs or summaries. A privacy finding blocks publication until a new preview
digest is produced.

Source status is append-only: `AVAILABLE`, `UPDATED`, `UNAVAILABLE`,
`RETRACTED`, or `UNKNOWN`. Retraction makes dependent Community freshness
stale and may notify the owner, but never deletes history or changes Trust.
