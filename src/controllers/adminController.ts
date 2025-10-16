import { Request, Response } from 'express';
import Card from '../models/Card';
import logger from '../utils/logger';

// Get all cards (admin only)
export const getAllCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await Card.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json(cards);
  } catch (error) {
    logger.error('Error fetching all cards:', error);
    res.status(500).json({ message: 'Error fetching cards', error });
  }
};
