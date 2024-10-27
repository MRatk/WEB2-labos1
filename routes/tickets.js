const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const express = require('express');
const pool = require('../db');
const {response} = require("express");
const path= require('path');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const router = express.Router();


async function getKey() {
    const response = await fetch('https://dev-1toh3papmv4d6yrs.us.auth0.com/.well-known/jwks.json');
    const { keys } = await response.json();
    return keys[0].x5c[0]; 
}

async function ckeckToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
        return res.status(401).send('No token provided');
    }

    const publicKey = await getKey(); 

    const pem = `-----BEGIN CERTIFICATE-----\n${publicKey}\n-----END CERTIFICATE-----`;

    jwt.verify(token, pem, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
            return res.status(401).send('M2M not authenticated');
        }
        req.user = decoded; 
        next(); 
    });
}

router.post('/', ckeckToken, async (req, res) => {
        const { vatin, firstname, lastname } = req.body;

        if (!vatin || !firstname || !lastname) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const { rows } = await pool.query('SELECT COUNT(*) FROM tickets WHERE vatin = $1', [vatin]);
        if (parseInt(rows[0].count) >= 3) {
            return res.status(400).json({ error: 'Max number of tickets for this OIB is 3. !' });
        }

        const ticketId = uuidv4();
        const createdAt = new Date();
        await pool.query('INSERT INTO tickets (id, vatin, firstname, lastname, created_at) VALUES ($1, $2, $3, $4, $5)',
            [ticketId, vatin, firstname, lastname, createdAt]);

        const qrCodeUrl = `${process.env.RENDER_EXTERNAL_URL}/tickets/qrCode/${ticketId}`;
        const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

        res.json({ qrCode: qrCodeImage, ticketId:ticketId });
});

router.get('/userProfile', (req, res) => {
    if(req.oidc.isAuthenticated()){
        res.json(req.oidc.user);
    }else{
        res.status(401).json({error: 'Unauthorized'});
    }
});

router.get('/validTicket/:id', async (req, res) => {
    const ticketId = req.params.id;
    try{
        //console.log(ticketId)
        const response  = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
        //console.log(response);
        if(response.rows.length > 0){
            res.json({ticketFound: true});
        }else{
            res.json({ticketFound: false});
        }
    }catch (error){
        res.status(400).json({error: 'Server error'})

    }

});

router.get('/qrCode/:id', async (req, res)=>{
    const ticketId = req.params.id;

    if (!req.oidc.isAuthenticated()) {
        return res.redirect(`/loginQR/${ticketId}`);
    }
    res.redirect(`/ticketInformation.html?ticketID=${ticketId}`);
});

router.get('/:id', async (req, res) => {
    const ticketId = req.params.id;

    if (!req.oidc.isAuthenticated()) {
        return res.redirect('/login');
    }
    const { rows } = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (rows.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = rows[0];
    res.json({
        vatin: ticket.vatin,
        firstname: ticket.firstname,
        lastname: ticket.lastname,
        created_at: ticket.created_at
    });

});

module.exports = router;
