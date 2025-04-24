// Import modules
const express = require('express')
const mysql = require('mysql2')
const path = require('path')
const multer = require('multer');
const bodyParser = require('body-parser')
const jose = require('jose') //library jose for jwt
const hash = require('js-sha256');//lib for hash
const { verify } = require('crypto');
const app = express()
//configuration
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(express.static('public'))
// Configure storage
const storage = multer.diskStorage({
    destination: '../files/', // Save files in the 'uploads' folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
})
const upload = multer({ storage: storage });
//pwhashing
function hashString(salt, input){
    let hashedString = hash.hmac(salt, input)
    return hashedString
  }
//secret
let secret_word = "fisk"
//jwt
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

//createToken(input).then(jwt => {
//    console.log(jwt);})

//function to verify jwt
async function verifyToken(req, res, next) {
    try {
        let authHeader = req.headers["authorization"]
        if (!authHeader) return res.status(401).json({ error: "No token provided" })
        let token = authHeader.split(" ")[1]; // Extract JWT from "Bearer <token>"
        let { payload } = await jwtVerify(token, secret);
        req.user = payload; // Attach decoded user data to request
        let username = req.user
        let sql = `SELECT user FROM user WHERE user =?`
        connection.execute(sql,[username],(err,results)=>{
            if(err){
                console.error("Database error:", err)
            }
            if (results.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }
            req.user = results[0].user; // Attach user data to request
            next(); // Proceed to next middleware or route
        })
    } catch (error) {
        res.status(403).json({ error: "Invalid token" })
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
    res.status(200)
})

app.post('/login/signup',(req, res)=>{
    let username = req.body.username
    let password = req.body.password
    let hashpw = hashString(username, password)
    let sql = `INSERT INTO user (user, password) VALUES ('${username}', '${hashpw}')`
    connection.execute(sql, (err, results)=>{
        if(err){
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

app.post('/resources',(req,res)=>{
    const sql = 'SELECT filename, user, id FROM files'
    db.execute(sql, [], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching data' })
            return
        }
        res.status(200).json(results)
    });
})

app.get('/resources/:id', verifyToken,(req,res)=>{
    let resourceId = req.params.dir
    let username = req.user
    sql = `SELECT * FROM files WHERE user='${username}' AND id='${resourceId}'`
    connection.execute(sql,(err,results)=>{
        if(err){
            res.status(500).send("Database error")
        }
        res.sendFile(results.filepath)
    })
})

app.post('/create',verifyToken,upload.single('file'),(req,res)=>{
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
    }
    let filename = req.file.filename
    let filepath = path.join(__dirname+'../files/'+filename)
    let sql = `INSERT INTO files (user, filename, filepath) VALUES('${req.user}', '${filename}', '${filepath}')`
    connection.execute(sql,(err, results)=>{
        if(err){
            res.status(500).send("Database error", err)
        }else{
            res.status(200).send("Upload succesfull")
        }
    })
})

app.put('/update/:id',verifyToken,upload.single('file'),(req,res)=>{
    let resourceId = req.params.id
    let filename = req.file.filename
    let filepath = path.join(__dirname+'../files/'+filename)
    let sql = `INSERT INTO files (user, filename, filepath) VALUES('${req.user}', '${filename}', '${filepath}') WHERE id='${resourceId}'`
    connection.execute(sql,(err, results)=>{
        if(err){
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