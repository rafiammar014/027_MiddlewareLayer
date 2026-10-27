import "dotenv/config";
import Joi from "joi";
import express from "express";
import PG from "pg";

const app = express()
const port = process.env.PORT 
const {Pool} = PG

const pool = new Pool({
    user: process.env.DB_USER,  
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middleware Logging
app.use((req, res, next) => {
    console.start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - console.start
        console.log({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        })
    })
    next()
})

//Response Envelope
function successResponse(res, message, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true, message, data, error: null,
    })
}

function errorResponse(res, message, status, details = null) {
    return res.status(status).json({
        success: false, message, data:null, error: details,
    })
}

// joi Validation schema
const biodataSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
    name: Joi.string().min(3).max(100).required(),
    nim: Joi.string().trim().min(5).max(20).required(),
    kelas: Joi.string().trim().min(1).max(20).required(),
})

const idSchema = Joi.object({
    id: Joi.number().integer().positive().required(),
})


//Middleware untuk validaasi body
function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body,{
        abortEarly:false, convert:true, allowUnknown: false
    }); 
    if (error) {
        return errorResponse(
        res,
        "Validation Error",
        400,
        error.details.map(item =>({
            field: item.path.join('.'),
            message: item.message
        }))
    )
}
    req.body = value,
    next()
    }
}


//Middleware untuk validaasi params
function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params);
    if (error) {
        return errorResponse(
        res,
        "Parameter Validation Error",
        400,
        error.details.map(item =>({
            field: item.path.join('.'),
            message: item.message
        }))
    )
}
    req.params = value,
    next()
    }
}