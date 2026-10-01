from pathlib import Path
import re
import joblib
import pandas as pd
from scipy.sparse import hstack

from inference.subcategory_rules import apply_subcategory_rules


# =========================================================
# 1. PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"


# =========================================================
# 2. LOAD MODEL 1 — CIVIC / NON-CIVIC
# =========================================================

civic_model = joblib.load(
    MODELS_DIR / "civic_model.joblib"
)

civic_vectorizer = joblib.load(
    MODELS_DIR / "civic_vectorizer.joblib"
)


# =========================================================
# 3. LOAD MODEL 2 — AREA
# =========================================================

area_model = joblib.load(
    MODELS_DIR / "area_model.joblib"
)

area_vectorizer = joblib.load(
    MODELS_DIR / "area_vectorizer.joblib"
)


# =========================================================
# 4. LOAD MODEL 3 — SUB-CATEGORY
# =========================================================

subcategory_model = joblib.load(
    MODELS_DIR / "subcategory_model.joblib"
)

subcategory_vectorizer = joblib.load(
    MODELS_DIR / "subcategory_vectorizer.joblib"
)


# =========================================================
# 5. LOAD MODEL 4 — SEVERITY V3
# =========================================================

severity_model = joblib.load(
    MODELS_DIR / "severity_model_v3.joblib"
)

severity_vectorizer = joblib.load(
    MODELS_DIR / "severity_vectorizer_v3.joblib"
)

severity_scaler = joblib.load(
    MODELS_DIR / "severity_scaler_v3.joblib"
)


print(
    "All CivicFix AI models loaded successfully ✅"
)


# =========================================================
# 6. SEVERITY FEATURE EXTRACTION
# =========================================================

def extract_severity_features(
    complaint_text
):

    text = complaint_text.lower()

    features = {

        "risk_injury": int(
            bool(
                re.search(
                    r"\binjur|fell|fall|accident|hurt|danger|unsafe|risk|bite|attack\b",
                    text
                )
            )
        ),

        "traffic_impact": int(
            bool(
                re.search(
                    r"\btraffic|vehicles|vehicle|commuters|blocked road|roadblock|congestion\b",
                    text
                )
            )
        ),

        "public_exposure": int(
            bool(
                re.search(
                    r"\bschool|children|hospital|busy road|market|public|pedestrians|residents\b",
                    text
                )
            )
        ),

        "health_hazard": int(
            bool(
                re.search(
                    r"\bsewage|contaminated|dirty water|foul|smoke|pollution|wastewater\b",
                    text
                )
            )
        ),

        "urgent_language": int(
            bool(
                re.search(
                    r"\burgent|immediate|dangerous|serious|severe|critical|emergency\b",
                    text
                )
            )
        ),

        "scale_impact": int(
            bool(
                re.search(
                    r"\blarge number|many people|whole area|entire|multiple|repeatedly|daily\b",
                    text
                )
            )
        ),

        "text_length":
            len(text.split())
    }


    # Same order as used during training
    return [

        features["risk_injury"],

        features["traffic_impact"],

        features["public_exposure"],

        features["health_hazard"],

        features["urgent_language"],

        features["scale_impact"],

        features["text_length"]

    ]


# =========================================================
# 7. DEPARTMENT MAPPING
# =========================================================

