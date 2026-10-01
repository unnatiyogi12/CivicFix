import mongoose from "mongoose";
import dotenv from "dotenv";

import GovernmentSource from "./models/GovernmentSource.js";
import GovernmentService from "./models/GovernmentService.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| OFFICIAL GOVERNMENT SOURCES
|--------------------------------------------------------------------------
*/

const sources = [
  {
    sourceName: "Bhopal District Government - Public Utilities",
    organization: "District Administration Bhopal",
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    department: "District Administration",
    category: "Public Utilities",
    sourceType: "official_website",
    officialUrl: "https://bhopal.nic.in/en/public-utilities/",
    description:
      "Official Bhopal District Government source listing municipal bodies and electricity utility information.",
    jurisdiction: "Bhopal District",
    license: "Government public information",
    status: "active",
    lastVerified: new Date(),
  },

  {
    sourceName: "Bhopal Municipal Corporation Official Portal",
    organization: "Bhopal Municipal Corporation",
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    department: "Bhopal Municipal Corporation",
    category: "Municipal Services",
    sourceType: "official_portal",
    officialUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    description:
      "Official Bhopal Municipal Corporation portal providing citizen services, solid waste management, building permission, departments and municipal information.",
    jurisdiction: "Bhopal Municipal Corporation",
    license: "Official government information",
    status: "active",
    lastVerified: new Date(),
  },

  {
    sourceName: "Madhya Pradesh e-Service Portal",
    organization: "Government of Madhya Pradesh",
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    department: "Government of Madhya Pradesh",
    category: "Citizen Services",
    sourceType: "official_portal",
    officialUrl: "https://www.services.mp.gov.in/eservice/eServices?srvs=25",
    description:
      "Official Madhya Pradesh e-Service portal containing municipal and citizen service procedures including garbage collection, sewer cleaning, sewer connection and other urban services.",
    jurisdiction: "Madhya Pradesh",
    license: "Official government information",
    status: "active",
    lastVerified: new Date(),
  },

  {
    sourceName: "Water Supply SCADA Bhopal",
    organization:
      "Ministry of Housing and Urban Affairs / Smart Cities Mission / Bhopal",
    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    department: "Bhopal Smart City / Water Management",
    category: "Water Supply",
    sourceType: "official_dataset",
    officialUrl:
      "https://tn.data.gov.in/catalog/water-supply-scada-bhopal",
    description:
      "Official Open Government Data catalog describing Bhopal water supply SCADA for water management, leak detection, water quality monitoring and water loss estimation.",
    jurisdiction: "Bhopal Municipal Corporation",
    license: "Government Open Data License - India",
    status: "active",
    lastVerified: new Date(),
  },
];

/*
|--------------------------------------------------------------------------
| GOVERNMENT SERVICES
|--------------------------------------------------------------------------
*/

