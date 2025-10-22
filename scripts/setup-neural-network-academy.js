import { Client, GatewayIntentBits} from "discord.js";
import { readFileSync } from "fs";

// Load environment variables
const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile
  .split("\n")
  .find((line) => line.startsWith("DISCORD_TOKEN="))
  ?.split("=")[1]
  .trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// MCP client helper
async function callMcpTool(toolName, args) {
  const response = await fetch("http://localhost:3001/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
      id: Date.now(),
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`MCP Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Role definitions from the guide
const ROLES = [
  {
    name: "Architect",
    color: 0xFF0000,
    permissions: ["Administrator"],
    hoist: true,
    mentionable: false,
    position: 18,
  },
  {
    name: "Neural Moderator",
    color: 0xFFA500,
    permissions: ["ManageMessages", "ManageThreads", "KickMembers", "BanMembers", "ModerateMembers", "ManageNicknames", "ViewAuditLog"],
    hoist: true,
    mentionable: true,
    position: 17,
  },
  {
    name: "Data Curator",
    color: 0xFFFF00,
    permissions: ["ManageMessages", "ManageThreads", "ManageEvents", "CreateEvents"],
    hoist: true,
    mentionable: true,
    position: 16,
  },
  {
    name: "AI Researcher",
    color: 0x9B59B6,
    permissions: ["CreatePublicThreads", "EmbedLinks", "AttachFiles", "UseExternalEmojis"],
    hoist: true,
    mentionable: true,
    position: 15,
  },
  {
    name: "ML Engineer",
    color: 0x3498DB,
    permissions: ["CreatePublicThreads", "EmbedLinks", "AttachFiles", "UseExternalEmojis"],
    hoist: true,
    mentionable: true,
    position: 14,
  },
  {
    name: "Data Scientist",
    color: 0x1ABC9C,
    permissions: ["CreatePublicThreads", "EmbedLinks", "AttachFiles"],
    hoist: true,
    mentionable: true,
    position: 13,
  },
  {
    name: "Neural Network",
    color: 0x2ECC71,
    permissions: ["CreatePublicThreads"],
    hoist: false,
    mentionable: false,
    position: 12,
  },
  {
    name: "Transformer",
    color: 0x27AE60,
    permissions: [],
    hoist: false,
    mentionable: false,
    position: 11,
  },
  {
    name: "Perceptron",
    color: 0x95A5A6,
    permissions: [],
    hoist: false,
    mentionable: false,
    position: 10,
  },
  {
    name: "NLP Specialist",
    color: 0xE91E63,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 9,
  },
  {
    name: "Computer Vision Expert",
    color: 0xFF5722,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 8,
  },
  {
    name: "Reinforcement Learning Enthusiast",
    color: 0x00BCD4,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 7,
  },
  {
    name: "LLM Developer",
    color: 0x673AB7,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 6,
  },
  {
    name: "Code Contributor",
    color: 0x607D8B,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 5,
  },
  {
    name: "Research Publisher",
    color: 0x795548,
    permissions: [],
    hoist: false,
    mentionable: true,
    position: 4,
  },
  {
    name: "Event Speaker",
    color: 0xFF9800,
    permissions: ["PrioritySpeaker"],
    hoist: false,
    mentionable: true,
    position: 3,
  },
  {
    name: "AI Assistant Bot",
    color: 0x00FFFF,
    permissions: ["SendMessages", "EmbedLinks", "AttachFiles", "ReadMessageHistory", "UseApplicationCommands"],
    hoist: false,
    mentionable: false,
    position: 2,
  },
  {
    name: "Verified Member",
    color: 0x000000, // Default
    permissions: [],
    hoist: false,
    mentionable: false,
    position: 1,
  },
];

client.once("ready", async () => {
  console.log(`\n${"=".repeat(70)}`);
  console.log("NEURAL NETWORK ACADEMY - SERVER SETUP");
  console.log(`${"=".repeat(70)}\n`);
  console.log(`✓ Connected as ${client.user.tag}\n`);

  const guild = client.guilds.cache.first();
  const guildId = guild.id;

  const createdRoles = {};
  const createdCategories = {};
  const createdChannels = {};

  try {
    // ===================================================================
    // PHASE 1: CREATE ROLES
    // ===================================================================
    console.log("PHASE 1: Creating Roles");
    console.log("-".repeat(70));

    for (const roleConfig of ROLES) {
      try {
        console.log(`Creating role: ${roleConfig.name}...`);

        const result = await callMcpTool("create_role", {
          guildId,
          name: roleConfig.name,
          color: roleConfig.color,
          hoist: roleConfig.hoist,
          mentionable: roleConfig.mentionable,
          permissions: roleConfig.permissions.length > 0 ? roleConfig.permissions : undefined,
        });

        createdRoles[roleConfig.name] = result.structuredContent.role.id;
        console.log(`  ✓ Created: ${roleConfig.name} (ID: ${createdRoles[roleConfig.name]})`);

        await delay(500); // Rate limiting
      } catch (error) {
        console.log(`  ✗ Failed to create ${roleConfig.name}: ${error.message}`);
      }
    }

    console.log(`\n✓ Created ${Object.keys(createdRoles).length}/${ROLES.length} roles\n`);

    // ===================================================================
    // PHASE 2: CREATE CATEGORIES
    // ===================================================================
    console.log("PHASE 2: Creating Categories");
    console.log("-".repeat(70));

    const CATEGORIES = [
      "📚 INITIALIZATION",
      "🧠 CORE LEARNING",
      "🔬 SPECIALIZATION DOMAINS",
      "💻 IMPLEMENTATION LAB",
      "🎯 RESEARCH & INNOVATION",
      "🎓 LEARNING PATHS",
      "🗣️ VOICE CHANNELS",
      "🤝 COMMUNITY & SOCIAL",
      "⚙️ ADMIN & MODERATION",
    ];

    for (const categoryName of CATEGORIES) {
      try {
        console.log(`Creating category: ${categoryName}...`);

        const result = await callMcpTool("create_category", {
          guildId,
          name: categoryName,
        });

        createdCategories[categoryName] = result.structuredContent.category.id;
        console.log(`  ✓ Created: ${categoryName} (ID: ${createdCategories[categoryName]})`);

        await delay(500);
      } catch (error) {
        console.log(`  ✗ Failed to create ${categoryName}: ${error.message}`);
      }
    }

    console.log(`\n✓ Created ${Object.keys(createdCategories).length}/${CATEGORIES.length} categories\n`);

    // ===================================================================
    // PHASE 3: CREATE CHANNELS
    // ===================================================================
    console.log("PHASE 3: Creating Channels");
    console.log("-".repeat(70));

    // CATEGORY 1: INITIALIZATION
    const initChannels = [
      {
        name: "system-prompt",
        type: "text",
        category: "📚 INITIALIZATION",
        topic: "Core instructions for optimal community performance",
      },
      {
        name: "model-updates",
        type: "text",
        category: "📚 INITIALIZATION",
        topic: "Latest patches and version updates for the community",
      },
      {
        name: "training-log",
        type: "text",
        category: "📚 INITIALIZATION",
        topic: "Scheduled training sessions and learning milestones",
      },
      {
        name: "token-economy",
        type: "text",
        category: "📚 INITIALIZATION",
        topic: "Credit system, role progression, and achievement tracking",
      },
      {
        name: "introduce-yourself",
        type: "text",
        category: "📚 INITIALIZATION",
        topic: "Initialize your presence - share your AI journey and interests",
        slowmode: 60,
      },
    ];

    // CATEGORY 2: CORE LEARNING
    const coreLearningChannels = [
      {
        name: "foundations",
        type: "forum",
        category: "🧠 CORE LEARNING",
        topic: "Building your neural pathways - fundamental concepts",
        tags: ["Python Basics", "Math Prerequisites", "Statistics 101", "First Steps", "Terminology"],
      },
      {
        name: "deep-learning",
        type: "forum",
        category: "🧠 CORE LEARNING",
        topic: "Dive into the deep end - neural network architectures and training",
        tags: ["Neural Networks", "CNN", "RNN/LSTM", "Transformers", "Architectures", "Backpropagation"],
      },
      {
        name: "machine-learning",
        type: "forum",
        category: "🧠 CORE LEARNING",
        topic: "Traditional algorithms and machine learning theory",
        tags: ["Supervised Learning", "Unsupervised Learning", "Feature Engineering", "Model Selection", "Ensemble Methods"],
      },
      {
        name: "mathematics-corner",
        type: "text",
        category: "🧠 CORE LEARNING",
        topic: "The mathematical backbone of AI - equations and proofs",
      },
      {
        name: "paper-reading-club",
        type: "forum",
        category: "🧠 CORE LEARNING",
        topic: "Decoding the research frontier - paper discussions and summaries",
        tags: ["ArXiv", "NeurIPS", "ICML", "CVPR", "Classic Papers", "Paper Summary"],
      },
    ];

    // CATEGORY 3: SPECIALIZATION DOMAINS
    const specializationChannels = [
      {
        name: "natural-language-processing",
        type: "forum",
        category: "🔬 SPECIALIZATION DOMAINS",
        topic: "Teaching machines to understand human language",
        tags: ["Tokenization", "Embeddings", "LLMs", "Fine-tuning", "Prompt Engineering", "BERT/GPT"],
      },
      {
        name: "computer-vision",
        type: "forum",
        category: "🔬 SPECIALIZATION DOMAINS",
        topic: "Giving machines the gift of sight",
        tags: ["Image Classification", "Object Detection", "Segmentation", "GANs", "Diffusion Models", "Video Analysis"],
      },
      {
        name: "reinforcement-learning",
        type: "forum",
        category: "🔬 SPECIALIZATION DOMAINS",
        topic: "Training agents through reward and exploration",
        tags: ["Q-Learning", "Policy Gradients", "PPO", "Multi-Agent", "Environments", "Robotics"],
      },
      {
        name: "llm-development",
        type: "forum",
        category: "🔬 SPECIALIZATION DOMAINS",
        topic: "Crafting the next generation of language models",
        tags: ["Architecture", "Training", "Fine-tuning", "RAG", "Deployment", "Evaluation"],
      },
      {
        name: "mlops-deployment",
        type: "text",
        category: "🔬 SPECIALIZATION DOMAINS",
        topic: "From jupyter notebook to production - deployment strategies",
      },
    ];

    // CATEGORY 4: IMPLEMENTATION LAB
    const implementationChannels = [
      {
        name: "code-review",
        type: "forum",
        category: "💻 IMPLEMENTATION LAB",
        topic: "Peer review and debugging assistance",
        tags: ["Python", "PyTorch", "TensorFlow", "JAX", "Bug Help", "Optimization"],
      },
      {
        name: "project-showcase",
        type: "forum",
        category: "💻 IMPLEMENTATION LAB",
        topic: "Deploy your creations - project demonstrations and portfolios",
        tags: ["Computer Vision", "NLP", "RL", "Web App", "Research", "Open Source"],
        slowmode: 120,
      },
      {
        name: "datasets-resources",
        type: "text",
        category: "💻 IMPLEMENTATION LAB",
        topic: "Fuel for your models - datasets, libraries, and learning resources",
      },
      {
        name: "compute-resources",
        type: "text",
        category: "💻 IMPLEMENTATION LAB",
        topic: "Hardware acceleration and cloud compute discussions",
      },
      {
        name: "github-integrations",
        type: "text",
        category: "💻 IMPLEMENTATION LAB",
        topic: "Real-time updates from community repositories",
      },
    ];

    // CATEGORY 5: RESEARCH & INNOVATION
    const researchChannels = [
      {
        name: "research-discussions",
        type: "forum",
        category: "🎯 RESEARCH & INNOVATION",
        topic: "Pushing the boundaries - research discussions and collaboration",
        tags: ["Novel Ideas", "Literature Review", "Methodology", "Experiments", "Results"],
      },
      {
        name: "sota-updates",
        type: "text",
        category: "🎯 RESEARCH & INNOVATION",
        topic: "Latest breakthroughs and benchmark achievements",
        slowmode: 60,
      },
      {
        name: "experiment-logs",
        type: "text",
        category: "🎯 RESEARCH & INNOVATION",
        topic: "Document your experiments - training logs and findings",
      },
      {
        name: "collaboration-board",
        type: "forum",
        category: "🎯 RESEARCH & INNOVATION",
        topic: "Connect and collaborate - find your research partners",
        tags: ["Looking for Team", "Research Collaboration", "Kaggle Competition", "Open Source", "Study Group"],
      },
    ];

    // CATEGORY 6: LEARNING PATHS
    const learningPathChannels = [
      {
        name: "beginner-bootcamp",
        type: "forum",
        category: "🎓 LEARNING PATHS",
        topic: "Structured 4-week introduction to AI/ML",
        tags: ["Week 1", "Week 2", "Week 3", "Week 4", "Assignments", "Questions"],
      },
      {
        name: "intermediate-workshops",
        type: "forum",
        category: "🎓 LEARNING PATHS",
        topic: "Level up your skills - intermediate workshops and projects",
        tags: ["Workshop Series", "Practical Projects", "Advanced Topics", "Case Studies"],
      },
      {
        name: "advanced-seminars",
        type: "forum",
        category: "🎓 LEARNING PATHS",
        topic: "Master class sessions - advanced AI/ML techniques",
        tags: ["Research Methods", "Advanced Theory", "Optimization", "Novel Techniques"],
      },
      {
        name: "study-groups",
        type: "text",
        category: "🎓 LEARNING PATHS",
        topic: "Form study groups and learn together",
      },
      {
        name: "career-guidance",
        type: "forum",
        category: "🎓 LEARNING PATHS",
        topic: "Navigate your AI career path",
        tags: ["Resume Review", "Interview Prep", "Job Postings", "Career Path", "Salary Discussion"],
      },
    ];

    // CATEGORY 7: VOICE CHANNELS
    const voiceChannels = [
      {
        name: "🔊 General Voice Lounge",
        type: "voice",
        category: "🗣️ VOICE CHANNELS",
        bitrate: 64000,
      },
      {
        name: "🎙️ Study Hall",
        type: "voice",
        category: "🗣️ VOICE CHANNELS",
        bitrate: 96000,
        userLimit: 25,
      },
      {
        name: "🎤 Workshop Stage",
        type: "stage",
        category: "🗣️ VOICE CHANNELS",
        topic: "Live presentations and workshops",
      },
      {
        name: "🎧 Pair Programming",
        type: "voice",
        category: "🗣️ VOICE CHANNELS",
        bitrate: 96000,
        userLimit: 10,
      },
      {
        name: "🔬 Research Discussion Room",
        type: "voice",
        category: "🗣️ VOICE CHANNELS",
        bitrate: 96000,
        userLimit: 15,
      },
      {
        name: "🎮 Reinforcement Learning Lab",
        type: "voice",
        category: "🗣️ VOICE CHANNELS",
        bitrate: 96000,
        userLimit: 20,
      },
    ];

    // CATEGORY 8: COMMUNITY & SOCIAL
    const communityChannels = [
      {
        name: "general-chat",
        type: "text",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Casual conversations and community bonding",
        slowmode: 5,
      },
      {
        name: "memes-and-humor",
        type: "text",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Overfitting jokes and gradient descent into comedy",
        slowmode: 10,
      },
      {
        name: "achievements",
        type: "text",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Celebrate community achievements and milestones",
      },
      {
        name: "ask-ai-assistant",
        type: "text",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Ask questions to our AI assistants",
        slowmode: 3,
      },
      {
        name: "weekly-challenges",
        type: "forum",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Weekly challenges to sharpen your skills",
        tags: ["Week 1", "Week 2", "Solutions", "Discussion"],
      },
      {
        name: "book-club",
        type: "forum",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Learn together through books and literature",
        tags: ["Deep Learning Book", "Pattern Recognition", "Currently Reading", "Recommendations"],
      },
      {
        name: "feedback-suggestions",
        type: "forum",
        category: "🤝 COMMUNITY & SOCIAL",
        topic: "Help us optimize the server experience",
        tags: ["Bug Report", "Feature Request", "Improvement", "Resolved"],
      },
    ];

    // CATEGORY 9: ADMIN & MODERATION
    const adminChannels = [
      {
        name: "mod-chat",
        type: "text",
        category: "⚙️ ADMIN & MODERATION",
        topic: "Internal moderator coordination",
        private: true,
      },
      {
        name: "mod-logs",
        type: "text",
        category: "⚙️ ADMIN & MODERATION",
        topic: "Automated logging of moderation actions",
        private: true,
      },
      {
        name: "admin-commands",
        type: "text",
        category: "⚙️ ADMIN & MODERATION",
        topic: "Administrative bot commands and testing",
        private: true,
      },
      {
        name: "verification-queue",
        type: "text",
        category: "⚙️ ADMIN & MODERATION",
        topic: "Review and verify new members",
        private: true,
      },
    ];

    // Combine all channels
    const ALL_CHANNELS = [
      ...initChannels,
      ...coreLearningChannels,
      ...specializationChannels,
      ...implementationChannels,
      ...researchChannels,
      ...learningPathChannels,
      ...voiceChannels,
      ...communityChannels,
      ...adminChannels,
    ];

    // Create channels
    for (const channelConfig of ALL_CHANNELS) {
      try {
        const categoryId = createdCategories[channelConfig.category];

        if (!categoryId) {
          console.log(`  ✗ Category not found for ${channelConfig.name}: ${channelConfig.category}`);
          continue;
        }

        console.log(`Creating ${channelConfig.type} channel: ${channelConfig.name}...`);

        let result;

        if (channelConfig.type === "text") {
          result = await callMcpTool("create_text_channel", {
            guildId,
            name: channelConfig.name,
            topic: channelConfig.topic,
            parent: categoryId,
            nsfw: false,
          });

          createdChannels[channelConfig.name] = result.structuredContent.channel.id;

          // Set slowmode if specified
          if (channelConfig.slowmode) {
            await callMcpTool("modify_channel", {
              channelId: createdChannels[channelConfig.name],
              slowmode: channelConfig.slowmode,
            });
          }
        } else if (channelConfig.type === "forum") {
          result = await callMcpTool("create_forum_channel", {
            guildId,
            name: channelConfig.name,
            topic: channelConfig.topic,
            parent: categoryId,
            tags: channelConfig.tags,
          });

          createdChannels[channelConfig.name] = result.structuredContent.forum.id;

          // Set slowmode if specified
          if (channelConfig.slowmode) {
            await callMcpTool("modify_channel", {
              channelId: createdChannels[channelConfig.name],
              slowmode: channelConfig.slowmode,
            });
          }
        } else if (channelConfig.type === "voice") {
          result = await callMcpTool("create_voice_channel", {
            guildId,
            name: channelConfig.name,
            parent: categoryId,
            bitrate: channelConfig.bitrate,
            userLimit: channelConfig.userLimit,
          });

          createdChannels[channelConfig.name] = result.structuredContent.channel.id;
        } else if (channelConfig.type === "stage") {
          result = await callMcpTool("create_stage_channel", {
            guildId,
            name: channelConfig.name,
            topic: channelConfig.topic,
            parent: categoryId,
          });

          createdChannels[channelConfig.name] = result.structuredContent.channel.id;
        }

        console.log(`  ✓ Created: ${channelConfig.name} (ID: ${createdChannels[channelConfig.name]})`);

        await delay(1000); // Rate limiting
      } catch (error) {
        console.log(`  ✗ Failed to create ${channelConfig.name}: ${error.message}`);
      }
    }

    console.log(`\n✓ Created ${Object.keys(createdChannels).length}/${ALL_CHANNELS.length} channels\n`);

    // ===================================================================
    // SUMMARY
    // ===================================================================
    console.log("\n" + "=".repeat(70));
    console.log("SETUP COMPLETE");
    console.log("=".repeat(70));
    console.log(`\nRoles Created: ${Object.keys(createdRoles).length}/${ROLES.length}`);
    console.log(`Categories Created: ${Object.keys(createdCategories).length}/${CATEGORIES.length}`);
    console.log(`Channels Created: ${Object.keys(createdChannels).length}/${ALL_CHANNELS.length}`);
    console.log("\nNeural Network Academy is ready for learning! 🧠\n");

    process.exit(0);
  } catch (error) {
    console.error("\n✗ Fatal error during setup:", error);
    process.exit(1);
  }
});

client.login(TOKEN);
