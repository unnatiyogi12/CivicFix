import re
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ======================================================
# NORMALIZE TEXT
# ======================================================

def normalize_text(text: str) -> str:

    if not isinstance(text, str):
        return ""

    text = text.lower().strip()

    text = re.sub(
        r"[^a-z0-9\s]",
        " ",
        text
    )

    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text


# ======================================================
# CREATE TF-IDF VECTORS
# ======================================================

def create_vectors(texts: list[str]):

    normalized_texts = [
        normalize_text(text)
        for text in texts
    ]

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1
    )

    vectors = vectorizer.fit_transform(
        normalized_texts
    )

    return vectorizer, vectors


# ======================================================
# CALCULATE SIMILARITY
# ======================================================

def calculate_similarity(
    new_complaint: str,
    existing_complaints: list[str]
):

    if not new_complaint:
        raise ValueError(
            "New complaint cannot be empty."
        )

    if not existing_complaints:
        return []

    all_texts = [
        new_complaint
    ] + existing_complaints

    vectorizer, vectors = create_vectors(
        all_texts
    )

    new_vector = vectors[0:1]

    existing_vectors = vectors[1:]

    similarity_scores = cosine_similarity(
        new_vector,
        existing_vectors
    )[0]

    results = []

    for index, score in enumerate(
        similarity_scores
    ):

        results.append({
            "index": index,

            "similarityScore": round(
                float(score),
                3
            )
        })

    results.sort(
        key=lambda x:
            x["similarityScore"],
        reverse=True
    )

    return results


# ======================================================
# FIND POSSIBLE DUPLICATES
# ======================================================

def find_possible_duplicates(
    new_complaint: str,
    existing_complaints: list[str],
    threshold: float = 0.45,
    top_k: int = 5
):

    similarities = calculate_similarity(
        new_complaint,
        existing_complaints
    )

    possible_duplicates = []

    for result in similarities:

        if (
            result["similarityScore"]
            >= threshold
        ):

            possible_duplicates.append(
                result
            )

    return possible_duplicates[:top_k]


# ======================================================
# DETECT DUPLICATE
# ======================================================

def detect_duplicate(
    new_complaint: str,
    existing_complaints: list[str],
    threshold: float = 0.45
):

    # --------------------------------------------------
    # No existing complaints
    # --------------------------------------------------

    if not existing_complaints:

        return {

            "isDuplicate": False,

            "similarityScore": 0,

            "matchedIndex": None,

            "message":
                "No existing complaints available for comparison."

        }


    # --------------------------------------------------
    # Calculate similarities
    # --------------------------------------------------

    similarities = calculate_similarity(
        new_complaint,
        existing_complaints
    )


    # --------------------------------------------------
    # No similarity result
    # --------------------------------------------------

    if not similarities:

        return {

            "isDuplicate": False,

            "similarityScore": 0,

            "matchedIndex": None,

            "message":
                "No similar complaints found."

        }


    # --------------------------------------------------
    # Best match
    # --------------------------------------------------

    best_match = similarities[0]

    best_score = (
        best_match["similarityScore"]
    )

    best_index = (
        best_match["index"]
    )


    # --------------------------------------------------
    # Check threshold
    # --------------------------------------------------

    is_duplicate = (
        best_score >= threshold
    )


    # ==================================================
    # DUPLICATE FOUND
    # ==================================================

    if is_duplicate:

        return {

            "isDuplicate": True,

            "similarityScore":
                best_score,

            "matchedIndex":
                best_index,

            "message":
                "This complaint may be a duplicate "
                "of an existing complaint."

        }


    # ==================================================
    # NOT A DUPLICATE
    # ==================================================

    return {

        "isDuplicate": False,

        "similarityScore":
            best_score,

        # IMPORTANT:
        # Do not return a matched complaint
        # when threshold is not crossed.

        "matchedIndex":
            None,

        "message":
            "No strong duplicate match found."

    }