const services = [
  {
    serviceName: "Garbage Collection",
    serviceCategory: "Solid Waste Management",
    subcategory: "Garbage Collection",
    description:
      "Urban garbage collection service for complaints related to uncollected household or public garbage.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Solid Waste Management",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "verified",

    officialUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    sourceEvidence:
      "BMC official portal provides Solid Waste Management and municipal citizen services.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Use official BMC solid waste information and MP e-Service procedure documents.",
  },

  {
    serviceName: "Sewerage Cleaning",
    serviceCategory: "Drainage and Sewerage",
    subcategory: "Sewer Cleaning",
    description:
      "Cleaning of sewerage systems and related urban sewer maintenance complaints.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Drainage and Sewerage",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "verified",

    officialUrl:
      "https://www.services.mp.gov.in/eservice/eServices?srvs=25",
    sourceEvidence:
      "MP e-Service portal lists service 5.33 for garbage collection and sewerage cleaning.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Retrieve official sewer cleaning procedure and service information.",
  },

  {
    serviceName: "New Sewer Connection",
    serviceCategory: "Drainage and Sewerage",
    subcategory: "Sewer Connection",
    description:
      "Application/service process for providing a new sewer connection where technically feasible.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Drainage and Sewerage",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "verified",

    officialUrl:
      "https://www.services.mp.gov.in/eservice/eServices?srvs=25",
    sourceEvidence:
      "MP e-Service portal lists service 5.34 for new sewer connection where technically feasible.",

    complaintChannel: "MP e-Service",
    complaintUrl:
      "https://www.services.mp.gov.in/eservice/eServices?srvs=25",

    ragEnabled: true,
    ragNotes:
      "Use official service procedure before showing citizen instructions.",
  },

  {
    serviceName: "Water Supply",
    serviceCategory: "Water Supply",
    subcategory: "Water Supply / Leakage",
    description:
      "Municipal water supply related complaints including supply issues and water leakage.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Water Supply",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "verified",

    officialUrl:
      "https://tn.data.gov.in/catalog/water-supply-scada-bhopal",
    sourceEvidence:
      "Official OGD catalog describes Water Supply SCADA at Bhopal Municipal Corporation for water management, leak detection and water quality monitoring.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Future RAG can retrieve official water supply and leakage procedures.",
  },

  {
    serviceName: "Electricity Supply Complaint",
    serviceCategory: "Electricity",
    subcategory: "Power Supply",
    description:
      "Electricity supply related complaints within the documented MPMKVVCL service area.",
    authorityName:
      "Madhya Pradesh Madhya Kshetra Vidyut Vitaran Co. Ltd.",
    department: "Electricity",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",

    routingStatus: "verified",

    officialUrl: "https://portal.mpcz.in",
    sourceEvidence:
      "Bhopal District Government officially lists MPMKVVCL as the electricity utility for Bhopal.",

    complaintChannel: "MPMKVVCL Official Portal",
    complaintUrl: "https://portal.mpcz.in",
    complaintPhone: "0755-2602033",

    ragEnabled: true,
    ragNotes:
      "Use official MPMKVVCL information for electricity complaint procedures.",
  },

  {
    serviceName: "Building Permission",
    serviceCategory: "Building and Construction",
    subcategory: "Building Permission",
    description:
      "Municipal building permission and approval related service.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Building Permission",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "verified",

    officialUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    sourceEvidence:
      "BMC official portal provides online Building Permission services.",

    complaintChannel: "BMC Building Permission",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",

    ragEnabled: true,
    ragNotes:
      "Future RAG should retrieve official building permission procedure and documents.",
  },

  {
    serviceName: "Streetlight Complaint",
    serviceCategory: "Street Lighting",
    subcategory: "Streetlight",
    description:
      "Streetlight malfunction or non-functional streetlight complaint.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Street Lighting",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    /*
     * We are deliberately not marking this verified yet.
     * Exact streetlight jurisdiction needs official verification.
     */
    routingStatus: "jurisdiction_required",

    officialUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    sourceEvidence:
      "BMC official portal contains municipal electricity branch information, but exact streetlight jurisdiction/service mapping requires verification.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Do not automatically forward until exact streetlight jurisdiction is verified.",
  },

  {
    serviceName: "Road / Pothole Complaint",
    serviceCategory: "Roads",
    subcategory: "Pothole / Road Damage",
    description:
      "Road damage, pothole and road maintenance complaint.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Roads",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    /*
     * A road may belong to different authorities.
     * CivicFix must check jurisdiction before final routing.
     */
    routingStatus: "jurisdiction_required",

    officialUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    sourceEvidence:
      "Municipal road responsibility exists, but exact road ownership/jurisdiction must be verified for each location.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Before routing, verify whether the road falls under BMC or another road authority.",
  },

  {
    serviceName: "Drainage Complaint",
    serviceCategory: "Drainage and Sewerage",
    subcategory: "Drain / Waterlogging",
    description:
      "Open drain blockage, drainage problem and waterlogging related complaint.",
    authorityName: "Bhopal Municipal Corporation",
    department: "Drainage and Sewerage",

    state: "Madhya Pradesh",
    district: "Bhopal",
    city: "Bhopal",
    municipality: "Bhopal Municipal Corporation",

    routingStatus: "jurisdiction_required",

    officialUrl:
      "https://www.services.mp.gov.in/eservice/eServices?srvs=25",
    sourceEvidence:
      "Official MP e-Service portal documents urban sewerage cleaning services; exact drainage network responsibility can vary by location.",

    complaintChannel: "BMC Citizen Services",
    complaintUrl:
      "https://www.bmconline.gov.in/sap/bc/ui5_ui5/sap/zbmcprdhome/index.html",
    complaintPhone: "155304",

    ragEnabled: true,
    ragNotes:
      "Verify whether the complaint concerns sewerage, storm-water drainage or another network.",
  },
];

