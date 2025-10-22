import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPermissionPrompts(server: McpServer) {
  server.registerPrompt(
    "audit-permissions",
    {
      title: "Server Permissions Audit",
      description: "Analyze and suggest permission improvements for security",
      argsSchema: {
        guildId: z.string().describe("Server/Guild ID to audit"),
        auditScope: z
          .enum(["full", "roles", "channels", "members"])
          .optional()
          .describe("Scope of the permissions audit"),
      },
    },
    ({ guildId, auditScope = "full" }) => {
      const scopeGuides: Record<string, string> = {
        full: `FULL SERVER AUDIT:
Comprehensive security and permissions review covering:
- Role hierarchy and permissions
- Channel-specific permission overrides
- Administrative access distribution
- Dangerous permission assignments
- Bot permission requirements
- Member role assignments`,

        roles: `ROLE PERMISSIONS AUDIT:
Focused review of role configuration:
- Role hierarchy ordering
- Permission escalation risks
- Dangerous permissions (Admin, ManageRoles, etc.)
- Role distribution and usage
- Managed vs. manual roles`,

        channels: `CHANNEL PERMISSIONS AUDIT:
Review channel-specific access:
- Permission overrides per channel
- Public vs. private channel access
- Role-based channel restrictions
- Category-level permissions
- NSFW channel protections`,

        members: `MEMBER PERMISSIONS AUDIT:
Individual member access review:
- High-privilege member count
- Admin and moderator assignments
- Unusual permission grants
- Member role assignments
- Bot member permissions`,
      };

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Server Permissions Security Audit

Guild ID: ${guildId}
Audit Scope: ${auditScope.toUpperCase()}

${scopeGuides[auditScope]}

SECURITY AUDIT PROCESS:

1. GATHER CURRENT STATE:
   - Use get_server_info for server overview
   - Use list_roles to get all roles with permissions
   - Use list_channels to see channel structure
   - Use list_members to understand member distribution

2. IDENTIFY SECURITY RISKS:

   HIGH RISK - Administrator Permission:
   - Roles with "Administrator" bypass all other permissions
   - Should only be assigned to server owner and trusted admins
   - Check: How many roles have Administrator?
   - Check: How many members have Administrator access?

   HIGH RISK - Role Management:
   - "ManageRoles" allows changing other member permissions
   - Should be limited to admin/senior mod roles
   - Can lead to privilege escalation
   - Check: Who can assign/remove roles?

   MEDIUM RISK - Channel Management:
   - "ManageChannels" allows restructuring server
   - "ManageWebhooks" can create security vulnerabilities
   - Should require moderator+ access

   MEDIUM RISK - Member Management:
   - "KickMembers" and "BanMembers" are powerful
   - Should be restricted to moderation team
   - Check: Are these separated appropriately?

   LOW RISK - Message Management:
   - "ManageMessages" for moderation
   - Should be given to moderators and helpers
   - Relatively safe permission

3. ANALYZE ROLE HIERARCHY:
   - Ensure admin roles are highest position
   - Moderator roles below admin but above members
   - Bot roles positioned appropriately for their function
   - No permission bypasses through position ordering

4. REVIEW CHANNEL OVERRIDES:
   - Private channels should deny @everyone Read access
   - Admin channels should only allow admin role
   - Mod channels should only allow mod+ roles
   - Check for conflicting permission overrides

5. GENERATE RECOMMENDATIONS:

   Based on findings, suggest:
   - Roles that need permission reduction
   - Members that should be reviewed for access level
   - Channel permission overrides that need fixing
   - Role hierarchy reordering if needed
   - New roles to create for better access control

DANGEROUS PERMISSIONS CHECKLIST:

Critical (Require highest trust):
- Administrator (full control)
- ManageGuild (server settings)
- ManageRoles (permission control)
- ManageWebhooks (security risk)

Important (Require moderation trust):
- BanMembers (permanent removal)
- KickMembers (temporary removal)
- ManageChannels (structure changes)
- ManageMessages (content moderation)
- ManageNicknames (identity management)

Moderate (Helper/Bot level):
- ModerateMembers (timeout)
- ManageEmojisAndStickers (cosmetic)
- ManageEvents (scheduling)

AUDIT REPORT STRUCTURE:

1. Executive Summary
   - Total roles analyzed
   - Total members with elevated permissions
   - Critical findings count
   - Overall risk level

2. Critical Findings
   - Specific security issues
   - Affected roles/channels/members
   - Potential impact

3. Recommendations
   - Prioritized action items
   - Suggested role changes
   - Permission adjustments needed

4. Best Practices
   - Role structure suggestions
   - Permission assignment guidelines
   - Ongoing security measures

Available tools:
- get_server_info: Server overview and statistics
- list_roles: All roles with permissions and member counts
- get_role_info: Detailed role information
- list_channels: Channel structure and types
- get_channel_details: Specific channel permissions
- list_members: Member list with role assignments
- get_member_info: Individual member details
- get_audit_logs: Recent permission changes (if available)

EXAMPLE ANALYSIS:

"Analyzing roles for ${guildId}...

Found 15 roles:
- 2 roles with Administrator permission (⚠️ HIGH RISK)
  - @Owner (1 member) ✓ Acceptable
  - @HeadAdmin (5 members) ⚠️ Review - Too many admins

- 3 roles with ManageRoles (⚠️ MEDIUM RISK)
  - @Admin (expected)
  - @SeniorMod (expected)
  - @Helper (🚨 CRITICAL - Helpers should not manage roles!)

Recommendations:
1. Remove Administrator from @HeadAdmin, use specific permissions instead
2. Remove ManageRoles from @Helper role immediately
3. Create @Moderator role with KickMembers, ManageMessages only
4. Audit 5 members with @HeadAdmin access"

Please begin the security audit by gathering server information.`,
            },
          },
        ],
      };
    },
  );
}
