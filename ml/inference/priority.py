

SEVERITY_SCORE = {

    "Low": 25,

    "Medium": 50,

    "High": 75,

    "Critical": 100

}

def calculate_priority(
    severity,
    area="",
    subcategory="",
    complaint_text=""
):

    severity_score = SEVERITY_SCORE.get(
        severity,
        25
    )

    score = severity_score


    high_risk_keywords = [

        "open manhole",

        "sewage overflow",

        "contaminated water",

        "water contamination",

        "fire",

        "electric wire",

        "fallen pole",

        "gas leak",

        "accident",

        "dangerous",

        "injury",

        "hospital",

        "school"

    ]


    text_lower = complaint_text.lower()


    for keyword in high_risk_keywords:

        if keyword in text_lower:

            score += 10

            break

    public_impact_keywords = [

        "many people",

        "residents",

        "entire area",

        "whole area",

        "public",

        "busy road",

        "traffic",

        "school",

        "hospital",

        "market"

    ]


    for keyword in public_impact_keywords:

        if keyword in text_lower:

            score += 5

            break


    critical_areas = [

        "Water Supply",

        "Sewerage & Drainage",

        "Public Safety",

        "Roads & Footpaths"

    ]


    if area in critical_areas:

        score += 5

    score = min(
        score,
        100
    )


    if score >= 90:

        priority = "Critical"

    elif score >= 75:

        priority = "High"

    elif score >= 50:

        priority = "Medium"

    else:

        priority = "Low"
        
    action_map = {

        "Critical":
            "Immediate attention required",

        "High":
            "Resolve as high priority",

        "Medium":
            "Review and assign to department",

        "Low":
            "Add to normal resolution queue"

    }


    return {

        "priorityScore": score,

        "priority": priority,

        "recommendedAction":
            action_map[priority]

    }