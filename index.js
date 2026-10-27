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

