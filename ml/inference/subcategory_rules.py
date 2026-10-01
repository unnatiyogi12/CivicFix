# =========================================================
# CIVICFIX AI
# SUBCATEGORY BUSINESS RULES
# =========================================================


def apply_waste_management_rule(
    text,
    ml_prediction
):
    """
    Validates Waste Management subcategory
    using strong complaint-specific signals.

    This is a business-rule/post-processing layer.
    It does NOT replace the ML model.
    """

    text_lower = text.lower().strip()


    # =====================================================
    # 1. GARBAGE BURNING
    # =====================================================

    burning_signals = [
        "garbage burning",
        "burning garbage",
        "burning waste",
        "waste burning",
        "burning trash",
        "trash burning",
        "burning rubbish",
        "set fire to garbage",
        "set fire to waste",
        "garbage is on fire",
        "waste is on fire",
        "smoke from garbage",
        "smoke from waste"
    ]

    for signal in burning_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Garbage Burning",

                "source":
                    "business_rule",

                "rule":
                    "garbage_burning"
            }


    # =====================================================
    # 2. ILLEGAL GARBAGE DUMPING
    # =====================================================

    illegal_dumping_signals = [
        "illegal dumping",
        "illegally dumping",
        "illegal garbage dumping",
        "illegal waste dumping",
        "dumping garbage",
        "dumping waste",
        "dumped garbage",
        "dumped waste",
        "garbage dumped",
        "waste dumped",
        "dumping household waste",
        "garbage being dumped"
    ]

    for signal in illegal_dumping_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Illegal Garbage Dumping",

                "source":
                    "business_rule",

                "rule":
                    "illegal_garbage_dumping"
            }


    # =====================================================
    # 3. WASTE COLLECTION VEHICLE ISSUE
    # =====================================================

    vehicle_issue_signals = [
        "garbage truck is leaking",
        "garbage truck leaking",
        "waste collection vehicle is leaking",
        "waste collection vehicle leaking",
        "collection vehicle is leaking",
        "collection vehicle leaking",
        "garbage truck is damaged",
        "garbage truck damaged",
        "waste collection vehicle damaged",
        "collection vehicle damaged",
        "garbage truck has broken",
        "collection vehicle has broken"
    ]

    for signal in vehicle_issue_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Waste Collection Vehicle Issue",

                "source":
                    "business_rule",

                "rule":
                    "waste_collection_vehicle"
            }


    # =====================================================
    # 4. OVERFLOWING DUSTBIN
    # =====================================================

    overflowing_bin_signals = [
        "dustbin is overflowing",
        "dustbin overflowing",
        "bin is overflowing",
        "bin overflowing",
        "garbage bin is full",
        "garbage bin is overflowing",
        "waste bin is full",
        "waste bin is overflowing",
        "dustbin is full",
        "dustbin full",
        "bin is full",
        "bin full",
        "spilling from the dustbin",
        "spilling from dustbin",
        "waste spilling from the bin",
        "garbage spilling from the bin"
    ]

    for signal in overflowing_bin_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Overflowing Dustbin",

                "source":
                    "business_rule",

                "rule":
                    "overflowing_dustbin"
            }


    # =====================================================
    # 5. CONSTRUCTION WASTE
    # =====================================================

    construction_waste_signals = [
        "construction debris",
        "construction waste",
        "building debris",
        "demolition debris",
        "demolition waste",
        "cement debris",
        "concrete debris",
        "building material dumped",
        "construction material dumped",
        "rubble from construction",
        "construction material waste"
    ]

    for signal in construction_waste_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Construction Waste",

                "source":
                    "business_rule",

                "rule":
                    "construction_waste"
            }


    # =====================================================
    # 6. GARBAGE NOT COLLECTED
    # =====================================================

    not_collected_signals = [
        "garbage has not been collected",
        "garbage not collected",
        "waste has not been collected",
        "waste not collected",
        "garbage is not collected",
        "waste is not collected",
        "garbage has not been picked up",
        "garbage not picked up",
        "waste has not been picked up",
        "waste not picked up",
        "garbage collection was missed",
        "waste collection was missed",
        "missed garbage collection",
        "missed waste collection",
        "missed pickup",
        "missed waste pickup",
        "waste pickup was missed",
        "garbage pickup was missed",
        "garbage truck has not visited",
        "garbage truck did not visit",
        "garbage truck has not come",
        "garbage truck did not come",
        "waste collection has been missed",
        "waste collection has not happened",
        "garbage collection has not happened",
        "garbage has been accumulating",
        "garbage is accumulating",
        "waste has been accumulating",
        "waste is accumulating",
        "garbage is piling up",
        "garbage has been piling up",
        "waste is piling up",
        "waste has been piling up",
        "uncollected garbage",
        "uncollected waste",
        "garbage left without collection",
        "waste left without collection",
        "garbage collection is irregular",
        "garbage is not being collected",
        "waste is not being collected"
    ]

    for signal in not_collected_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Garbage Not Collected",

                "source":
                    "business_rule",

                "rule":
                    "garbage_not_collected"
            }


    # =====================================================
    # 7. LITTERING
    # =====================================================

    littering_signals = [
        "littering",
        "littered",
        "litter is scattered",
        "garbage is scattered",
        "waste is scattered",
        "trash is scattered",
        "plastic waste scattered",
        "food waste scattered",
        "waste scattered across the street",
        "garbage scattered across the street"
    ]

    for signal in littering_signals:

        if signal in text_lower:

            return {
                "subcategory":
                    "Littering",

                "source":
                    "business_rule",

                "rule":
                    "littering"
            }


    # =====================================================
    # 8. NO STRONG RULE → KEEP ML PREDICTION
    # =====================================================

    return {
        "subcategory":
            ml_prediction,

        "source":
            "ml_model",

        "rule":
            None
    }


# =========================================================
# GENERIC SUBCATEGORY RULE ENGINE
# =========================================================

def apply_subcategory_rules(
    text,
    area,
    ml_prediction
):

    if area == "Waste Management":

        return apply_waste_management_rule(
            text=text,
            ml_prediction=ml_prediction
        )

    return {
        "subcategory":
            ml_prediction,

        "source":
            "ml_model",

        "rule":
            None
    }
