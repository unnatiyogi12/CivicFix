from pathlib import Path
import joblib
import pandas as pd
import numpy as np
import re
from scipy.sparse import hstack


# ============================================================
# 1. PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"


# ============================================================
# 2. LOAD MODELS
# ============================================================

civic_model = joblib.load(
    MODELS_DIR / "civic_model.joblib"
)

civic_vectorizer = joblib.load(
    MODELS_DIR / "civic_vectorizer.joblib"
)

area_model = joblib.load(
    MODELS_DIR / "area_model.joblib"
)

area_vectorizer = joblib.load(
    MODELS_DIR / "area_vectorizer.joblib"
)

subcategory_model = joblib.load(
    MODELS_DIR / "subcategory_model.joblib"
)

subcategory_vectorizer = joblib.load(
    MODELS_DIR / "subcategory_vectorizer.joblib"
)

severity_model_v3 = joblib.load(
    MODELS_DIR / "severity_model_v3.joblib"
)

severity_vectorizer_v3 = joblib.load(
    MODELS_DIR / "severity_vectorizer_v3.joblib"
)

severity_scaler_v3 = joblib.load(
    MODELS_DIR / "severity_scaler_v3.joblib"
)


print("\nAll CivicFix AI models loaded successfully ✅")


# ============================================================
# 3. SEVERITY FEATURE EXTRACTION
# ============================================================

def extract_severity_features(text):

    text_lower = text.lower()

    risk_injury = int(
        bool(
            re.search(
                r"\binjur|fell|fall|accident|hurt|danger|unsafe|risk|bite|attack\b",
                text_lower
            )
        )
    )

    traffic_impact = int(
        bool(
            re.search(
                r"\btraffic|vehicles|vehicle|commuters|blocked road|roadblock|congestion\b",
                text_lower
            )
        )
    )

    public_exposure = int(
        bool(
            re.search(
                r"\bschool|children|hospital|busy road|market|public|pedestrians|residents\b",
                text_lower
            )
        )
    )

    health_hazard = int(
        bool(
            re.search(
                r"\bsewage|contaminated|dirty water|foul|smoke|pollution|wastewater\b",
                text_lower
            )
        )
    )

    urgent_language = int(
        bool(
            re.search(
                r"\burgent|immediate|dangerous|serious|severe|critical|emergency\b",
                text_lower
            )
        )
    )

    scale_impact = int(
        bool(
            re.search(
                r"\blarge number|many people|whole area|entire|multiple|repeatedly|daily\b",
                text_lower
            )
        )
    )

    text_length = len(text.split())

    return [
        risk_injury,
        traffic_impact,
        public_exposure,
        health_hazard,
        urgent_language,
        scale_impact,
        text_length
    ]


# ============================================================
# 4. PREDICTION FUNCTION
# ============================================================

