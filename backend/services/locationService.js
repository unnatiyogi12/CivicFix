import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ======================================================
// FILE PATHS
// ======================================================

// Gwalior
const GWALIOR_WARD_FILE_PATH = path.resolve(
    __dirname,
    "../../data/wards/gwalior.geojson"
);

// Bhopal
const BHOPAL_WARD_FILE_PATH = path.resolve(
    __dirname,
    "../../data/wards/bhopal.geojson"
);

// NEW:
// Common city-wise Ward → Zone mapping
const CITY_WARD_ZONE_MAPPING_PATH = path.resolve(
    __dirname,
    "../../data/wards/city_ward_zone_mapping.json"
);

// Old Gwalior mapping kept as fallback
const OLD_GWALIOR_MAPPING_PATH = path.resolve(
    __dirname,
    "../../data/wards/ward_zone_mapping.json"
);


// ======================================================
// COORDINATE VALIDATION
// ======================================================

export function validateCoordinates(
    latitude,
    longitude
) {

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
        !Number.isFinite(lat) ||
        lat < -90 ||
        lat > 90
    ) {

        return {
            valid: false,
            message: "Invalid latitude."
        };
    }

    if (
        !Number.isFinite(lng) ||
        lng < -180 ||
        lng > 180
    ) {

        return {
            valid: false,
            message: "Invalid longitude."
        };
    }

    return {
        valid: true,
        latitude: lat,
        longitude: lng
    };
}


// ======================================================
// GENERIC GEOJSON LOADER
// ======================================================

function loadGeoJSON(
    filePath,
    sourceName
) {

    try {

        if (!fs.existsSync(filePath)) {

            console.log(
                `⚠️ ${sourceName} file not found:`,
                filePath
            );

            return null;
        }

        const fileContent =
            fs.readFileSync(
                filePath,
                "utf-8"
            );

        return JSON.parse(fileContent);

    } catch (error) {

        console.log(
            `⚠️ Failed to load ${sourceName}:`,
            error.message
        );

        return null;
    }
}


// ======================================================
// LOAD CITY WARD → ZONE MAPPING
// ======================================================

function loadCityWardZoneMapping() {

    try {

        if (
            !fs.existsSync(
                CITY_WARD_ZONE_MAPPING_PATH
            )
        ) {

            console.log(
                "⚠️ City Ward-Zone mapping file not found:",
                CITY_WARD_ZONE_MAPPING_PATH
            );

            return {};
        }

        const fileContent =
            fs.readFileSync(
                CITY_WARD_ZONE_MAPPING_PATH,
                "utf-8"
            );

        return JSON.parse(
            fileContent
        );

    } catch (error) {

        console.log(
            "⚠️ Failed to load city Ward-Zone mapping:",
            error.message
        );

        return {};
    }
}


// ======================================================
// LOAD OLD GWALIOR MAPPING
// ======================================================
//
// This is only a fallback so existing Gwalior
// functionality does not suddenly break.
// ======================================================

function loadOldGwaliorMapping() {

    try {

        if (
            !fs.existsSync(
                OLD_GWALIOR_MAPPING_PATH
            )
        ) {

            return {};
        }

        const fileContent =
            fs.readFileSync(
                OLD_GWALIOR_MAPPING_PATH,
                "utf-8"
            );

        return JSON.parse(
            fileContent
        );

    } catch (error) {

        console.log(
            "⚠️ Failed to load old Gwalior mapping:",
            error.message
        );

        return {};
    }
}


// ======================================================
// GET ZONE FROM CITY + WARD
// ======================================================

