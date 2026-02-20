/**
 * RSA MVP Enhanced — Root Application Component
 * ================================================
 * Main layout with sidebar navigation, page routing,
 * and authentication state management.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Drawer, AppBar, Toolbar, Typography, IconButton,
    List, ListItem, ListItemIcon, ListItemText, useMediaQuery,
    Divider, Avatar, Chip, Tooltip,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    CloudUpload as UploadIcon,
    Work as JobIcon,
    CompareArrows as MatchIcon,
    Assessment as ReportIcon,
    AutoAwesome as AIIcon,
    Logout as LogoutIcon,
    Shield as ShieldIcon,
    People as PeopleIcon,
} from '@mui/icons-material';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import JobsPage from './pages/JobsPage';
import MatchingPage from './pages/MatchingPage';
import ResultsPage from './pages/ResultsPage';
import GdprPage from './pages/GdprPage';
import CandidateDetailPage from './pages/CandidateDetailPage';
import JobAnalyticsPage from './pages/JobAnalyticsPage';
import CandidatesPage from './pages/CandidatesPage';

const DRAWER_WIDTH = 260;

const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/upload', label: 'Upload Resumes', icon: <UploadIcon /> },
    { path: '/jobs', label: 'Job Descriptions', icon: <JobIcon /> },
    { path: '/candidates', label: 'Candidates', icon: <PeopleIcon /> },
    { path: '/matching', label: 'Run Matching', icon: <MatchIcon /> },
    { path: '/results', label: 'Results & Reports', icon: <ReportIcon /> },
    { path: '/gdpr', label: 'GDPR Compliance', icon: <ShieldIcon /> },
];

function AnimatedRoutes() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><DashboardPage /></PageWrapper>} />
                <Route path="/upload" element={<PageWrapper><UploadPage /></PageWrapper>} />
                <Route path="/jobs" element={<PageWrapper><JobsPage /></PageWrapper>} />
                <Route path="/candidates" element={<PageWrapper><CandidatesPage /></PageWrapper>} />
                <Route path="/matching" element={<PageWrapper><MatchingPage /></PageWrapper>} />
                <Route path="/results" element={<PageWrapper><ResultsPage /></PageWrapper>} />
                <Route path="/gdpr" element={<PageWrapper><GdprPage /></PageWrapper>} />
                <Route path="/candidate/:candidateId" element={<PageWrapper><CandidateDetailPage /></PageWrapper>} />
                <Route path="/job/:jobId/analytics" element={<PageWrapper><JobAnalyticsPage /></PageWrapper>} />
            </Routes>
        </AnimatePresence>
    );
}

function PageWrapper({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
            {children}
        </motion.div>
    );
}

function getRoleBadge(role) {
    const styles = {
        admin: { label: '👑 Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        recruiter: { label: '🎯 Recruiter', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
        hiring_manager: { label: '📊 Manager', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
        viewer: { label: '👁️ Viewer', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    };
    return styles[role] || styles.viewer;
}

function App() {
    const [user, setUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isMobile = useMediaQuery('(max-width:768px)');

    // Check for existing session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('rsa_token');
        const savedUser = localStorage.getItem('rsa_user');
        if (savedToken && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('rsa_token');
                localStorage.removeItem('rsa_user');
            }
        }
    }, []);

    const handleLogin = (userData, authToken) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('rsa_token');
        localStorage.removeItem('rsa_user');
    };

    // Show login page if not authenticated
    if (!user) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const roleBadge = getRoleBadge(user.role);

    const drawerContent = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Logo */}
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{
                    width: 44, height: 44,
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    fontSize: '1.2rem', fontWeight: 800,
                }}>
                    <AIIcon />
                </Avatar>
                <Box>
                    <Typography variant="h6" sx={{
                        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        lineHeight: 1.2,
                    }}>
                        RSA
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        Screening Agent
                    </Typography>
                </Box>
                <Chip label="MVP" size="small" sx={{
                    ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 700,
                    background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.3)',
                }} />
            </Box>

            <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)' }} />

            {/* Navigation */}
            <List sx={{ px: 1.5, py: 2, flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}
                        onClick={() => isMobile && setMobileOpen(false)}>
                        {({ isActive }) => (
                            <ListItem sx={{
                                borderRadius: 2, mb: 0.5, px: 2, py: 1.2,
                                transition: 'all 200ms ease',
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))'
                                    : 'transparent',
                                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                '&:hover': {
                                    background: isActive
                                        ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(6,182,212,0.07))'
                                        : 'rgba(99,102,241,0.04)',
                                },
                            }}>
                                <ListItemIcon sx={{
                                    color: isActive ? '#6366f1' : '#94a3b8',
                                    minWidth: 40, transition: 'color 200ms ease',
                                }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isActive ? '#1e293b' : '#64748b',
                                    }} />
                            </ListItem>
                        )}
                    </NavLink>
                ))}
            </List>

            {/* User Profile Section */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{
                        width: 36, height: 36,
                        background: roleBadge.bg, color: roleBadge.color,
                        fontWeight: 700, fontSize: '0.85rem',
                    }}>
                        {user.name?.[0] || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 600, fontSize: '0.8rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {user.name}
                        </Typography>
                        <Chip label={roleBadge.label} size="small" sx={{
                            height: 18, fontSize: '0.6rem', fontWeight: 600,
                            background: roleBadge.bg, color: roleBadge.color,
                        }} />
                    </Box>
                    <Tooltip title="Logout">
                        <IconButton size="small" onClick={handleLogout} sx={{ color: '#ef4444' }}>
                            <LogoutIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>
                {user.company_name && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        🏢 {user.company_name}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    return (
        <Router>
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                {/* Sidebar */}
                {isMobile ? (
                    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                        sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
                        {drawerContent}
                    </Drawer>
                ) : (
                    <Drawer variant="permanent" sx={{
                        width: DRAWER_WIDTH, flexShrink: 0,
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
                    }}>
                        {drawerContent}
                    </Drawer>
                )}

                {/* Main Content */}
                <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Top Bar */}
                    <AppBar position="sticky" sx={{ zIndex: 1 }}>
                        <Toolbar>
                            {isMobile && (
                                <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                                    <MenuIcon />
                                </IconButton>
                            )}
                            <Typography variant="h6" sx={{
                                fontFamily: "'Outfit', sans-serif", fontWeight: 600, flex: 1,
                            }}>
                                Recruitment Screening Agent
                            </Typography>
                            <Chip
                                icon={<AIIcon sx={{ fontSize: 16 }} />}
                                label="AI Powered"
                                size="small"
                                sx={{
                                    background: 'rgba(16,185,129,0.1)', color: '#059669',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    fontWeight: 600, fontSize: '0.7rem',
                                }}
                            />
                        </Toolbar>
                    </AppBar>

                    {/* Page Content */}
                    <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: 'auto' }}>
                        <AnimatedRoutes />
                    </Box>
                </Box>
            </Box>
        </Router>
    );
}

export default App;
