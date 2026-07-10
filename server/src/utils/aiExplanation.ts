import Groq from 'groq-sdk';

// Initialize Groq client (only if key exists)
const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

export async function explainScore(scoreData: any, profile: any): Promise<string> {
  const prompt = `
    You are a friendly, encouraging financial assistant named Sakhi for women in the informal economy in India. 
    Explain this alternative credit score to the user in simple, everyday language (no complex jargon).
    Use relatable analogies. Keep it under 3-4 sentences.
    
    User Profile: Name: ${profile.name}, Occupation: ${profile.occupation}
    Score: ${scoreData.score}/100
    Breakdown: ${JSON.stringify(scoreData.breakdown)}
  `;

  // 1. Try OpenRouter if key is present
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log("Using OpenRouter SDK to explain score (model: tencent/hy3:free)...");
      const { OpenRouter } = await import('@openrouter/sdk');
      const openrouter = new OpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY
      });

      const response = await openrouter.chat.send({
        chatRequest: {
          model: "tencent/hy3:free",
          messages: [
            { role: "system", content: "You are a helpful, empathetic financial literacy assistant for underserved women. Keep answers simple, short, and encouraging. Always end in one specific next action." },
            { role: "user", content: prompt }
          ]
        }
      });

      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        return response.choices[0].message.content || '';
      }
    } catch (error) {
      console.error("Error communicating with OpenRouter SDK:", error);
    }
  }

  // 2. Fallback to Groq
  if (groq) {
    try {
      console.log("Falling back to Groq API to explain score...");
      const response = await groq.chat.completions.create({
        model: "llama3-8b-8192", 
        max_tokens: 300,
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a helpful, empathetic financial literacy assistant for underserved women. Keep answers simple, short, and encouraging. Always end in one specific next action." },
          { role: "user", content: prompt }
        ]
      });
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error("Groq API Error:", error);
    }
  }

  // 3. Static fallback explanation
  return `Hi ${profile.name}! Your SakhiScore is ${scoreData.score}/100. This shows a very promising start! Like watering a small plant, small regular savings and timely bill payments will help your credit score grow tall and strong. Keep using Sakhi to record your income and payments regularly to qualify for better loan matches soon!`;
}
