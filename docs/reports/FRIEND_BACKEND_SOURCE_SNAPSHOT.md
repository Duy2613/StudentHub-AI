# Friend Backend Source Snapshot

**Status:** `PINNED_READ_ONLY`

**Audit timestamp:** `2026-09-02T15:49:52.1019735+07:00`

**Repository:** `https://github.com/anhkt015/StudentHub-AI.git`

**Branch:** `develop`

**Pinned commit:** `0625b1b950f29edd714507e485284208207039fb`

**Commit timestamp:** `2026-09-01T16:58:49+07:00`

**Commit subject:** `feat: support user pro expert layer4 modes`

## Capture method

The branch was resolved with `git ls-remote`, then cloned into an isolated temporary directory for read-only inspection. No push, commit, merge, issue, deployment, database mutation, credential rotation, or remote configuration change was performed.

The clone exposes 23 reachable commits, one remote branch (`origin/develop`), no tags, and 63 tracked files. The snapshot is tied to the commit above; future compatibility work must not target the moving `develop` branch without re-pinning it.

## Security handling

Values that can be credentials are intentionally omitted from this document. The pinned source contains a tracked literal PostgreSQL connection-string password in:

`backend/StudentHub.API/appsettings.json:3`

This is classified as `SECRET_ROTATION_REQUIRED`. The affected environment is a Supabase-hosted PostgreSQL connection configured through the `DefaultConnection` setting. The value must be revoked and rotated by an operator, the complete reachable Git history and deployment configuration must be checked, and the replacement must be supplied through a secret store. Deleting or editing the file alone is not sufficient.

Historical Git metadata also shows compiled configuration artifacts under `backend/StudentHub.API/bin/Debug/net10.0/` were tracked by an earlier commit. Those artifacts are an additional history-review surface; their contents are not reproduced here.

## Relevant source manifest

The following manifest records the source files used for the Phase A reconciliation. Hashes are SHA-256 values of the pinned checkout and do not contain credential values.

| Path | Bytes | SHA-256 |
| --- | ---: | --- |
| `backend/StudentHub.API/StudentHub.API.csproj` | 1509 | `8d67508e1ceab7548921380472fb4b517a90487bf24f3a59d1232fa282a8cd05` |
| `backend/StudentHub.API/Program.cs` | 3362 | `ea0c846df0dedd76c9c8da6c1d0c8345a6cd0bc8613e0873d86ce2c02c991f96` |
| `backend/StudentHub.API/appsettings.json` | 1036 | `28a458cf6e2507d657af81f009fa397bf4ff030b84695e8722fba8c28324a48b` |
| `backend/StudentHub.API/appsettings.Development.json` | 127 | `73f95f9e0ceb205fc1c4dc50c07697fcfa29d7087868c2aef1d504cb38c771ec` |
| `backend/StudentHub.API/Controllers/AuthController.cs` | 4328 | `e5ae74c5d33a761801abe22dbd79b3219398b96ef7e6b199b67a6c6fb0edc46e` |
| `backend/StudentHub.API/Controllers/UsersController.cs` | 912 | `5e5c2094fb449811f13399cb1eef7f2f7f4666f4b913fa61191d0390b5a7012e` |
| `backend/StudentHub.API/Controllers/Verification/VerificationController.cs` | 1688 | `565b9bc9b48576aa4345a3d11e810117117b19006cad043c4ffb38b63a109904` |
| `backend/StudentHub.API/Controllers/Verification/Layer3VerificationController.cs` | 1698 | `5e5f4f9fde0992f37d53e5809df2953ee1210cb1ab8caaf0e4b6c8f976c2c8ec` |
| `backend/StudentHub.API/Controllers/Verification/Layer4VerificationController.cs` | 2692 | `43c4fb5be583a2f073466c1c0da882a176e9481eba54186c9b93254249661120` |
| `backend/StudentHub.API/Data/AppDbContext.cs` | 299 | `c5bb38048a10ed11a86ff39507d02c44de5c76ba70285aa4016813dc493e321d` |
| `backend/StudentHub.API/Models/User.cs` | 535 | `aae401b26ac732ca6c6a845e4e5e8115fa7ae387a6d9be35067335bf89c0773e` |
| `backend/StudentHub.API/DTOs/UserResponseDto.cs` | 242 | `db9ffedfb784690f7b807fa6df528e6da64ae4d2bfc3b4f6d7b16c540e698fba` |
| `backend/StudentHub.API/DTOs/Verification/Layer2VerifyRequest.cs` | 125 | `59ba5be0c3b8b8a5edbe3aa08d3e3c4a3d24e69c59ceb75d134cdf7bdd0f04a3` |
| `backend/StudentHub.API/DTOs/Verification/Layer2VerifyResponse.cs` | 350 | `0760873b127201eb401c5b66e80a0509520ea62578232a9f34f8fca01bc1925d` |
| `backend/StudentHub.API/DTOs/Verification/Layer3VerifyRequest.cs` | 123 | `fbeafab58b1e6a5bd9ea415cd2afe84f7ecaf5f42cf9b26815619ec0115f96c2` |
| `backend/StudentHub.API/DTOs/Verification/Layer4VerifyRequest.cs` | 520 | `a5e65161a21b06f54fd4673c3dd07298c760718da219073b147ca793c4486584` |
| `backend/StudentHub.API/Services/Verification/ILayer2VerificationService.cs` | 501 | `0b77e64608f643c26106924dde531e53d7f2a802b9c4340e4955642cb8c3c0a9` |
| `backend/StudentHub.API/Services/Verification/ILayer3VerificationService.cs` | 656 | `6d41a6e05fd6be92803a96e821ab9ba76d9db1c07b20e29310c21dcc77608975` |
| `backend/StudentHub.API/Services/Verification/ILayer4VerificationService.cs` | 910 | `77e29dd37c987379f995798ff42b7c51b5e2af4c7e144576d4f66064bb414701` |
| `backend/StudentHub.API/Services/Verification/Layer2VerificationService.cs` | 8475 | `c36bad01665272a0031764a7e71e848a7f31f3726b0be54e4373b362c4b487ce` |
| `backend/StudentHub.API/Services/Verification/Layer3VerificationService.cs` | 9182 | `20426f35771354e6ece7804a002bcef45c27919480b62ce8045f72342e88a0bd` |
| `backend/StudentHub.API/Services/Verification/Layer4VerificationService.cs` | 29996 | `5060e30d0f4329f50c43b1167897fca46c04e67b168cb0c58701eaab7872e912` |
| `backend/StudentHub.API/Migrations/20260808064703_InitialCreate.cs` | 1812 | `0d6b2e3c4fb7b2e08b6a91df7e6c03b94b45d9dd149b1492cbff1dfc4d8ed2bf` |
| `backend/StudentHub.API/Migrations/AppDbContextModelSnapshot.cs` | 2283 | `f65bb09bce8c6b5a013d41e8154e3088571a798fcb3f9943b06f0647dd1e38c4` |
| `backend/StudentHub.API/Dockerfile` | 495 | `8d09ace9c4d3e3c0b5469eac44d1bb142ad2ae503b7f5623a3f5484ef697b5bd` |
| `Dockerfile` | 471 | `6b8596b873125af5b8fc6d2c5793cd79f5452c6b5814fef939a970a786fd3ced` |

## Pinning conclusion

`develop` is now a reproducible source reference for contract extraction. It is not an approved runtime dependency, not the canonical StudentHub data plane, and not safe to decommission or promote without the reconciliation, adapter, shadow, rollback, staging, and live gates defined by the evolution program.