function findZoneFromCityWard(
    city,
    wardCode
) {

    const normalizedCity =
        String(
            city || ""
        )
            .trim();

    const normalizedWardCode =
        String(
            wardCode || ""
        )
            .trim();

    if (
        !normalizedCity ||
        !normalizedWardCode
    ) {

        return null;
    }


    // --------------------------------------------------
    // New city-wise mapping
    // --------------------------------------------------

    const cityMapping =
        loadCityWardZoneMapping();

    const cityWardMapping =
        cityMapping[
            normalizedCity
        ];


    if (
        cityWardMapping &&
        Object.prototype.hasOwnProperty.call(
            cityWardMapping,
            normalizedWardCode
        )
    ) {

        const zone =
            cityWardMapping[
                normalizedWardCode
            ];

        if (
            zone !== null &&
            zone !== undefined &&
            String(zone).trim() !== ""
        ) {

            return String(zone).trim();
        }
    }


    // --------------------------------------------------
    // Gwalior legacy fallback
    // --------------------------------------------------

    if (
        normalizedCity.toLowerCase() ===
        "gwalior"
    ) {

        const oldMapping =
            loadOldGwaliorMapping();

        const zone =
            oldMapping[
                normalizedWardCode
            ];

        if (
            zone !== null &&
            zone !== undefined &&
            String(zone).trim() !== ""
        ) {

            return String(zone).trim();
        }
    }


    return null;
}


// ======================================================
// FIND WARD IN GEOJSON
// ======================================================

function findWardInGeoJSON(
    data,
    latitude,
    longitude,
    city
) {

    if (
        !data ||
        !Array.isArray(
            data.features
        )
    ) {

        return null;
    }


    const locationPoint =
        point([
            Number(longitude),
            Number(latitude)
        ]);


    for (
        const feature of data.features
    ) {

        try {

            const isInside =
                booleanPointInPolygon(
                    locationPoint,
                    feature
                );

            if (!isInside) {
                continue;
            }


            const properties =
                feature.properties || {};


            // ==================================================
            // BHOPAL
            // ==================================================

            if (
                city === "Bhopal"
            ) {

                const wardCode =
                    String(
                        properties.Ward_Number ??
                        properties.ward_number ??
                        properties.wardno ??
                        properties.ward_no ??
                        properties.wardcode ??
                        properties.WARD_NO ??
                        ""
                    ).trim();


                const wardName =
                    String(
                        properties.Name ??
                        properties.name ??
                        properties.Ward_Name ??
                        properties.wardname ??
                        properties.ward_name ??
                        ""
                    ).trim();


                if (!wardCode) {
                    continue;
                }


                return {

                    ward:
                        wardName,

                    wardCode:
                        wardCode,

                    municipality:
                        "Bhopal Municipal Corporation",

                    ulbCode:
                        "",

                    district:
                        "Bhopal",

                    state:
                        "Madhya Pradesh",

                    source:
                        "Bhopal_Wards"
                };
            }


            // ==================================================
            // GWALIOR
            // ==================================================

            if (
                city === "Gwalior"
            ) {

                const ulbName =
                    String(
                        properties.ulbname || ""
                    )
                        .trim()
                        .toLowerCase();


                // Only Gwalior Municipal Corporation
                if (
                    ulbName !== "gwalior"
                ) {

                    continue;
                }


                const wardName =
                    properties.wardname ||
                    "";


                const wardCode =
                    String(
                        properties.wardcode ||
                        ""
                    ).trim();


                return {

                    ward:
                        wardName,

                    wardCode:
                        wardCode,

                    municipality:
                        properties.ulbname ||
                        "Gwalior",

                    ulbCode:
                        properties.ulbcode ||
                        "",

                    district:
                        properties.districtname ||
                        "Gwalior",

                    state:
                        properties.statename ||
                        "Madhya Pradesh",

                    source:
                        "Gwalior_Wards"
                };
            }


        } catch (error) {

            console.log(
                `⚠️ ${city} ward polygon check failed:`,
                error.message
            );
        }
    }


    return null;
}


// ======================================================
// FIND BHOPAL WARD
// ======================================================

function findBhopalWard(
    latitude,
    longitude
) {

    const data =
        loadGeoJSON(
            BHOPAL_WARD_FILE_PATH,
            "Bhopal ward"
        );

    return findWardInGeoJSON(
        data,
        latitude,
        longitude,
        "Bhopal"
    );
}


// ======================================================
// FIND GWALIOR WARD
// ======================================================
// ======================================================
// FIND GWALIOR WARD
// ======================================================

