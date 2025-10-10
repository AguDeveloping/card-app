import { Request, Response } from 'express';
import Card, { ICard } from '../models/Card';
import logger from '../utils/logger';

// Get all cards
export const getCards = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Fetching all cards");
    // log the user making the request: statusFilters: todo, doing, done
    // logger.info(`Request query: ${JSON.stringify(req.query)}`);
    let filters = {};
    if (req.query.status) {
      filters = { ...filters, status: req.query.status };
    }
    // logger.info(`Query filters: ${JSON.stringify(filters)}`);
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

// Get card statistics
export const getCardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info("Fetching card statistics");
    // logger.info(`Request query: ${JSON.stringify(req.query)}`);

    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // logger.info(`Calculating stats from ${days30} to ${now}`);
    // logger.info(`Calculating stats from ${days7} to ${now}`);
    const stats = await Card.aggregate([
      {
        $facet: {
          totalCards: [
            { $count: "count" }
          ],
          totalStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          totalProjects: [
            { $group: { _id: "$title" } },
            { $count: "count" }
          ],
          cardsCreatedLast7Days: [
            { $match: { createdAt: { $gte: days7 } } },
            { $count: "count" }
          ],
          cardsCompletedLast7Days: [
            { $match: { status: "done", updatedAt: { $gte: days7 } } },
            { $count: "count" }
          ],
          cardsCompletedLast30Days: [
            { $match: { status: "done", updatedAt: { $gte: days30 } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                count: { $sum: 1 }
              }
            },
            {
              $group: {
                _id: null,
                count: { $avg: "$count" }
              }
            }
          ],
          mostActiveProjectLast30Days: [
            { $match: { createdAt: { $gte: days30 } } },
            { $group: { _id: "$title", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 },
            { $project: { name: "$_id", count: 1, _id: 0 } }
          ]
        }
      },
      {
        $project: {
          totalCards: { $arrayElemAt: ["$totalCards.count", 0] },
          totalStatus: "$totalStatus",
          totalProjects: { $arrayElemAt: ["$totalProjects.count", 0] },
          cardsCreatedLast7Days: { $ifNull: [{ $arrayElemAt: ["$cardsCreatedLast7Days.count", 0] }, 0] },
          cardsCompletedLast7Days: { $ifNull: [{ $arrayElemAt: ["$cardsCompletedLast7Days.count", 0] }, 0] },
          cardsCompletedLast30Days: { $ifNull: [{ $arrayElemAt: ["$cardsCompletedLast30Days.count", 0] }, 0] },
          mostActiveProjectLast30Days: { $arrayElemAt: ["$mostActiveProjectLast30Days", 0] }
        }
      }
    ])
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
