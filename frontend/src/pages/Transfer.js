// frontend/src/pages/Transfer.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
    Box, Typography, Card, CardContent,
    TextField, Button, Alert, Snackbar,
    MenuItem, Select, FormControl, InputLabel
} from '@mui/material';

const Transfer = () => {
    const { API_URL } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');
    const [openSnackbar, setOpenSnackbar] = useState(false);

    useEffect(() => {
        fetchAccounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await axios.get(`${API_URL}/accounts`);
            setAccounts(response.data);
            if (response.data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    fromAccount: response.data[0].id.toString()
                }));
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleTransfer = async () => {
        // Validation
        if (!formData.fromAccount || !formData.toAccount || !formData.amount) {
            showMessage('Please fill all required fields', 'error');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            showMessage('Amount must be positive', 'error');
            return;
        }

        // Get auth token
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('Please log in to perform transfers', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/transactions/transfer`, {
                to_account: formData.toAccount,
                amount: amount,
                description: formData.description || `Transfer to ${formData.toAccount}`
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            showMessage('Transfer successful!', 'success');

            // Reset form
            setFormData(prev => ({
                ...prev,
                toAccount: '',
                amount: '',
                description: ''
            }));

            // Refresh accounts to get updated balance
            fetchAccounts();
        } catch (error) {
            // Handle different error response formats
            let errorMessage = 'Transfer failed';

            if (error.response?.data) {
                // Check if it's a validation error with detail array
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map(err => err.msg).join(', ');
                } else if (typeof error.response.data.detail === 'string') {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            showMessage(errorMessage, 'error');
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

    const selectedAccount = accounts.find(acc =>
        acc.id.toString() === formData.fromAccount
    );

    return (
        <Box sx={{ p: 3, maxWidth: 600, margin: '0 auto' }}>
            <Typography variant="h4" gutterBottom>
                Transfer Money
            </Typography>

            <Card>
                <CardContent>
                    {/* From Account */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>From Account</InputLabel>
                        <Select
                            name="fromAccount"
                            value={formData.fromAccount}
                            onChange={handleChange}
                            label="From Account"
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={account.id.toString()}>
                                    {account.account_number} ({account.account_type}) -
                                    Balance: ₹{account.balance.toLocaleString()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* To Account */}
                    <TextField
                        fullWidth
                        label="To Account Number"
                        name="toAccount"
                        value={formData.toAccount}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                        required
                    />

                    {/* Amount */}
                    <TextField
                        fullWidth
                        label="Amount (₹)"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                        required
                    />

                    {/* Description */}
                    <TextField
                        fullWidth
                        label="Description (Optional)"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                    />

                    {/* Balance Info */}
                    {selectedAccount && selectedAccount.balance !== undefined && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Available Balance: ₹{typeof selectedAccount.balance === 'number' ? selectedAccount.balance.toLocaleString() : '0.00'}
                        </Alert>
                    )}

                    {/* Transfer Button */}
                    <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        size="large"
                        onClick={handleTransfer}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Transfer Now'}
                    </Button>

                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                        Note: Large transfers may require additional verification
                    </Typography>
                </CardContent>
            </Card>

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

export default Transfer;