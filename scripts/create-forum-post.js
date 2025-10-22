import { Client, GatewayIntentBits } from 'discord.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read token from .env file
const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const token = envFile
  .split('\n')
  .find(line => line.startsWith('DISCORD_TOKEN='))
  ?.split('=')[1]
  .trim();

if (!token) {
  console.error('❌ DISCORD_TOKEN not found in .env file');
  console.error('Please create a .env file with your Discord bot token:');
  console.error('  cp .env.example .env');
  console.error('  # Edit .env and add your token');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const forumChannelId = '1430342466963509288'; // ai-engineering-paths
    const forum = await client.channels.fetch(forumChannelId);

    if (!forum.isThreadOnly()) {
      console.error('Channel is not a forum!');
      process.exit(1);
    }

    console.log(`Creating thread in forum: ${forum.name}`);

    // Create the forum post (thread)
    const thread = await forum.threads.create({
      name: 'AI Engineering: Complete Field Assessment & Learning Framework',
      message: {
        content: `# AI Engineering: Complete Field Assessment & Learning Framework

## Introduction: What is AI Engineering?

AI Engineering is the discipline of **building, deploying, and maintaining artificial intelligence systems in production**. Unlike pure research (which focuses on advancing the state-of-the-art) or pure software engineering (which focuses on traditional applications), AI Engineering sits at the intersection—taking theoretical AI/ML concepts and turning them into reliable, scalable, production systems.

**Think of it this way:**
- **AI Researchers** invent new recipes
- **AI Engineers** run the restaurant at scale
- **AI Application Engineers** create the menu and customer experience

This field emerged because deploying AI systems requires unique skills beyond traditional software engineering: understanding probabilistic systems, managing data quality at scale, monitoring model drift, and building infrastructure for compute-intensive workloads.`,
      },
    });

    console.log(`Thread created: ${thread.name} (ID: ${thread.id})`);

    // Post additional sections as follow-up messages
    const sections = [
      `## The AI Engineering Landscape: Core Disciplines

AI Engineering is not a single role—it's a **family of specialized engineering disciplines**. Here's how they group together:

### 🔬 Foundation Builders (Research & Core ML)
Engineers who focus on advancing capabilities and building core ML systems.
**Roles:** AI Research Engineer, Machine Learning Scientist, Research Engineer

### 🏗️ Production Engineers (Deployment & Operations)
Engineers who take models from notebooks to production systems.
**Roles:** Machine Learning Engineer, MLOps Engineer, ML Platform Engineer

### 📊 Data Infrastructure Engineers
Engineers who build and maintain the data pipelines that feed AI systems.
**Roles:** ML Data Engineer, Feature Engineering Specialist, Data Platform Engineer

### 🎯 Applied AI Engineers (Integration & Applications)
Engineers who integrate AI capabilities into products and applications.
**Roles:** AI Application Engineer, LLM Engineer / Prompt Engineer, AI Integration Specialist

### 🔧 Domain Specialists
Engineers who specialize in specific AI domains (can overlap with above categories).
**Specializations:** Computer Vision Engineer, NLP Engineer, Speech/Audio ML Engineer, RL Engineer`,

      `## Universal Skills Matrix

Every AI Engineer needs a foundation across these dimensions, though depth varies by role.

### 📐 Mathematical Foundations

**Linear Algebra** - From basic matrix operations to tensor manipulation
**Calculus** - Derivatives, gradients, and multivariable optimization
**Probability & Statistics** - Distributions, inference, and Bayesian methods
**Optimization** - Gradient descent to advanced convex optimization

**Why this matters:** ML is fundamentally applied mathematics. Understanding *why* algorithms work helps debug when they don't.

**Resource Path:**
🟢 **Beginner**: Khan Academy (Linear Algebra, Statistics)
🟡 **Intermediate**: *Mathematics for Machine Learning* (Deisenroth et al.) - Free PDF
🔴 **Advanced**: Stanford CS229 Math Review, *Convex Optimization* (Boyd)`,

      `### 💻 Programming & Software Engineering

**Core Skills:**
- **Python** - From basic scripts to CPython internals
- **Data Structures & Algorithms** - Essential for efficient systems
- **Software Design** - Modular code to distributed architectures
- **Version Control (Git)** - Collaborative development workflows
- **Testing & CI/CD** - Ensuring reliability and reproducibility

**Why this matters:** AI systems are software systems. Poor engineering practices lead to unreproducible experiments, brittle pipelines, and unmaintainable code.

**Resource Path:**
🟢 **Beginner**: *Automate the Boring Stuff with Python*, Codecademy
🟡 **Intermediate**: *Fluent Python* (Ramalho), LeetCode problems
🔴 **Advanced**: *Designing Data-Intensive Applications* (Kleppmann)`,

      `### 🤖 Machine Learning Fundamentals

**Core Areas:**
- **Supervised Learning** - Classification, regression, feature engineering
- **Deep Learning** - Neural networks, CNNs, RNNs, Transformers
- **Model Evaluation** - Metrics, validation, statistical testing
- **ML Theory** - Bias-variance, generalization, PAC learning

**Why this matters:** This is your core domain knowledge—what makes you an *AI* engineer rather than just a software engineer.

**Resource Path:**
🟢 **Beginner**: Andrew Ng's Coursera ML Course, *Hands-On Machine Learning* (Géron)
🟡 **Intermediate**: Fast.ai courses, Stanford CS229
🔴 **Advanced**: *Deep Learning* (Goodfellow), *Pattern Recognition and ML* (Bishop)
⚫ **Expert**: Research papers on arXiv, conferences (NeurIPS, ICML, ICLR)`,

      `### 🛠️ ML Engineering & Production

**Critical Skills:**
- **Model Deployment** - From Flask to Kubernetes-scale serving
- **MLOps** - Experiment tracking, CI/CD for ML, automated retraining
- **Data Engineering** - Pipelines, validation, feature stores
- **Distributed Computing** - Training and inference at scale

**Why this matters:** Research code runs once. Production code runs forever. The gap between them is massive.

**Resource Path:**
🟢 **Beginner**: *Building ML Powered Applications* (Ameisen)
🟡 **Intermediate**: *Designing Machine Learning Systems* (Huyen), MLOps courses
🔴 **Advanced**: *Reliable Machine Learning* (Breck), cloud certifications (AWS ML, GCP ML)`,

      `### ☁️ Cloud & Infrastructure

**Key Areas:**
- **Cloud Platforms** - AWS/GCP/Azure ML services
- **Containerization** - Docker, Kubernetes orchestration
- **Infrastructure as Code** - Terraform, Pulumi
- **Monitoring & Observability** - Metrics, logging, tracing

**Why this matters:** Modern AI systems run in the cloud. Understanding infrastructure is essential for reliability and cost-effectiveness.

**Resource Path:**
🟢 **Beginner**: Cloud provider tutorials (AWS/GCP free tier)
🟡 **Intermediate**: *Kubernetes in Action* (Lukša), cloud architect certifications
🔴 **Advanced**: *Site Reliability Engineering* (Google), *Cloud Native Patterns* (Davis)`,

      `### 💬 Large Language Models & Gen AI (Emerging)

**Specialized Skills:**
- **Prompt Engineering** - Effective prompting to novel techniques
- **LLM Fine-tuning** - LoRA/PEFT to RLHF and DPO
- **RAG & Vector DBs** - Retrieval, chunking, hybrid search
- **LLM Deployment** - API usage to self-hosted multi-GPU inference

**Why this matters:** LLMs are transforming AI engineering. Even if you don't specialize in them, you'll interact with them.

**Resource Path:**
🟢 **Beginner**: OpenAI Cookbook, *Build a Large Language Model* (Raschka)
🟡 **Intermediate**: DeepLearning.AI LLM courses, Hugging Face docs
🔴 **Advanced**: Research papers (attention, RLHF, mixture-of-experts)`,

      `### 🧠 Soft Skills & Domain Knowledge

**Essential Skills:**
- **Communication** - Technical writing to thought leadership
- **Collaboration** - Code review to building engineering culture
- **Product Thinking** - Understanding requirements to product strategy
- **Ethics & Fairness** - Bias awareness to fairness research

**Why this matters:** Technical excellence alone doesn't create impact. You need to understand the problem, work with others, and communicate your work.

**Resource Path:**
- **Communication**: *The Pragmatic Programmer* (Thomas/Hunt), technical blog writing
- **Collaboration**: Open source contributions, team projects
- **Product**: *Inspired* (Cagan), work closely with PMs
- **Ethics**: *Fairness and Machine Learning* (Barocas et al.)`,

      `## Competency Framework by Role

Each role requires different depths across these skill areas.

### 🔬 AI Research Engineer
**Focus**: Advancing the state-of-the-art, publishing papers, inventing new algorithms.
🔴 **Critical (Expert-Advanced)**: ML Fundamentals, Math Foundations, Programming
🟡 **Important (Intermediate)**: ML Theory, Model Evaluation
🟢 **Helpful (Basic)**: MLOps, Cloud Infrastructure, Communication

### 🏗️ Machine Learning Engineer
**Focus**: Taking models from research/prototypes and deploying them to production.
🔴 **Critical (Advanced-Expert)**: ML Fundamentals, ML Engineering, Programming, Software Design
🟡 **Important (Intermediate)**: MLOps, Cloud Infrastructure, Data Engineering
🟢 **Helpful (Basic-Intermediate)**: Math Foundations, ML Theory

### ⚙️ MLOps Engineer
**Focus**: Building infrastructure and automation for the ML lifecycle.
🔴 **Critical (Advanced-Expert)**: MLOps, Cloud Infrastructure, DevOps, Software Engineering
🟡 **Important (Intermediate)**: ML Fundamentals, Data Engineering, Monitoring
🟢 **Helpful (Basic-Intermediate)**: Deep Learning, Distributed Systems`,

      `### 🏛️ ML Platform Engineer
**Focus**: Building internal tools and platforms that enable ML teams to be more productive.
🔴 **Critical (Advanced-Expert)**: Software Engineering, System Design, Cloud Infrastructure
🟡 **Important (Intermediate-Advanced)**: ML Fundamentals, MLOps, Data Engineering
🟢 **Helpful (Intermediate)**: Distributed Systems, API Design, Product Thinking

### 📊 ML Data Engineer
**Focus**: Building data pipelines, feature stores, and data infrastructure for ML systems.
🔴 **Critical (Advanced-Expert)**: Data Engineering, SQL, Data Pipelines, Software Engineering
🟡 **Important (Intermediate)**: ML Fundamentals, Distributed Computing, Cloud Infrastructure
🟢 **Helpful (Basic-Intermediate)**: ML Theory, Feature Engineering

### 🎯 AI Application Engineer
**Focus**: Integrating AI/ML capabilities into products and user-facing applications.
🔴 **Critical (Advanced)**: Software Engineering, API Design, ML Fundamentals
🟡 **Important (Intermediate)**: Product Thinking, LLMs & Gen AI, Model Deployment
🟢 **Helpful (Basic-Intermediate)**: Frontend Development, UX Design`,

      `### 🤖 LLM/Prompt Engineer
**Focus**: Working specifically with large language models—prompting, fine-tuning, RAG, deployment.
🔴 **Critical (Advanced)**: LLMs & Gen AI, Prompt Engineering, ML Fundamentals
🟡 **Important (Intermediate)**: Software Engineering, RAG & Vector DBs, Model Evaluation
🟢 **Helpful (Basic-Intermediate)**: NLP, Fine-tuning, Cloud Infrastructure

## Choosing Your Path: Decision Framework

### What energizes you most?
📝 **Publishing papers and advancing theory** → AI Research Engineer
🔨 **Building production systems that scale** → ML Engineer or MLOps Engineer
🏗️ **Creating tools that make others productive** → ML Platform Engineer
📊 **Working with data at scale** → ML Data Engineer
🎨 **Building user-facing features** → AI Application Engineer
🤖 **Working with cutting-edge LLMs** → LLM Engineer

### What's your background?
🎓 **PhD or strong research background** → AI Research Engineer, ML Engineer
💻 **Software engineering background** → ML Platform Engineer, AI Application Engineer, LLM Engineer
🔧 **DevOps/SRE background** → MLOps Engineer
📊 **Data engineering background** → ML Data Engineer`,

      `## Universal Prerequisites: The Foundation Layer

**Before diving into any specialized path, every AI Engineer should have:**

### Tier 0: Computing Fundamentals
Basic programming concepts, command line, how computers work
**Resources:** *Code* (Petzold), Harvard CS50

### Tier 1: Programming Foundations (3-6 months for beginners)
Python programming, data structures, Git, command line proficiency
**Resources:** *Automate the Boring Stuff*, Python for Everybody, Git Immersion

### Tier 2: Math Foundations (Can be learned alongside programming)
Linear algebra, calculus, probability and statistics
**Resources:** Khan Academy, 3Blue1Brown, *Mathematics for Machine Learning*

### Tier 3: Core ML Concepts (3-6 months)
Classical ML, neural networks, model evaluation, feature engineering
**Resources:** Andrew Ng's ML Specialization, *Hands-On Machine Learning*, Fast.ai

**Once you have Tiers 1-3, you're ready to specialize into specific paths.**`,

      `## Learning Strategy: Progressive Mastery

### The 70-20-10 Rule for AI Engineering
- **70% Hands-on practice**: Build projects, write code, deploy models
- **20% Learning from others**: Read code, attend talks, study papers
- **10% Structured learning**: Courses, books, tutorials

### Project-Based Learning Path
1. **Beginner**: Titanic survival prediction (Kaggle) - *Data cleaning, scikit-learn*
2. **Intermediate**: Build and deploy ML web app - *Flask/FastAPI, Docker, cloud*
3. **Advanced**: End-to-end ML system with monitoring - *MLOps, CI/CD, feature stores*
4. **Expert**: Contribute to open source ML framework - *Advanced engineering, collaboration*

### The T-Shaped Engineer
- **Horizontal bar (Breadth)**: Basic understanding across ALL areas
- **Vertical bar (Depth)**: Deep expertise in 2-3 areas relevant to your role

**Example for ML Engineer:**
Deep: ML Fundamentals, ML Engineering, Python
Medium: MLOps, Cloud, Data Engineering
Shallow: Math Theory, Research, LLMs`,

      `## Common Pitfalls & How to Avoid Them

❌ **Tutorial Hell** - Watching endless courses without building anything
✅ **Solution**: After each tutorial section, build something *without* following along

❌ **Math Paralysis** - Believing you need a math PhD before writing any code
✅ **Solution**: Learn math *as needed* for what you're building. Start practical, add theory later

❌ **Tool Hopping** - Constantly switching frameworks, never going deep
✅ **Solution**: Pick ONE framework (PyTorch or TensorFlow) and stick with it for 6+ months

❌ **Ignoring Software Engineering** - Writing notebook code that never makes it to production
✅ **Solution**: Every project you build, deploy it. Even if it's just a simple Flask app

❌ **Working in Isolation** - Never getting feedback on your work
✅ **Solution**: Contribute to open source, share projects on GitHub, join ML communities`,

      `## Essential Resources Hub

### 📚 Books Worth Owning
- *Hands-On Machine Learning* (Géron) - Best practical intro
- *Deep Learning* (Goodfellow et al.) - The "bible" of deep learning
- *Designing Machine Learning Systems* (Huyen) - Production ML
- *The Pragmatic Programmer* (Thomas/Hunt) - Essential engineering

### 🎓 Courses That Matter
- [Fast.ai](https://www.fast.ai/) - Practical deep learning
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/) - Production ML
- [DeepLearning.AI](https://www.deeplearning.ai/) - Comprehensive ML/DL specializations
- [MLOps Zoomcamp](https://github.com/DataTalksClub/mlops-zoomcamp) - Free MLOps course

### 🛠️ Tools to Master
- **ML Frameworks**: PyTorch or TensorFlow/Keras
- **Experiment Tracking**: Weights & Biases, MLflow
- **Deployment**: FastAPI, Docker, Kubernetes
- **Data**: Pandas, Polars, DuckDB
- **Cloud**: AWS SageMaker, GCP Vertex AI, Azure ML`,

      `### 🌐 Communities to Join
- [r/MachineLearning](https://www.reddit.com/r/MachineLearning/) - Research papers and discussions
- [MLOps Community](https://mlops.community/) - Production ML
- [Hugging Face Discord](https://huggingface.co/join/discord) - NLP/LLMs
- [Papers with Code](https://paperswithcode.com/) - Latest research with code

### 📰 Staying Current
- [The Batch](https://www.deeplearning.ai/the-batch/) - Weekly AI news (Andrew Ng)
- [Import AI](https://importai.substack.com/) - AI research newsletter (Jack Clark)
- arXiv Sanity - Curated ML papers
- Twitter/X - Follow key researchers and practitioners

## Final Thoughts

AI Engineering is a **learn-by-doing** field. Theory matters, but building matters more. Every great AI engineer has:

1. 💪 Built things that broke, then fixed them
2. 📖 Read code and papers they didn't fully understand at first
3. 🤝 Collaborated with people smarter than them
4. 🔄 Iterated relentlessly on their craft

**You don't need to know everything before you start. You need to start before you know everything.**

Pick a path. Build something. Ship it. Learn. Repeat.

Welcome to AI Engineering. 🚀`,
    ];

    // Post each section with a small delay
    for (let i = 0; i < sections.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await thread.send(sections[i]);
      console.log(`Posted section ${i + 1}/${sections.length}`);
    }

    console.log('\\nForum post complete!');
    console.log(`Thread URL: https://discord.com/channels/${thread.guildId}/${thread.id}`);

  } catch (error) {
    console.error('Error creating forum post:', error);
  }

  client.destroy();
  process.exit(0);
});

client.login(token);
