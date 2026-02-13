/**
 * RSA MVP Enhanced — Dashboard Page (Redesigned)
 * =================================================
 * Shows: Active Jobs, Candidate Count, Leaderboard, Rankings,
 * and animated analytics charts (Recharts).
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
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    Radar, PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip, Legend,
} from 'recharts';

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
        return { bg: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)', emoji: `#${rank}`, color: '#64748b' };
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
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
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

            {/* Analytics Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Radar Chart — Score Dimensions */}
                <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    📊 Score Breakdown
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Average scores across matching dimensions
                                </Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart
                                        outerRadius={90}
                                        data={(() => {
                                            const lb = data.leaderboard || [];
                                            const avg = (key) => lb.length > 0 ? lb.reduce((s, c) => s + (c[key] || 0), 0) / lb.length * 100 : 0;
                                            return [
                                                { dimension: 'Skills', score: Math.round(avg('skill_score')), fullMark: 100 },
                                                { dimension: 'Experience', score: Math.round(avg('experience_score')), fullMark: 100 },
                                                { dimension: 'Education', score: Math.round(avg('education_score')), fullMark: 100 },
                                                { dimension: 'Overall', score: Math.round(avg('overall_score')), fullMark: 100 },
                                            ];
                                        })()}
                                    >
                                        <PolarGrid stroke="rgba(0,0,0,0.08)" />
                                        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                        <Radar
                                            name="Avg Score"
                                            dataKey="score"
                                            stroke="#6366f1"
                                            fill="#6366f1"
                                            fillOpacity={0.25}
                                            strokeWidth={2}
                                            animationDuration={1500}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, color: '#1e293b' }}
                                            formatter={(value) => [`${value}%`, 'Avg Score']}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Pie Chart — Candidate Pipeline */}
                <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🧩 Candidate Pipeline
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Distribution of candidates by processing status
                                </Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Ready', value: data.candidates_ready || 0 },
                                                { name: 'Pending', value: data.candidates_pending || 0 },
                                                { name: 'Processing', value: data.candidates_processing || 0 },
                                                { name: 'Errors', value: data.candidates_error || 0 },
                                            ].filter(d => d.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={1200}
                                            animationBegin={300}
                                        >
                                            {[
                                                { name: 'Ready', color: '#10b981' },
                                                { name: 'Pending', color: '#f59e0b' },
                                                { name: 'Processing', color: '#06b6d4' },
                                                { name: 'Errors', color: '#ef4444' },
                                            ].filter((_, i) => [
                                                data.candidates_ready,
                                                data.candidates_pending,
                                                data.candidates_processing,
                                                data.candidates_error,
                                            ][i] > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, color: '#1e293b' }}
                                        />
                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '0.75rem', color: '#94a3b8' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
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
                                                background: 'rgba(99,102,241,0.02)',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                                cursor: 'pointer',
                                                transition: 'all 200ms ease',
                                                '&:hover': { borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.04)' },
                                            }} onClick={() => navigate(`/job/${job.id}/analytics`)}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{job.title}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{job.company}{job.department ? ` · ${job.department}` : ''}</Typography>
                                                    </Box>
                                                    <Chip label={`${job.candidates_matched} matched`} size="small"
                                                        sx={{ fontSize: '0.6rem', height: 20, background: 'rgba(16,185,129,0.1)', color: '#059669' }} />
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {(job.required_skills || []).map(skill => (
                                                        <Chip key={skill} label={skill} size="small"
                                                            sx={{ fontSize: '0.6rem', height: 18, background: 'rgba(99,102,241,0.06)', color: '#6366f1' }} />
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
                                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.2, borderBottom: i < 3 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
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
                                                        color: candidate.rank <= 3 ? rs.color : '#6366f1',
                                                    }}>
                                                        {candidate.name?.[0] || '?'}
                                                    </Avatar>

                                                    {/* Info */}
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (candidate.candidate_id) navigate(`/candidate/${candidate.candidate_id}`);
                                                            }}
                                                            sx={{
                                                                fontWeight: 600,
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                cursor: candidate.candidate_id ? 'pointer' : 'default',
                                                                '&:hover': candidate.candidate_id ? {
                                                                    color: '#6366f1',
                                                                    textDecoration: 'underline',
                                                                } : {},
                                                                transition: 'color 150ms ease',
                                                            }}
                                                        >
                                                            {candidate.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                            {candidate.matched_job} • {candidate.experience_years}y exp
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                            {(candidate.skills || []).slice(0, 3).map(skill => (
                                                                <Chip key={skill} label={skill} size="small"
                                                                    sx={{ fontSize: '0.55rem', height: 16, background: 'rgba(99,102,241,0.06)', color: '#6366f1' }} />
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
                                                                backgroundColor: 'rgba(0,0,0,0.06)',
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
