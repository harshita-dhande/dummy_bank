// frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Card, CardContent, Typography, Grid, Box,
    Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Alert
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const Dashboard = () => {
    const { user, API_URL } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get(`${API_URL}/dashboard`);
            setDashboardData(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load dashboard data');
            setLoading(false);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Welcome, {user?.name}!
            </Typography>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="textSecondary" gutterBottom>
                                Total Balance
                            </Typography>
                            <Typography variant="h5">
                                ₹{dashboardData?.total_balance?.toLocaleString() || '0.00'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <AccountBalanceIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="textSecondary" gutterBottom>
                                Accounts
                            </Typography>
                            <Typography variant="h5">
                                {dashboardData?.accounts?.length || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <TrendingUpIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                            <Typography color="textSecondary" gutterBottom>
                                Digital Gold
                            </Typography>
                            <Typography variant="h5">
                                {dashboardData?.digital_gold?.grams?.toFixed(4) || '0.0000'}g
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item>
                    <Button
                        variant="contained"
                        color="primary"
                        component={Link}
                        to="/transfer"
                    >
                        Transfer Money
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="outlined"
                        color="primary"
                        component={Link}
                        to="/investments"
                    >
                        Invest in Gold
                    </Button>
                </Grid>
                <Grid item>
                    <Button
                        variant="outlined"
                        component={Link}
                        to="/accounts"
                    >
                        View Accounts
                    </Button>
                </Grid>
            </Grid>

            {/* Recent Transactions */}
            <Typography variant="h6" gutterBottom>
                Recent Transactions
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dashboardData?.recent_transactions?.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                    {new Date(tx.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{tx.transaction_type}</TableCell>
                                <TableCell>{tx.description}</TableCell>
                                <TableCell align="right" sx={{
                                    color: tx.transaction_type.includes('deposit') ? 'green' : 'red'
                                }}>
                                    ₹{tx.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: tx.status === 'completed' ? 'green' :
                                                tx.status === 'pending' ? 'orange' : 'red',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {tx.status.toUpperCase()}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default Dashboard;