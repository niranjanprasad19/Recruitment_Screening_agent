/**
 * RSA MVP Enhanced — Login Page
 * ================================
 * Beautiful login/register page with role-based auth.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, TextField, Button,
    Select, MenuItem, FormControl, InputLabel, Alert,
    Avatar, Chip, Tabs, Tab, InputAdornment, IconButton,
} from '@mui/material';
import {
    AutoAwesome as AIIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    Business as CompanyIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
    Login as LoginIcon,
    PersonAdd as RegisterIcon,
} from '@mui/icons-material';

function LoginPage({ onLogin }) {
    const [tab, setTab] = useState(0); // 0=login, 1=register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('recruiter');
    const [companyName, setCompanyName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const API_BASE = process.env.REACT_APP_API_URL || '';
            const endpoint = tab === 0 ? 'login' : 'register';
            const body = tab === 0
                ? { email, password }
                : { email, password, name, role, company_name: companyName };

            const response = await fetch(`${API_BASE}/api/v1/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                const detail = data.detail;
                if (typeof detail === 'string') throw new Error(detail);
                if (Array.isArray(detail)) throw new Error(detail.map(d => d.msg || JSON.stringify(d)).join('; '));
                throw new Error('Authentication failed');
            }

            // Store token and user info
            localStorage.setItem('rsa_token', data.access_token);
            localStorage.setItem('rsa_user', JSON.stringify(data.user));
            onLogin(data.user, data.access_token);

        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { value: 'admin', label: 'Admin', desc: 'Full access to all features', icon: '👑' },
        { value: 'recruiter', label: 'Recruiter', desc: 'Upload, match, and manage candidates', icon: '🎯' },
        { value: 'hiring_manager', label: 'Hiring Manager', desc: 'View results and rankings', icon: '📊' },
        { value: 'viewer', label: 'Viewer', desc: 'Read-only access to results', icon: '👁️' },
    ];

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f4f8 50%, #fdf2f8 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated background elements */}
            <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: [0.02, 0.06, 0.02],
                            x: [0, 50 * (i % 2 === 0 ? 1 : -1), 0],
                            y: [0, 30 * (i % 3 === 0 ? 1 : -1), 0],
                        }}
                        transition={{ repeat: Infinity, duration: 8 + i * 2, ease: 'easeInOut' }}
                        style={{
                            position: 'absolute',
                            width: 400 + i * 80,
                            height: 400 + i * 80,
                            borderRadius: '50%',
                            background: i % 2 === 0
                                ? 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)'
                                : 'radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)',
                            top: `${10 + i * 15}%`,
                            left: `${-10 + i * 20}%`,
                        }}
                    />
                ))}
            </Box>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                style={{ width: '100%', maxWidth: 460, padding: '0 16px', zIndex: 1 }}
            >
                {/* Logo */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                        <Avatar sx={{
                            width: 72, height: 72, mx: 'auto', mb: 2,
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            fontSize: '2rem', boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
                        }}>
                            <AIIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                    </motion.div>
                    <Typography variant="h4" sx={{
                        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        RSA
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        AI-Powered Recruitment Screening Agent
                    </Typography>
                </Box>

                <Card sx={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 20px 60px rgba(99,102,241,0.12)',
                }}>
                    <CardContent sx={{ p: 4 }}>
                        <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }}
                            variant="fullWidth"
                            sx={{
                                mb: 3,
                                '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #6366f1, #06b6d4)', height: 3, borderRadius: 2 },
                                '& .MuiTab-root': { fontWeight: 600, fontSize: '0.9rem', textTransform: 'none' },
                            }}
                        >
                            <Tab icon={<LoginIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Login" />
                            <Tab icon={<RegisterIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Register" />
                        </Tabs>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSubmit}>
                            <AnimatePresence mode="wait">
                                <motion.div key={tab} initial={{ opacity: 0, x: tab === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>

                                    {tab === 1 && (
                                        <TextField
                                            fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                                            sx={{ mb: 2 }} required
                                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#64748b', fontSize: 20 }} /></InputAdornment> }}
                                        />
                                    )}

                                    <TextField
                                        fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        sx={{ mb: 2 }} required
                                        InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#64748b', fontSize: 20 }} /></InputAdornment> }}
                                    />

                                    <TextField
                                        fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password}
                                        onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} required
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#64748b', fontSize: 20 }} /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ color: '#64748b' }}>
                                                        {showPassword ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {tab === 1 && (
                                        <>
                                            <FormControl fullWidth sx={{ mb: 2 }}>
                                                <InputLabel>Role</InputLabel>
                                                <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                                                    {roles.map(r => (
                                                        <MenuItem key={r.value} value={r.value}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <span>{r.icon}</span>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.label}</Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{r.desc}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>

                                            <TextField
                                                fullWidth label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                                                sx={{ mb: 2 }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><CompanyIcon sx={{ color: '#64748b', fontSize: 20 }} /></InputAdornment> }}
                                            />
                                        </>
                                    )}

                                    <Button
                                        type="submit" variant="contained" fullWidth size="large"
                                        disabled={loading || !email || !password || (tab === 1 && !name)}
                                        sx={{ py: 1.5, mt: 1, fontSize: '1rem' }}
                                    >
                                        {loading ? 'Please wait...' : tab === 0 ? 'Sign In' : 'Create Account'}
                                    </Button>
                                </motion.div>
                            </AnimatePresence>
                        </form>

                        {/* Quick demo login */}
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                Quick demo login:
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Admin', role: 'admin', color: '#f59e0b' },
                                    { label: 'Recruiter', role: 'recruiter', color: '#6366f1' },
                                    { label: 'Manager', role: 'hiring_manager', color: '#10b981' },
                                ].map(demo => (
                                    <Chip
                                        key={demo.role}
                                        label={demo.label}
                                        size="small"
                                        onClick={async () => {
                                            setLoading(true);
                                            setError('');
                                            try {
                                                const API_BASE = process.env.REACT_APP_API_URL || '';
                                                // Register if not exists, then login
                                                const demoEmail = `${demo.role}@demo.com`;
                                                await fetch(`${API_BASE}/api/v1/auth/register`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        email: demoEmail, password: 'demo123', name: `Demo ${demo.label}`,
                                                        role: demo.role, company_name: 'Demo Corp',
                                                    }),
                                                }).catch(() => { });
                                                const r = await fetch(`${API_BASE}/api/v1/auth/login`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: demoEmail, password: 'demo123' }),
                                                });
                                                const data = await r.json();
                                                if (r.ok) {
                                                    localStorage.setItem('rsa_token', data.access_token);
                                                    localStorage.setItem('rsa_user', JSON.stringify(data.user));
                                                    onLogin(data.user, data.access_token);
                                                }
                                            } catch (err) {
                                                setError('Demo login failed');
                                            }
                                            setLoading(false);
                                        }}
                                        sx={{
                                            cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem',
                                            background: `${demo.color}15`, color: demo.color,
                                            border: `1px solid ${demo.color}30`,
                                            '&:hover': { background: `${demo.color}25` },
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2, opacity: 0.5 }}>
                    RSA MVP Enhanced v1.0 — AI-Powered Recruitment
                </Typography>
            </motion.div>
        </Box>
    );
}

export default LoginPage;
