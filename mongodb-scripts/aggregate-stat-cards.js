//db.getCollection("cards").find({})

const now = new Date();
const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

db.getCollection("cards").aggregate([
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


// Query to count cards created in last 7 days:
db.getCollection("cards").countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});

// Query to count cards completed in last 7 days:
db.getCollection("cards").countDocuments({
    status: "done",
    updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
});

db.getCollection("cards").deleteOne({ "_id": ObjectId("68e92b5b397066614344152e") });

db.getCollection("cards").find({});

db.getCollection("cards").countDocuments();

db.getCollection("cards").insertOne(
    {
        "title": "Testing cards statics",
        "description": "New card for stats test.",
        "status": "done",
        "createdAt": now,
        "updatedAt": now,
        "__v" : 0
    },
);
// result
{
    "acknowledged" : true,
    "insertedId" : ObjectId("68e92b5b397066614344152e")
}

db.getCollection("cards").findOne({"_id" : ObjectId("68e92c89397066614344152f")});