DEPARTMENT_MAP = {

    # -------------------------
    # Roads & Footpaths
    # -------------------------

    "Pothole":
        "Roads / Municipal Engineering",

    "Damaged Road":
        "Roads / Municipal Engineering",

    "Broken Footpath":
        "Roads / Municipal Engineering",

    "Missing Footpath":
        "Roads / Municipal Engineering",

    "Road Construction/Maintenance":
        "Roads / Municipal Engineering",

    "Road Obstruction":
        "Roads / Municipal Engineering",

    "Road Signage":
        "Roads / Municipal Engineering",

    "Road Encroachment":
        "Roads / Municipal Engineering",


    # -------------------------
    # Waste Management
    # -------------------------

    "Garbage Not Collected":
        "Waste Management / Sanitation",

    "Illegal Garbage Dumping":
        "Waste Management / Sanitation",

    "Overflowing Dustbin":
        "Waste Management / Sanitation",

    "Littering":
        "Waste Management / Sanitation",

    "Construction Waste":
        "Waste Management / Sanitation",

    "Garbage Burning":
        "Waste Management / Sanitation",

    "Waste Collection Vehicle Issue":
        "Waste Management / Sanitation",


    # -------------------------
    # Water Supply
    # -------------------------

    "No Water Supply":
        "Water Supply",

    "Water Leakage":
        "Water Supply",

    "Pipeline Damage":
        "Water Supply",

    "Low Water Pressure":
        "Water Supply",

    "Contaminated Water":
        "Water Supply",

    "Water Wastage":
        "Water Supply",

    "Water Supply Interruption":
        "Water Supply",


    # -------------------------
    # Sewerage & Drainage
    # -------------------------

    "Sewage Overflow":
        "Sewerage / Drainage",

    "Blocked Sewer":
        "Sewerage / Drainage",

    "Drain Blockage":
        "Sewerage / Drainage",

    "Drain Overflow":
        "Sewerage / Drainage",

    "Manhole Issue":
        "Sewerage / Drainage",

    "Wastewater on Road":
        "Sewerage / Drainage",

    "Stormwater Drain Issue":
        "Sewerage / Drainage",


    # -------------------------
    # Street Lighting
    # -------------------------

    "Street Light Not Working":
        "Electrical / Street Lighting",

    "Damaged Light Pole":
        "Electrical / Street Lighting",

    "Dark Street":
        "Electrical / Street Lighting",

    "Insufficient Street Lighting":
        "Electrical / Street Lighting",

    "New Street Light Required":
        "Electrical / Street Lighting",

    "Electrical Street-Light Fault":
        "Electrical / Street Lighting",


    # -------------------------
    # Traffic & Road Safety
    # -------------------------

    "Illegal Parking":
        "Traffic Police / Transport Authority",

    "Traffic Signal Issue":
        "Traffic Police / Transport Authority",

    "Traffic Congestion":
        "Traffic Police / Transport Authority",

    "Road Blockage Affecting Traffic":
        "Traffic Police / Transport Authority",

    "Dangerous Driving":
        "Traffic Police / Transport Authority",

    "Illegal Road Occupation":
        "Traffic Police / Transport Authority",

    "Traffic Sign Issue":
        "Traffic Police / Transport Authority",

    "Public Transport/Vehicle Violation":
        "Traffic Police / Transport Authority",


    # -------------------------
    # Public Transport
    # -------------------------

    "Bus Stop Issue":
        "Transport Authority / Transit Agency",

    "Bus Service Issue":
        "Transport Authority / Transit Agency",

    "Bus Route Issue":
        "Transport Authority / Transit Agency",

    "Bus Overcrowding":
        "Transport Authority / Transit Agency",

    "Missing/Damaged Bus Shelter":
        "Transport Authority / Transit Agency",

    "Public Transport Accessibility":
        "Transport Authority / Transit Agency",


    # -------------------------
    # Animal Issues
    # -------------------------

    "Stray Dog":
        "Animal Control / Municipal Animal Services",

    "Animal Nuisance":
        "Animal Control / Municipal Animal Services",

    "Animal Rescue":
        "Animal Control / Municipal Animal Services",

    "Animal Bite":
        "Animal Control / Municipal Animal Services",

    "Stray Animal":
        "Animal Control / Municipal Animal Services",

    "Dead Animal":
        "Animal Control / Municipal Animal Services",

    "Animal Sterilization":
        "Animal Control / Municipal Animal Services",


    # -------------------------
    # Pollution & Environment
    # -------------------------

    "Air Pollution":
        "Pollution Control Authority",

    "Noise Pollution":
        "Pollution Control Authority",

    "Dust Pollution":
        "Pollution Control Authority",

    "Smoke Pollution":
        "Pollution Control Authority",

    "Water Pollution":
        "Pollution Control Authority",

    "Illegal Burning":
        "Pollution Control Authority",

    "Industrial Pollution":
        "Pollution Control Authority",


    # -------------------------
    # Trees & Greenery
    # -------------------------

    "Fallen Tree":
        "Parks / Horticulture",

    "Dangerous Tree Branch":
        "Parks / Horticulture",

    "Tree Maintenance":
        "Parks / Horticulture",

    "Illegal Tree Cutting":
        "Parks / Horticulture",

    "Tree Plantation":
        "Parks / Horticulture",

    "Overgrown Vegetation":
        "Parks / Horticulture",


    # -------------------------
    # Parks & Recreation
    # -------------------------

    "Park Maintenance":
        "Parks / Horticulture",

    "Damaged Playground Equipment":
        "Parks / Horticulture",

    "Playground Issue":
        "Parks / Horticulture",

    "Park Lighting":
        "Parks / Horticulture",

    "Park Cleanliness":
        "Parks / Horticulture",

    "Public Recreation Facility":
        "Parks / Horticulture",


    # -------------------------
    # Public Sanitation
    # -------------------------

    "Public Toilet Issue":
        "Sanitation Department",

    "Public Urination":
        "Sanitation Department",

    "Unhygienic Public Area":
        "Sanitation Department",

    "Toilet Maintenance":
        "Sanitation Department",

    "Lack of Public Toilet":
        "Sanitation Department",

    "Sanitation Facility Issue":
        "Sanitation Department",


    # -------------------------
    # Public Safety
    # -------------------------

    "Unsafe Public Place":
        "Municipal Safety / Police / Fire Services",

    "Hazardous Public Infrastructure":
        "Municipal Safety / Police / Fire Services",

    "Open/Dangerous Area":
        "Municipal Safety / Police / Fire Services",

    "Public Nuisance":
        "Municipal Safety / Police / Fire Services",

    "Fire Safety Issue":
        "Municipal Safety / Police / Fire Services",

    "Safety Hazard":
        "Municipal Safety / Police / Fire Services",


    # -------------------------
    # Public Infrastructure
    # -------------------------

    "Damaged Public Building":
        "Municipal Engineering",

    "Damaged Public Facility":
        "Municipal Engineering",

    "Missing Civic Signage":
        "Municipal Engineering",

    "Damaged Public Property":
        "Municipal Engineering",

    "Public Facility Maintenance":
        "Municipal Engineering",

    "Accessibility/Ramp Issue":
        "Municipal Engineering",


    # -------------------------
    # Lakes & Water Bodies
    # -------------------------

    "Lake Pollution":
        "Lake / Environment Authority",

    "Garbage Near Lake":
        "Lake / Environment Authority",

    "Lake Encroachment":
        "Lake / Environment Authority",

    "Lake Maintenance":
        "Lake / Environment Authority",

    "Sewage Entering Lake":
        "Lake / Environment Authority",

    "Illegal Activity Around Lake":
        "Lake / Environment Authority",


    # -------------------------
    # Other
    # -------------------------

    "Other Valid Civic Issue":
        "Municipal Administration"
}


