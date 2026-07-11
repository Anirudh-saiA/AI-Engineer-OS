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
  flashcardQuestion?: string;
  flashcardAnswer?: string;
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
      estimatedDuration: "3.5 hours",
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
          estimatedDuration: "30 mins",
          xp: 50,
          resources: [
            { title: "What Is an AI Engineer? (And What Do They Do?) - 365 Data Science", type: "video", url: "http://www.youtube.com/watch?v=gT1SiZttBDE", xp: 50 },
            { title: "What is AI Engineering - Telusko", type: "video", url: "http://www.youtube.com/watch?v=cp0_xWxLGaI", xp: 50 },
            { title: "What Is an AI Engineer? | Re:Sourced", type: "article", url: "https://www.resourced.com.au/articles/what-is-an-ai-engineer", xp: 30 }
          ],
          flashcardQuestion: "What is the primary role of an AI Engineer compared to a traditional software developer?",
          flashcardAnswer: "An AI Engineer focuses on integrating, configuring, and orchestrating pre-trained models, embeddings, and vector databases into production-grade applications, rather than building custom model architectures from scratch."
        },
        {
          id: "ai-vs-ml-eng",
          title: "AI Engineer vs ML Engineer",
          description: "Contrasting systems integration with training core models.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "35 mins",
          xp: 50,
          resources: [
            { title: "AI Engineer vs. Machine Learning Engineer - Marina Wyss", type: "video", url: "http://www.youtube.com/watch?v=NmBW49OBeBU", xp: 50 },
            { title: "Don't Waste 2026 on the Wrong Career - Zen van Riel", type: "video", url: "http://www.youtube.com/watch?v=cqDQV5g7zHo", xp: 50 },
            { title: "Which Career Path Fits You? - IIT Kharagpur", type: "article", url: "https://online.iitkgp.ac.in/blog/ai-engineer-vs-ml-engineer-career-comparison", xp: 30 }
          ],
          flashcardQuestion: "What is the key difference in focus between an AI Engineer and a Machine Learning (ML) Engineer?",
          flashcardAnswer: "AI Engineers focus on application development, APIs, prompt orchestration, and systems integration using existing models, whereas ML Engineers focus on training, optimizing, and deploying custom mathematical models and data pipelines."
        },
        {
          id: "ai-vs-agi",
          title: "AI vs AGI",
          description: "Understanding narrow artificial intelligence versus artificial general intelligence.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "30 mins",
          xp: 50,
          resources: [
            { title: "AI vs. AGI: What's the Difference? - AI Global", type: "video", url: "http://www.youtube.com/watch?v=dGdSK4lD1bU", xp: 50 },
            { title: "The 7 SCARY Stages of AI - Technomics", type: "video", url: "http://www.youtube.com/watch?v=wF5kwCjLCtI", xp: 50 },
            { title: "What is the difference between AGI vs AI? - ServiceNow", type: "article", url: "https://www.servicenow.com/ai/what-is-ai-vs-agi.html", xp: 30 }
          ],
          flashcardQuestion: "How does standard (Narrow) AI differ from Artificial General Intelligence (AGI)?",
          flashcardAnswer: "Narrow AI is designed and trained to perform specific tasks (like image recognition or text generation) within a defined domain, whereas AGI represents hypothetical systems with human-like general cognitive abilities across any domain."
        },
        {
          id: "common-terminology",
          title: "Common Terminology",
          description: "Glossary of parameters, tokens, context windows, and inference.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "35 mins",
          xp: 50,
          resources: [
            { title: "7 AI Terms You Need to Know - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=VSFuqMh4hus", xp: 50 },
            { title: "Understanding AI Jargon - Gary Explains", type: "video", url: "http://www.youtube.com/watch?v=sqFZaIebSB0", xp: 50 },
            { title: "Artificial Intelligence - Terminology - TutorialsPoint", inArticle: true, type: "article", url: "https://www.tutorialspoint.com/artificial_intelligence/artificial_intelligence_terminology.htm", xp: 30 }
          ],
          flashcardQuestion: "What is the difference between a model's 'context window' and its 'inference' phase?",
          flashcardAnswer: "The context window is the maximum number of tokens a model can process in a single prompt session, while inference is the real-time generation phase where the model outputs predictions or text."
        },
        {
          id: "impact-product",
          title: "Impact on Product Development",
          description: "How generative AI changes UI/UX design paradigms and product iteration.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "30 mins",
          xp: 50,
          resources: [
            { title: "AI Engineers - What Do They Do? - Krish Naik", type: "video", url: "http://www.youtube.com/watch?v=y8qRq9PMCh8", xp: 50 },
            { title: "Should YOU Become An AI Engineer? - CodeHead", type: "video", url: "http://www.youtube.com/watch?v=TQwwK7P_J4I", xp: 50 },
            { title: "AI Engineer Roadmap - roadmap.sh", type: "article", url: "https://roadmap.sh/ai-engineer", xp: 30 }
          ],
          flashcardQuestion: "In what way does generative AI shift traditional product design and iteration cycles?",
          flashcardAnswer: "Generative AI introduces non-deterministic outputs and conversational user interfaces, shifting the focus towards rapid prompt iteration, dynamic UI generation, and continuous alignment evaluation."
        },
        {
          id: "roles-responsibilities",
          title: "Roles and Responsibilities",
          description: "Team dynamics, AI safety compliance, and API infrastructure maintenance.",
          parentId: "intro",
          difficulty: "Beginner",
          estimatedDuration: "35 mins",
          xp: 50,
          resources: [
            { title: "What is an AI Engineer? (And what do they do?) - Jay Feng", type: "video", url: "http://www.youtube.com/watch?v=o0OczKvQ_is", xp: 50 },
            { title: "How to Become an AI Engineer FAST (2026) - Sajjaad Khader", type: "video", url: "http://www.youtube.com/watch?v=aAItDrJ8-rE", xp: 50 },
            { title: "What Does an AI Engineer Do? - Codecademy", type: "article", url: "https://www.codecademy.com/resources/blog/what-does-an-ai-engineer-do", xp: 30 }
          ],
          flashcardQuestion: "What is a major compliance and security responsibility unique to AI Engineers?",
          flashcardAnswer: "AI Engineers must actively audit systems for prompt injection vulnerabilities, prevent leaking sensitive PII data to external LLM APIs, and ensure model output formatting safety."
        }
      ]
    },
    {
      id: "llm-fundamentals",
      title: "LLM Fundamentals",
      description: "Core mechanisms under the hood of Large Language Models.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "26.5 hours",
      xp: 400,
      resources: [
        { title: "Visualizing Transformer Architecture", type: "video", xp: 80 },
        { title: "Transformer Self-Attention Coding Exercise", type: "exercise", xp: 100 }
      ],
      children: [
        {
          id: "inference",
          title: "Inference",
          description: "How models generate text token by token.",
          parentId: "llm-fundamentals",
          difficulty: "Beginner",
          estimatedDuration: "1.5 hours",
          xp: 50,
          resources: [
            { title: "AI Inference: The Secret to AI's Superpowers - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=XtT5i0ZeHHE", xp: 50 },
            { title: "Large Language Models explained briefly - 3Blue1Brown", type: "video", url: "http://www.youtube.com/watch?v=LPZh9BOjkQs", xp: 50 },
            { title: "Why Inference is hard.. - Caleb Writes Code", type: "video", url: "http://www.youtube.com/watch?v=B18zBnjZKmc", xp: 50 },
            { title: "LLM Inference Guide (Google)", type: "article", url: "https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference", xp: 30 },
            { title: "LLM Inference Handbook", type: "article", url: "https://bentoml.com/llm/", xp: 30 }
          ],
          flashcardQuestion: "What is the primary difference between a model's 'training' phase and its 'inference' phase?",
          flashcardAnswer: "Training is the computationally expensive process of teaching a model by adjusting its internal weights using vast datasets, whereas inference is the process of using the frozen, fully trained model to generate predictions or text token by token in real-time."
        },
        {
          id: "training",
          title: "Training",
          description: "Pre-training, fine-tuning, and alignment stages.",
          parentId: "llm-fundamentals",
          difficulty: "Intermediate",
          estimatedDuration: "7.5 hours",
          xp: 80,
          resources: [
            { title: "Train Your Own LLM - freeCodeCamp.org", type: "video", url: "http://www.youtube.com/watch?v=9Ge0sMm65jo", xp: 50 },
            { title: "LLM Full Course For Data Engineers - Ansh Lamba", type: "video", url: "http://www.youtube.com/watch?v=X8F9JfCUWrs", xp: 50 },
            { title: "How to Train an LLM on Your Own Data - Decodo", type: "video", url: "http://www.youtube.com/watch?v=syH-T9OSMqk", xp: 50 },
            { title: "A Practical Guide to LLM Fine Tuning", type: "article", url: "https://www.databricks.com/blog/llm-fine-tuning", xp: 30 },
            { title: "Fine-tuning LLMs Overview (Google Cloud)", type: "article", url: "https://cloud.google.com/use-cases/fine-tuning-ai-models", xp: 30 }
          ],
          flashcardQuestion: "Why do AI Engineers typically use 'fine-tuning' instead of training a Large Language Model from scratch?",
          flashcardAnswer: "Pre-training an LLM from scratch requires millions of dollars in compute (GPUs) and massive amounts of raw internet data. Fine-tuning allows engineers to take an existing pre-trained model and adapt it to a specific task or behavior using a much smaller, specialized dataset, saving significant time and resources."
        },
        {
          id: "embeddings-fundamental",
          title: "Embeddings",
          description: "Mapping text into high-dimensional vector space.",
          parentId: "llm-fundamentals",
          difficulty: "Intermediate",
          estimatedDuration: "1 hour",
          xp: 70,
          resources: [
            { title: "What are Word Embeddings? - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=wgfSDrqYMJ4", xp: 50 },
            { title: "Tokens vs Embeddings - Annie Sexton", type: "video", url: "http://www.youtube.com/watch?v=izbifbq3-eI", xp: 50 },
            { title: "A Guide to LLM Embeddings", type: "article", url: "https://www.couchbase.com/blog/llm-embeddings/", xp: 30 },
            { title: "What Are LLM Embeddings?", type: "article", url: "https://aisera.com/blog/llm-embeddings/", xp: 30 }
          ],
          flashcardQuestion: "What exactly is an 'embedding' in the context of Large Language Models?",
          flashcardAnswer: "An embedding is a numerical representation of text (or other data) formatted as a dense vector (an array of floating-point numbers). It captures semantic meaning, meaning words or concepts with similar meanings have vectors that are mathematically closer together in high-dimensional space."
        },
        {
          id: "vector-dbs-fundamental",
          title: "Vector Databases",
          description: "Indexed stores designed for fast vector similarity search.",
          parentId: "llm-fundamentals",
          difficulty: "Intermediate",
          estimatedDuration: "1.5 hours",
          xp: 80,
          resources: [
            { title: "What is a Vector Database? - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=gl1r1XV0SLw", xp: 50 },
            { title: "Vector databases are so hot right now - Fireship", type: "video", url: "http://www.youtube.com/watch?v=klTvEwg3oJ4", xp: 50 },
            { title: "Vector Databases simply explained! - AssemblyAI", type: "video", url: "http://www.youtube.com/watch?v=dN0lsF2cvm4", xp: 50 },
            { title: "Vector databases and LLMs", type: "article", url: "https://www.instaclustr.com/education/open-source-ai/vector-databases-and-llms-better-together/", xp: 30 },
            { title: "Vector Database for LLM Use Cases", type: "article", url: "https://cloudian.com/guides/ai-infrastructure/vector-database-for-llm-use-cases-and-notable-dbs-in-2026/", xp: 30 }
          ],
          flashcardQuestion: "Why use a Vector Database instead of a traditional relational database (like PostgreSQL) for AI search?",
          flashcardAnswer: "Traditional databases rely on exact keyword matches (lexical search). Vector databases are optimized to store high-dimensional embeddings and perform 'similarity searches' using algorithms like cosine similarity. This allows you to find contextually relevant information even if the exact keywords don't match."
        },
        {
          id: "rag-fundamental",
          title: "RAG",
          description: "Retrieval-Augmented Generation context injection flows.",
          parentId: "llm-fundamentals",
          difficulty: "Intermediate",
          estimatedDuration: "1.5 hours",
          xp: 80,
          resources: [
            { title: "What is Retrieval-Augmented Generation (RAG)? - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=T-D1OfcDW1MRAG", xp: 50 },
            { title: "RAG Explained For Beginners - KodeKloud", type: "video", url: "http://www.youtube.com/watch?v=_HQ2H_0Ayy0", xp: 50 },
            { title: "Introduction To Understanding RAG - Krish Naik", type: "video", url: "http://www.youtube.com/watch?v=fZM3oX4xEyg", xp: 50 },
            { title: "RAG Complete Guide", type: "article", url: "https://www.datacamp.com/blog/what-is-retrieval-augmented-generation-rag", xp: 30 },
            { title: "What is RAG?", type: "article", url: "https://aws.amazon.com/what-is/retrieval-augmented-generation/", xp: 30 }
          ],
          flashcardQuestion: "How does RAG (Retrieval-Augmented Generation) prevent a Large Language Model from hallucinating?",
          flashcardAnswer: "Instead of relying purely on the model's static internal memory, RAG intercepts the user query, retrieves verified factual information from an external vector database, and injects that information directly into the prompt. The LLM is then instructed to answer based ONLY on the provided retrieved context."
        },
        {
          id: "prompt-eng-fundamental",
          title: "Prompt Engineering",
          description: "Techniques to elicit structured, reliable reasoning from LLMs.",
          parentId: "llm-fundamentals",
          difficulty: "Beginner",
          estimatedDuration: "12 hours",
          xp: 50,
          resources: [
            { title: "Prompt Engineering Full Course 2026 - Simplilearn", type: "video", url: "http://www.youtube.com/watch?v=DvhFcIRRXyI", xp: 50 },
            { title: "Prompt Engineering Full Course - Tech With Tim", type: "video", url: "http://www.youtube.com/watch?v=2BpCk4d2Cc0", xp: 50 },
            { title: "Learn PROMPT ENGINEERING from Scratch - Digital Skills", type: "video", url: "http://www.youtube.com/watch?v=dUulqgLqPBk", xp: 50 },
            { title: "Prompt engineering: A guide to improving LLM performance", type: "article", url: "https://circleci.com/blog/prompt-engineering/", xp: 30 },
            { title: "Prompt Engineering Guide", type: "article", url: "https://github.com/dair-ai/prompt-engineering-guide", xp: 30 }
          ],
          flashcardQuestion: "What is the 'Few-Shot Prompting' technique in Prompt Engineering?",
          flashcardAnswer: "Few-shot prompting involves providing the model with a few concrete examples (shots) of the desired input-output format within the prompt itself. This teaches the model the exact pattern, tone, or formatting structure it should replicate for the actual query, leading to much more reliable outputs."
        },
        {
          id: "ai-agents-fundamental",
          title: "AI Agents",
          description: "Enabling LLMs with tools, memory loops, and planning capabilities.",
          parentId: "llm-fundamentals",
          difficulty: "Advanced",
          estimatedDuration: "1.5 hours",
          xp: 100,
          resources: [
            { title: "AI Agents, Clearly Explained - Jeff Su", type: "video", url: "http://www.youtube.com/watch?v=FwOTs4UxQS4", xp: 50 },
            { title: "AI Agents vs. LLMs - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=I9z-nrk9cw0", xp: 50 },
            { title: "What is OpenClaw? Inside AI Agents - IBM Technology", type: "video", url: "http://www.youtube.com/watch?v=L7FF8Zgab3M", xp: 50 },
            { title: "LLM agents: The ultimate guide", type: "article", url: "https://www.superannotate.com/blog/llm-agents", xp: 30 },
            { title: "A practical guide to building agents (OpenAI)", type: "article", url: "https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf", xp: 30 }
          ],
          flashcardQuestion: "What distinguishes an 'AI Agent' from a standard conversational LLM?",
          flashcardAnswer: "A standard LLM just predicts the next token in a static conversation. An AI Agent wraps the LLM in an autonomous loop (like ReAct: Reason and Act) where it is given access to external tools (like calculators, web search, or database queries). The Agent can break a problem down, execute tools to fetch missing data, analyze the tool outputs, and repeat until the goal is achieved."
        }
      ]
    },
    {
      id: "using-pretrained-models",
      title: "Using Pre-trained Models",
      description: "Interacting with hosted foundation models via standard client SDKs.",
      parentId: "ai-engineer",
      difficulty: "Beginner",
      estimatedDuration: "10 hours",
      xp: 500,
      children: [
        {
          id: "pretrained-concepts",
          title: "Pre-trained Models Overview",
          description: "Understanding architecture limitations and model evaluation.",
          parentId: "using-pretrained-models",
          difficulty: "Beginner",
          estimatedDuration: "2 hours",
          xp: 100,
          children: [
            {
              id: "benefits-pretrained",
              title: "Benefits of Pre-trained Models",
              description: "Cost efficiency, immediate deployment, and state-of-the-art accuracy.",
              parentId: "pretrained-concepts",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "Pretrained Models: The AI Revolution in 5 Minutes!", type: "video", url: "https://www.youtube.com/watch?v=DWnWJeH9-uI", xp: 50 },
                { title: "Using pre-trained models in TensorFlow", type: "video", url: "https://www.youtube.com/watch?v=iTlj3gMYzw8", xp: 50 },
                { title: "Leveraging Pre-Trained Machine Learning Models for Efficient Entity Resolution", type: "video", url: "https://www.youtube.com/watch?v=nqKwCEvR6n4", xp: 50 },
                { title: "What Is A Pretrained Model? | IBM", type: "article", url: "https://www.ibm.com/think/topics/pretrained-model", xp: 30 },
                { title: "Why Pre-Trained Models Matter for Machine Learning - AHEAD", type: "article", url: "https://www.ahead.com/resources/why-pre-trained-models-matter-for-machine-learning/", xp: 30 },
                { title: "How do pre-trained models benefit deep learning? - Milvus", type: "article", url: "https://milvus.io/ai-quick-reference/how-do-pretrained-models-benefit-deep-learning", xp: 30 }
              ],
              flashcardQuestion: "What is the main operational benefit of using a pre-trained model rather than building one from scratch?",
              flashcardAnswer: "Pre-trained models save significant time, data collection efforts, and computational resources since the foundation of learned features is already established, allowing developers to focus purely on application integration or light fine-tuning."
            },
            {
              id: "limitations-considerations",
              title: "Limitations and Considerations",
              description: "Data cut-off times, hallucinations, and context size limits.",
              parentId: "pretrained-concepts",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "L14: Task specific fine tuning and its limitations | GPT for real NLP task", type: "video", url: "https://www.youtube.com/watch?v=cwSfU3g-9zs", xp: 50 },
                { title: "Chapter 3: Finetuning Pretrained Model | Trainer-API", type: "video", url: "https://www.youtube.com/watch?v=CbpaWfKtunY", xp: 50 },
                { title: "What are the pros and cons of using pre-trained models in machine learning? - Verve AI", type: "article", url: "https://www.vervecopilot.com/question-bank/advantages-disadvantages-pre-trained-model", xp: 30 },
                { title: "The Pros and Cons of Using Pre-Trained Models in Machine Learning - Medium", type: "article", url: "https://medium.com/@bhupendra360i/the-pros-and-cons-of-using-pre-trained-models-in-machine-learning-9bbd9e6802f", xp: 30 },
                { title: "Challenges of Using Pre-trained Models: the Practitioners' Perspective - ResearchGate", type: "article", url: "https://www.researchgate.net/publication/382312695_Challenges_of_Using_Pre-trained_Models_the_Practitioners'_Perspective", xp: 30 }
              ],
              flashcardQuestion: "What is a major risk or limitation of relying on third-party pre-trained models?",
              flashcardAnswer: "You inherit any biases or poor data quality present in the original training dataset. Furthermore, if using an opaque model behind an API, you face a lack of transparency and potential intellectual property or licensing risks."
            }
          ]
        },
        {
          id: "popular-ai-models",
          title: "Popular AI Models",
          description: "Exploring proprietary and open models across key providers.",
          parentId: "using-pretrained-models",
          difficulty: "Beginner",
          estimatedDuration: "8 hours",
          xp: 300,
          children: [
            {
              id: "openai-models",
              title: "OpenAI Models (GPT-4o, GPT-3.5)",
              description: "General intelligence standard-bearers.",
              parentId: "popular-ai-models",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "ChatGPT API Full Course - OpenAI API For Beginners", type: "video", url: "https://www.youtube.com/watch?v=J_OJAwnEuFs", xp: 50 },
                { title: "OpenAI Official YouTube Channel", type: "video", url: "https://www.youtube.com/@OpenAI/videos", xp: 50 },
                { title: "OpenAI API Documentation (Model Optimization & Fine-tuning)", type: "article", url: "https://developers.openai.com/api/docs/guides/model-optimization", xp: 30 },
                { title: "OpenAI Platform Quickstart", type: "article", url: "https://platform.openai.com/docs/quickstart", xp: 30 }
              ],
              flashcardQuestion: "What is the primary advantage of OpenAI's GPT-4o model over previous generations?",
              flashcardAnswer: "GPT-4o is natively multimodal from the ground up, allowing it to process text, audio, and images natively and much faster, whereas previous models often relied on separate models stitched together for different modalities."
            },
            {
              id: "anthropic-claude",
              title: "Anthropic's Claude",
              description: "Focus on extended context window, code editing, and structural outputs.",
              parentId: "popular-ai-models",
              difficulty: "Beginner",
              estimatedDuration: "1.5 hours",
              xp: 60,
              resources: [
                { title: "Claude Code for Beginners Tutorial [Full Course]", type: "video", url: "https://www.youtube.com/watch?v=gh2_PhgZGsM", xp: 50 },
                { title: "Claude Certified Architect – Foundations Course Guide", type: "video", url: "https://www.youtube.com/watch?v=WpEwatKitWY", xp: 50 },
                { title: "Claude Batch API & Multi-Pass Review", type: "video", url: "https://www.youtube.com/watch?v=BXs7QoLQxX0", xp: 50 },
                { title: "Anthropic Official Documentation", type: "article", url: "https://docs.anthropic.com/", xp: 30 },
                { title: "Claude API Reference", type: "article", url: "https://docs.anthropic.com/claude/reference/getting-started-with-the-api", xp: 30 }
              ],
              flashcardQuestion: "What is Anthropic's 'Constitutional AI' approach in the Claude models?",
              flashcardAnswer: "Constitutional AI is Anthropic's methodology for training helpful and harmless AI assistants without relying entirely on human feedback. It involves giving the model a 'constitution' (a set of ethical rules and principles) which it uses to critique and revise its own generated responses."
            },
            {
              id: "google-gemini",
              title: "Google's Gemini",
              description: "Native multimodal features and extremely large context windows.",
              parentId: "popular-ai-models",
              difficulty: "Beginner",
              estimatedDuration: "1.5 hours",
              xp: 60,
              resources: [
                { title: "How to Use Google Gemini Al (Full Tutorial)", type: "video", url: "https://www.youtube.com/watch?v=PDMcpthR88U", xp: 50 },
                { title: "Google Gemini Complete Beginners Guide 2026", type: "video", url: "https://www.youtube.com/watch?v=jAl9YNnXDKc", xp: 50 },
                { title: "Google Gemini: PRO Tutorial for Beginners", type: "video", url: "https://www.youtube.com/watch?v=8aRJYpExTfs", xp: 50 },
                { title: "Google Gemini Documentation", type: "article", url: "https://ai.google.dev/docs", xp: 30 },
                { title: "Google Gemini API Quickstart", type: "article", url: "https://ai.google.dev/tutorials/quickstart", xp: 30 }
              ],
              flashcardQuestion: "What is the defining structural capability of Google's Gemini Pro 1.5 compared to other standard LLMs?",
              flashcardAnswer: "Its massive context window, capable of processing over 1 to 2 million tokens in a single prompt. This allows developers to upload entire codebases, long books, or hours of video directly into the context."
            },
            {
              id: "huggingface-models",
              title: "Hugging Face Models",
              description: "Open weights ecosystem for self-hosting.",
              parentId: "popular-ai-models",
              difficulty: "Intermediate",
              estimatedDuration: "1 hour",
              xp: 80,
              resources: [
                { title: "Hugging Face Tutorial for Beginners", type: "video", url: "https://www.youtube.com/watch?v=3xLTD5wSBEs", xp: 50 },
                { title: "Deploying AI Models with Hugging Face – Hands-On Course", type: "video", url: "https://www.youtube.com/watch?v=R8h_gpSpEVU", xp: 50 },
                { title: "Hugging Face Documentation", type: "article", url: "https://huggingface.co/docs", xp: 30 },
                { title: "Hugging Face Transformer Course", type: "article", url: "https://huggingface.co/course/chapter1/1", xp: 30 }
              ],
              flashcardQuestion: "Why would an AI Engineer choose to use Hugging Face instead of an API provider like OpenAI or Anthropic?",
              flashcardAnswer: "Hugging Face provides an open-source ecosystem where developers can download the raw weights of models (like Llama or Mistral). This is crucial for organizations that need complete data privacy, offline capabilities, custom local fine-tuning, and no vendor lock-in."
            },
            {
              id: "mistral-ai",
              title: "Mistral AI",
              description: "High-performance modular open-weights models.",
              parentId: "popular-ai-models",
              difficulty: "Intermediate",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "Mistral AI Agents | Full Walkthrough", type: "video", url: "https://www.youtube.com/watch?v=oaIBkEdITRQ", xp: 50 },
                { title: "Mistral AI Official YouTube Channel", type: "video", url: "https://www.youtube.com/@MistralAIOfficial/videos", xp: 50 },
                { title: "Mistral AI Official Documentation", type: "article", url: "https://docs.mistral.ai/", xp: 30 },
                { title: "Mistral Platform API Guide", type: "article", url: "https://docs.mistral.ai/platform/endpoints/", xp: 30 }
              ],
              flashcardQuestion: "What is the 'Mixture of Experts' (MoE) architecture often associated with Mistral models?",
              flashcardAnswer: "MoE is an architectural design where a model consists of several sub-networks ('experts'). For any given token, only a small subset of these experts are activated. This allows the model to have a massive total parameter count (high capacity) while remaining fast and compute-efficient during inference."
            },
            {
              id: "cohere-models",
              title: "Cohere",
              description: "Text analysis, rerank models, and multilingual search.",
              parentId: "popular-ai-models",
              difficulty: "Intermediate",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "Model Mondays - Unlocking enterprise value with Cohere", type: "video", url: "https://www.youtube.com/watch?v=7bgLTt1obZI", xp: 50 },
                { title: "Cohere Official YouTube Channel (NLP Tutorials)", type: "video", url: "https://www.youtube.com/@CohereAI/videos", xp: 50 },
                { title: "Cohere Documentation", type: "article", url: "https://docs.cohere.com/", xp: 30 },
                { title: "Cohere LLM University", type: "article", url: "https://llm.university", xp: 30 }
              ],
              flashcardQuestion: "What specific enterprise RAG pipeline component is Cohere extremely well-regarded for?",
              flashcardAnswer: "Cohere is renowned for its Rerank model endpoints. In a standard RAG pipeline, a vector database retrieves the top documents based on similarity, and then a Rerank model re-scores and reorders those documents based on true relevance before sending them to the LLM."
            },
            {
              id: "replicate",
              title: "Replicate",
              description: "API hosting infrastructure for open-source AI models.",
              parentId: "popular-ai-models",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 40,
              resources: [
                { title: "Replicate API: Generate Stunning Images (Tutorial)", type: "video", url: "https://www.youtube.com/watch?v=QtDbE1KMGMQ", xp: 50 },
                { title: "Replicate Official YouTube Channel", type: "video", url: "https://www.youtube.com/@replicatehq/videos", xp: 50 },
                { title: "Replicate Documentation", type: "article", url: "https://replicate.com/docs", xp: 30 },
                { title: "Getting Started with Replicate API", type: "article", url: "https://replicate.com/docs/get-started", xp: 30 }
              ],
              flashcardQuestion: "What is the core value proposition of Replicate for AI Engineers?",
              flashcardAnswer: "Replicate provides simple API endpoints to run open-source models (like Llama, Stable Diffusion, or Whisper) without the engineer needing to understand complex GPU provisioning, model hosting, Docker containers, or infrastructure scaling."
            }
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
      estimatedDuration: "10 hours",
      xp: 600,
      children: [
        {
          id: "openai-api",
          title: "OpenAI API",
          description: "Core REST structures and SDK integrations.",
          parentId: "openai-platform",
          difficulty: "Beginner",
          estimatedDuration: "7 hours",
          xp: 400,
          children: [
            {
              id: "chat-completions",
              title: "Chat Completions API",
              description: "Integrating chat history, system instructions, and completion formats.",
              parentId: "openai-api",
              difficulty: "Beginner",
              estimatedDuration: "1.5 hours",
              xp: 80,
              resources: [
                { title: "Chat Completions API Guide", type: "article", url: "https://developers.openai.com/api/docs/guides/text", xp: 30 },
                { title: "Migrate to Responses Guide", type: "article", url: "https://developers.openai.com/api/docs/guides/migrate-to-responses", xp: 30 },
                { title: "OpenAI API Tutorial 1", type: "video", url: "https://www.youtube.com/watch?v=cLJ9KE4iyeY", xp: 50 },
                { title: "OpenAI API Tutorial 2", type: "video", url: "https://www.youtube.com/watch?v=WeqnZGZWyrI", xp: 50 }
              ],
              flashcardQuestion: "In the OpenAI Chat Completions API, what are the primary roles used to construct a conversation?",
              flashcardAnswer: "The primary roles are 'system' (sets the behavior), 'user' (provides the query), and 'assistant' (the model's past responses)."
            },
            {
              id: "writing-prompts-api",
              title: "Writing Prompts",
              description: "Formatting instructions programmatically inside system role templates.",
              parentId: "openai-api",
              difficulty: "Beginner",
              estimatedDuration: "1.5 hours",
              xp: 60,
              resources: [
                { title: "Prompt Engineering Guide (OpenAI)", type: "article", url: "https://platform.openai.com/docs/guides/prompt-engineering", xp: 30 },
                { title: "Prompting Guide", type: "article", url: "https://www.promptingguide.ai/", xp: 30 },
                { title: "Writing Prompts Tutorial 1", type: "video", url: "https://www.youtube.com/watch?v=jC4v5AS4ART", xp: 50 },
                { title: "Writing Prompts Tutorial 2", type: "video", url: "https://www.youtube.com/watch?v=dOxUroR57hs", xp: 50 }
              ],
              flashcardQuestion: "What is the benefit of putting instructions in the 'system' message rather than the 'user' message?",
              flashcardAnswer: "The system message provides high-level persistent instructions that the model prioritizes, making it more robust against user prompt injections and ensuring consistent formatting."
            },
            {
              id: "max-tokens",
              title: "Maximum Tokens",
              description: "Configuring safety ceilings for completion and usage limits.",
              parentId: "openai-api",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 40,
              resources: [
                { title: "What are tokens and how to count them", type: "article", url: "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them", xp: 30 },
                { title: "Models Overview", type: "article", url: "https://platform.openai.com/docs/models", xp: 30 },
                { title: "Understanding Tokens Tutorial", type: "video", url: "https://www.youtube.com/watch?v=ic3sYZJ9WxQ", xp: 50 }
              ],
              flashcardQuestion: "What does the 'max_tokens' parameter actually control in an OpenAI API request?",
              flashcardAnswer: "It strictly limits the maximum number of tokens generated in the OUTPUT (completion), it does not limit the size of the input prompt (which is constrained by the model's context window)."
            },
            {
              id: "token-counting",
              title: "Token Counting",
              description: "Using tiktoken to calculate lengths prior to request execution.",
              parentId: "openai-api",
              difficulty: "Intermediate",
              estimatedDuration: "1 hour",
              xp: 80,
              resources: [
                { title: "Token Counting Guide", type: "article", url: "https://developers.openai.com/api/docs/guides/token-counting", xp: 30 },
                { title: "Tiktoken GitHub Repository", type: "article", url: "https://github.com/openai/tiktoken", xp: 30 },
                { title: "Token Counting Tutorial", type: "video", url: "https://www.youtube.com/watch?v=f9x0L-z3Oq4", xp: 50 }
              ],
              flashcardQuestion: "Why should developers use a library like 'tiktoken' before sending requests to the API?",
              flashcardAnswer: "To accurately calculate the number of tokens in a string offline, ensuring the prompt doesn't exceed context limits and accurately estimating API costs before making the call."
            },
            {
              id: "pricing-considerations",
              title: "Pricing Considerations",
              description: "Optimizing input vs output token expenditures.",
              parentId: "openai-api",
              difficulty: "Beginner",
              estimatedDuration: "1 hour",
              xp: 50,
              resources: [
                { title: "OpenAI Pricing", type: "article", url: "https://openai.com/api/pricing/", xp: 30 },
                { title: "Managing Costs (Production Best Practices)", type: "article", url: "https://platform.openai.com/docs/guides/production-best-practices/managing-costs", xp: 30 },
                { title: "API Pricing Tutorial", type: "video", url: "https://www.youtube.com/watch?v=b4OtwM1T6wQ", xp: 50 }
              ],
              flashcardQuestion: "How is the OpenAI API typically billed?",
              flashcardAnswer: "It is billed based on usage, calculated per 1,000 (or 1 million) tokens. The cost is split between input tokens (the prompt you send) and output tokens (the response the model generates), with output tokens usually being more expensive."
            },
            {
              id: "managing-tokens-api",
              title: "Managing Tokens",
              description: "Implementing custom sliding context filters to prevent overflow.",
              parentId: "openai-api",
              difficulty: "Intermediate",
              estimatedDuration: "1 hour",
              xp: 90,
              resources: [
                { title: "Rate Limits", type: "article", url: "https://platform.openai.com/docs/guides/rate-limits", xp: 30 },
                { title: "How to Handle Rate Limits", type: "article", url: "https://cookbook.openai.com/examples/how_to_handle_rate_limits", xp: 30 },
                { title: "Managing Rate Limits Tutorial", type: "video", url: "https://www.youtube.com/watch?v=HntcHYNfD3Q", xp: 50 }
              ],
              flashcardQuestion: "What happens if a chat conversation history grows larger than the model's maximum context window?",
              flashcardAnswer: "The API request will fail with an error. Developers must implement sliding window strategies, summarizing old messages, or dropping the oldest messages to manage token limits."
            }
          ]
        },
        {
          id: "openai-playground",
          title: "OpenAI Playground",
          description: "Direct developer console simulation of parameters like temperature, top_p, and frequency penalty.",
          parentId: "openai-platform",
          difficulty: "Beginner",
          estimatedDuration: "1.5 hours",
          xp: 50,
          resources: [
            { title: "OpenAI Playground", type: "article", url: "https://platform.openai.com/playground", xp: 30 },
            { title: "Learn the OpenAI API Playground", type: "article", url: "https://www.codecademy.com/learn/learn-the-open-ai-api-playground", xp: 30 },
            { title: "OpenAI Playground Tutorial 1", type: "video", url: "https://www.youtube.com/watch?v=nWArLQfY0Ls", xp: 50 },
            { title: "OpenAI Playground Tutorial 2", type: "video", url: "https://www.youtube.com/watch?v=SmzmPNsEpNM", xp: 50 }
          ],
          flashcardQuestion: "What is the primary purpose of the OpenAI Playground?",
          flashcardAnswer: "It provides a web-based UI for developers to quickly experiment with API parameters (like temperature, top_p, and roles) and test prompts without needing to write any code."
        },
        {
          id: "fine-tuning",
          title: "Fine-tuning",
          description: "Preparing JSONL data patterns to align structural output styles.",
          parentId: "openai-platform",
          difficulty: "Advanced",
          estimatedDuration: "1.5 hours",
          xp: 120,
          resources: [
            { title: "Supervised Fine-tuning Guide", type: "article", url: "https://developers.openai.com/api/docs/guides/supervised-fine-tuning", xp: 30 },
            { title: "Fine-tuning Best Practices", type: "article", url: "https://developers.openai.com/api/docs/guides/fine-tuning-best-practices", xp: 30 },
            { title: "Fine-tuning Tutorial 1", type: "video", url: "https://www.youtube.com/watch?v=o9jz04bIW0E", xp: 50 },
            { title: "Fine-tuning Tutorial 2", type: "video", url: "https://www.youtube.com/watch?v=ya888p-_HJ0", xp: 50 }
          ],
          flashcardQuestion: "In what format must data be prepared for OpenAI's supervised fine-tuning API?",
          flashcardAnswer: "Data must be formatted as a JSONL (JSON Lines) file, where each line is a valid JSON object representing a single conversational training example with 'system', 'user', and 'assistant' roles."
        }
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
