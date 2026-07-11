export interface LearningResource {
  title: string;
  type: 'video' | 'article' | 'exercise' | 'quiz' | 'project';
  url?: string;
  xp: number;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  parentId?: string;
  children?: RoadmapNode[];
  estimatedDuration?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  xp?: number;
  resources?: LearningResource[];
  skillsLearned?: string[];
  prerequisites?: string[];
  completionCriteria?: string;
}

export const AI_ENGINEER_ROADMAP: RoadmapNode = {
  id: "ai-engineer",
  title: "AI Engineer",
  description: "Comprehensive path to master prompt engineering, open-source models, embeddings, vector databases, RAG, agentic workflows, and multimodal interfaces.",
  difficulty: "Intermediate",
  estimatedDuration: "120 hours",
  xp: 5000,
  skillsLearned: ["AI Application Architecture", "LLM Integration", "Semantic Search", "RAG Systems", "Cognitive AI Agents"],
  children: [
    {
      id: "intro",
      title: "Introduction",
      description: "Foundational concepts defining the landscape of AI Engineering.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "6 hours",
      xp: 200,
      skillsLearned: ["Terminology Clarity", "Role Differentiation"],
      resources: [
        { title: "What is an AI Engineer?", type: "article", xp: 30 },
        { title: "AI Engineer vs ML Engineer Comparison", type: "video", xp: 50 },
        { title: "Introductory Terminology Quiz", type: "quiz", xp: 60 }
      ],
      children: [
        {
          id: "what-is-ai-eng",
          title: "What is an AI Engineer?",
          description: "Understanding the role, scope, and engineering expectations.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "How to Become an AI Engineer - Pace Online", type: "article", url: "https://online.pace.edu/articles/computer-science/how-to-become-an-ai-engineer/", xp: 30 },
            { title: "What Is an AI Engineer? | Re:Sourced", type: "article", url: "https://www.resourced.com.au/articles/what-is-an-ai-engineer", xp: 30 }
          ]
        },
        {
          id: "ai-vs-ml-eng",
          title: "AI Engineer vs ML Engineer",
          description: "Contrasting systems integration with training core models.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "Which Career Path Fits You? - IIT Kharagpur", type: "article", url: "https://online.iitkgp.ac.in/blog/ai-engineer-vs-ml-engineer-career-comparison", xp: 30 },
            { title: "Core Differences, Skills, and Salary - Simplilearn", type: "article", url: "https://www.simplilearn.com/ai-engineer-vs-ml-engineer-article", xp: 30 }
          ]
        },
        {
          id: "ai-vs-agi",
          title: "AI vs AGI",
          description: "Understanding narrow artificial intelligence versus artificial general intelligence.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "What is the difference between AGI vs AI? - ServiceNow", type: "article", url: "https://www.servicenow.com/ai/what-is-ai-vs-agi.html", xp: 30 },
            { title: "AI vs AGI vs ASI in 2026 - Kanerika", type: "article", url: "https://kanerika.com/blogs/ai-vs-agi-vs-asi/", xp: 30 },
            { title: "Understanding the Shift in Future of Intelligence - Medium", type: "article", url: "https://medium.com/@poorvis885/ai-vs-agi-understanding-the-shift-in-the-future-of-intelligence-56302a6fa38f", xp: 30 }
          ]
        },
        {
          id: "common-terminology",
          title: "Common Terminology",
          description: "Glossary of parameters, tokens, context windows, and inference.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "Artificial Intelligence Achievement Glossary - Globee Awards", type: "article", url: "https://globeeawards.com/artificial-intelligence-achievement-glossary/", xp: 30 },
            { title: "Artificial Intelligence - Terminology - TutorialsPoint", type: "article", url: "https://www.tutorialspoint.com/artificial_intelligence/artificial_intelligence_terminology.htm", xp: 30 }
          ]
        },
        {
          id: "impact-product",
          title: "Impact on Product Development",
          description: "How generative AI changes UI/UX design paradigms and product iteration.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "AI Engineer Roadmap - roadmap.sh", type: "article", url: "https://roadmap.sh/ai-engineer", xp: 30 },
            { title: "AI Trainer Job Description Template - Rework", type: "article", url: "https://resources.rework.com/libraries/job-description-templates/ai-trainer", xp: 30 }
          ]
        },
        {
          id: "roles-responsibilities",
          title: "Roles and Responsibilities",
          description: "Team dynamics, AI safety compliance, and API infrastructure maintenance.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "1 hour",
          xp: 50,
          resources: [
            { title: "AI Engineer Career: Job Description, Salary & Outlook - Arkansas State", type: "article", url: "https://degree.astate.edu/online-programs/undergraduate/bs-digital-technology-design/ai/career-path-salary-outlook/", xp: 30 },
            { title: "Roles and Responsibilities Industry-Wise - Taggd", type: "article", url: "https://taggd.in/blogs/ai-engineer-job-description-roles-and-responsibilites/", xp: 30 },
            { title: "What Does an AI Engineer Do? - Codecademy", type: "article", url: "https://www.codecademy.com/resources/blog/what-does-an-ai-engineer-do", xp: 30 }
          ]
        }
      ]
    },
    {
      id: "llm-fundamentals",
      title: "LLM Fundamentals",
      description: "Core mechanisms under the hood of Large Language Models.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "12 hours",
      xp: 400,
      resources: [
        { title: "Visualizing Transformer Architecture", type: "video", xp: 80 },
        { title: "Transformer Self-Attention Coding Exercise", type: "exercise", xp: 100 }
      ],
      children: [
        { id: "inference", title: "Inference", description: "How models generate text token by token.", parentId: "llm-fundamentals", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 50 },
        { id: "training", title: "Training", description: "Pre-training, fine-tuning, and alignment stages.", parentId: "llm-fundamentals", difficulty: "Intermediate", estimatedDuration: "3 hours", xp: 80 },
        { id: "embeddings-fundamental", title: "Embeddings", description: "Mapping text into high-dimensional vector space.", parentId: "llm-fundamentals", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 70 },
        { id: "vector-dbs-fundamental", title: "Vector Databases", description: "Indexed stores designed for fast vector similarity search.", parentId: "llm-fundamentals", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
        { id: "rag-fundamental", title: "RAG", description: "Retrieval-Augmented Generation context injection flows.", parentId: "llm-fundamentals", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
        { id: "prompt-eng-fundamental", title: "Prompt Engineering", description: "Techniques to elicit structured, reliable reasoning from LLMs.", parentId: "llm-fundamentals", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 50 },
        { id: "ai-agents-fundamental", title: "AI Agents", description: "Enabling LLMs with tools, memory loops, and planning capabilities.", parentId: "llm-fundamentals", difficulty: "Advanced", estimatedDuration: "3 hours", xp: 100 }
      ]
    },
    {
      id: "using-pretrained-models",
      title: "Using Pre-trained Models",
      description: "Interacting with hosted foundation models via standard client SDKs.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "14 hours",
      xp: 500,
      children: [
        {
          id: "pretrained-concepts",
          title: "Pre-trained Models Overview",
          description: "Understanding architecture limitations and model evaluation.",
          parentId: "using-pretrained-models",
          difficulty: "Beginner",
          estimatedDuration: "3 hours",
          xp: 100,
          children: [
            { id: "benefits-pretrained", title: "Benefits of Pre-trained Models", description: "Cost efficiency, immediate deployment, and state-of-the-art accuracy.", parentId: "pretrained-concepts", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "limitations-considerations", title: "Limitations and Considerations", description: "Data cut-off times, hallucinations, and context size limits.", parentId: "pretrained-concepts", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 }
          ]
        },
        {
          id: "popular-ai-models",
          title: "Popular AI Models",
          description: "Exploring proprietary and open models across key providers.",
          parentId: "using-pretrained-models",
          difficulty: "Beginner",
          estimatedDuration: "11 hours",
          xp: 300,
          children: [
            { id: "openai-models", title: "OpenAI Models (GPT-4o, GPT-3.5)", description: "General intelligence standard-bearers.", parentId: "popular-ai-models", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 50 },
            { id: "anthropic-claude", title: "Anthropic's Claude", description: "Focus on extended context window, code editing, and structural outputs.", parentId: "popular-ai-models", difficulty: "Beginner", estimatedDuration: "2.5 hours", xp: 60 },
            { id: "google-gemini", title: "Google's Gemini", description: "Native multimodal features and extremely large context windows.", parentId: "popular-ai-models", difficulty: "Beginner", estimatedDuration: "2.5 hours", xp: 60 },
            { id: "huggingface-models", title: "Hugging Face Models", description: "Open weights ecosystem for self-hosting.", parentId: "popular-ai-models", difficulty: "Intermediate", estimatedDuration: "3 hours", xp: 80 },
            { id: "mistral-ai", title: "Mistral AI", description: "High-performance modular open-weights models.", parentId: "popular-ai-models", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "cohere-models", title: "Cohere", description: "Text analysis, rerank models, and multilingual search.", parentId: "popular-ai-models", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "replicate", title: "Replicate", description: "API hosting infrastructure for open-source AI models.", parentId: "popular-ai-models", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 40 }
          ]
        }
      ]
    },
    {
      id: "openai-platform",
      title: "OpenAI Platform",
      description: "Mastering the developer portal, APIs, and client configurations of OpenAI.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "15 hours",
      xp: 600,
      children: [
        {
          id: "openai-api",
          title: "OpenAI API",
          description: "Core REST structures and SDK integrations.",
          parentId: "openai-platform",
          difficulty: "Beginner",
          estimatedDuration: "10 hours",
          xp: 400,
          children: [
            { id: "chat-completions", title: "Chat Completions API", description: "Integrating chat history, system instructions, and completion formats.", parentId: "openai-api", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 80 },
            { id: "writing-prompts-api", title: "Writing Prompts", description: "Formatting instructions programmatically inside system role templates.", parentId: "openai-api", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 60 },
            { id: "max-tokens", title: "Maximum Tokens", description: "Configuring safety ceilings for completion and usage limits.", parentId: "openai-api", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 40 },
            { id: "token-counting", title: "Token Counting", description: "Using tiktoken to calculate lengths prior to request execution.", parentId: "openai-api", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
            { id: "pricing-considerations", title: "Pricing Considerations", description: "Optimizing input vs output token expenditures.", parentId: "openai-api", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "managing-tokens-api", title: "Managing Tokens", description: "Implementing custom sliding context filters to prevent overflow.", parentId: "openai-api", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 90 }
          ]
        },
        { id: "openai-playground", title: "OpenAI Playground", description: "Direct developer console simulation of parameters like temperature, top_p, and frequency penalty.", parentId: "openai-platform", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 50 },
        { id: "fine-tuning", title: "Fine-tuning", description: "Preparing JSONL data patterns to align structural output styles.", parentId: "openai-platform", difficulty: "Advanced", estimatedDuration: "3 hours", xp: 120 }
      ]
    },
    {
      id: "ai-safety-ethics",
      title: "AI Safety and Ethics",
      description: "Implementing structural safety checks, moderation gates, and user constraint filters.",
      parentId: "ai-engineer",
      difficulty: "Intermediate",
      estimatedDuration: "10 hours",
      xp: 500,
      children: [
        { id: "prompt-injection", title: "Prompt Injection Attacks", description: "Understanding jailbreaks, system role overrides, and defense strategies.", parentId: "ai-safety-ethics", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
        { id: "bias-fairness", title: "Bias and Fairness", description: "Auditing completions for programmatic equity and representation.", parentId: "ai-safety-ethics", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 },
        { id: "security-privacy", title: "Security and Privacy Concerns", description: "Managing data leakages, scrubbing PII, and using HIPAA-compliant gateways.", parentId: "ai-safety-ethics", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
        { id: "adversarial-testing", title: "Conducting Adversarial Testing", description: "Red-teaming models with unexpected instruction pipelines.", parentId: "ai-safety-ethics", difficulty: "Advanced", estimatedDuration: "2.5 hours", xp: 100 },
        { id: "moderation-api", title: "OpenAI Moderation API", description: "Executing lightweight pre-checks for hate speech, self-harm, or illegal activity.", parentId: "ai-safety-ethics", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 50 },
        { id: "safety-best-practices", title: "Safety Best Practices", description: "Sanitizing model inputs, limiting outputs, and tracking API abuse.", parentId: "ai-safety-ethics", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 50 }
      ]
    },
    {
      id: "opensource-ai",
      title: "Open Source AI",
      description: "Running open-weights models locally and deploying cost-effective custom servers.",
      parentId: "ai-engineer",
      difficulty: "Intermediate",
      estimatedDuration: "15 hours",
      xp: 700,
      children: [
        { id: "open-vs-closed", title: "Open vs Closed Source Models", description: "Trade-offs between licensing cost, data privacy, and reasoning capability.", parentId: "opensource-ai", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 50 },
        {
          id: "huggingface",
          title: "Hugging Face Ecosystem",
          description: "Leveraging open weights repositories and inference scripts.",
          parentId: "opensource-ai",
          difficulty: "Intermediate",
          estimatedDuration: "5 hours",
          xp: 250,
          children: [
            { id: "hf-hub", title: "Hugging Face Hub", description: "Navigating model repositories, licenses, and documentation cards.", parentId: "huggingface", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "hf-tasks", title: "Hugging Face Tasks", description: "Matching pipelines to classification, summarization, or generation goals.", parentId: "huggingface", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 },
            { id: "finding-models", title: "Finding Open Source Models", description: "Filtering by leaderboard rankings, quantizations, and benchmarks.", parentId: "huggingface", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 }
          ]
        },
        {
          id: "using-os-models",
          title: "Using Open Source Models",
          description: "Loading and executing models on hardware constraints.",
          parentId: "opensource-ai",
          difficulty: "Advanced",
          estimatedDuration: "5 hours",
          xp: 250,
          children: [
            { id: "inference-sdk", title: "Inference SDK", description: "Programmatic text generation pipelines using python libraries.", parentId: "using-os-models", difficulty: "Intermediate", estimatedDuration: "2.5 hours", xp: 90 },
            { id: "transformers-js", title: "Transformers.js", description: "Executing models completely in-browser via WebGL/WebGPU acceleration.", parentId: "using-os-models", difficulty: "Advanced", estimatedDuration: "2.5 hours", xp: 110 }
          ]
        },
        {
          id: "ollama",
          title: "Ollama",
          description: "Local runner orchestration system for GGUF model formats.",
          parentId: "opensource-ai",
          difficulty: "Intermediate",
          estimatedDuration: "4 hours",
          xp: 200,
          children: [
            { id: "ollama-models", title: "Ollama Models (Llama3, Phi3)", description: "Pulling and running custom model weights locally.", parentId: "ollama", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 80 },
            { id: "ollama-sdk", title: "Ollama SDK", description: "Integrating local API calls with Node.js and Python projects.", parentId: "ollama", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 90 }
          ]
        }
      ]
    },
    {
      id: "embeddings-vector-dbs",
      title: "Embeddings & Vector Databases",
      description: "Managing semantic knowledge mapping and storage indexing patterns.",
      parentId: "ai-engineer",
      difficulty: "Intermediate",
      estimatedDuration: "18 hours",
      xp: 800,
      children: [
        {
          id: "what-are-embeddings",
          title: "What are Embeddings",
          description: "Mathematical structures of vector representations.",
          parentId: "embeddings-vector-dbs",
          difficulty: "Intermediate",
          estimatedDuration: "4 hours",
          xp: 200,
          children: [
            { id: "semantic-search-concept", title: "Semantic Search", description: "Revising literal keyword search into concept similarity match.", parentId: "what-are-embeddings", difficulty: "Beginner", estimatedDuration: "1 hour", xp: 50 },
            { id: "data-classification", title: "Data Classification", description: "Grouping vector coordinates with clustering algorithms.", parentId: "what-are-embeddings", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 50 },
            { id: "recommendation-systems", title: "Recommendation Systems", description: "Mapping consumer attributes to find nearest product vectors.", parentId: "what-are-embeddings", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 50 },
            { id: "anomaly-detection", title: "Anomaly Detection", description: "Isolating vector spikes mapping outside standard clusters.", parentId: "what-are-embeddings", difficulty: "Advanced", estimatedDuration: "1 hour", xp: 60 }
          ]
        },
        {
          id: "openai-embeddings-api",
          title: "Open AI Embeddings API",
          description: "Generating vectors using text-embedding-3-small and large models.",
          parentId: "embeddings-vector-dbs",
          difficulty: "Beginner",
          estimatedDuration: "3 hours",
          xp: 150,
          children: [
            { id: "openai-embedding-models", title: "Open AI Embedding Models", description: "Selecting dimension parameters (256, 1536, 3072).", parentId: "openai-embeddings-api", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 60 },
            { id: "pricing-embeddings", title: "Pricing Considerations", description: "Calculating throughput costs per million input tokens.", parentId: "openai-embeddings-api", difficulty: "Beginner", estimatedDuration: "1.5 hours", xp: 50 }
          ]
        },
        {
          id: "os-embeddings",
          title: "Open-Source Embeddings",
          description: "Running embedding pipelines locally on CPU/GPU structures.",
          parentId: "embeddings-vector-dbs",
          difficulty: "Intermediate",
          estimatedDuration: "4 hours",
          xp: 200,
          children: [
            { id: "sentence-transformers", title: "Sentence Transformers", description: "Integrating high-performance local BERT models.", parentId: "os-embeddings", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 90 },
            { id: "hf-embeddings", title: "Models on Hugging Face", description: "Downloading open source models mapping coordinates directly.", parentId: "os-embeddings", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 90 }
          ]
        },
        {
          id: "vector-databases",
          title: "Vector Databases",
          description: "Orchestrating vector indices for persistent lookups.",
          parentId: "embeddings-vector-dbs",
          difficulty: "Advanced",
          estimatedDuration: "7 hours",
          xp: 350,
          children: [
            { id: "purpose-functionality", title: "Purpose and Functionality", description: "HNSW algorithms, Flat index structures, and cosine similarity.", parentId: "vector-databases", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
            { id: "popular-dbs", title: "Popular Vector DBs", description: "Exploring Chroma, Pinecone, Weaviate, FAISS, LanceDB, Qdrant, Supabase, and MongoDB Atlas.", parentId: "vector-databases", difficulty: "Intermediate", estimatedDuration: "3 hours", xp: 120 },
            { id: "indexing-similarity", title: "Implementing Vector Search", description: "Connecting datasets, calculating vectors, and querying nearest neighbors.", parentId: "vector-databases", difficulty: "Advanced", estimatedDuration: "2 hours", xp: 100 }
          ]
        }
      ]
    },
    {
      id: "rag-implementation",
      title: "RAG & Implementation",
      description: "Retrieval-Augmented Generation processes injecting customized contexts dynamically.",
      parentId: "ai-engineer",
      difficulty: "Advanced",
      estimatedDuration: "20 hours",
      xp: 900,
      children: [
        { id: "rag-usecases", title: "RAG Usecases", description: "Enterprise document Q&A, code repositories traversal, and private database chat.", parentId: "rag-implementation", difficulty: "Beginner", estimatedDuration: "2 hours", xp: 80 },
        { id: "rag-vs-finetuning", title: "RAG vs Fine-tuning", description: "Contrasting dynamic background injection with structural training parameter alignment.", parentId: "rag-implementation", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 80 },
        {
          id: "implementing-rag-details",
          title: "Implementing RAG",
          description: "Step-by-step pipeline architectures.",
          parentId: "rag-implementation",
          difficulty: "Advanced",
          estimatedDuration: "8 hours",
          xp: 400,
          children: [
            { id: "rag-chunking", title: "Chunking", description: "Sentence splitter, token boundaries, and overlapping configurations.", parentId: "implementing-rag-details", difficulty: "Intermediate", estimatedDuration: "2 hours", xp: 90 },
            { id: "rag-embedding", title: "Embedding", description: "Generating vectors for individual content segments dynamically.", parentId: "implementing-rag-details", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 80 },
            { id: "rag-db-storage", title: "Vector Database Storage", description: "Upserting data chunks along with custom document metadata fields.", parentId: "implementing-rag-details", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 80 },
            { id: "rag-retrieval", title: "Retrieval Process", description: "Fetching relevant metadata using vector similarity and filtering constraints.", parentId: "implementing-rag-details", difficulty: "Advanced", estimatedDuration: "1.5 hours", xp: 90 },
            { id: "rag-generation", title: "Generation", description: "Constructing prompts matching context and raw query to output completions.", parentId: "implementing-rag-details", difficulty: "Advanced", estimatedDuration: "1.5 hours", xp: 90 }
          ]
        },
        { id: "openai-assistant-api", title: "OpenAI Assistant API", description: "Offloading threading, parsing, and retrieval indexes natively to OpenAI gateways.", parentId: "rag-implementation", difficulty: "Intermediate", estimatedDuration: "4 hours", xp: 180 },
        {
          id: "rag-frameworks",
          title: "Ways of Implementing RAG",
          description: "Integrating code base pipelines directly or utilizing orchestration libraries.",
          parentId: "rag-implementation",
          difficulty: "Advanced",
          estimatedDuration: "4 hours",
          xp: 200,
          children: [
            { id: "sdks-directly", title: "Using SDKs Directly", description: "Building chunk-upsert-query pipeline manually using standard HTTP requests.", parentId: "rag-frameworks", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 80 },
            { id: "langchain-rag", title: "Langchain Integration", description: "Abstract chains, loaders, splitters, and custom prompts orchestration.", parentId: "rag-frameworks", difficulty: "Advanced", estimatedDuration: "1.5 hours", xp: 90 },
            { id: "llamaindex-rag", title: "Llama Index Integration", description: "Optimized index loaders, connectors, and advanced querying capabilities.", parentId: "rag-frameworks", difficulty: "Advanced", estimatedDuration: "1 hour", xp: 90 }
          ]
        }
      ]
    },
    {
      id: "ai-agents",
      title: "AI Agents",
      description: "Cognitive loop architectures allowing models to choose tool routes dynamically.",
      parentId: "ai-engineer",
      difficulty: "Advanced",
      estimatedDuration: "18 hours",
      xp: 900,
      children: [
        { id: "agents-usecases", title: "Agents Usecases", description: "Autonomous coding scripts, complex data analysts, and task schedulers.", parentId: "ai-agents", difficulty: "Intermediate", estimatedDuration: "3 hours", xp: 100 },
        { id: "prompt-eng-agents", title: "Prompt Engineering for Agents", description: "Constructing robust agent rules, system limitations, and JSON templates.", parentId: "ai-agents", difficulty: "Intermediate", estimatedDuration: "3 hours", xp: 100 },
        { id: "react-prompting", title: "ReAct Prompting", description: "Reasoning and Acting loop architectures (Thought, Action, Observation).", parentId: "ai-agents", difficulty: "Advanced", estimatedDuration: "4 hours", xp: 200 },
        {
          id: "building-agents-details",
          title: "Building AI Agents",
          description: "Practical implementations of autonomous scripts.",
          parentId: "ai-agents",
          difficulty: "Advanced",
          estimatedDuration: "8 hours",
          xp: 500,
          children: [
            { id: "manual-agents", title: "Manual Implementation", description: "Writing pure logic structures parsing agent function calls.", parentId: "building-agents-details", difficulty: "Advanced", estimatedDuration: "3 hours", xp: 150 },
            { id: "openai-tools", title: "OpenAI Functions / Tools", description: "Declaring valid JSON schemas inside the chat request to retrieve arguments.", parentId: "building-agents-details", difficulty: "Intermediate", estimatedDuration: "2.5 hours", xp: 120 },
            { id: "openai-assistant-agents", title: "OpenAI Assistant API Tools", description: "Connecting code interpreter, custom web hook tools, and search capabilities.", parentId: "building-agents-details", difficulty: "Advanced", estimatedDuration: "2.5 hours", xp: 150 }
          ]
        }
      ]
    },
    {
      id: "multimodal-ai",
      title: "Multimodal AI",
      description: "Extending models to process speech, images, and audio seamlessly.",
      parentId: "ai-engineer",
      difficulty: "Advanced",
      estimatedDuration: "12 hours",
      xp: 700,
      children: [
        {
          id: "multimodal-usecases",
          title: "Multimodal AI Usecases & Tasks",
          description: "Understanding application possibilities.",
          parentId: "multimodal-ai",
          difficulty: "Intermediate",
          estimatedDuration: "4 hours",
          xp: 200,
          children: [
            { id: "image-understanding", title: "Image Understanding", description: "Processing diagrams, OCR parsing, and visual context extraction.", parentId: "multimodal-usecases", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 50 },
            { id: "image-generation", title: "Image Generation", description: "Integrating image creators like DALL-E and Midjourney API calls.", parentId: "multimodal-usecases", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 50 },
            { id: "video-understanding", title: "Video Understanding", description: "Breaking frames down to run context queries over timed sequences.", parentId: "multimodal-usecases", difficulty: "Advanced", estimatedDuration: "1 hour", xp: 60 },
            { id: "audio-processing", title: "Audio & Speech Processing", description: "Speech-to-text, text-to-speech, and audio semantic searches.", parentId: "multimodal-usecases", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 50 }
          ]
        },
        {
          id: "implementing-multimodal",
          title: "Implementing Multimodal AI",
          description: "Practical code orchestration examples.",
          parentId: "multimodal-ai",
          difficulty: "Advanced",
          estimatedDuration: "8 hours",
          xp: 500,
          children: [
            { id: "vision-api", title: "OpenAI Vision API", description: "Passing images as URL or base64 structures to GPT-4o.", parentId: "implementing-multimodal", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 80 },
            { id: "dalle-api", title: "DALL-E API", description: "Generating and editing images programmatically.", parentId: "implementing-multimodal", difficulty: "Intermediate", estimatedDuration: "1 hour", xp: 60 },
            { id: "whisper-api", title: "Whisper API", description: "Transcribing and translating audio file streams.", parentId: "implementing-multimodal", difficulty: "Intermediate", estimatedDuration: "1.5 hours", xp: 80 },
            { id: "hf-multimodal", title: "Hugging Face Models", description: "Integrating open weights vision-language models.", parentId: "implementing-multimodal", difficulty: "Advanced", estimatedDuration: "1.5 hours", xp: 90 },
            { id: "langchain-multimodal", title: "LangChain for Multimodal Apps", description: "Chaining text prompts, image inputs, and vision outputs.", parentId: "implementing-multimodal", difficulty: "Advanced", estimatedDuration: "1.5 hours", xp: 95 },
            { id: "llamaindex-multimodal", title: "LlamaIndex for Multimodal Apps", description: "Indexing image-text metadata for vector similarity lookups.", parentId: "implementing-multimodal", difficulty: "Advanced", estimatedDuration: "1 hour", xp: 95 }
          ]
        }
      ]
    },
    {
      id: "development-tools",
      title: "Development Tools",
      description: "Harnessing IDE extensions and automation frameworks custom tailored for AI engineering.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "6 hours",
      xp: 300,
      children: [
        { id: "code-editors", title: "AI Code Editors", description: "Utilizing tools like Cursor and VS Code Copilot workspaces.", parentId: "development-tools", difficulty: "Beginner", estimatedDuration: "3 hours", xp: 150 },
        { id: "completion-tools", title: "Code Completion Tools", description: "Maximizing context awareness, inline completions, and terminal debuggers.", parentId: "development-tools", difficulty: "Beginner", estimatedDuration: "3 hours", xp: 150 }
      ]
    }
  ]
};