# =========================================================
# 8. MAIN AI PIPELINE
# =========================================================

def predict_complaint(
    complaint_text
):

    # =====================================================
    # BASIC VALIDATION
    # =====================================================

    if not isinstance(
        complaint_text,
        str
    ):

        raise TypeError(
            "Complaint text must be a string."
        )


    complaint_text = (
        complaint_text.strip()
    )


    if not complaint_text:

        raise ValueError(
            "Complaint text cannot be empty."
        )


    # =====================================================
    # MODEL 1 — CIVIC / NON-CIVIC
    # =====================================================

    civic_features = (
        civic_vectorizer.transform(
            [complaint_text]
        )
    )


    civic_prediction = (
        civic_model.predict(
            civic_features
        )[0]
    )


    civic_probabilities = (
        civic_model.predict_proba(
            civic_features
        )[0]
    )


    civic_confidence = (
        civic_probabilities.max()
    )


    # =====================================================
    # NON-CIVIC → STOP PIPELINE
    # =====================================================

    if civic_prediction == 0:

        return {

            "is_civic": False,

            "civic_confidence":
                round(
                    float(
                        civic_confidence
                    ),
                    3
                ),

            "message":
                "This does not appear to be a civic complaint."

        }


    # =====================================================
    # MODEL 2 — AREA
    # =====================================================

    area_features = (
        area_vectorizer.transform(
            [complaint_text]
        )
    )


    area_prediction = (
        area_model.predict(
            area_features
        )[0]
    )


    area_probabilities = (
        area_model.predict_proba(
            area_features
        )[0]
    )


    area_confidence = (
        area_probabilities.max()
    )


    # =====================================================
    # MODEL 3 — SUB-CATEGORY
    # =====================================================

    sub_features = (
        subcategory_vectorizer.transform(
            [complaint_text]
        )
    )


    # Original ML prediction

    sub_prediction = (
        subcategory_model.predict(
            sub_features
        )[0]
    )


    sub_probabilities = (
        subcategory_model.predict_proba(
            sub_features
        )[0]
    )


    sub_confidence = (
        sub_probabilities.max()
    )


    # =====================================================
    # SUBCATEGORY BUSINESS-RULE VALIDATION
    # =====================================================

    subcategory_result = (
        apply_subcategory_rules(
            text=complaint_text,

            area=area_prediction,

            ml_prediction=sub_prediction
        )
    )


    # Final subcategory after
    # ML + business-rule validation

    final_subcategory = (
        subcategory_result[
            "subcategory"
        ]
    )


    subcategory_source = (
        subcategory_result[
            "source"
        ]
    )


    # =====================================================
    # MODEL 4 — SEVERITY V3
    # =====================================================

    # IMPORTANT:
    # Use FINAL subcategory instead
    # of raw ML subcategory.

    severity_context = (

        complaint_text

        + " "

        + area_prediction

        + " "

        + final_subcategory
    )


    # -----------------------------------------------------
    # Text features
    # -----------------------------------------------------

    severity_text_features = (
        severity_vectorizer.transform(
            [severity_context]
        )
    )


    # -----------------------------------------------------
    # Numeric severity features
    # -----------------------------------------------------

    severity_numeric_features = (
        extract_severity_features(
            complaint_text
        )
    )


    # -----------------------------------------------------
    # Convert to DataFrame
    # -----------------------------------------------------

    severity_numeric_df = (
        pd.DataFrame(

            [severity_numeric_features],

            columns=[

                "risk_injury",

                "traffic_impact",

                "public_exposure",

                "health_hazard",

                "urgent_language",

                "scale_impact",

                "text_length"

            ]
        )
    )


    # -----------------------------------------------------
    # Scale numeric features
    # -----------------------------------------------------

    severity_numeric_scaled = (
        severity_scaler.transform(
            severity_numeric_df
        )
    )


    # -----------------------------------------------------
    # Combine text + numeric features
    # -----------------------------------------------------

    severity_features = hstack([

        severity_text_features,

        severity_numeric_scaled

    ])


    # -----------------------------------------------------
    # Predict severity
    # -----------------------------------------------------

    severity_prediction = (
        severity_model.predict(
            severity_features
        )[0]
    )


    severity_probabilities = (
        severity_model.predict_proba(
            severity_features
        )[0]
    )


    severity_confidence = (
        severity_probabilities.max()
    )


    # =====================================================
    # DEPARTMENT
    # =====================================================

    # IMPORTANT:
    # Department is based on FINAL
    # validated subcategory.

    department = (
        DEPARTMENT_MAP.get(

            final_subcategory,

            "Municipal Administration"
        )
    )


    # =====================================================
    # FINAL RESULT
    # =====================================================

    return {

        "is_civic":
            True,


        "civic_confidence":
            round(
                float(
                    civic_confidence
                ),
                3
            ),


        "area":
            area_prediction,


        "area_confidence":
            round(
                float(
                    area_confidence
                ),
                3
            ),


        "sub_category":
            final_subcategory,


        "sub_category_confidence":
            round(
                float(
                    sub_confidence
                ),
                3
            ),


        "sub_category_source":
            subcategory_source,


        "severity":
            severity_prediction,


        "severity_confidence":
            round(
                float(
                    severity_confidence
                ),
                3
            ),


        "department":
            department
    }


# =========================================================
# 9. TEST THE COMPLETE AI PIPELINE
# =========================================================

if __name__ == "__main__":

    test_complaints = [

        # 1
        "There is a huge pothole near the school and motorcycles are losing balance.",


        # 2
        "A huge pile of garbage is blocking the road and traffic.",


        # 3
        "Dirty contaminated water with a strong smell is coming from the taps.",


        # 4
        "Sewage is overflowing onto the road near a hospital.",


        # 5
        "The street light near my house has stopped working.",


        # 6
        "A fallen tree is completely blocking the main road.",


        # 7
        "There is loud construction noise disturbing the entire neighborhood every night.",


        # 8
        "The park playground equipment is slightly damaged but still usable.",


        # 9
        "There is an open manhole on a busy road and children could fall.",


        # 10
        "My laptop is not turning on after the latest update."

    ]


    for i, complaint in enumerate(
        test_complaints,
        start=1
    ):

        print(
            "\n" + "=" * 80
        )

        print(
            f"TEST {i}"
        )

        print(
            "Complaint:",
            complaint
        )


        result = (
            predict_complaint(
                complaint
            )
        )


        print(
            "AI Prediction:"
        )

        print(
            result
        )