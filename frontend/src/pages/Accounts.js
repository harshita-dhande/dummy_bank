// frontend/src/pages/Accounts.js
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Grid,
    Button,
    CircularProgress
} from '@mui/material';
import axios from 'axios';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Accounts
            </Typography>
            <Grid container spacing={3}>
                {accounts.map((account) => (
                    <Grid item xs={12} md={6} key={account.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {account.account_type}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Account Number: {account.account_number}
                                </Typography>
                                <Typography variant="h5" sx={{ mt: 2 }}>
                                    ${account.balance.toFixed(2)}
                                </Typography>
                                <Button variant="outlined" sx={{ mt: 2 }}>
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default Accounts;
