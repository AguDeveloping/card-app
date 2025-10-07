db.getCollection("cards").find({})

db.getCollection("cards").find({"status": "in-progress"})

//db.getCollection("cards").updateMany({"status": "in-progress"},{$set: {"status": "doing"}})
