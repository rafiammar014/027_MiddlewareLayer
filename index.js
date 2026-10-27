import "dotenv/config";
import Joi from "joi";
import express from "express";
import PG from "pg";

const app = express()
const port = process.env.PORT 
const {Pool} = PG

