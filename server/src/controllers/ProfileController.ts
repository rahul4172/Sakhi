import { Request, Response } from 'express';
import { profileService } from '../services/ProfileService';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2),
  occupation: z.string(),
  sessionId: z.string()
});

export class ProfileController {
  async createProfile(req: Request, res: Response) {
    try {
      const data = profileSchema.parse(req.body);
      const profile = await profileService.createOrUpdateProfile(data.sessionId, {
        name: data.name,
        occupation: data.occupation
      });
      res.status(201).json(profile);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const data = await profileService.getProfile(sessionId as string);
      res.json(data);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }
}

export const profileController = new ProfileController();
