import { z } from "zod";

// Discord snowflake ID
export const snowflakeSchema = z
  .string()
  .regex(/^\d{17,19}$/, "Must be a valid Discord snowflake ID");

// Embed schema
export const embedSchema = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  url: z.string().url().optional(),
  color: z.number().int().min(0).max(0xffffff).optional(),
  timestamp: z.string().datetime().optional(),
  footer: z
    .object({
      text: z.string().max(2048),
      iconURL: z.string().url().optional(),
    })
    .optional(),
  image: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  thumbnail: z
    .object({
      url: z.string().url(),
    })
    .optional(),
  author: z
    .object({
      name: z.string().max(256),
      url: z.string().url().optional(),
      iconURL: z.string().url().optional(),
    })
    .optional(),
  fields: z
    .array(
      z.object({
        name: z.string().max(256),
        value: z.string().max(1024),
        inline: z.boolean().optional(),
      }),
    )
    .max(25)
    .optional(),
});

// File attachment schema
export const fileSchema = z.object({
  name: z.string(),
  attachment: z.string().describe("File path or URL"),
  description: z.string().max(1024).optional(),
});

// Author schema
export const authorSchema = z.object({
  id: snowflakeSchema,
  username: z.string(),
  discriminator: z.string(),
  bot: z.boolean(),
  avatar: z.string().nullable(),
});

// Attachment schema
export const attachmentSchema = z.object({
  id: snowflakeSchema,
  filename: z.string(),
  size: z.number(),
  url: z.string().url(),
  contentType: z.string().optional(),
});

// Reaction schema
export const reactionSchema = z.object({
  emoji: z.string(),
  count: z.number(),
  me: z.boolean(),
});

// Message schema
export const messageSchema = z.object({
  id: snowflakeSchema,
  content: z.string(),
  author: authorSchema,
  timestamp: z.string().datetime(),
  editedTimestamp: z.string().datetime().nullable(),
  attachments: z.array(attachmentSchema),
  embeds: z.array(embedSchema),
  reactions: z.array(reactionSchema).optional(),
});

// Channel schema
export const channelSchema = z.object({
  id: snowflakeSchema,
  name: z.string(),
  type: z.number(),
  position: z.number().optional(),
  topic: z.string().nullable().optional(),
  nsfw: z.boolean().optional(),
  parentId: snowflakeSchema.nullable().optional(),
});

// Role schema
export const roleSchema = z.object({
  id: snowflakeSchema,
  name: z.string(),
  color: z.number(),
  position: z.number(),
  permissions: z.array(z.string()),
  managed: z.boolean(),
  mentionable: z.boolean(),
});

// Forum tag schema
export const forumTagSchema = z.object({
  id: snowflakeSchema,
  name: z.string(),
  emoji: z.string().nullable(),
});

// Webhook schema
export const webhookSchema = z.object({
  id: snowflakeSchema,
  token: z.string().optional(),
  url: z.string().url().optional(),
  name: z.string(),
  avatar: z.string().nullable(),
  channelId: snowflakeSchema,
});
