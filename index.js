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