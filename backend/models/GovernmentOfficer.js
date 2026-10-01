import mongoose from "mongoose";

const governmentOfficerSchema = new mongoose.Schema(
    {
        // =====================================================
        // GOVERNMENT IDENTITY
        // =====================================================

        governmentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        designation: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // GOVERNMENT DEPARTMENT
        // =====================================================

        department: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // AUTHORITY / ORGANIZATION
        // =====================================================

        authorityName: {
            type: String,
            required: true,
            trim: true
        },


        // =====================================================
        // LOCATION / JURISDICTION
        // =====================================================

        state: {
            type: String,
            trim: true,
            default: ""
        },

        district: {
            type: String,
            trim: true,
            default: ""
        },

        city: {
            type: String,
            trim: true,
            default: ""
        },

        zone: {
            type: String,
            trim: true,
            default: ""
        },

        ward: {
            type: String,
            trim: true,
            default: ""
        },


        // =====================================================
        // CONTACT
        // =====================================================

        officialEmail: {
            type: String,
            trim: true,
            default: ""
        },

        officialPhone: {
            type: String,
            trim: true,
            default: ""
        },


        // =====================================================
        // STATUS
        // =====================================================

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// =========================================================
// INDEXES
// =========================================================

governmentOfficerSchema.index({
    department: 1
});

governmentOfficerSchema.index({
    authorityName: 1
});

governmentOfficerSchema.index({
    city: 1,
    district: 1
});

governmentOfficerSchema.index({
    zone: 1,
    ward: 1
});

governmentOfficerSchema.index({
    active: 1
});


const GovernmentOfficer = mongoose.model(
    "GovernmentOfficer",
    governmentOfficerSchema
);

export default GovernmentOfficer;