function findGwaliorWard(
    latitude,
    longitude
) {

    const data =
        loadGeoJSON(
            GWALIOR_WARD_FILE_PATH,
            "Gwalior ward"
        );

    // ==================================================
    // GWALIOR WARD DEBUG
    // ==================================================

    console.log("\n=================================");
    console.log("🔍 GWALIOR WARD DEBUG");

    console.log(
        "Ward file:",
        GWALIOR_WARD_FILE_PATH
    );

    console.log(
        "File exists:",
        fs.existsSync(GWALIOR_WARD_FILE_PATH)
    );

    console.log(
        "Data loaded:",
        !!data
    );

    console.log(
        "Feature count:",
        data?.features?.length || 0
    );

    console.log(
        "Coordinates:",
        latitude,
        longitude
    );

    // Show first feature properties
    // This will help us know the actual property names
    if (
        data &&
        Array.isArray(data.features) &&
        data.features.length > 0
    ) {

        console.log(
            "First feature properties:",
            data.features[0]?.properties || {}
        );
    }

    // ==================================================
    // FIND WARD
    // ==================================================

    const result =
        findWardInGeoJSON(
            data,
            latitude,
            longitude,
            "Gwalior"
        );

    // ==================================================
    // MATCH RESULT
    // ==================================================

    console.log(
        "Matched ward:",
        result?.ward || "NOT FOUND"
    );

    console.log(
        "Matched ward code:",
        result?.wardCode || "NOT FOUND"
    );

    console.log(
        "Matched municipality:",
        result?.municipality || "NOT FOUND"
    );

    console.log(
        "Matched district:",
        result?.district || "NOT FOUND"
    );

    console.log(
        "Matched state:",
        result?.state || "NOT FOUND"
    );

    console.log("=================================\n");

    return result;
}


// ======================================================
// REVERSE GEOCODING
// ======================================================

async function reverseGeocode(
    latitude,
    longitude
) {

    try {

        const response =
            await axios.get(
                "https://nominatim.openstreetmap.org/reverse",
                {
                    params: {

                        lat:
                            latitude,

                        lon:
                            longitude,

                        format:
                            "jsonv2",

                        addressdetails:
                            1
                    },

                    headers: {

                        "User-Agent":
                            "CivicFixAI/1.0"
                    },

                    timeout:
                        10000
                }
            );


        const data =
            response.data;


        const address =
            data.address || {};


        return {

            displayName:
                data.display_name ||
                "",

            city:
                address.city ||
                address.town ||
                address.city_district ||
                address.village ||
                "",

            district:
                address.state_district ||
                address.district ||
                "",

            state:
                address.state ||
                "",

            country:
                address.country ||
                "",

            postcode:
                address.postcode ||
                ""
        };

    } catch (error) {

        console.log(
            "⚠️ Reverse geocoding failed:",
            error.message
        );

        return null;
    }
}


// ======================================================
// DETECT CITY
// ======================================================

function detectCity(
    geoData,
    address = ""
) {

    const combinedText =
        [
            geoData?.city || "",
            geoData?.district || "",
            address || ""
        ]
            .join(" ")
            .toLowerCase();


    if (
        combinedText.includes("bhopal")
    ) {

        return "Bhopal";
    }


    if (
        combinedText.includes("gwalior")
    ) {

        return "Gwalior";
    }


    return "";
}


// ======================================================
// MAIN LOCATION INTELLIGENCE
// ======================================================

