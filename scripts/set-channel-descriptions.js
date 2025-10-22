import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find((line) => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Channel descriptions mapping
const descriptions = {
  // CORE LEARNING
  "foundations": "Start your AI/ML journey here! Learn Python, NumPy, Pandas, and essential ML libraries. Post questions about getting started, share beginner resources, and find study buddies. No question is too basic!",

  "deep-learning": "Deep dive into neural networks! Discuss architectures (CNNs, RNNs, Transformers), frameworks (PyTorch, TensorFlow), training techniques, and research breakthroughs. Share your model experiments and get feedback.",

  "machine-learning": "Classical ML algorithms and techniques. Decision Trees, Random Forests, SVMs, clustering, dimensionality reduction, feature engineering, and model evaluation. Bridge theory to practice!",

  "mathematics-corner": "The math behind ML! Linear algebra, calculus, probability, statistics, and optimization. Share derivations, ask for intuition, discuss mathematical concepts. Visual explanations welcome!",

  "paper-reading-club": "Read and discuss research papers together! Share papers, post summaries, debate methodologies, and stay current with cutting-edge research. Use the three-pass approach shared in the pinned guide.",

  // SPECIALIZATION DOMAINS
  "computer-vision": "Image processing, object detection, segmentation, GANs, diffusion models, and everything visual! Discuss architectures like ResNet, YOLO, Vision Transformers, and share your CV projects.",

  "natural-language-processing": "Text processing, transformers, attention mechanisms, tokenization, embeddings, and sequence modeling. Discuss BERT, GPT, T5, and modern NLP architectures.",

  "llm-development": "Large Language Model development, training, fine-tuning, RLHF, prompt engineering, and deployment. Share experiences with GPT, Claude, Llama, and other LLMs.",

  "reinforcement-learning": "Agents, environments, rewards, Q-learning, policy gradients, PPO, SAC, and more! Discuss OpenAI Gym, stable-baselines3, game AI, and robotics applications.",

  "mlops-deployment": "Production ML systems! Model serving, monitoring, CI/CD pipelines, containerization, orchestration, scaling, and MLOps best practices. Docker, Kubernetes, MLflow, and cloud platforms.",

  // IMPLEMENTATION LAB
  "code-review": "Get feedback on your ML code! Post snippets, full projects, or architectures for constructive review. Help others improve their code quality and learn from peer feedback.",

  "project-showcase": "Show off your completed projects! Share demos, architectures, results, and lessons learned. Celebrate wins and inspire others with your work!",

  "github-integrations": "GitHub activity, repository updates, PR discussions, and collaborative development. Connect your repos and track progress on open-source ML projects.",

  "training-log": "Log your training runs, share hyperparameters, discuss convergence issues, and celebrate breakthroughs! Track experiments, compare results, and learn from failures.",

  "model-updates": "Stay updated on latest model releases! New versions of PyTorch, TensorFlow, Transformers library updates, new model architectures, and breaking changes.",

  "experiment-logs": "Document your experiments, ablation studies, and hypothesis testing. Share what worked, what didn't, and why. Scientific method applied to ML!",

  "datasets-resources": "Share and discover datasets! Public datasets, data collection techniques, data cleaning tips, synthetic data generation, and data augmentation strategies.",

  "compute-resources": "Discuss GPUs, TPUs, cloud platforms (AWS, GCP, Azure), local hardware builds, Colab, Kaggle kernels, and compute optimization. Share deals and free tier hacks!",

  // RESEARCH & INNOVATION
  "research-discussions": "Discuss latest research trends, methodologies, experimental designs, and novel ideas. Brainstorm research directions and collaborate on investigations.",

  "sota-updates": "State-of-the-art model updates! New benchmarks, SOTA results, leaderboard changes, and breakthrough performances. Track progress in computer vision, NLP, and RL.",

  // LEARNING PATHS
  "beginner-bootcamp": "Structured beginner learning path. Follow along with bootcamp curriculum, post progress updates, ask bootcamp-specific questions, and support fellow beginners.",

  "intermediate-workshops": "Intermediate-level workshops and tutorials. More advanced topics than foundations but not quite research-level. Practical implementations and deeper dives.",

  "advanced-seminars": "Advanced topics for experienced practitioners. Cutting-edge techniques, research replication, advanced mathematics, and optimization strategies.",

  "ai-engineering-paths": "Career paths in AI/ML! ML Engineer, Research Scientist, Data Scientist, MLOps Engineer paths. Share roadmaps, certifications, and career advice.",

  // COMMUNITY & SOCIAL
  "introduce-yourself": "Welcome! Introduce yourself to the community. Share your background, interests, goals, and what brought you here. Find people with similar interests!",

  "general-chat": "Off-topic discussions, casual conversations, and community bonding. Share memes, news, and non-technical chat. Keep it friendly and inclusive!",

  "memes-and-humor": "ML memes, AI humor, training jokes, and lighthearted content. Share funny experiences, debugging stories, and laugh together!",

  "study-groups": "Form study groups! Coordinate study schedules, share progress, hold each other accountable, and learn together. Great for courses, books, and papers.",

  "achievements": "Celebrate your wins! Course completions, successful projects, job offers, paper acceptances, Kaggle medals, and personal milestones. We're proud of you!",

  "career-guidance": "Career advice, interview prep, resume reviews, job hunting strategies, salary discussions, and professional development in AI/ML.",

  "book-club": "Read and discuss ML/AI books together! Suggest books, organize reading schedules, discuss chapters, and deepen your understanding through discussion.",

  "ask-ai-assistant": "Ask questions to the AI assistant! Get help with concepts, debugging, explanations, resource recommendations, and learning guidance.",

  // COMMUNITY EVENTS
  "weekly-challenges": "Weekly coding/ML challenges! Test your skills, learn new techniques, and compete with the community. Challenges posted every Monday!",

  "collaboration-board": "Find collaborators for projects! Post project ideas, look for teammates, form research groups, and build together.",

  "feedback-suggestions": "Suggest improvements to the server! Request new channels, features, resources, or changes. Help shape this community!",

  // ADMIN & MODERATION
  "the-forum": "Admin-only: Server planning, decisions, and administrative discussions.",

  "general": "Admin-only: General administrative communications and coordination.",

  "mod-chat": "Moderators: Coordinate moderation activities, discuss issues, and plan community events.",

  "mod-logs": "Automated moderation logs. Track kicks, bans, warnings, and moderator actions.",

  "admin-commands": "Admin command testing and bot management. Test new features before rolling out to the community.",

  "verification-queue": "User verification queue. New members await verification before gaining full server access.",

  "system-prompt": "System configuration and bot prompts. Technical configuration for server automation and AI assistants.",

  "token-economy": "Track server economy, points system, achievements, and gamification elements (if enabled).",
};

client.once("ready", async () => {
  console.log("Setting channel descriptions...\n");

  const guild = client.guilds.cache.first();
  const channels = guild.channels.cache;

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [id, channel] of channels) {
    // Skip categories and voice channels (they don't have topics)
    if (channel.type === 4 || channel.type === 2 || channel.type === 13) {
      continue;
    }

    const description = descriptions[channel.name];

    if (!description) {
      console.log(`⊘ Skipping ${channel.name} (no description defined)`);
      skipped++;
      continue;
    }

    try {
      await channel.edit({
        topic: description,
        reason: "Adding channel descriptions for community clarity",
      });
      console.log(`✓ Updated ${channel.name}`);
      updated++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Failed to update ${channel.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Updated: ${updated}`);
  console.log(`  ⊘ Skipped: ${skipped}`);
  console.log(`  ✗ Errors: ${errors}`);

  process.exit(0);
});

client.login(TOKEN);
