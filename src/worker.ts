interface DetectRoleRequest {
  prompt: string;
  system?: string;
}

interface GenerateContentRequest {
  prompt: string;
  system?: string;
}

interface AIMessage {
  role: string;
  content: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Enable CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Only accept POST request
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST method allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse body from request
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/detect-role") {
        const { prompt, system } = body as DetectRoleRequest;

        if (!prompt) {
          return new Response(
            JSON.stringify({ error: "Missing required field: prompt" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        const result = await detectRole(prompt, system, env);
        return new Response(JSON.stringify({ result }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      if (path === "/generate-content") {
        const { prompt, system } = body as GenerateContentRequest;

        if (!prompt) {
          return new Response(
            JSON.stringify({ error: "Missing required field: prompt" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        const result = await generateContent(prompt, system, env);
        return new Response(JSON.stringify({ result }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};

async function detectRole(
  prompt: string,
  system: string | undefined,
  env: Env
): Promise<string> {
  try {
    // Build messages
    const messages: AIMessage[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const chat = { messages };

    // Call AI
    const selectedModel = env.AI_MODEL || "@cf/meta/llama-3-8b-instruct";
    const response = await env.AI.run(selectedModel, chat);

    return (response as any).response?.[0]?.text || "Software Engineer";
  } catch (error) {
    console.error("Error detecting role:", error);
    return "Software Engineer";
  }
}

async function generateContent(
  prompt: string,
  system: string | undefined,
  env: Env
): Promise<string> {
  try {
    // Build messages
    const messages: AIMessage[] = [];
    if (system) {
      messages.push({ role: "system", content: system });
    }
    messages.push({ role: "user", content: prompt });

    const chat = { messages };

    // Call AI
    const selectedModel = env.AI_MODEL || "@cf/meta/llama-3-8b-instruct";
    const response = await env.AI.run(selectedModel, chat);

    return (response as any).response?.[0]?.text || "Failed to generate content.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "An error occurred while generating content. Please try again.";
  }
}

interface Env {
  AI: any;
  AI_MODEL?: string;
}
