import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// register a new user

router.post("/register", async(req, res) => {
    try{
        const {name, email, password} = req.body;
        
        // check required fields

        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            })
        }
        
        // check if user already exists
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already exists"
            })
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // cerate user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        })
    }
    
})

router.post("/login" , async(req,res) => {
    try{
        const {email, password} = req.body;

        // check required fields
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            })
        }
        const user = await User.findOne({email});

        // find user
        if(!user){
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        // compare password
        const isPasswordCorrect = await bcrypt.compare(
            password, 
            user.password
            )

        if(!isPasswordCorrect){
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        // create JWT
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn : "1d"
            }
        )

        // send response
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch(error){
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        })
    }
})

export default router
