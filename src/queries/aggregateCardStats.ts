import mongoose from 'mongoose';
import { IUser } from '../models/User';
import Card from '../models/Card';
// import logger from '../utils/logger';

// Aggregation pipeline to compute card statistics
export const aggregateCardStats = async (user: IUser): Promise<any[]> => {
    const now = new Date();
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // logger.info(`Calculating stats from ${days30} to ${now}`);
    // logger.info(`Calculating stats from ${days7} to ${now}`);

    // Convert userId string to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(user._id);

    const pipeline: mongoose.PipelineStage[] = [
        // FIRST: Filter by userId - this ensures all stats are for this user only
        {
            $match: {
                userId: userObjectId
            }
        },
        // Add user population using $lookup
        {
            $lookup: {
                from: 'users',           // Collection name (lowercase, plural)
                localField: 'userId',    // Field in cards collection
                foreignField: '_id',     // Field in users collection
                as: 'userDetails',       // Output array name
                pipeline: [              // Sub-pipeline to select only needed fields
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            role: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        // Unwind user details (convert from array to object)
        {
            $unwind: {
                path: '$userDetails',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $facet: {
                // User info (will be the same for all cards)
                userInfo: [
                    { $limit: 1 },
                    {
                        $project: {
                            _id: 0,
                            user: '$userDetails'
                        }
                    }
                ],
                totalCards: [
                    { $count: "count" }
                ],
                totalStatus: [
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                    // This stage to ensure all status values are present.
                    {
                        $group: {
                            _id: null,
                            statusCounts: { $push: { status: "$_id", count: "$count" } }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            statusBreakdown: {
                                $map: {
                                    input: ["todo", "doing", "done"],
                                    as: "status",
                                    in: {
                                        _id: "$$status",
                                        count: {
                                            $let: {
                                                vars: {
                                                    found: {
                                                        $filter: {
                                                            input: "$statusCounts",
                                                            cond: { $eq: ["$$this.status", "$$status"] }
                                                        }
                                                    }
                                                },
                                                in: {
                                                    $cond: {
                                                        if: { $gt: [{ $size: "$$found" }, 0] },
                                                        then: { $arrayElemAt: ["$$found.count", 0] },
                                                        else: 0
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    { $unwind: "$statusBreakdown" },
                    { $replaceRoot: { newRoot: "$statusBreakdown" } }
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
                // User info
                user: { $arrayElemAt: ["$userInfo.user", 0] },
                // Stats
                totalCards: { $arrayElemAt: ["$totalCards.count", 0] },
                totalStatus: "$totalStatus",
                totalProjects: { $arrayElemAt: ["$totalProjects.count", 0] },
                cardsCreatedLast7Days: { $ifNull: [{ $arrayElemAt: ["$cardsCreatedLast7Days.count", 0] }, 0] },
                cardsCompletedLast7Days: { $ifNull: [{ $arrayElemAt: ["$cardsCompletedLast7Days.count", 0] }, 0] },
                cardsCompletedLast30Days: { $ifNull: [{ $arrayElemAt: ["$cardsCompletedLast30Days.count", 0] }, 0] },
                mostActiveProjectLast30Days: { $arrayElemAt: ["$mostActiveProjectLast30Days", 0] },
                // Generate date
                generatedAt: now.toISOString()
            }
        }
    ];

    const result = await Card.aggregate(pipeline);

    const stats = result[0] || {
        totalCards: 0,
        totalStatus: [
            {
                "_id": "todo",
                "count": 0
            },
            {
                "_id": "doing",
                "count": 0
            },
            {
                "_id": "done",
                "count": 0
            }
        ],
        totalProjects: 0,
        cardsCreatedLast7Days: 0,
        cardsCompletedLast7Days: 0,
        cardsCompletedLast30Days: 0,
        mostActiveProjectLast30Days: null,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        generatedAt: now.toISOString()
    };

    return stats;
};

export default aggregateCardStats;