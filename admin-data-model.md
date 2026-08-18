# NITER EEE Alumni Administration Data Model

The public directory and the secured administration system will use the same records. The public site reads only published fields and job posts; administrative updates therefore appear automatically without copying data between systems.

| Entity | Core responsibility | Administrative access |
|---|---|---|
| `admin_roles` | Assigns **super_admin** or **editor** access to authenticated users | Super admin only |
| `alumni` | Stores directory identity, location, public status, photo, and profile fields | Super admin and editor |
| `batches` | Stores batch number, session, and display metadata | Super admin and editor |
| `districts` | Stores district names and directory context | Super admin and editor |
| `jobs` | Stores job content, publication status, deadline, and application details | Super admin and editor |
| `gallery_items` | Stores gallery media metadata and publication state | Super admin and editor |
| `site_content` | Stores editable homepage, about, and contact copy | Super admin and editor |
| `activity_logs` | Records sensitive create, edit, delete, publish, and role-management actions | Readable by super admin |

## Reusable Alumni Profile Contract

Every alumni record has its own profile values: session, student ID, blood group, school, college, BSc, MSc, skill, research activities, current work, previous work, and social links. The shared public template reads these values independently; missing values render as `-` without changing another alumnus’s profile.

## Authorization Contract

Authentication uses the installed Manus OAuth system. The project owner is bootstrapped as the initial **super_admin**. Users without an explicit role cannot access `/admin`. Editors may manage operational content; destructive role assignment and audit-log access remain restricted to super admins.
