const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'dashnexus-secret',
    resave: false,
    saveUninitialized: false
}));

const users = [];

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }
    next();
}

app.get('/', (req, res) => {
    res.render('index', { user: req.session.user });
});

app.get('/pricing', (req, res) => {
    res.render('pricing', { user: req.session.user });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    const { username, password, type } = req.body;
    if (users.find(u => u.username === username)) {
        return res.render('signup', { error: 'User already exists' });
    }
    const role = type === 'enterprise' ? 'enterprise' : type === 'company' ? 'company' : 'individual';
    const user = { username, password, role };
    users.push(user);
    req.session.user = user;
    res.redirect('/dashboard');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.user = user;
    res.redirect('/dashboard');
});

app.get('/dashboard', requireLogin, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

app.get('/admin', requireAdmin, (req, res) => {
    res.render('admin', { users });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`DashNexus running on port ${PORT}`);
});
