/**
 * RSA MVP Enhanced — Candidates Page
 * ====================================
 * View and manage all candidates in the system.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    TextField, Chip, Avatar, IconButton, InputAdornment,
    LinearProgress, Tooltip
} from '@mui/material';
import {
    Search as SearchIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    school as SchoolIcon,
    Visibility as ViewIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { resumeApi } from '../services/api';

function CandidateCard({ candidate, index, navigate }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
        >
            <Card
                sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                    },
                }}
                onClick={() => navigate(`/candidate/${candidate.id}`)}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
                        <Avatar
                            sx={{
                                width: 56, height: 56,
                                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                fontSize: '1.25rem', fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                            }}
                        >
                            {candidate.name ? candidate.name[0].toUpperCase() : '?'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {candidate.name || 'Unknown Candidate'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', mb: 0.5 }}>
                                <EmailIcon sx={{ fontSize: 14 }} />
                                <Typography variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {candidate.email || 'No email'}
                                </Typography>
                            </Box>
                            {candidate.experience_years > 0 && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                                    <WorkIcon sx={{ fontSize: 14 }} />
                                    <Typography variant="caption">
                                        {candidate.experience_years} years exp.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ mb: 2, height: 48, overflow: 'hidden' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Top Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(candidate.skills || []).slice(0, 5).map((skill, i) => (
                                <Chip
                                    key={i}
                                    label={skill}
                                    size="small"
                                    sx={{
                                        fontSize: '0.65rem',
                                        height: 20,
                                        background: 'rgba(99,102,241,0.06)',
                                        color: '#6366f1',
                                        border: '1px solid rgba(99,102,241,0.1)',
                                    }}
                                />
                            ))}
                            {(candidate.skills || []).length > 5 && (
                                <Chip label={`+${candidate.skills.length - 5}`} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                            )}
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <Chip
                            label={candidate.status}
                            size="small"
                            className={`status-badge ${candidate.status}`}
                            sx={{ fontSize: '0.65rem', height: 22 }}
                        />
                        <Button
                            size="small"
                            endIcon={<ViewIcon sx={{ fontSize: 16 }} />}
                            sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                        >
                            View Profile
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CandidatesPage() {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchCandidates();
    }, [page]);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const response = await resumeApi.list(page, 20);
            setCandidates(response.data.candidates || []);
            setTotalPages(Math.ceil((response.data.total || 0) / 20));
        } catch (err) {
            console.error('Failed to fetch candidates:', err);
            // Fallback demo data if API fails or is empty
            if (candidates.length === 0) {
                setCandidates([
                    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', experience_years: 5, skills: ['Python', 'Django', 'React'], status: 'compressed' },
                    { id: '2', name: 'Bob Smith', email: 'bob@example.com', experience_years: 3, skills: ['Java', 'Spring', 'SQL'], status: 'compressed' },
                    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', experience_years: 7, skills: ['JavaScript', 'Node.js', 'AWS'], status: 'processing' },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.skills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 800,
                                mb: 1,
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Candidate Database
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            View and manage all candidates in the system
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        onClick={fetchCandidates}
                        startIcon={<RefreshIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        Refresh
                    </Button>
                </Box>
            </motion.div>

            {/* Search & Filter */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card sx={{ mb: 4, borderRadius: 3 }}>
                    <CardContent sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, email, or skills..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2 }
                            }}
                            variant="outlined"
                            size="small"
                        />
                    </CardContent>
                </Card>
            </motion.div>

            {/* Content */}
            {loading ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <LinearProgress sx={{ maxWidth: 300, mx: 'auto', mb: 2, borderRadius: 1 }} />
                    <Typography color="text.secondary">Loading candidates...</Typography>
                </Box>
            ) : filteredCandidates.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <PersonIcon sx={{ fontSize: 64, color: '#64748b', opacity: 0.3, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">No candidates found</Typography>
                    <Typography variant="body2" color="text.secondary">Try adjusting your search or upload new resumes.</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {filteredCandidates.map((candidate, index) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={candidate.id || index}>
                                <CandidateCard candidate={candidate} index={index} navigate={navigate} />
                            </Grid>
                        ))}
                    </AnimatePresence>
                </Grid>
            )}

            {/* Simple Pagination (if needed) */}
            {candidates.length > 0 && !loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 1 }}>
                    <Button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        variant="outlined"
                        size="small"
                    >
                        Previous
                    </Button>
                    <Typography variant="caption" sx={{ alignSelf: 'center', px: 2, color: 'text.secondary' }}>
                        Page {page}
                    </Typography>
                    <Button
                        disabled={candidates.length < 20} // Simple check
                        onClick={() => setPage(p => p + 1)}
                        variant="outlined"
                        size="small"
                    >
                        Next
                    </Button>
                </Box>
            )}
        </Box>
    );
}

export default CandidatesPage;
