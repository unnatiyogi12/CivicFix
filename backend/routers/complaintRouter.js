import express from "express";

import Complaint from "../models/complaint.js";

import User from "../models/User.js";

import Incident from "../models/incident.js";

import GovernmentSource from "../models/GovernmentSource.js";

import GovernmentService from "../models/GovernmentService.js";

import {

    notifyCitizenForStatus,

    notifyCitizen,

    notifyAdmins,

    notifyGovernmentUsers

} from "../services/notificationService.js"



import {

    getLocationIntelligence

} from "../services/locationService.js";



import {

    findGovernmentRoute

} from "../services/governmentRoutingService.js";



import authMiddleware from "../middlewares/authMiddleware.js";

import adminMiddleware from "../middlewares/adminMiddleware.js";

import governmentMiddleware from "../middlewares/governmentMiddleware.js";



const router = express.Router();


const getCivicFixStatus = (complaint) => {

    if (complaint.civicFixStatus) {

        return complaint.civicFixStatus;

    }



    if (complaint.status === "Under Review") return "Under Review";

    if (complaint.status === "Verified") return "Verified";

    if (complaint.status === "Forwarded") return "Forwarded";

    if (complaint.status === "Resolved") return "Resolved";



    return "Reported";

};


router.post(

    "/",

    authMiddleware,

    async (req, res) => {



        try {



            const {

                title,

                description,

                category,

                location,

                severity

            } = req.body;



            if (

                !title ||

                !description ||

                !location

            ) {

                return res.status(400).json({

                    success: false,

                    message: "Please provide required fields"

                });



            }

            let aiClassification = {
                isCivic: null,
                area: "",
                subcategory: "",
                subcategorySource: "",
                severity: "",
                department: "",
                priorityScore: 0,
                priority: "",
                recommendedAction: ""
            };


            try {



                const ML_API_URL =
                    "https://civicfix-backend-ce2z.onrender.com";



                console.log(
                    "\n🤖 Sending complaint to CivicFix AI..."
                );



                console.log(
                    "Title:",
                    title
                );



                console.log(
                    "Description:",
                    description
                );



                const controller =
                    new AbortController();



                const timeout =
                    setTimeout(
                        () => controller.abort(),
                        90000
                    );



                let mlResponse;



                try {



                    mlResponse =
                        await fetch(
                            `${ML_API_URL}/predict`,
                            {

                                method: "POST",



                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Accept":
                                        "application/json"

                                },



                                body:
                                    JSON.stringify({

                                        title:
                                            String(
                                                title
                                            ).trim(),

                                        description:
                                            String(
                                                description
                                            ).trim()

                                    }),



                                signal:
                                    controller.signal

                            }
                        );

                } finally {

                    clearTimeout(
                        timeout
                    );

                }

                console.log(
                    "🤖 ML HTTP Status:",
                    mlResponse.status
                );



                const mlRawText =
                    await mlResponse.text();



                console.log(
                    "🤖 ML Raw Response:",
                    mlRawText
                );



                if (!mlResponse.ok) {

                    throw new Error(
                        `ML API returned HTTP ${mlResponse.status}: ${mlRawText}`
                    );

                }

                let mlData;

                try {

                    mlData =
                        JSON.parse(
                            mlRawText
                        );



                } catch (parseError) {



                    throw new Error(
                        `ML API returned invalid JSON: ${parseError.message}`
                    );
                }

                console.log(
                    "✅ ML Parsed Response:",
                    mlData
                );

                const readML = (
                    camelCaseKey,
                    snakeCaseKey,
                    fallback = ""
                ) => {

                    if (

                        mlData[
                            camelCaseKey
                        ] !== undefined &&

                        mlData[
                            camelCaseKey
                        ] !== null

                    ) {



                        return mlData[
                            camelCaseKey
                        ];
                    }

                    if (

                        snakeCaseKey &&

                        mlData[
                            snakeCaseKey
                        ] !== undefined &&

                        mlData[
                            snakeCaseKey
                        ] !== null

                    ) {

                        return mlData[
                            snakeCaseKey
                        ];


                    }

                    return fallback;
                };
                const priorityScoreValue =
                    Number(

                        readML(
                            "priorityScore",
                            "priority_score",
                            0
                        )

                    );



                aiClassification = {



                    isCivic:
                        readML(
                            "isCivic",
                            "is_civic",
                            null
                        ),


                    area:
                        readML(
                            "area",
                            null,
                            ""
                        ),



                    subcategory:
                        readML(
                            "subcategory",
                            "sub_category",
                            ""
                        ),



                    subcategorySource:
                        readML(
                            "subcategorySource",
                            "sub_category_source",
                            "ml_model"
                        ),



                    severity:
                        readML(
                            "severity",
                            null,
                            ""
                        ),



                    department:
                        readML(
                            "department",
                            null,
                            ""
                        ),



                    priorityScore:
                        Number.isFinite(
                            priorityScoreValue
                        )
                            ? priorityScoreValue
                            : 0,



                    priority:
                        readML(
                            "priority",
                            null,
                            ""
                        ),



                    recommendedAction:
                        readML(
                            "recommendedAction",
                            "recommended_action",
                            ""
                        )



                };



                console.log(
                    "🧠 FINAL AI CLASSIFICATION:",
                    aiClassification
                );



            } catch (mlError) {



                console.error(
                    "❌ ML API FAILED:",
                    mlError.message
                );



                aiClassification = {

                    isCivic: null,

                    area: "",

                    subcategory: "",

                    subcategorySource:
                        "",

                    severity: "",

                    department: "",

                    priorityScore: 0,

                    priority: "",

                    recommendedAction: ""

                };

            }

            let duplicateDetection = {

                isDuplicate: false,



                similarityScore: 0,



                matchedComplaintId: null,



                message: ""

            };

            try {

                console.log(
                    "\n🔎 Checking for duplicate complaints..."
                );

                const existingComplaints =
                    await Complaint.find({})

                        .select(
                            "_id title description aiClassification createdAt"
                        )

                        .sort({
                            createdAt: -1
                        })

                        .limit(100);

                const complaintCandidates =
                    existingComplaints.map(
                        (complaint) => ({

                            id:
                                complaint._id.toString(),



                            text:
                                `${complaint.title} ${complaint.description}`

                        })

                    );

                if (
                    complaintCandidates.length > 0
                ) {


                    const duplicateResponse =
                        await fetch(
                            "https://civicfix-ml.onrender.com/duplicate-check",
                            {

                                method: "POST",



                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },


                                body:
                                    JSON.stringify({

                                        complaintText:
                                            `${title} ${description}`,



                                        existingComplaints:
                                            complaintCandidates

                                    })

                            }

                        );


                    if (
                        duplicateResponse.ok
                    ) {

                        const duplicateData =
                            await duplicateResponse.json();

                        console.log(
                            "🔎 Duplicate Result:",
                            duplicateData
                        );

                        duplicateDetection = {



                            isDuplicate:
                                duplicateData.isDuplicate ??
                                false,



                            similarityScore:
                                duplicateData.similarityScore ??
                                0,



                            matchedComplaintId:
                                duplicateData.isDuplicate
                                    ? (
                                        duplicateData.matchedComplaintId ??
                                        null
                                    )
                                    : null,



                            message:
                                duplicateData.message ??
                                ""



                        };



                    } else {



                        console.log(
                            "❌ Duplicate API returned status:",
                            duplicateResponse.status
                        );



                    }



                } else {

                    console.log(
                        "ℹ️ No existing complaints available for duplicate check."
                    );



                }



            } catch (duplicateError) {



                console.log(
                    "⚠️ Duplicate detection failed:",
                    duplicateError.message
                );

            }


            let processedLocation =
                location;

            try {

                const locationResult =
                    await getLocationIntelligence({

                        latitude:
                            location.latitude,



                        longitude:
                            location.longitude,



                        address:
                            location.address || ""

                    });
                if (
                    locationResult.success
                ) {

                    processedLocation =
                        locationResult.location;



                    console.log(
                        "📍 Location processed:",
                        processedLocation
                    );

                }

            } catch (locationError) {

                console.log(
                    "⚠️ Location intelligence failed:",
                    locationError.message
                );
            }

            let governmentRouting = {

                status: "not_checked",

                serviceId: null,

                serviceName: "",

                authorityName: "",

                department: "",

                officialUrl: "",

                complaintChannel: "",

                complaintUrl: "",

                complaintPhone: "",

                sourceId: null,

                sourceName: "",

                routingMessage: "",

                matchedAt: null
            };

            try {



                console.log(
                    "\n🏛️ Finding Government Service..."
                );



                const routingResult =
                    await findGovernmentRoute({

                        area:
                            aiClassification.area,



                        subcategory:
                            aiClassification.subcategory,



                        department:
                            aiClassification.department,



                        title,



                        description,



                        location:
                            processedLocation

                    });



                governmentRouting = {



                    status:
                        routingResult.status,



                    serviceId:
                        routingResult.service?.id ||
                        null,



                    serviceName:
                        routingResult.service?.serviceName ||
                        "",



                    authorityName:
                        routingResult.service?.authorityName ||
                        "",



                    department:
                        routingResult.service?.department ||
                        aiClassification.department ||
                        "",



                    officialUrl:
                        routingResult.service?.officialUrl ||
                        "",



                    complaintChannel:
                        routingResult.service?.complaintChannel ||
                        "",



                    complaintUrl:
                        routingResult.service?.complaintUrl ||
                        "",



                    complaintPhone:
                        routingResult.service?.complaintPhone ||
                        "",



                    sourceId:
                        routingResult.source?.id ||
                        null,



                    sourceName:
                        routingResult.source?.sourceName ||
                        "",



                    routingMessage:
                        routingResult.message ||
                        "",



                    matchedAt:
                        new Date()



                };



                console.log(
                    "🏛️ Government Routing:",
                    governmentRouting
                );



            } catch (routingError) {



                console.log(
                    "⚠️ Government routing failed:",
                    routingError.message
                );
            }
            const priorityValue =
                typeof aiClassification.priority === "string"
                    ? aiClassification.priority.trim()
                    : "";

            const priority =
                ["Low", "Medium", "High", "Critical"].includes(
                    priorityValue
                )
                    ? priorityValue
                    : "";

            const complaint =
                await Complaint.create({

                    userId:
                        req.user.userId,


                    title,

                    description,

                    category,

                    location:
                        processedLocation,

                    severity:
                        aiClassification.severity ||
                        severity ||
                        "Low",

                    aiClassification: {


                        isCivic:
                            aiClassification.isCivic,



                        area:
                            aiClassification.area,



                        subcategory:
                            aiClassification.subcategory,



                        subcategorySource:
                            aiClassification.subcategorySource,



                        severity:
                            aiClassification.severity,



                        department:
                            aiClassification.department

                    },

                    priorityScore:
                        Number(
                            aiClassification.priorityScore ??
                            0
                        ),


                    priority,



                    recommendedAction:
                        aiClassification.recommendedAction ||
                        " ",



                    duplicateDetection,


                    governmentRouting

                });


            console.log(
                "\n✅ Complaint saved:",
                complaint._id
            );


            let incident = null;

            try {

                if (

                    duplicateDetection.isDuplicate &&

                    duplicateDetection.matchedComplaintId

                ) {

                    console.log(
                        "\n🔗 Possible duplicate found."
                    );

                    console.log(
                        "Matched Complaint:",
                        duplicateDetection.matchedComplaintId
                    );

                    const matchedComplaint =
                        await Complaint.findById(
                            duplicateDetection.matchedComplaintId
                        );
                    if (matchedComplaint) {


                        if (
                            matchedComplaint.incidentId
                        ) {

                            incident =
                                await Incident.findById(
                                    matchedComplaint.incidentId
                                );

                            if (incident) {

                                const alreadyLinked =
                                    incident.complaints.some(
                                        (id) =>
                                            id.toString() ===
                                            complaint._id.toString()
                                    );

                                if (!alreadyLinked) {

                                    incident.complaints.push(
                                        complaint._id
                                    );

                                }

                                incident.complaintCount =
                                    incident.complaints.length;



                                await incident.save();

                                console.log(
                                    "🔗 Complaint added to existing incident:",
                                    incident.incidentId
                                );

                            }

                        }


                        else {

                            const incidentNumber =
                                `INC-${Date.now()}`;

                            incident =
                                await Incident.create({

                                    incidentId:
                                        incidentNumber,


                                    title:
                                        matchedComplaint.title,


                                    area:
                                        matchedComplaint
                                            .aiClassification
                                            ?.area ||
                                        "",


                                    subcategory:
                                        matchedComplaint
                                            .aiClassification
                                            ?.subcategory ||
                                        "",


                                    department:
                                        matchedComplaint
                                            .aiClassification
                                            ?.department ||
                                        "",


                                    priority:
                                        matchedComplaint.priority ||
                                        "",

                                    complaintCount:
                                        2,

                                    complaints: [

                                        matchedComplaint._id,

                                        complaint._id

                                    ],

                                    status:
                                        "Open",


                                    location:
                                        matchedComplaint.location

                                });



                            matchedComplaint.incidentId =
                                incident._id;



                            matchedComplaint.incidentStatus =
                                incident.status;



                            await matchedComplaint.save();



                            console.log(
                                "🆕 New incident created:",
                                incident.incidentId
                            );



                        }

                    }

                }

            } catch (incidentError) {

                console.log(
                    "⚠️ Incident clustering failed:",
                    incidentError.message
                );

            }

            if (incident) {

                complaint.incidentId =
                    incident._id;

                complaint.incidentStatus =
                    incident.status;

                await complaint.save();

                await notifyAdmins({

                    complaintId:
                        complaint._id,

                    title:
                        "New Complaint Reported",

                    message:
                        `A new complaint "${complaint.title}" has been reported by a citizen.`,

                    type:
                        "complaint_submitted"

                });

                console.log(
                    "🔗 New complaint linked to incident:",
                    incident.incidentId
                );

            }


            res.status(201).json({

                success: true,

                message:
                    "Complaint created successfully",

                complaint,

                aiClassification,

                duplicateDetection,

                governmentRouting,

                location:
                    complaint.location,

                incident:

                    incident

                        ? {

                            id:
                                incident._id,


                            incidentId:
                                incident.incidentId,


                            complaintCount:
                                incident.complaintCount,


                            status:
                                incident.status

                        }

                        : null

            });

        } catch (error) {

            console.error(
                "❌ Complaint creation error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Server error",

                error:
                    error.message
            });

        }

    }

);


