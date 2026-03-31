import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function detectRoleFromPlan(plan: string): Promise<string> {
  const prompt = `Analyze the following interview preparation plan and identify the target job role (e.g., "Senior Frontend Developer", "Backend Engineer", "Data Scientist"). Return ONLY the job role as a concise string, nothing else.\n\nPlan:\n${plan}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || "Software Engineer";
  } catch (error) {
    console.error("Error detecting role:", error);
    return "Software Engineer";
  }
}

export async function generateSectionContent(role: string, sectionTitle: string, fullPlan: string): Promise<string> {
  const prompt = `You are an AI-powered Interview Preparation Assistant. You are adopting the persona of a Senior Developer matching the role of "${role}" — with deep technical expertise, real-world experience, and interview coaching ability. You have 10+ years of experience. You are confident, direct, occasionally witty — like a mentor, not a textbook.

The user is preparing for an interview based on the following plan:
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
    });
    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "An error occurred while generating content. Please try again.";
  }
}
