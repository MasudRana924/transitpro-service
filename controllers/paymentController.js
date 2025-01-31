// controllers/paymentController.js
const axios = require('axios');
const Payment = require('../models/Payment');

const BKASH_APP_KEY = '0vWQuCRGiUX7EPVjQDr0EUAYtc';
const BKASH_APP_SECRET = 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx';
const BKASH_USERNAME = '01770618567';
const BKASH_PASSWORD = 'D7DaC<*E*eG';

let accessToken = '';

// Function to grant token
const grantToken = async () => {
    try {
        const response = await axios.post('https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant', {
            app_key: BKASH_APP_KEY,
            app_secret: BKASH_APP_SECRET
        }, {
            headers: {
                username: BKASH_USERNAME,
                password: BKASH_PASSWORD
            }
        });

        accessToken = response.data.id_token; // Store the token
        return accessToken;
    } catch (error) {
        throw new Error('Failed to grant token: ' + error.message);
    }
};

// Create Payment
const createPayment = async (req, res) => {
    try {
        const { amount, callbackURL, merchantInvoiceNumber } = req.body;
        console.log("request body", req.body)
        if (!accessToken) {
            await grantToken();
        }
        const response = await axios.post('https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create', {
            mode: '0011',
            payerReference: '01619777283',
            callbackURL: callbackURL,
            merchantAssociationInfo: 'MI05MID54RF09123456One',
            amount: amount,
            currency: 'BDT',
            intent: 'sale',
            merchantInvoiceNumber: merchantInvoiceNumber
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-App-Key': BKASH_APP_KEY
            }
        });
        const payment = new Payment({
            paymentID: response.data.paymentID,
            amount: amount,
            status: 'created'
        });
        await payment.save();
        res.json(response.data);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            try {

                await grantToken();
                const retryResponse = await axios.post('https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create', {
                    mode: '0011',
                    payerReference: '01619777283',
                    callbackURL: callbackURL,
                    merchantAssociationInfo: 'MI05MID54RF09123456One',
                    amount: amount,
                    currency: 'BDT',
                    intent: 'sale',
                    merchantInvoiceNumber: merchantInvoiceNumber
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                        'X-App-Key': BKASH_APP_KEY
                    }
                });


                // Save payment details
                const payment = new Payment({
                    paymentID: response.data.paymentID,
                    amount: amount,
                    status: 'created'
                });
                await payment.save();

                console.log("Bkash Payment Response:", response.data); // Debugging log

                // Send full response including bkashURL
                res.json(response.data);
            } catch (retryError) {
                res.status(500).json({ error: 'Failed to create payment after retry: ' + retryError.message });
            }
        } else {
            res.status(500).json({ error: 'Failed to create payment: ' + error.message });
        }
    }
};

const executePayment = async (req, res) => {
    try {
        const { paymentID } = req.body;

        const response = await axios.post('https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute', {
            paymentID: paymentID
        }, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-App-Key': BKASH_APP_KEY
            }
        });

        // Update payment status in the database
        await Payment.findOneAndUpdate({ paymentID: paymentID }, { status: 'executed' });

        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    grantToken,
    createPayment,
    executePayment
};