router.get(

    "/my",

    authMiddleware,

    async (req, res) => {



        try {



            const complaints =
                await Complaint.find({

                    userId:
                        req.user.userId

                })

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                )

                .sort({
                    createdAt: -1
                });



            res.status(200).json({

                success: true,



                complaints

            });



        } catch (error) {



            console.error(
                "Fetch complaints error:",
                error
            );



            res.status(500).json({

                success: false,



                message:
                    "Failed to fetch complaints",



                error:
                    error.message

            });



        }



    }

);


router.get(

    "/admin/all",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {

        try {

            const complaints =
                await Complaint.find()

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                )

                .sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                count:
                    complaints.length,


                complaints

            });

        } catch (error) {

            console.error(
                "Admin complaints error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch complaints",

                error:
                    error.message

            });


        }


    }

);


router.get(

    "/admin/incidents",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {


        try {

            const incidents =
                await Incident.find()

                .populate(
                    "complaints"
                )

                .sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                count:
                    incidents.length,


                incidents

            });


        } catch (error) {

            console.error(
                "Admin incidents error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch incidents",

                error:
                    error.message

            });


        }


    }

);




router.patch(

    "/admin/:complaintId/status",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {



        try {


            const {
                complaintId
            } = req.params;



            const {
                status: requestedStatus
            } = req.body;



            const allowedStatuses = [

                "Reported",

                "Under Review",

                "Verified",

                "Resolved",

                "Rejected",

                "Routed",

                "Forwarded"

            ];


            if (
                !allowedStatuses.includes(
                    requestedStatus
                )
            ) {


                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid CivicFix status. Government action statuses cannot be changed by admin."

                });

            }

            const complaint =
                await Complaint.findById(
                    complaintId
                );


            if (!complaint) {

                return res.status(404).json({

                    success: false,


                    message:
                        "Complaint not found"

                });

            }

            const currentStatus =
                getCivicFixStatus(
                    complaint
                );


            const transitionMap = {

                "Reported": [
                    "Under Review",
                    "Rejected"
                ],

                "Under Review": [
                    "Verified",
                    "Rejected"
                ],

                "Verified": [
                    "Rejected"
                ],

                "Forwarded": [],

                "Resolved": [],

                "Rejected": [],

                "Routed": []

            };



            if (
                requestedStatus ===
                currentStatus
            ) {

                return res.status(200).json({

                    success: true,



                    message:
                        "Complaint is already at this CivicFix status.",



                    complaint

                });

            }

            if (
                !(transitionMap[
                    currentStatus
                ] || []).includes(
                    requestedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid CivicFix status transition: ${currentStatus} → ${requestedStatus}.`,

                    civicFixStatus:
                        currentStatus,

                    governmentStatus:
                        complaint.governmentStatus ||
                        "Not Received"

                });

            }

            complaint.civicFixStatus =
                requestedStatus;


            complaint.status =
                requestedStatus;

            await complaint.save();


            const updatedComplaint =
                await Complaint.findById(
                    complaint._id
                )

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                );



            await notifyCitizenForStatus(
                complaint.userId,
                complaint._id,
                requestedStatus
            );



            return res.status(200).json({

                success: true,



                message:
                    "CivicFix complaint status updated successfully.",



                complaint:
                    updatedComplaint

            });



        } catch (error) {



            console.error(
                "Admin status update error:",
                error
            );



            return res.status(500).json({

                success: false,



                message:
                    "Failed to update CivicFix complaint status.",



                error:
                    error.message

            });



        }



    }

);

router.patch(

    "/admin/:complaintId/government-forward",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {


        try {

            const {
                complaintId
            } = req.params;


            const complaint =
                await Complaint.findById(
                    complaintId
                );


            if (!complaint) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Complaint not found"

                });

            }

            const currentStatus =
                getCivicFixStatus(
                    complaint
                );

            if (
                currentStatus !==
                "Verified"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only Verified complaints can be forwarded to government."

                });

            }

            const route =
                complaint.governmentRouting;


            if (
                !route ||
                route.status !==
                "matched"
            ) {


                return res.status(400).json({

                    success: false,

                    message:
                        "Government route has not been verified for this complaint."

                });

            }

            complaint.civicFixStatus =
                "Forwarded";

            complaint.status =
                "Forwarded";

            complaint.governmentStatus =
                "Not Received";

            complaint.governmentForwarding = {

                forwardedAt:
                    new Date(),

                forwardedBy:
                    req.user.userId,

                serviceId:
                    route.serviceId,

                sourceId:
                    route.sourceId,

                serviceName:
                    route.serviceName,

                authorityName:
                    route.authorityName,

                department:
                    route.department,

                complaintChannel:
                    route.complaintChannel,

                complaintUrl:
                    route.complaintUrl,

                complaintPhone:
                    route.complaintPhone,

                officialUrl:
                    route.officialUrl,

                routingMessage:
                    route.routingMessage

            };



            await complaint.save();



            await notifyGovernmentUsers({

                complaintId:
                    complaint._id,

                title:
                    "New Complaint Forwarded",

                message:
                    `A CivicFix complaint "${complaint.title}" has been forwarded to government for action.`,

                type:
                    "forwarded"

            });



            await notifyCitizenForStatus(
                complaint.userId,
                complaint._id,
                "Forwarded"
            );



            const updatedComplaint =
                await Complaint.findById(
                    complaint._id
                )

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                );



            return res.status(200).json({

                success: true,



                message:
                    "Complaint forwarded to government successfully.",



                complaint:
                    updatedComplaint

            });



        } catch (error) {



            console.error(
                "Government forwarding error:",
                error
            );



            return res.status(500).json({

                success: false,



                message:
                    "Failed to forward complaint to government.",



                error:
                    error.message

            });



        }



    }

);


router.get(

    "/government/all",

    authMiddleware,

    governmentMiddleware,

    async (req, res) => {

        try {

            const complaints =
                await Complaint.find({

                    civicFixStatus: {

                        $in: [
                            "Forwarded",
                            "Resolved"
                        ]

                    }

                })

                .sort({
                    createdAt: -1
                })

                .lean();



            return res.status(200).json({

                success: true,

                count:
                    complaints.length,

                complaints

            });

        } catch (error) {

            console.error(
                "Government complaints fetch error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch government complaints"

            });
        }

    }

);


const governmentTransitionMap = {

    "Not Received": [
        "Received"
    ],

    "Received": [
        "Accepted"
    ],

    "Accepted": [
        "Work Started"
    ],

    "Work Started": [
        "In Progress"
    ],

    "In Progress": [
        "Resolution Submitted"
    ],

    "Resolution Submitted": []

};

router.patch(

    "/government/:complaintId/action",

    authMiddleware,

    governmentMiddleware,

    async (req, res) => {

        try {

            const {
                complaintId
            } = req.params;

            const {
                status,
                resolutionNote = "",
                proofUrls = []
            } = req.body;

            const allowedStatuses =
                Object.keys(
                    governmentTransitionMap
                );

            const requestedStatus =
                String(
                    status || ""
                ).trim();

            if (
                !allowedStatuses.includes(
                    requestedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,


                    message:
                        "Invalid government action status."

                });

            }

            const complaint =
                await Complaint.findById(
                    complaintId
                );

            if (!complaint) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Complaint not found"

                });

            }

            if (
                getCivicFixStatus(
                    complaint
                ) !== "Forwarded"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Government action can start only after CivicFix forwards the complaint."

                });

            }

            const currentGovernmentStatus =
                complaint.governmentStatus ||
                "Not Received";


            if (
                requestedStatus ===
                currentGovernmentStatus
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Government status is already ${currentGovernmentStatus}.`

                });

            }

            if (
                !(
                    governmentTransitionMap[
                        currentGovernmentStatus
                    ] || []
                ).includes(
                    requestedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Invalid government status transition: ${currentGovernmentStatus} → ${requestedStatus}.`,

                    governmentStatus:
                        currentGovernmentStatus

                });

            }

            const now =
                new Date();

            complaint.governmentStatus =
                requestedStatus;

            complaint.governmentAction.lastUpdatedAt =
                now;

            complaint.governmentAction.lastUpdatedBy =
                req.user.userId;

            if (
                requestedStatus ===
                "Received"
            ) {

                complaint.governmentAction.receivedAt =
                    now;

            }

            if (
                requestedStatus ===
                "Accepted"
            ) {

                complaint.governmentAction.acceptedAt =
                    now;

            }

            if (
                requestedStatus ===
                "Work Started"
            ) {

                complaint.governmentAction.workStartedAt =
                    now;

            }

            if (
                requestedStatus ===
                "Resolution Submitted"
            ) {

                const cleanNote =
                    String(
                        resolutionNote ||
                        ""
                    ).trim();

                const cleanProofUrls =
                    Array.isArray(
                        proofUrls
                    )
                        ? proofUrls
                            .map(
                                (url) =>
                                    String(
                                        url || ""
                                    ).trim()
                            )
                            .filter(
                                Boolean
                            )
                        : [];

                if (!cleanNote) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Resolution note is required."

                    });

                }

                if (
                    cleanProofUrls.length ===
                    0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "At least one proof URL is required."

                    });

                }

                if (
                    cleanProofUrls.length >
                    10
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Maximum 10 proof URLs are allowed."

                    });

                }
                complaint.governmentAction.resolutionSubmittedAt =
                    now;

                complaint.governmentAction.resolutionNote =
                    cleanNote;

                complaint.governmentAction.proofUrls =
                    cleanProofUrls;

                complaint.resolutionReview.status =
                    "Pending";

                complaint.resolutionReview.reviewedAt =
                    null;

                complaint.resolutionReview.reviewedBy =
                    null;

                complaint.resolutionReview.note =
                    "";

                await complaint.save();


                await notifyAdmins({

                    complaintId:
                        complaint._id,

                    title:
                        "Government Resolution Submitted",

                    message:
                        `Government has submitted resolution proof for "${complaint.title}". Admin review is required.`,

                    type:
                        "resolution_submitted"

                });

            }

            await complaint.save();

            const updatedComplaint =
                await Complaint.findById(
                    complaint._id
                )

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                );


            return res.status(200).json({

                success: true,

                message:
                    "Government complaint status updated successfully.",


                complaint:
                    updatedComplaint

            });

        } catch (error) {

            console.error(
                "Government action error:",
                error
            );

            return res.status(500).json({

                success: false,


                message:
                    "Failed to update government action.",


                error:
                    error.message

            });


        }


    }

);

router.patch(

    "/admin/:complaintId/resolution-review",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {

        try {

            const {
                complaintId
            } = req.params;



            const {
                decision,
                note = ""
            } = req.body;



            const normalizedDecision =
                String(
                    decision || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                ![
                    "approve",
                    "rework",
                    "reject"
                ].includes(
                    normalizedDecision
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Decision must be approve, rework, or reject."

                });

            }

            const complaint =
                await Complaint.findById(
                    complaintId
                );

            if (!complaint) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Complaint not found"

                });

            }

            if (
                getCivicFixStatus(
                    complaint
                ) !== "Forwarded"
            ) {

                return res.status(400).json({

                    success: false,
                    message:
                        "Resolution review is available only for forwarded complaints."

                });
            }

            if (
                complaint.governmentStatus !==
                "Resolution Submitted"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Government resolution has not been submitted yet."

                });
            }
            const resolutionNote =
                String(
                    complaint
                        .governmentAction
                        ?.resolutionNote ||
                    ""
                ).trim();

            const proofUrls =
                Array.isArray(
                    complaint
                        .governmentAction
                        ?.proofUrls
                )
                    ? complaint
                        .governmentAction
                        .proofUrls
                    : [];

            if (
                !resolutionNote ||
                proofUrls.length === 0
            ) {

                return res.status(400).json({

                    success: false,
                    message:
                        "Resolution note and proof are required before review."

                });

            }
            const reviewNote =
                String(
                    note || ""
                ).trim();


            if (
                normalizedDecision ===
                "approve"
            ) {

                complaint.civicFixStatus =
                    "Resolved";

                complaint.status =
                    "Resolved";

                complaint.resolutionReview.status =
                    "Approved";

                complaint.resolutionReview.reviewedAt =
                    new Date();

                complaint.resolutionReview.reviewedBy =
                    req.user.userId;

                complaint.resolutionReview.note =
                    reviewNote;

                await complaint.save();

                await notifyCitizenForStatus(
                    complaint.userId,
                    complaint._id,
                    "Resolved"
                );

                await notifyCitizen({

                    userId:
                        complaint.userId,

                    complaintId:
                        complaint._id,

                    title:
                        "Complaint Resolved",

                    message:
                        `Your complaint "${complaint.title}" has been marked resolved after government proof review.`,

                    type:
                        "resolved"

                });



                return res.status(200).json({

                    success: true,



                    message:
                        "Government resolution approved. Complaint is now Resolved.",



                    complaint

                });

            }

            complaint.governmentStatus =
                "In Progress";


            complaint.governmentAction.resolutionSubmittedAt =
                null;


            complaint.resolutionReview.status =
                "Rejected";


            complaint.resolutionReview.reviewedAt =
                new Date();


            complaint.resolutionReview.reviewedBy =
                req.user.userId;


            complaint.resolutionReview.note =
                reviewNote
            await complaint.save();

            await notifyGovernmentUsers({

                complaintId:
                    complaint._id,

                title:
                    "Resolution Rework Required",

                message:
                    `Admin has requested rework for complaint "${complaint.title}".`,

                type:
                    "status_update"

            });



            return res.status(200).json({

                success: true,

                message:
                    "Resolution sent back for rework.",

                complaint

            });

        } catch (error) {


            console.error(
                "Resolution review error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to review government resolution.",

                error:
                    error.message

            });

        }

    }

);

router.get(

    "/admin/:complaintId",

    authMiddleware,

    adminMiddleware,

    async (req, res) => {

        try {

            const {
                complaintId
            } = req.params;

            const complaint =
                await Complaint.findById(
                    complaintId
                )

                .populate(
                    "userId",
                    "name email"
                )

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                );



            if (!complaint) {



                return res.status(404).json({

                    success: false,



                    message:
                        "Complaint not found"

                });

            }

            return res.status(200).json({

                success: true,

                complaint

            });

        } catch (error) {

            console.error(
                "Single complaint error:",
                error
            );

            return res.status(500).json({

                success: false,



                message:
                    "Failed to fetch complaint.",



                error:
                    error.message

            });



        }



    }

);


router.get(

    "/my/:complaintId",

    authMiddleware,

    async (req, res) => {



        try {



            const {
                complaintId
            } = req.params;



            const complaint =
                await Complaint.findOne({

                    _id:
                        complaintId,



                    userId:
                        req.user.userId

                })

                .populate(
                    "incidentId"
                )

                .populate(
                    "governmentRouting.serviceId"
                )

                .populate(
                    "governmentRouting.sourceId"
                );



            if (!complaint) {



                return res.status(404).json({

                    success: false,



                    message:
                        "Complaint not found"

                });



            }



            return res.status(200).json({

                success: true,



                complaint

            });



        } catch (error) {



            console.error(
                "Citizen complaint error:",
                error
            );



            return res.status(500).json({

                success: false,



                message:
                    "Failed to fetch complaint.",



                error:
                    error.message

            });



        }



    }

);
router.patch(

    "/my/:complaintId/verification",

    authMiddleware,

    async (req, res) => {



        try {



            const {
                complaintId
            } = req.params;



            const {
                decision
            } = req.body;



            const normalizedDecision =
                String(
                    decision || ""
                )
                    .trim()
                    .toLowerCase();



            if (
                ![
                    "confirm",
                    "reopen"
                ].includes(
                    normalizedDecision
                )
            ) {



                return res.status(400).json({

                    success: false,



                    message:
                        "Decision must be confirm or reopen."

                });



            }



            const complaint =
                await Complaint.findOne({

                    _id:
                        complaintId,



                    userId:
                        req.user.userId

                });



            if (!complaint) {



                return res.status(404).json({

                    success: false,



                    message:
                        "Complaint not found"

                });



            }



            if (
                getCivicFixStatus(
                    complaint
                ) !== "Resolved"
            ) {



                return res.status(400).json({

                    success: false,



                    message:
                        "Citizen verification is available only for resolved complaints."

                });



            }



            if (
                normalizedDecision ===
                "confirm"
            ) {



                complaint.citizenVerification =
                    "Confirmed";



                await complaint.save();



                await notifyAdmins({

                    complaintId:
                        complaint._id,

                    title:
                        "Citizen Confirmed Resolution",

                    message:
                        `Citizen has confirmed the resolution of "${complaint.title}".`,

                    type:
                        "status_update"

                });



                return res.status(200).json({

                    success: true,



                    message:
                        "Resolution confirmed successfully.",



                    complaint

                });



            }



            complaint.citizenVerification =
                "Rejected";



            complaint.civicFixStatus =
                "Reopened";



            complaint.status =
                "Reopened";



            complaint.governmentStatus =
                "Not Received";



            complaint.governmentAction.resolutionSubmittedAt =
                null;



            complaint.resolutionReview.status =
                "Pending";



            complaint.resolutionReview.reviewedAt =
                null;



            complaint.resolutionReview.reviewedBy =
                null;



            complaint.resolutionReview.note =
                "Citizen reopened the complaint after resolution.";



            await complaint.save();



            await notifyAdmins({

                complaintId:
                    complaint._id,

                title:
                    "Complaint Reopened by Citizen",

                message:
                    `Citizen has reopened "${complaint.title}" because the issue was not resolved.`,

                type:
                    "reopened"

            });



            await notifyGovernmentUsers({

                complaintId:
                    complaint._id,

                title:
                    "Complaint Reopened",

                message:
                    `Citizen has reopened "${complaint.title}". Further action is required.`,

                type:
                    "reopened"

            });



            return res.status(200).json({

                success: true,



                message:
                    "Complaint reopened successfully.",



                complaint

            });



        } catch (error) {



            console.error(
                "Citizen verification error:",
                error
            );



            return res.status(500).json({

                success: false,



                message:
                    "Failed to process citizen verification.",



                error:
                    error.message

            });



        }



    }

);


export default router;