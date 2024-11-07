const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const app = express();
//const port = process.env.PORT || 4000; // Use the PORT environment variable for Cloud Run or local development
const port = process.env.port || 4000; // Use the PORT environment variable for Cloud Run
const project_id = process.env.projectid
const db_connection_name = process.env.dbconnectionname


// Initialize Secret Manager Client
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
    const [version] = await client.accessSecretVersion({
        name: `projects/${project_id}/secrets/${secretName}/versions/latest`,
    });
    return version.payload.data.toString('utf8');
}

// Database connection
async function connectToDatabase() {
    const user = await getSecret('DB_USERNAME');
    const password = await getSecret('DB_PASSWORD');
    
    const db = mysql.createConnection({
        host: `/cloudsql/${db_connection_name}`, // Use Cloud SQL connection name
        user: user,
        password: password,
        database: 'registration_db', // Ensure this database exists
    });

    db.connect(err => {
        if (err) {
            console.error('Database connection failed:', err);
            return;
        }
        console.log('Connected to database');
    });

    return db;
}

// Connect to the database
let db;
connectToDatabase().then(connection => {
    db = connection;
}).catch(err => {
    console.error('Failed to connect to the database:', err);
});

// Middleware Configuration
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/images', express.static(path.join(__dirname, 'images')));

/* // Initialize Database Connections
let db; // Connection for user management (registration_db)
let stationDb; // Connection for station data (wissen_fleet)

async function initializeDatabases() {
    try {
        db = await connectToDatabase('registration_db'); // Connect to registration_db
        stationDb = await connectToDatabase('wissen_fleet'); // Connect to wissen_fleet
    } catch (err) {
        console.error('Error initializing databases:', err);
        process.exit(1); // Exit if database connections fail
    }
} */

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        return res.redirect('/login');
    }
}

// Routes

// Home Route
app.get('/', (req, res) => {
    res.render('index');
});

// Registration Route
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into registration_db
        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error during registration:', err);
                return res.status(500).send('Error during registration');
            }

            // Automatically log the user in after registration
            const loginSql = 'SELECT * FROM users WHERE username = ?';
            db.query(loginSql, [username], (err, results) => {
                if (err) {
                    console.error('Error fetching user after registration:', err);
                    return res.status(500).send('Error during login');
                }

                if (results.length === 0) {
                    return res.status(401).send('Invalid user');
                }

                // Set session variables
                req.session.userId = results[0].id;
                req.session.username = results[0].username;

                // Redirect to the dashboard
                res.redirect('/dashboard');
            });
        });
    } catch (err) {
        console.error('Error in registration process:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Login Route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).send('Error during login');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid username or password');
        }

        try {
            const isMatch = await bcrypt.compare(password, results[0].password);
            if (!isMatch) {
                return res.status(401).send('Invalid username or password');
            }

            // Set session variables
            req.session.userId = results[0].id;
            req.session.username = results[0].username;

            // Redirect to the dashboard
            res.redirect('/dashboard');
        } catch (err) {
            console.error('Error comparing passwords:', err);
            res.status(500).send('Error during login');
        }
    });
});

// Dashboard Route (Protected)
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    const username = req.session.username;

    // Query station data from wissen_fleet database
    const sql = `
        SELECT 
            id, 
            name, 
            addressId, 
            phoneNumber, 
            emailId, 
            stationInfoId, 
            createdDateTime, 
            lastUpdatedDateTime, 
            status 
        FROM station
    `;

    stationDb.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching station data:', err);
            return res.status(500).send('Error loading dashboard data');
        }

        // Pass station data to dashboard view
        res.render('dashboard', { username, stationData: results });
    });
});

// Logout Route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error during logout');
        }
        res.redirect('/');
    });
});

// Start the server after initializing databases
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
 

