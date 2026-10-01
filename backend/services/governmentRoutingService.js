import GovernmentService from "../models/GovernmentService.js";

/*
|--------------------------------------------------------------------------
| TEXT NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizeText = (value = "") => {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s/&-]/gi, " ")
    .replace(/\s+/g, " ");
};

/*
|--------------------------------------------------------------------------
| CREATE SEARCH TEXT
|--------------------------------------------------------------------------
*/

const buildComplaintSearchText = ({
  area,
  subcategory,
  department,
  title,
  description,
}) => {
  return normalizeText(
    [
      area,
      subcategory,
      department,
      title,
      description,
    ]
      .filter(Boolean)
      .join(" ")
  );
};

/*
|--------------------------------------------------------------------------
| CHECK LOCATION MATCH
|--------------------------------------------------------------------------
*/

const getLocationScore = (complaintLocation = {}, service = {}) => {
  let score = 0;

  const complaintCity = normalizeText(complaintLocation.city);
  const complaintDistrict = normalizeText(
    complaintLocation.district
  );
  const complaintMunicipality = normalizeText(
    complaintLocation.municipality
  );
  const complaintState = normalizeText(complaintLocation.state);

  const serviceCity = normalizeText(service.city);
  const serviceDistrict = normalizeText(service.district);
  const serviceMunicipality = normalizeText(
    service.municipality
  );
  const serviceState = normalizeText(service.state);

  // City match = strongest location signal
  if (
    complaintCity &&
    serviceCity &&
    complaintCity === serviceCity
  ) {
    score += 30;
  }

  // District match
  if (
    complaintDistrict &&
    serviceDistrict &&
    complaintDistrict === serviceDistrict
  ) {
    score += 20;
  }

  // Municipality match
  if (
    complaintMunicipality &&
    serviceMunicipality &&
    complaintMunicipality === serviceMunicipality
  ) {
    score += 20;
  }

  // State match
  if (
    complaintState &&
    serviceState &&
    complaintState === serviceState
  ) {
    score += 10;
  }

  return score;
};

/*
|--------------------------------------------------------------------------
| CHECK SERVICE TEXT MATCH
|--------------------------------------------------------------------------
*/

