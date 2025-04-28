// Import modules
const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const multer = require('multer');
const bodyParser = require('body-parser')
const jose = require('jose') //library jose for jwt
const { jwtVerify } = require("jose");
const hash = require('js-sha256');//lib for hash
const app = express()
//configuration
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(express.static('public'))
// Configure storage
const storage = multer.diskStorage({
    destination: path.join(__dirname, './files/'), // Save files in the 'files' folder
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Store with original filename
    }
});
const upload = multer({ storage: storage });
//pwhashing
function hashString(salt, input){
    let hashedString = hash.hmac(salt, input)
    return hashedString
  }
//secret
let secret_word = "fisk"
//jwt buffer
const secret = Buffer.from(secret_word)
// Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'test',
  });
//create jwt
async function createToken(payload) {
    return await new jose.SignJWT({user: payload})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
}

//function to verify jwt
async function verifyToken(req, res, next) {
    try {
        let authHeader = req.headers["authorization"]
        if (!authHeader) return res.status(401).json({ error: "No token provided" })
        let token = authHeader.split(" ")[1]; // Extract JWT from "Bearer <token>"
        let { payload } = await jwtVerify(token, secret);
        req.user = payload.user; // Attach decoded user data to request
        let username = req.user
        console.log("JWT username: "+req.user)
        let sql = `SELECT user FROM user WHERE user =?`
        connection.execute(sql,[username],(err,results)=>{
            if(err){
                console.error("Database error:", err)
            }
            if (!results || results.length === 0) {
                console.log("user not found")
                return res.status(404).json({ error: "User not found" });
            }
            req.user = results[0].user; // Attach user data to request
            next(); // Proceed to next middleware or route
        })
    } catch (error) {
        console.log(error)
        res.status(403).json({ error: "Invalid token" }).sendFile(path.join(__dirname+'/public/403.html'))
    }
}

// Routes
app.get('/',(req,res)=>{
    res.status(200).sendFile(path.join(__dirname+'/public/index.html'))
})

app.get('/login', (req, res) => {
    res.status(200).sendFile(path.join(__dirname+'/public/login.html'))
});

app.post('/login/login',(req,res)=>{
    let username = req.body.username
    let password = req.body.password
    hashpwd = hashString(username, password)
    let sql = `SELECT user FROM user WHERE user = ? AND password = ?`
    connection.execute(sql, [username, hashpwd], (err, results, fields) => {
      if (err) {
          console.log(err)
          return res.status(500).send('Error occurred')
      }
      if (results.length > 0) {
        console.log(results);
        createToken(results[0].user).then(jwt => {
            console.log(jwt); 
            res.status(200).json({ jwt: jwt, message: 'Login successful'})
        });
      } else {
          res.status(401).send('Invalid credentials')
      }
    })
})

app.post('/login/upload',(req,res)=>{
    res.status(501).send("Not implemented, use /create!")
})

app.post('/login/signup',(req, res)=>{
    let username = req.body.username
    let password = req.body.password
    let hashpw = hashString(username, password)
    let sql = `INSERT INTO user (user, password) VALUES ('${username}', '${hashpw}')`
    connection.execute(sql, (err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Unable to create account!")
        }else{
            console.log("account created "+ username +" " + password)
            res.status(200).sendFile(__dirname+'/public/upload.html')
        }
    })
})

app.post('/login/logout',verifyToken,(req,res)=>{
    res.status(200)
})

app.get('/resources',(req,res)=>{
    const sql = 'SELECT filename, user, id FROM files'
    connection.execute(sql, [], (err, results) => {
        if (err) {
            console.log(err)
            res.status(500).json({ error: 'Error fetching data' })
            return
        }
        res.status(200).json(results)
    });
})

app.get('/resources/:id', verifyToken,(req,res)=>{
    console.log("Getting file")
    let resourceId = req.params.id
    let username = req.user
    sql = `SELECT filepath FROM files WHERE user='${username}' AND id=${resourceId}`
    connection.execute(sql,(err,results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error")
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "File not found" });
        }
        let filepath = results[0].filepath;
        console.log("Resolved filepath:", filepath);
        res.status(200).sendFile(filepath);
    })
})

app.post('/create',verifyToken,upload.single("file"),(req,res)=>{
    console.log("Uploaded file:", req.file);
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
    }
    let filename = req.file.originalname
    let filepath = path.join(__dirname,'./files/',filename).replace(/\\/g, '\\\\')
    let sql = `INSERT INTO files (user, filename, filepath) VALUES('${req.user}', '${filename}', '${filepath}')`
    connection.execute(sql,(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error", err)
        }else{
            res.status(200).send("Upload succesfull")
        }
    })
})

app.put('/update/:id',verifyToken,upload.single('ufile'),(req,res)=>{
    console.log("Uploaded file:", req.file)
    let resourceId = req.params.id
    if (!resourceId || isNaN(resourceId)) {
        return res.status(400).json({ error: "Invalid file ID provided" });
    }
    console.log("update ID: " + resourceId)
    let filename = req.file.originalname
    let filepath = path.join(__dirname,'./files/',filename)
    console.log(filepath + " : " + filename)
    let sql = `UPDATE files SET user=?, filename=?, filepath=? WHERE id=?`
    connection.execute(sql,[req.user, filename, filepath, resourceId],(err, results)=>{
        if(err){
            console.log(err)
            res.status(500).send("Database error", err)
        }else{
            res.status(200).send("Upload succesfull")
        }
    })
})

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});