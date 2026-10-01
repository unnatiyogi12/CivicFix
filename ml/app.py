from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from inference.predict import predict_complaint
from inference.priority import calculate_priority
from inference.duplicate_detector import detect_duplicate


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="CivicFix AI ML API",
    description=(
        "AI service for CivicFix complaint classification, "
        "priority intelligence and duplicate detection"
    ),
    version="2.2.0"
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ComplaintRequest(BaseModel):

    title: str

    description: str


class DuplicateCheckRequest(BaseModel):

    complaintText: str

    existingComplaints: list[dict]


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {

        "success": True,

        "message":
            "CivicFix AI ML API is running 🚀"

    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {

        "success": True,

        "status":
            "healthy"

    }


# =========================================================
# COMPLAINT PREDICTION
# =========================================================

@app.post("/predict")
def predict(
    request: ComplaintRequest
):

    try:

        # =================================================
        # CLEAN INPUT
        # =================================================

        title = (
            request.title.strip()
        )

        description = (
            request.description.strip()
        )


        # =================================================
        # VALIDATION
        # =================================================

        if not title:

            raise HTTPException(
                status_code=400,

                detail=
                    "Title cannot be empty."
            )


        if not description:

            raise HTTPException(
                status_code=400,

                detail=
                    "Description cannot be empty."
            )


        # =================================================
        # COMBINE TITLE + DESCRIPTION
        # =================================================

        complaint_text = (
            title
            + " "
            + description
        )


        # =================================================
        # RUN COMPLETE AI PIPELINE
        # =================================================

        result = (
            predict_complaint(
                complaint_text
            )
        )


        # =================================================
        # NON-CIVIC COMPLAINT
        # =================================================

        if result.get(
            "is_civic"
        ) is False:

            return {

                "success":
                    True,

                "isCivic":
                    False,

                "civicConfidence":
                    result.get(
                        "civic_confidence",
                        0
                    ),

                "area":
                    "",

                "areaConfidence":
                    0,

                "subcategory":
                    "",

                "subcategoryConfidence":
                    0,

                "subcategorySource":
                    "ml_model",

                "severity":
                    "",

                "severityConfidence":
                    0,

                "department":
                    "",

                "priorityScore":
                    0,

                "priority":
                    "",

                "recommendedAction":
                    (
                        "This does not appear "
                        "to be a civic complaint."
                    ),

                "message":
                    result.get(
                        "message",
                        (
                            "This does not appear "
                            "to be a civic complaint."
                        )
                    )
            }


        # =================================================
        # GET AI RESULTS
        # =================================================

        severity = result.get(
            "severity",
            "Low"
        )


        area = result.get(
            "area",
            ""
        )


        subcategory = result.get(
            "sub_category",
            ""
        )


        subcategory_source = result.get(
            "sub_category_source",
            "ml_model"
        )


        # =================================================
        # PRIORITY CALCULATION
        # =================================================

        priority_result = (
            calculate_priority(

                severity=
                    severity,

                area=
                    area,

                subcategory=
                    subcategory,

                complaint_text=
                    complaint_text
            )
        )


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "success":
                True,


            # ---------------------------------------------
            # CIVIC CLASSIFICATION
            # ---------------------------------------------

            "isCivic":
                result.get(
                    "is_civic",
                    True
                ),

            "civicConfidence":
                result.get(
                    "civic_confidence",
                    0
                ),


            # ---------------------------------------------
            # AREA
            # ---------------------------------------------

            "area":
                area,

            "areaConfidence":
                result.get(
                    "area_confidence",
                    0
                ),


            # ---------------------------------------------
            # SUBCATEGORY
            # ---------------------------------------------

            "subcategory":
                subcategory,

            "subcategoryConfidence":
                result.get(
                    "sub_category_confidence",
                    0
                ),

            "subcategorySource":
                subcategory_source,


            # ---------------------------------------------
            # SEVERITY
            # ---------------------------------------------

            "severity":
                severity,

            "severityConfidence":
                result.get(
                    "severity_confidence",
                    0
                ),


            # ---------------------------------------------
            # DEPARTMENT
            # ---------------------------------------------

            "department":
                result.get(
                    "department",
                    ""
                ),


            # ---------------------------------------------
            # PRIORITY
            # ---------------------------------------------

            "priorityScore":
                priority_result.get(
                    "priorityScore",
                    0
                ),

            "priority":
                priority_result.get(
                    "priority",
                    "Low"
                ),


            # ---------------------------------------------
            # RECOMMENDED ACTION
            # ---------------------------------------------

            "recommendedAction":
                priority_result.get(
                    "recommendedAction",
                    ""
                )
        }


    # =====================================================
    # HTTP ERROR
    # =====================================================

    except HTTPException:

        raise


    # =====================================================
    # VALUE ERROR
    # =====================================================

    except ValueError as error:

        raise HTTPException(

            status_code=400,

            detail=str(error)

        )


    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as error:

        print(
            "ML prediction error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=
                "ML prediction failed."

        )


# =========================================================
# DUPLICATE CHECK
# =========================================================

@app.post("/duplicate-check")
def duplicate_check(
    request: DuplicateCheckRequest
):

    try:

        # =================================================
        # CLEAN COMPLAINT
        # =================================================

        complaint_text = (
            request.complaintText.strip()
        )


        # =================================================
        # VALIDATION
        # =================================================

        if not complaint_text:

            raise HTTPException(

                status_code=400,

                detail=
                    "Complaint text cannot be empty."

            )


        # =================================================
        # PREPARE EXISTING COMPLAINTS
        # =================================================

        existing_complaints = []


        for complaint in (
            request.existingComplaints
        ):

            text = complaint.get(
                "text",
                ""
            )


            if text:

                existing_complaints.append(
                    text
                )


        # =================================================
        # RUN DUPLICATE DETECTOR
        # =================================================

        result = detect_duplicate(

            new_complaint=
                complaint_text,

            existing_complaints=
                existing_complaints,

            threshold=
                0.45

        )


        # =================================================
        # FIND MATCHED COMPLAINT ID
        # =================================================

        matched_complaint_id = None


        matched_index = result.get(
            "matchedIndex"
        )


        if (
            matched_index is not None
            and result.get(
                "isDuplicate",
                False
            )
        ):

            if (
                0 <= matched_index
                < len(
                    request.existingComplaints
                )
            ):

                matched_complaint_id = (

                    request
                    .existingComplaints[
                        matched_index
                    ]
                    .get(
                        "id"
                    )
                )


        # =================================================
        # FINAL DUPLICATE RESPONSE
        # =================================================

        return {

            "success":
                True,

            "isDuplicate":
                result.get(
                    "isDuplicate",
                    False
                ),

            "similarityScore":
                result.get(
                    "similarityScore",
                    0
                ),

            "matchedComplaintId":
                matched_complaint_id,

            "matchedIndex":
                (
                    matched_index
                    if result.get(
                        "isDuplicate",
                        False
                    )
                    else None
                ),

            "message":
                result.get(
                    "message",
                    ""
                )
        }


    # =====================================================
    # HTTP ERROR
    # =====================================================

    except HTTPException:

        raise


    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as error:

        print(
            "Duplicate detection error:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=
                "Duplicate detection failed."

        )