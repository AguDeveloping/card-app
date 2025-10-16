import { Request, Response } from 'express';
import Card, { ICard } from '../models/Card';
import { IUser } from '../models/User';
import { checkOwnership } from '../middleware/authorization';
import aggregateCardStats from '../queries/aggregateCardStats';
import logger from '../utils/logger';

// Get user's own cards
export const getUserCards = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;

    // log the user making the request: statusFilters: todo, doing, done
    // logger.info(`Request query: ${JSON.stringify(req.query)}`);
    let filters = {};
    if (req.query.status) {
      filters = { ...filters, status: req.query.status };
    }
    // logger.info(`Query filters: ${JSON.stringify(filters)}`);

    const cards = await Card
      .find({ ...filters, userId: user._id })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.json(cards);
  } catch (error) {
    logger.error('Error fetching user cards:', error);
    res.status(500).json({ message: 'Error fetching cards', error });
  }
};

// Get a single card by ID
export const getCardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const cardId = req.params.id;

    const card = await Card.findById(cardId).populate('userId', 'username email');

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Check ownership
    if (!checkOwnership(card.userId._id.toString(), user)) {
      res.status(403).json({ message: 'Access denied - not card owner' });
      return;
    }

    res.json(card);
  } catch (error) {
    logger.error('Error fetching card:', error);
    res.status(500).json({ message: 'Error fetching card', error });
  }
};

// Create a new card
export const createCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const card = new Card({ ...req.body, userId: user._id });
    const savedCard = await card.save();
    await savedCard.populate('userId', 'username email'); // Populate user details
    logger.info(`Card created by user ${user.username} (${user._id}): ${savedCard._id}`);
    res.status(201).json(savedCard);
  } catch (error) {
    logger.error('Error creating card:', error);
    res.status(500).json({ message: 'Error creating card', error });
  }
};

// Update a card
export const updateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const cardId = req.params.id;

    logger.info('=== UPDATE CARD DEBUG ===');
    logger.info('User from req.user:', {
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });
    logger.info('Card ID:', cardId);

    const card: ICard | null = await Card.findById(cardId);

    if (!card) {
      res
        .status(404)
        .json({ message: 'Card not found' });
      return;
    }

    logger.info('Card found:', {
      id: card._id!.toString(),
      userId: card.userId.toString(),
      title: card.title
    });

    // Check ownership
    if (!checkOwnership(card.userId.toString(), user)) {
      logger.info('❌ Access denied - ownership check failed');
      res
        .status(403)
        .json({ message: 'Access denied - not card owner' });
      return;
    }
    logger.info('✅ Ownership check passed, updating card...');

    const updatedCard = await Card
      .findByIdAndUpdate(
        cardId,
        req.body,
        { new: true, runValidators: true }
      )
      .populate('userId', 'username email');

    logger.info('✅ Card updated successfully');
    res.json(updatedCard);
  } catch (error: any) {
    logger.error('Error updating card:', error.message);
    res.status(500).json({ message: 'Error updating card', error });
  }
};

// Delete a card
export const deleteCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as IUser;
    const cardId = req.params.id;

    const card = await Card.findById(cardId);

    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }

    // Check ownership
    if (!checkOwnership(card.userId.toString(), user)) {
      res.status(403).json({ message: 'Access denied - not card owner' });
      return;
    }

    await Card.findByIdAndDelete(cardId);
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    logger.error('Error deleting card:', error);
    res.status(500).json({ message: 'Error deleting card', error });
  }
};

// Get card statistics
export const getCardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Fetching card statistics");
    // logger.info(`Request query: ${JSON.stringify(req.query)}`);

    const user = req.user as IUser;

    const stats = await aggregateCardStats(user);
    // logger.info(`Card statistics: ${JSON.stringify(stats)}`);

    if (!stats || stats.length === 0) {
      res.status(404).json({ message: 'No statistics available' });
      return;
    }
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching card statistics', error });
  }
};
