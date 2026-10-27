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

app.get("/", async(req, res) => {
    const result = await pool.query("SELECT * FROM biodata ORDER BY id")
    return successResponse(res, "Data Berhasil Diambil", result.rows)
})

app.post("/biodata", validateBody(biodataSchema), async(req, res) => {
    const { id, name, nim, kelas } = req.body
    const result = await pool.query(
        'INSERT INTO biodata (id, name, nim, kelas) VALUES ($1, $2, $3, $4) RETURNING *',
        [id ?? null, name, nim, kelas]
    )
    return successResponse(res, "Data Berhasil Ditambahkan", result.rows[0], 201)
})

app.put(
    "/biodata/:id", 
    validateParams(idSchema),
    validateBody(
        biodataSchema
            .fork(["nama", "nim", "kelas"], (field) => field.required())
            .fork(["id"], (field) => field.forbidden())
    ),
    async(req, res) => {
        const { id } = req.params
        const { name, nim, kelas } = req.body

        const result = await pool.query(
            'UPDATE biodata SET name = $1, nim = $2, kelas = $3 WHERE id = $4 RETURNING *',
            [name, nim, kelas, id]
        )
        if (result.rowCount === 0) {
            return errorResponse(res, "Data Tidak Ditemukan", 404)
        }
        return successResponse(res, "Data Berhasil Diupdate", result.rows[0])
    },
);

app.delete("/biodata/:id", validateParams(idSchema), async(req, res) => {
    const { id } = req.params
    const result = await pool.query(
        'DELETE FROM biodata WHERE id = $1 RETURNING *',
        [id]
    )
    if (result.rowCount === 0) {
        return errorResponse(res, "Data Tidak Ditemukan", 404)
    }
    return successResponse(res, "Data Berhasil Dihapus", result.rows[0])
})

//Route Not Found
app.use((req, res) => {
    return errorResponse(res, "Route Not Found", 404)
})

//global Error Handler
app.use((err, req, res, next) => {
    console.error(err)
    if (res.headersSent) {
        return next(err)
    }
    return errorResponse(res, "Internal Server Error", 500)
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})


