// frontend/src/pages/Investments.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
    Box, Typography, Card, CardContent, Grid,
    TextField, Button, Alert, Snackbar, Paper
} from '@mui/material';

const Investments = () => {
    const { API_URL } = useAuth();
    const [goldData, setGoldData] = useState(null);
    const [investAmount, setInvestAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        fetchGoldData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchGoldData = async () => {
        try {
            const response = await axios.get(`${API_URL}/investments/digital-gold`);
            setGoldData(response.data);
        } catch (error) {
            console.error('Failed to fetch gold data:', error);
        }
    };

    const handleInvest = async () => {
        if (!investAmount || isNaN(investAmount) || parseFloat(investAmount) <= 0) {
            showMessage('Please enter a valid amount', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/investments/digital-gold/buy`, {
                amount: parseFloat(investAmount)
            });

            if (response.data.status === 'pending_approval') {
                // This is where the "Conscious Pause" would trigger
                // For now, we'll simulate approval
                await axios.post(`${API_URL}/transactions/${response.data.transaction_id}/approve`);

                showMessage('Investment successful! Gold purchased.', 'success');
                setInvestAmount('');
                fetchGoldData(); // Refresh data
            }
        } catch (error) {
            showMessage(error.response?.data?.detail || 'Investment failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, type) => {
        // Ensure msg is always a string
        let messageText = msg;

        if (typeof msg === 'object' && msg !== null) {
            // If it's an object, try to extract a meaningful message
            if (msg.detail) {
                messageText = msg.detail;
            } else if (msg.message) {
                messageText = msg.message;
            } else {
                messageText = JSON.stringify(msg);
            }
        } else if (typeof msg !== 'string') {
            messageText = String(msg);
        }

        setMessage(messageText);
        setMessageType(type);
        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    // Current gold price (simulated)
    const currentGoldPrice = 5000; // ₹5000 per gram

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Digital Gold Investments
            </Typography>

            {/* Gold Price Info */}
            <Card sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Current Gold Price
                    </Typography>
                    <Typography variant="h4" color="primary">
                        ₹{currentGoldPrice.toLocaleString()} per gram
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Last updated: {new Date().toLocaleDateString()}
                    </Typography>
                </CardContent>
            </Card>

            <Grid container spacing={4}>
                {/* Current Holdings */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Your Gold Holdings
                            </Typography>

                            {goldData && (
                                <>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography color="textSecondary">Total Gold</Typography>
                                        <Typography variant="h4">
                                            {goldData.grams.toFixed(4)}g
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                        <Typography color="textSecondary">Current Value</Typography>
                                        <Typography variant="h5" color="success.main">
                                            ₹{goldData.current_value.toLocaleString()}
                                        </Typography>
                                    </Box>

                                    <Typography variant="body2" color="textSecondary">
                                        Last updated: {new Date(goldData.last_updated).toLocaleString()}
                                    </Typography>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Buy Gold Form */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Buy Digital Gold
                            </Typography>

                            <TextField
                                fullWidth
                                label="Amount (₹)"
                                type="number"
                                value={investAmount}
                                onChange={(e) => setInvestAmount(e.target.value)}
                                sx={{ mb: 3 }}
                                helperText={`Approx. ${(investAmount / currentGoldPrice || 0).toFixed(4)}g`}
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={handleInvest}
                                disabled={loading || !investAmount}
                            >
                                {loading ? 'Processing...' : 'Buy Gold'}
                            </Button>

                            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                Note: Transactions require approval via "Conscious Pause" verification
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Investment Guidelines */}
            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    About Digital Gold
                </Typography>
                <Typography paragraph>
                    • Buy 24K pure digital gold starting from ₹100
                </Typography>
                <Typography paragraph>
                    • Gold is stored securely in insured vaults
                </Typography>
                <Typography paragraph>
                    • Sell anytime at market price
                </Typography>
                <Typography paragraph>
                    • No storage charges
                </Typography>
            </Paper>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={messageType}
                    sx={{ width: '100%' }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Investments;