export async function getLocationIntelligence({

    latitude,

    longitude,

    address = ""

}) {

    // --------------------------------------------------
    // 1. Validate coordinates
    // --------------------------------------------------

    const validation =
        validateCoordinates(
            latitude,
            longitude
        );


    if (
        !validation.valid
    ) {

        throw new Error(
            validation.message
        );
    }


    // --------------------------------------------------
    // 2. Reverse geocoding
    // --------------------------------------------------

    const geoData =
        await reverseGeocode(
            validation.latitude,
            validation.longitude
        );


    // --------------------------------------------------
    // 3. Detect city from address/geocoding
    // --------------------------------------------------

    let detectedCity =
        detectCity(
            geoData,
            address
        );


    // --------------------------------------------------
    // 4. Try city-specific ward detection
    // --------------------------------------------------

    let wardData = null;


    if (
        detectedCity === "Bhopal"
    ) {

        wardData =
            findBhopalWard(
                validation.latitude,
                validation.longitude
            );

    } else if (
        detectedCity === "Gwalior"
    ) {

        wardData =
            findGwaliorWard(
                validation.latitude,
                validation.longitude
            );
    }


    // --------------------------------------------------
    // 5. Spatial fallback
    // --------------------------------------------------
    //
    // If reverse geocoding did not identify the city,
    // use the ward polygons themselves.
    // --------------------------------------------------

    if (!wardData) {

        const bhopalWard =
            findBhopalWard(
                validation.latitude,
                validation.longitude
            );


        if (bhopalWard) {

            wardData =
                bhopalWard;

            detectedCity =
                "Bhopal";
        }
    }


    if (!wardData) {

        const gwaliorWard =
            findGwaliorWard(
                validation.latitude,
                validation.longitude
            );


        if (gwaliorWard) {

            wardData =
                gwaliorWard;

            detectedCity =
                "Gwalior";
        }
    }


    // --------------------------------------------------
    // 6. Find zone from city + ward
    // --------------------------------------------------

    const zone =
        findZoneFromCityWard(
            detectedCity,
            wardData?.wardCode
        );


    // --------------------------------------------------
    // 7. Municipality
    // --------------------------------------------------

    const municipality =
        wardData?.municipality ||
        (
            detectedCity === "Bhopal"
                ? "Bhopal Municipal Corporation"
                : ""
        ) ||
        geoData?.city ||
        "";


    // --------------------------------------------------
    // 8. District
    // --------------------------------------------------

    const district =
        wardData?.district ||
        (
            detectedCity === "Bhopal"
                ? "Bhopal"
                : detectedCity === "Gwalior"
                    ? "Gwalior"
                    : ""
        ) ||
        geoData?.district ||
        "";


    // --------------------------------------------------
    // 9. State
    // --------------------------------------------------

    const state =
        wardData?.state ||
        geoData?.state ||
        "Madhya Pradesh";


    // --------------------------------------------------
    // 10. Jurisdiction
    // --------------------------------------------------

    const jurisdiction =
        wardData?.municipality ||
        municipality ||
        geoData?.city ||
        "";


    // --------------------------------------------------
    // 11. Location source
    // --------------------------------------------------

    let locationSource =
        "OpenStreetMap";


    if (
        wardData?.source ===
        "Bhopal_Wards"
    ) {

        locationSource =
            "Bhopal_Wards + CityWardZoneMapping + OpenStreetMap";

    } else if (
        wardData?.source ===
        "Gwalior_Wards"
    ) {

        locationSource =
            "Gwalior_Wards + CityWardZoneMapping + OpenStreetMap";
    }


    // --------------------------------------------------
    // 12. LOG
    // --------------------------------------------------

    console.log(
        "\n📍 LOCATION INTELLIGENCE"
    );


    console.log(
        "Latitude:",
        validation.latitude
    );


    console.log(
        "Longitude:",
        validation.longitude
    );


    console.log(
        "Detected City:",
        detectedCity ||
        "Not detected"
    );


    console.log(
        "Municipality:",
        municipality ||
        "Not found"
    );


    console.log(
        "Ward:",
        wardData?.ward ||
        "Not found"
    );


    console.log(
        "Ward Code:",
        wardData?.wardCode ||
        "Not found"
    );


    console.log(
        "Zone:",
        zone ||
        "Not found"
    );


    console.log(
        "District:",
        district ||
        "Not found"
    );


    console.log(
        "State:",
        state ||
        "Not found"
    );


    // --------------------------------------------------
    // 13. RETURN
    // --------------------------------------------------

    return {

        success:
            true,

        location: {

            latitude:
                validation.latitude,

            longitude:
                validation.longitude,

            address:
                address ||
                geoData?.displayName ||
                "",

            ward:
                wardData?.ward ||
                "",

            wardCode:
                wardData?.wardCode ||
                "",

            zone:
                zone ||
                "",

            municipality:
                municipality,

            ulbCode:
                wardData?.ulbCode ||
                "",

            district:
                district,

            state:
                state,

            jurisdiction:
                jurisdiction,

            source:
                locationSource
        }
    };
}