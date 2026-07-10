import { Request, Response } from 'express';
import Profile from '../models/Profile';
import Income from '../models/Income';
import Expense from '../models/Expense';

export class LiteracyController {
  async handleChat(req: Request, res: Response) {
    try {
      const { message, history, language } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        console.warn('OPENROUTER_API_KEY is not set. Returning fallback chat response.');
        return res.json({
          reply: "I am having trouble connecting to my AI brain because the API key is not configured, but I am always here to help you save and grow your business!"
        });
      }

      // Fetch user profile and financials for personalization
      const authUser = (req as any).user;
      let userContextPrompt = '';

      if (authUser) {
        const [profile, incomes, expenses] = await Promise.all([
          Profile.findOne({ sessionId: authUser.userId }),
          Income.find({ userId: authUser.userId }),
          Expense.find({ userId: authUser.userId })
        ]);

        if (profile) {
          const totalIncome = incomes.reduce((acc, inc) => acc + (inc.amount || 0), 0);
          const totalExpense = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
          const creditScore = profile.currentScore || 0;
          const tokenBalance = profile.tokenBalance || 0;
          const occupation = profile.occupation || 'business owner';

          userContextPrompt = `
You are responding to a user with the following real-time profile:
- Name: ${profile.name}
- Occupation: ${occupation}
- Credit Score (SakhiScore): ${creditScore}
- Reward Wallet Balance: ${tokenBalance} SAKHI
- Monthly Income: ₹${totalIncome}
- Monthly Expenses: ₹${totalExpense}
Use these specific facts to give tailored advice, savings tips, and encouraging business feedback. For example, if they have tailors/SHG/etc. context, make analogies to that. If their expenses exceed income, gently suggest budgeting. Do not mention that you received this structured list.
`;
        }
      }

      console.log(`AI Assistant answering message in language: ${language || 'English'}`);

      const { OpenRouter } = await import('@openrouter/sdk');
      const openrouter = new OpenRouter({ apiKey });

      // Build system prompt
      const systemPrompt = `You are Sakhi, a warm, friendly, and encouraging financial literacy AI assistant for women entrepreneurs in India. 
Respond in the language specified (e.g. Hindi, English, Marathi, etc.) or matching the user's input style.
Explain financial terms (like savings, microloans, interest, EMIs, and government schemes) in simple, relatable terms. Use local analogies (like sowing seeds, running local shops, tailoring, or self-help groups).
Keep replies encouraging, simple, and under 3-4 sentences. Always conclude with one specific next step.
${userContextPrompt}`;

      // Map history to OpenRouter messages
      const formattedMessages = [
        { role: 'system', content: systemPrompt }
      ];

      if (Array.isArray(history)) {
        history.forEach((m: any) => {
          if (m.role && (m.text || m.content)) {
            formattedMessages.push({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.text || m.content
            });
          }
        });
      }

      // Add current message
      formattedMessages.push({
        role: 'user',
        content: message
      });

      // Call OpenRouter SDK
      const response = await openrouter.chat.send({
        chatRequest: {
          model: 'tencent/hy3:free',
          messages: formattedMessages as any
        }
      });

      if (response && response.choices && response.choices[0] && response.choices[0].message) {
        const reply = response.choices[0].message.content;
        return res.json({ reply });
      } else {
        throw new Error('Invalid response structure from OpenRouter SDK');
      }

    } catch (error: any) {
      console.error('AI Chat Assistant error:', error);
      res.status(500).json({
        reply: "I'm having a little trouble thinking right now. Let's try again in a few moments, or check your connection!"
      });
    }
  }
}

export const literacyController = new LiteracyController();
