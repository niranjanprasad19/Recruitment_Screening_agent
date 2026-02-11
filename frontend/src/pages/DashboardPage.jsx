/**
 * RSA MVP Enhanced — Dashboard Page (Redesigned)
 * =================================================
 * Shows: Active Jobs, Candidate Count, Leaderboard, Rankings
 * No analytics charts — this is a recruitment command center.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Chip,
    Avatar, LinearProgress, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
    Work as JobIcon,
    People as PeopleIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendIcon,
    CheckCircle as CheckIcon,
    Schedule as PendingIcon,
    Error as ErrorIcon,
    Star as StarIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';

// Animated counter component
function AnimatedCounter({ value, duration = 1.5 }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let start = 0;
        const end = Number(value) || 0;
        if (end === 0) { setDisplay(0); return; }
        const step = end / (duration * 60);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setDisplay(end); clearInterval(timer); }
            else setDisplay(Math.floor(start));
        }, 1000 / 60);
        return () => clearInterval(timer);
    }, [value, duration]);
    return <>{display}</>;
}

function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await dashboardApi.getMetrics(30);
            setData(res.data);
        } catch (err) {
            // Demo data when backend has no data yet
            setData({
                active_jobs: [
                    { id: '1', title: 'Senior Python Developer', company: 'TechCorp', department: 'Engineering', required_skills: ['Python', 'Django', 'AWS'], candidates_matched: 12, created_at: new Date().toISOString() },
                    { id: '2', title: 'Full Stack Engineer', company: 'StartupXYZ', department: 'Product', required_skills: ['React', 'Node.js', 'PostgreSQL'], candidates_matched: 8, created_at: new Date().toISOString() },
                    { id: '3', title: 'Data Scientist', company: 'DataCo', department: 'AI/ML', required_skills: ['Python', 'TensorFlow', 'SQL'], candidates_matched: 5, created_at: new Date().toISOString() },
                ],
                total_active_jobs: 3,
                total_jobs: 5,
                total_candidates: 42,
                candidates_ready: 35,
                candidates_pending: 4,
                candidates_processing: 2,
                candidates_error: 1,
                leaderboard: [
                    { rank: 1, name: 'Alice Johnson', email: 'alice@email.com', overall_score: 0.94, skill_score: 0.95, experience_score: 1.0, education_score: 1.0, skills: ['Python', 'Django', 'AWS', 'Docker'], experience_years: 7, matched_job: 'Senior Python Developer', bias_adjusted: false },
                    { rank: 2, name: 'Bob Smith', email: 'bob@email.com', overall_score: 0.87, skill_score: 0.82, experience_score: 0.9, education_score: 1.0, skills: ['Python', 'FastAPI', 'AWS'], experience_years: 5, matched_job: 'Senior Python Developer', bias_adjusted: false },
                    { rank: 3, name: 'Carol Williams', email: 'carol@email.com', overall_score: 0.81, skill_score: 0.78, experience_score: 0.85, education_score: 0.7, skills: ['Python', 'Flask', 'GCP'], experience_years: 6, matched_job: 'Full Stack Engineer', bias_adjusted: true },
                    { rank: 4, name: 'David Brown', email: 'david@email.com', overall_score: 0.74, skill_score: 0.7, experience_score: 0.8, education_score: 1.0, skills: ['Java', 'Spring', 'Python'], experience_years: 4, matched_job: 'Full Stack Engineer', bias_adjusted: false },
                    { rank: 5, name: 'Eva Davis', email: 'eva@email.com', overall_score: 0.69, skill_score: 0.65, experience_score: 0.6, education_score: 1.0, skills: ['React', 'Node.js', 'Python'], experience_years: 3, matched_job: 'Data Scientist', bias_adjusted: false },
                ],
                avg_match_score: 0.81,
                completed_sessions: 4,
                recent_activity: [],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 2 }} />
                <Typography color="text.secondary">Loading dashboard...</Typography>
            </Box>
        );
    }

    if (!data) return null;

    const getRankStyle = (rank) => {
        if (rank === 1) return { bg: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))', border: '1px solid rgba(245,158,11,0.4)', emoji: '🥇', color: '#f59e0b' };
        if (rank === 2) return { bg: 'linear-gradient(135deg, rgba(148,163,184,0.12), rgba(148,163,184,0.04))', border: '1px solid rgba(148,163,184,0.3)', emoji: '🥈', color: '#94a3b8' };
        if (rank === 3) return { bg: 'linear-gradient(135deg, rgba(205,127,50,0.12), rgba(205,127,50,0.04))', border: '1px solid rgba(205,127,50,0.3)', emoji: '🥉', color: '#cd7f32' };
        return { bg: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', emoji: `#${rank}`, color: '#64748b' };
    };

    const getScoreColor = (score) => {
        const s = score * 100;
        if (s >= 80) return '#10b981';
        if (s >= 60) return '#06b6d4';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography variant="h4" sx={{
                    fontFamily: "'Outfit', sans-serif", fontWeight: 800, mb: 0.5,
                    background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Command Center
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Your recruitment pipeline at a glance
                </Typography>
            </motion.div>

            {/* Stat Cards */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {[
                    { label: 'Active Jobs', value: data.total_active_jobs, icon: <JobIcon />, color: '#6366f1', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' },
                    { label: 'Total Candidates', value: data.total_candidates, icon: <PeopleIcon />, color: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))' },
                    { label: 'Ready to Match', value: data.candidates_ready, icon: <CheckIcon />, color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))' },
                    { label: 'Avg Match Score', value: `${(data.avg_match_score * 100).toFixed(0)}%`, icon: <TrendIcon />, color: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))' },
                ].map((stat, index) => (
                    <Grid item xs={6} md={3} key={stat.label}>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card sx={{ background: stat.gradient, border: `1px solid ${stat.color}22` }}>
                                <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                                                {stat.label}
                                            </Typography>
                                            <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: stat.color, lineHeight: 1.2, mt: 0.5 }}>
                                                {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{ background: `${stat.color}20`, color: stat.color, width: 48, height: 48 }}>
                                            {stat.icon}
                                        </Avatar>
                                    </Box>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Active Jobs */}
                <Grid item xs={12} md={5}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                        🏢 Active Jobs
                                    </Typography>
                                    <Chip label={`${data.total_active_jobs} open`} size="small"
                                        sx={{ fontSize: '0.7rem', height: 24, background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 600 }} />
                                </Box>

                                {data.active_jobs.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <JobIcon sx={{ fontSize: 48, color: '#64748b', opacity: 0.3, mb: 1 }} />
                                        <Typography color="text.secondary" variant="body2">No active jobs yet</Typography>
                                        <Typography variant="caption" color="text.secondary">Create a job description to get started</Typography>
                                    </Box>
                                ) : (
                                    data.active_jobs.map((job, i) => (
                                        <motion.div key={job.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.08 }}>
                                            <Box sx={{
                                                p: 2, mb: 1.5, borderRadius: 2,
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                cursor: 'pointer',
                                                transition: 'all 200ms ease',
                                                '&:hover': { borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' },
                                            }} onClick={() => navigate('/jobs')}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{job.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{job.company}{job.department ? ` · ${job.department}` : ''}</Typography>
                                                    </Box>
                                                    <Chip label={`${job.candidates_matched} matched`} size="small"
                                                        sx={{ fontSize: '0.6rem', height: 20, background: 'rgba(16,185,129,0.12)', color: '#34d399' }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {(job.required_skills || []).map(skill => (
                                                        <Chip key={skill} label={skill} size="small"
                                                            sx={{ fontSize: '0.6rem', height: 18, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc' }} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Candidate Status */}
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                        <Card sx={{ mt: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2.5 }}>
                                    👥 Candidate Pipeline
                                </Typography>
                                {[
                                    { label: 'Ready to Match', count: data.candidates_ready, color: '#10b981', icon: <CheckIcon sx={{ fontSize: 16 }} /> },
                                    { label: 'Pending Upload', count: data.candidates_pending, color: '#f59e0b', icon: <PendingIcon sx={{ fontSize: 16 }} /> },
                                    { label: 'Processing', count: data.candidates_processing, color: '#06b6d4', icon: <TrendIcon sx={{ fontSize: 16 }} /> },
                                    { label: 'Errors', count: data.candidates_error, color: '#ef4444', icon: <ErrorIcon sx={{ fontSize: 16 }} /> },
                                ].map((item, i) => (
                                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                        <Avatar sx={{ width: 32, height: 32, background: `${item.color}15`, color: item.color }}>{item.icon}</Avatar>
                                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{item.label}</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>{item.count}</Typography>
                                    </Box>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Leaderboard */}
                <Grid item xs={12} md={7}>
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <TrophyIcon sx={{ color: '#f59e0b' }} />
                                        <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                            Leaderboard
                                        </Typography>
                                    </Box>
                                    <Tooltip title="View all results">
                                        <IconButton size="small" onClick={() => navigate('/results')} sx={{ color: '#64748b' }}>
                                            <ArrowIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                {data.leaderboard.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <TrophyIcon sx={{ fontSize: 60, color: '#64748b', opacity: 0.2, mb: 1 }} />
                                        <Typography color="text.secondary" variant="body2">No matches yet</Typography>
                                        <Typography variant="caption" color="text.secondary">Run matching to see ranked candidates</Typography>
                                    </Box>
                                ) : (
                                    data.leaderboard.map((candidate, i) => {
                                        const rs = getRankStyle(candidate.rank);
                                        return (
                                            <motion.div key={candidate.candidate_id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                    p: 2, mb: 1, borderRadius: 2,
                                                    background: rs.bg, border: rs.border,
                                                    transition: 'all 200ms ease',
                                                    '&:hover': { transform: 'translateX(4px)' },
                                                }}>
                                                    {/* Rank */}
                                                    <Box sx={{ textAlign: 'center', minWidth: 40 }}>
                                                        <Typography sx={{ fontSize: candidate.rank <= 3 ? '1.4rem' : '0.85rem', fontWeight: 700, color: rs.color }}>
                                                            {rs.emoji}
                                                        </Typography>
                                                    </Box>

                                                    {/* Avatar */}
                                                    <Avatar sx={{
                                                        width: 42, height: 42,
                                                        background: candidate.rank <= 3 ? `${rs.color}30` : 'rgba(99,102,241,0.12)',
                                                        fontWeight: 700, fontSize: '0.9rem',
                                                        color: candidate.rank <= 3 ? rs.color : '#818cf8',
                                                    }}>
                                                        {candidate.name?.[0] || '?'}
                                                    </Avatar>

                                                    {/* Info */}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {candidate.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                            {candidate.matched_job} • {candidate.experience_years}y exp
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                            {(candidate.skills || []).slice(0, 3).map(skill => (
                                                                <Chip key={skill} label={skill} size="small"
                                                                    sx={{ fontSize: '0.55rem', height: 16, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc' }} />
                                                            ))}
                                                        </Box>
                                                    </Box>

                                                    {/* Score */}
                                                    <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                                                        <Typography variant="h6" sx={{
                                                            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                                                            color: getScoreColor(candidate.overall_score), lineHeight: 1,
                                                        }}>
                                                            {(candidate.overall_score * 100).toFixed(0)}%
                                                        </Typography>
                                                        <LinearProgress variant="determinate" value={candidate.overall_score * 100}
                                                            sx={{
                                                                mt: 0.5, height: 4, borderRadius: 2, width: 60,
                                                                backgroundColor: 'rgba(255,255,255,0.06)',
                                                                '& .MuiLinearProgress-bar': { background: getScoreColor(candidate.overall_score), borderRadius: 2 },
                                                            }} />
                                                        {candidate.bias_adjusted && (
                                                            <Typography variant="caption" sx={{ fontSize: '0.55rem', color: '#f59e0b' }}>🛡️ bias adj.</Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardPage;
