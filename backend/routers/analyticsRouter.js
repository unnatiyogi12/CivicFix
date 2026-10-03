import express from "express";
import Complaint from "../models/complaint.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

const router = express.Router();

const counts = (rows) => rows.reduce((a, v) => {
  const k = String(v || "Unknown").trim() || "Unknown";
  a[k] = (a[k] || 0) + 1;
  return a;
}, {});

const top = (obj, limit=15) => Object.entries(obj)
  .map(([label,count]) => ({label,count}))
  .sort((a,b) => b.count-a.count)
  .slice(0,limit);

router.get("/overview", authMiddleware, adminMiddleware, async (req,res) => {
  try {
    const complaints = await Complaint.find({}).select(
      "category severity priority priorityScore civicFixStatus status governmentStatus citizenVerification aiClassification location createdAt"
    ).lean();

    const status = counts(complaints.map(c => c.civicFixStatus || c.status || "Reported"));
    const government = counts(complaints.map(c => c.governmentStatus || "Not Received"));
    const severity = counts(complaints.map(c => c.aiClassification?.severity || c.severity || "Unknown"));
    const category = counts(complaints.map(c => c.aiClassification?.area || c.category || "Other"));
    const priority = counts(complaints.map(c => c.priority || "Unassigned"));
    const ward = counts(complaints.map(c => c.location?.ward || c.location?.wardCode || "Unknown"));

    const now = Date.now(), day = 86400000;
    const recentStart = now - 7*day, previousStart = now - 14*day;
    const recent = complaints.filter(c => new Date(c.createdAt).getTime() >= recentStart).length;
    const previous = complaints.filter(c => {
      const t = new Date(c.createdAt).getTime();
      return t >= previousStart && t < recentStart;
    }).length;

    let anomalyStatus = "Normal";
    let anomalyMessage = "No major 7-day complaint spike detected.";
    if (previous === 0 && recent >= 3) {
      anomalyStatus = "Emerging";
      anomalyMessage = "Recent complaint activity appeared after a zero-complaint baseline.";
    } else if (previous > 0 && recent >= previous*2 && recent >= 4) {
      anomalyStatus = "Spike";
      anomalyMessage = "Recent 7-day complaint volume is at least 2x the previous 7-day volume.";
    }

    const recentCats = counts(complaints.filter(c => new Date(c.createdAt).getTime() >= recentStart)
      .map(c => c.aiClassification?.area || c.category || "Other"));
    const previousCats = counts(complaints.filter(c => {
      const t = new Date(c.createdAt).getTime();
      return t >= previousStart && t < recentStart;
    }).map(c => c.aiClassification?.area || c.category || "Other"));

    const categoryAnomalies = Object.entries(recentCats)
      .map(([label,count]) => ({ label, recentCount:count, previousCount:previousCats[label] || 0 }))
      .filter(x => x.previousCount === 0 ? x.recentCount >= 3 : x.recentCount >= x.previousCount*2 && x.recentCount >= 4)
      .sort((a,b) => b.recentCount-a.recentCount)
      .slice(0,10);

    const resolved = complaints.filter(c => (c.civicFixStatus || c.status) === "Resolved").length;
    const confirmed = complaints.filter(c => c.citizenVerification === "Confirmed").length;
    const reopened = complaints.filter(c => c.citizenVerification === "Rejected").length;

    return res.json({
      success:true,
      generatedAt:new Date().toISOString(),
      summary:{ total:complaints.length, resolved, open:Math.max(complaints.length-resolved,0), citizenConfirmed:confirmed, citizenReopened:reopened },
      statusCounts:top(status,20), governmentStatusCounts:top(government,20), severityCounts:top(severity,10),
      categoryCounts:top(category,15), priorityCounts:top(priority,10),
      hotspots:top(ward,10).map(x => ({...x, hotspot:x.count>=3 ? "High activity" : x.count===2 ? "Watch" : "Low activity"})),
      anomaly:{status:anomalyStatus,message:anomalyMessage,recent7Days:recent,previous7Days:previous,categoryAnomalies}
    });
  } catch(error) {
    console.error("Analytics overview error:", error);
    return res.status(500).json({success:false,message:"Failed to generate analytics.",error:error.message});
  }
});

export default router;