def predict_test_complaint(text):

    # --------------------------------------------------------
    # MODEL 1 — CIVIC / NON-CIVIC
    # --------------------------------------------------------

    X_civic = civic_vectorizer.transform([text])

    civic_pred = civic_model.predict(X_civic)[0]

    civic_probs = civic_model.predict_proba(X_civic)[0]

    civic_conf = float(np.max(civic_probs))

    predicted_civic = bool(civic_pred)


    # --------------------------------------------------------
    # NON-CIVIC
    # --------------------------------------------------------

    if not predicted_civic:

        return {
            "is_civic": False,
            "civic_confidence": round(civic_conf, 3),
            "area": "",
            "subcategory": "",
            "severity": "",
            "department": "",
            "message": "This does not appear to be a civic complaint."
        }


    # --------------------------------------------------------
    # MODEL 2 — AREA
    # --------------------------------------------------------

    X_area = area_vectorizer.transform([text])

    area_pred = area_model.predict(X_area)[0]

    area_probs = area_model.predict_proba(X_area)[0]

    area_conf = float(np.max(area_probs))


    # --------------------------------------------------------
    # MODEL 3 — SUBCATEGORY
    # --------------------------------------------------------

    X_sub = subcategory_vectorizer.transform([text])

    sub_pred = subcategory_model.predict(X_sub)[0]

    sub_probs = subcategory_model.predict_proba(X_sub)[0]

    sub_conf = float(np.max(sub_probs))


    # --------------------------------------------------------
    # MODEL 4 — SEVERITY V3
    # --------------------------------------------------------

    severity_context = (
        text
        + " "
        + str(area_pred)
        + " "
        + str(sub_pred)
    )

    X_severity_text = (
        severity_vectorizer_v3.transform(
            [severity_context]
        )
    )

    severity_features = extract_severity_features(text)

    severity_columns = [
        "risk_injury",
        "traffic_impact",
        "public_exposure",
        "health_hazard",
        "urgent_language",
        "scale_impact",
        "text_length"
    ]

    X_severity_num = pd.DataFrame(
        [severity_features],
        columns=severity_columns
    )

    X_severity_num_scaled = (
        severity_scaler_v3.transform(
            X_severity_num
        )
    )

    X_severity_final = hstack([
        X_severity_text,
        X_severity_num_scaled
    ])

    severity_pred = severity_model_v3.predict(
        X_severity_final
    )[0]

    severity_probs = severity_model_v3.predict_proba(
        X_severity_final
    )[0]

    severity_conf = float(
        np.max(severity_probs)
    )


    # --------------------------------------------------------
    # DEPARTMENT
    # --------------------------------------------------------

    department_map = {

        "Pothole":
            "Roads / Municipal Engineering",

        "Damaged Road":
            "Roads / Municipal Engineering",

        "Broken Footpath":
            "Roads / Municipal Engineering",

        "Garbage Not Collected":
            "Waste Management / Sanitation",

        "Illegal Garbage Dumping":
            "Waste Management / Sanitation",

        "Water Leakage":
            "Water Supply",

        "No Water Supply":
            "Water Supply",

        "Pipeline Damage":
            "Water Supply",

        "Contaminated Water":
            "Water Supply",

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

        "Street Light Not Working":
            "Electrical / Street Lighting",

        "Damaged Light Pole":
            "Electrical / Street Lighting",

        "Illegal Parking":
            "Traffic Police / Transport Authority",

        "Traffic Signal Issue":
            "Traffic Police / Transport Authority",

        "Stray Dog":
            "Animal Control / Municipal Animal Services",

        "Animal Bite":
            "Animal Control / Municipal Animal Services",

        "Air Pollution":
            "Pollution Control Authority",

        "Noise Pollution":
            "Pollution Control Authority",

        "Fallen Tree":
            "Parks / Horticulture",

        "Tree Maintenance":
            "Parks / Horticulture",

        "Park Maintenance":
            "Parks / Horticulture",

        "Playground Issue":
            "Parks / Horticulture",

        "Public Toilet Issue":
            "Sanitation Department",

        "Unsafe Public Place":
            "Municipal Safety / Police / Fire Services",

        "Safety Hazard":
            "Municipal Safety / Police / Fire Services",

        "Damaged Public Building":
            "Municipal Engineering",

        "Damaged Public Facility":
            "Municipal Engineering",

        "Lake Pollution":
            "Lake / Environment Authority"
    }

    department = department_map.get(
        sub_pred,
        "Municipal Administration"
    )


    # --------------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------------

    return {

        "is_civic": True,

        "civic_confidence":
            round(civic_conf, 3),

        "area":
            area_pred,

        "area_confidence":
            round(area_conf, 3),

        "subcategory":
            sub_pred,

        "subcategory_confidence":
            round(sub_conf, 3),

        "severity":
            severity_pred,

        "severity_confidence":
            round(severity_conf, 3),

        "department":
            department
    }


# ============================================================
# 5. TEST COMPLAINTS
# ============================================================

test_complaints = [

    "There is a huge pothole near the school and motorcycles are losing balance.",

    "Dirty contaminated water with a strong smell is coming from the taps.",

    "Sewage is overflowing onto the road near a hospital.",

    "The street light near my house has stopped working.",

    "A fallen tree is completely blocking the main road.",

    "There is an open manhole on a busy road.",

    "My laptop is not turning on after the latest update."
]


# ============================================================
# 6. RUN TESTS
# ============================================================

for index, complaint in enumerate(
    test_complaints,
    start=1
):

    print("\n" + "=" * 70)

    print(
        f"TEST {index}"
    )

    print(
        "Complaint:",
        complaint
    )

    result = predict_test_complaint(
        complaint
    )

    print(
        "Prediction:"
    )

    print(
        result
    )