import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    role: {
        type: String,
        enum: ["citizen", "admin"],
        default: "citizen"
    }
},
    {
        timestamps: true
    }
)
const User = mongoose.model("User", UserSchema)

export default User