/*
|--------------------------------------------------------------------------
| MAIN SEED FUNCTION
|--------------------------------------------------------------------------
*/

const seedGovernmentData = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");

    /*
     * STEP 1:
     * Create/update government sources
     */

    const sourceMap = {};

    for (const sourceData of sources) {
      const source = await GovernmentSource.findOneAndUpdate(
        {
          sourceName: sourceData.sourceName,
        },
        sourceData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      sourceMap[sourceData.sourceName] = source._id;

      console.log(`✅ Source ready: ${sourceData.sourceName}`);
    }

    /*
     * STEP 2:
     * Attach correct source to each service
     */

    const sourceNames = {
      bmc: "Bhopal Municipal Corporation Official Portal",
      district: "Bhopal District Government - Public Utilities",
      mpService: "Madhya Pradesh e-Service Portal",
      water: "Water Supply SCADA Bhopal",
    };

    const serviceSourceMap = [
      {
        serviceName: "Garbage Collection",
        source: sourceNames.bmc,
      },
      {
        serviceName: "Sewerage Cleaning",
        source: sourceNames.mpService,
      },
      {
        serviceName: "New Sewer Connection",
        source: sourceNames.mpService,
      },
      {
        serviceName: "Water Supply",
        source: sourceNames.water,
      },
      {
        serviceName: "Electricity Supply Complaint",
        source: sourceNames.district,
      },
      {
        serviceName: "Building Permission",
        source: sourceNames.bmc,
      },
      {
        serviceName: "Streetlight Complaint",
        source: sourceNames.bmc,
      },
      {
        serviceName: "Road / Pothole Complaint",
        source: sourceNames.bmc,
      },
      {
        serviceName: "Drainage Complaint",
        source: sourceNames.mpService,
      },
    ];

    /*
     * STEP 3:
     * Create/update services
     */

    for (const serviceData of services) {
      const sourceInfo = serviceSourceMap.find(
        (item) => item.serviceName === serviceData.serviceName
      );

      const sourceId = sourceInfo
        ? sourceMap[sourceInfo.source]
        : null;

      const finalServiceData = {
        ...serviceData,
        sourceId,
        lastVerified: new Date(),
        active: true,
      };

      await GovernmentService.findOneAndUpdate(
        {
          serviceName: serviceData.serviceName,
          city: serviceData.city,
        },
        finalServiceData,
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`✅ Service ready: ${serviceData.serviceName}`);
    }

    /*
     * SUMMARY
     */

    const sourceCount = await GovernmentSource.countDocuments();
    const serviceCount = await GovernmentService.countDocuments();

    console.log("\n======================================");
    console.log("🎉 GOVERNMENT DATA SEED COMPLETED");
    console.log("======================================");
    console.log(`Government Sources : ${sourceCount}`);
    console.log(`Government Services: ${serviceCount}`);
    console.log("======================================\n");

    await mongoose.disconnect();

    console.log("🔌 MongoDB disconnected");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Government data seed failed");
    console.error(error);

    await mongoose.disconnect();

    process.exit(1);
  }
};

seedGovernmentData();