import { Request, Response } from 'express';
import Card, { ICard } from '../models/Card';
import logger from '../utils/logger';

// Get all cards
export const getCards = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Fetching all cards");
    // log the user making the request: statusFilters: todo, doing, done
    logger.info(`Request query: ${JSON.stringify(req.query)}`);
    let filters = {};
    if (req.query.status) {
      filters = { ...filters, status: req.query.status };
    }
    logger.info(`Query filters: ${JSON.stringify(filters)}`);
    const cards = await Card.find(filters).sort({ createdAt: -1 });
    res.status(200).json(cards);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cards', error });
  }
};

// Get a single card by ID
export const getCardById = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching card', error });
  }
};

// Create a new card
export const createCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = new Card(req.body);
    const savedCard = await card.save();
    res.status(201).json(savedCard);
  } catch (error) {
    res.status(500).json({ message: 'Error creating card', error });
  }
};

// Update a card
export const updateCard = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Incoming update payload:", req.body); // Add this
    const card = await Card.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    console.log("Updated card:", card); // Add this
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ message: 'Error updating card', error });
  }
};

// Delete a card
export const deleteCard = async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await Card.findByIdAndDelete(req.params.id);
    if (!card) {
      res.status(404).json({ message: 'Card not found' });
      return;
    }
    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting card', error });
  }
};