const getServiceMatchScore = ({
  area,
  subcategory,
  department,
  title,
  description,
}, service) => {
  const complaintText = buildComplaintSearchText({
    area,
    subcategory,
    department,
    title,
    description,
  });

  const serviceText = normalizeText(
    [
      service.serviceName,
      service.serviceCategory,
      service.subcategory,
      service.department,
      service.description,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (!complaintText || !serviceText) {
    return 0;
  }

  const complaintWords = complaintText
    .split(" ")
    .filter((word) => word.length >= 3);

  const serviceWords = new Set(
    serviceText
      .split(" ")
      .filter((word) => word.length >= 3)
  );

  let matchedWords = 0;

  for (const word of complaintWords) {
    if (serviceWords.has(word)) {
      matchedWords++;
    }
  }

  if (complaintWords.length === 0) {
    return 0;
  }

  const similarity =
    matchedWords / complaintWords.length;

  /*
   * Convert similarity into a score out of 60.
   */
  return Math.round(similarity * 60);
};

/*
|--------------------------------------------------------------------------
| EXACT / STRONG MATCH CHECK
|--------------------------------------------------------------------------
*/

const getExactFieldScore = (
  {
    area,
    subcategory,
    department,
  },
  service
) => {
  let score = 0;

  const normalizedArea = normalizeText(area);
  const normalizedSubcategory = normalizeText(subcategory);
  const normalizedDepartment = normalizeText(department);

  const serviceCategory = normalizeText(
    service.serviceCategory
  );

  const serviceSubcategory = normalizeText(
    service.subcategory
  );

  const serviceDepartment = normalizeText(
    service.department
  );

  const serviceName = normalizeText(
    service.serviceName
  );

  /*
   * Subcategory is the strongest signal.
   */
  if (
    normalizedSubcategory &&
    serviceSubcategory &&
    (
      normalizedSubcategory === serviceSubcategory ||
      serviceSubcategory.includes(normalizedSubcategory) ||
      normalizedSubcategory.includes(serviceSubcategory)
    )
  ) {
    score += 50;
  }

  /*
   * Service name match.
   */
  if (
    normalizedSubcategory &&
    serviceName &&
    (
      serviceName.includes(normalizedSubcategory) ||
      normalizedSubcategory.includes(serviceName)
    )
  ) {
    score += 40;
  }

  /*
   * Department match.
   */
  if (
    normalizedDepartment &&
    serviceDepartment &&
    (
      normalizedDepartment === serviceDepartment ||
      serviceDepartment.includes(normalizedDepartment) ||
      normalizedDepartment.includes(serviceDepartment)
    )
  ) {
    score += 25;
  }

  /*
   * Area / category match.
   */
  if (
    normalizedArea &&
    serviceCategory &&
    (
      normalizedArea === serviceCategory ||
      serviceCategory.includes(normalizedArea) ||
      normalizedArea.includes(serviceCategory)
    )
  ) {
    score += 20;
  }

  return score;
};

/*
|--------------------------------------------------------------------------
| MAIN GOVERNMENT ROUTING FUNCTION
|--------------------------------------------------------------------------
*/

export const findGovernmentRoute = async ({
  area = "",
  subcategory = "",
  department = "",
  title = "",
  description = "",
  location = {},
}) => {
  try {
    /*
     * Only active government services should participate.
     */
    const services = await GovernmentService.find({
      active: true,
    }).populate("sourceId");

    if (!services.length) {
      return {
        status: "no_verified_route",
        message:
          "No active government service is available for routing.",
        service: null,
        source: null,
        candidates: [],
      };
    }

    /*
     * Calculate score for every available service.
     */
    const candidates = services
      .map((service) => {
        const exactScore = getExactFieldScore(
          {
            area,
            subcategory,
            department,
          },
          service
        );

        const textScore = getServiceMatchScore(
          {
            area,
            subcategory,
            department,
            title,
            description,
          },
          service
        );

        const locationScore = getLocationScore(
          location,
          service
        );

        const totalScore =
          exactScore +
          textScore +
          locationScore;

        return {
          service,
          exactScore,
          textScore,
          locationScore,
          totalScore,
        };
      })
      .sort(
        (a, b) =>
          b.totalScore - a.totalScore
      );

    const bestCandidate = candidates[0];

    /*
     * No meaningful match.
     */
    if (
      !bestCandidate ||
      bestCandidate.totalScore < 30
    ) {
      return {
        status: "no_verified_route",
        message:
          "CivicFix could not find a sufficiently supported government service.",
        service: null,
        source: null,
        candidates: candidates
          .slice(0, 3)
          .map(formatCandidate),
      };
    }

    const service = bestCandidate.service;

    /*
     * IMPORTANT:
     *
     * We do not convert jurisdiction_required
     * into a verified route.
     */
    if (
      service.routingStatus ===
      "jurisdiction_required"
    ) {
      return {
        status: "jurisdiction_required",
        message:
          "A potential government service was identified, but jurisdiction verification is required before final routing.",
        service: formatService(service),
        source: formatSource(service.sourceId),
        candidates: candidates
          .slice(0, 3)
          .map(formatCandidate),
      };
    }

    /*
     * Service exists but official evidence
     * has not been verified.
     */
    if (
      service.routingStatus ===
      "needs_verification"
    ) {
      return {
        status: "needs_verification",
        message:
          "A possible government service was identified, but its routing information still requires verification.",
        service: formatService(service),
        source: formatSource(service.sourceId),
        candidates: candidates
          .slice(0, 3)
          .map(formatCandidate),
      };
    }

    /*
     * Verified route.
     */
    return {
      status: "verified",
      message:
        "Government service successfully identified.",
      service: formatService(service),
      source: formatSource(service.sourceId),
      candidates: candidates
        .slice(0, 3)
        .map(formatCandidate),
    };
  } catch (error) {
    console.error(
      "Government routing error:",
      error
    );

    return {
      status: "routing_error",
      message:
        "Government routing could not be completed.",
      service: null,
      source: null,
      candidates: [],
      error: error.message,
    };
  }
};

/*
|--------------------------------------------------------------------------
| FORMAT SERVICE
|--------------------------------------------------------------------------
*/

const formatService = (service) => {
  if (!service) {
    return null;
  }

  return {
    id: service._id,

    serviceName:
      service.serviceName,

    serviceCategory:
      service.serviceCategory,

    subcategory:
      service.subcategory,

    authorityName:
      service.authorityName,

    department:
      service.department,

    state:
      service.state,

    district:
      service.district,

    city:
      service.city,

    municipality:
      service.municipality,

    ward:
      service.ward,

    zone:
      service.zone,

    routingStatus:
      service.routingStatus,

    officialUrl:
      service.officialUrl,

    sourceEvidence:
      service.sourceEvidence,

    complaintChannel:
      service.complaintChannel,

    complaintUrl:
      service.complaintUrl,

    complaintPhone:
      service.complaintPhone,

    ragEnabled:
      service.ragEnabled,

    ragNotes:
      service.ragNotes,

    lastVerified:
      service.lastVerified,
  };
};

/*
|--------------------------------------------------------------------------
| FORMAT SOURCE
|--------------------------------------------------------------------------
*/

const formatSource = (source) => {
  if (!source) {
    return null;
  }

  return {
    id: source._id,

    sourceName:
      source.sourceName,

    organization:
      source.organization,

    sourceType:
      source.sourceType,

    officialUrl:
      source.officialUrl,

    jurisdiction:
      source.jurisdiction,

    license:
      source.license,

    lastVerified:
      source.lastVerified,

    status:
      source.status,
  };
};

/*
|--------------------------------------------------------------------------
| FORMAT CANDIDATE
|--------------------------------------------------------------------------
*/

const formatCandidate = (candidate) => {
  return {
    serviceId:
      candidate.service._id,

    serviceName:
      candidate.service.serviceName,

    authorityName:
      candidate.service.authorityName,

    routingStatus:
      candidate.service.routingStatus,

    score:
      candidate.totalScore,

    exactScore:
      candidate.exactScore,

    textScore:
      candidate.textScore,

    locationScore:
      candidate.locationScore,
  };
};