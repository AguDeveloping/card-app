//db.getCollection("cards").find({})

const now = new Date();
const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

db.cards.aggregate([
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
      avgCardsCompletedPerDayLast30Days: [
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
            avg: { $avg: "$count" }
          }
        }
      ],
      mostActiveProjectLast30Days: [
        { $match: { createdAt: { $gte: days30 } } },
        { $group: { _id: "$title", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]
    }
  },
  {
    $project: {
      totalCards: { $arrayElemAt: ["$totalCards.count", 0] },
      totalStatus: "$totalStatus",
      totalProjects: { $arrayElemAt: ["$totalProjects.count", 0] },
      cardsCreatedLast7Days: { $arrayElemAt: ["$cardsCreatedLast7Days.count", 0] },
      cardsCompletedLast7Days: { $arrayElemAt: ["$cardsCompletedLast7Days.count", 0] },
      avgCardsCompletedPerDayLast30Days: { $ifNull: [{ $arrayElemAt: ["$avgCardsCompletedPerDayLast30Days.avg", 0] }, 0] },
      mostActiveProjectLast30Days: { $arrayElemAt: ["$mostActiveProjectLast30Days", 0] }
    }
  }
])
