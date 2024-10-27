const express = require('express');
const { auth } = require('express-openid-connect');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const ticketsRouter = require('./routes/tickets');
const path = require('path')
const pool = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000',
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
};

app.use(auth(config));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'scripts')));

app.use('/tickets', ticketsRouter);
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});
app.get('/login', (req, res) => {
    res.oidc.login();
});
app.get('/loginQR/:id', (req, res)=>{
    const ticketId = req.params.id;
    const redirectUrl = `${process.env.RENDER_EXTERNAL_URL}/tickets/qrCode/${ticketId}`;
    res.oidc.login({returnTo: redirectUrl});
})
app.get('/logout', (req, res) => {
    const logoutUrl = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.CLIENT_ID}&returnTo=${encodeURIComponent(config.baseURL)}`;
})
app.get('/api/users', (req, res) =>{
    if(req.oidc.isAuthenticated()){
        return res.json({logged: true})
    }else{
        return res.json({logged: false})
    }
});

app.get('/count', async (req, res) => {
    try{
        const result = await pool.query('SELECT COUNT(id) FROM tickets');
        const count = result.rows[0].count;
        res.json({
            count: count
        });
    } catch (error){
        res.status(500);
    }
});
app.get('/favicon.ico', (req, res) => res.status(204).end());

// app.get('/scripts/home_script.js', (req, res) => {
//     console.log('Request for home_script.js received');
//     res.sendFile(path.join(__dirname, 'scripts', 'home_script.js'));
// });

app.get('/:id', async (req, res) => {
    const ticketId = req.params.id;

    if (!req.oidc.isAuthenticated()) {
        return res.redirect(`/loginQR/${ticketId}`);
    }
    const { rows } = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    res.redirect(`/ticketInformation.html?ticketID=${ticketId}`);


});


try {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
} catch (error) {
    console.error('Error starting server:', error);
}
