import cron from "node-cron";
import recommendationModel from "../models/recommendation.model";

// ✅ Runs every day at midnight
cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Running cron job to check for expired recommendations...");

    try {
        // Get today's date minus 7 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() - 7);

        // **Find and update expired recommendations**
        const updated = await recommendationModel.updateMany(
            { "recommendations.date": { $lte: expiryDate }, "recommendations.expired": false },
            { $set: { "recommendations.$[elem].expired": true } },
            { arrayFilters: [{ "elem.date": { $lte: expiryDate } }] }  // ✅ Correct way to update array elements
        );

        console.log(`✅ ${updated.modifiedCount} recommendations marked as expired.`);
    } catch (error) {
        console.error("❌ Error updating expired recommendations:", error);
    }
});
