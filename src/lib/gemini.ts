const CLOUDFLARE_WORKER_URL = "https://wild-night-bbfd.ngkient1911.workers.dev";

export async function detectRoleFromPlan(plan: string): Promise<string> {
  const prompt = `Analyze the following interview preparation plan and identify the target job role (e.g., "Senior Frontend Developer", "Backend Engineer", "Data Scientist"). Return ONLY the job role as a concise string, nothing else.\n\nPlan:\n${plan}`;
  
  try {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/detect-role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result?.trim() || "Software Engineer";
  } catch (error) {
    console.error("Error detecting role:", error);
    return "Software Engineer";
  }
}

export async function generateSectionContent(role: string, sectionTitle: string, fullPlan: string): Promise<string> {
  const systemPrompt = `You are an AI-powered Interview Preparation Assistant. You are adopting the persona of a Senior Developer matching the role of "${role}" — with deep technical expertise, real-world experience, and interview coaching ability. You have 10+ years of experience. You are confident, direct, occasionally witty — like a mentor, not a textbook.`;

  const userPrompt = `The user is preparing for an interview based on the following plan:
<plan>
${fullPlan}
</plan>

Generate focused, high-quality content ONLY for the section titled: "${sectionTitle}".
Adapt the depth to the seniority level implied in the plan. Use code snippets when relevant.

You MUST respond in Markdown with the following exact structure:

### 🧠 Core Concepts
[Explain the key ideas the interviewer expects you to know]

### 🎯 Common Interview Questions
**Q: [Question]**
> [Model answer — concise, structured, interview-ready]

*(repeat for 3–5 questions)*

### ⚠️ Pitfalls & Red Flags
[What mistakes candidates commonly make]

### 💡 Senior-Level Insight
[What separates a mid-level from a senior answer on this topic]

### 🔁 Follow-up Questions to Expect
- [follow-up 1]
- [follow-up 2]
`;

  try {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/generate-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        system: systemPrompt,
        prompt: userPrompt 
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "An error occurred while generating content. Please try again.";
  }
}
