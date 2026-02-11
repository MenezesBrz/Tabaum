const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const PORT = 3000;
const SECRET_KEY = 'tabaum-premium-secret-key-change-in-prod';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.' }
});

app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

// Database Setup
let db;
(async () => {
    db = await open({
        filename: 'database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            subject TEXT,
            message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log('Database initialized');
})();

// Routes

// 1. Register
app.post('/api/register', [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('A senha deve ter pelo menos 8 caracteres.'),
    body('name').trim().notEmpty().withMessage('O nome é obrigatório.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, name } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
        const result = await db.run(
            'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
            [email, hashedPassword, name]
        );

        const token = jwt.sign({ id: result.lastID, email }, SECRET_KEY, { expiresIn: '7d' });

        res.status(201).json({ message: 'Usuário criado com sucesso!', token, user: { name, email } });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// 2. Login
app.post('/api/login', [
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('password').notEmpty().withMessage('A senha é obrigatória.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

        // Generic error message to prevent account enumeration
        if (!user) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }

        // Update last login (optional improvement)
        await db.run('UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });

        res.json({ message: 'Login realizado com sucesso!', token, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
});

// 3. Me (Verify Token)
app.get('/api/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Não autenticado' });

    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });

        const user = await db.get('SELECT name, email FROM users WHERE id = ?', [decoded.id]);
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        res.json({ user });
    });
});

// 4. Contact Form
app.post('/api/contact', [
    body('name').trim().notEmpty().withMessage('O nome é obrigatório.'),
    body('email').isEmail().withMessage('E-mail inválido.').normalizeEmail(),
    body('subject').trim().notEmpty().withMessage('O assunto é obrigatório.'),
    body('message').trim().notEmpty().withMessage('A mensagem é obrigatória.')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, subject, message } = req.body;

    try {
        await db.run(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );
        res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao enviar mensagem.' });
    }
});

// 5. Products (Search & Filter)
app.get('/api/products', async (req, res) => {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    try {
        // First check if table exists (dynamic creation if needed for demo)
        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                description TEXT,
                price REAL,
                category TEXT,
                image TEXT
            )
        `);

        const products = await db.all(query, params);
        res.json({ products });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar produtos.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
