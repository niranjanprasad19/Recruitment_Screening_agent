/**
 * RSA MVP Enhanced — Job Analytics Page
 * =======================================
 * Per-job analytics showing score distributions, skill coverage,
 * experience breakdown, top candidates, and match session history.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Chip, Avatar,
    LinearProgress, Button, Divider, CircularProgress, IconButton, Tooltip,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Work as JobIcon,
    People as PeopleIcon,
    TrendingUp as TrendIcon,
    EmojiEvents as TrophyIcon,
    Shield as ShieldIcon,
    Assessment as ChartIcon,
    PersonSearch as PersonSearchIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { dashboardApi } from '../services/api';

const BRIGHT_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ icon, label, value, color, sub }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card sx={{
                background: `linear-gradient(135deg, ${color}12, ${color}06)`,
                border: `1px solid ${color}30`,
                borderRadius: 3,
            }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ background: `${color}20`, color, width: 44, height: 44 }}>
                            {icon}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif", color }}>
                                {value}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.7rem' }}>
                                {label}
                            </Typography>
                            {sub && <Typography variant="caption" sx={{ display: 'block', color: '#94a3b8', fontSize: '0.6rem' }}>{sub}</Typography>}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function JobAnalyticsPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, [jobId]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await dashboardApi.getJobAnalytics(jobId);
            setData(res.data);
        } catch (err) {
            setError('Failed to load job analytics');
            // Demo data fallback
            setData({
                job: { id: jobId, title: 'Senior Python Developer', company: 'TechCorp', department: 'Engineering', status: 'compressed', required_skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS', 'React'], created_at: new Date().toISOString() },
                summary: { total_matched: 24, total_sessions: 3, avg_overall_score: 0.67, avg_skill_score: 0.72, avg_experience_score: 0.61, avg_education_score: 0.58, avg_semantic_score: 0.78, highest_score: 0.94, lowest_score: 0.21, bias_adjusted_count: 4 },
                score_distribution: [
                    { range: '0-10', count: 0 }, { range: '10-20', count: 1 }, { range: '20-30', count: 2 },
                    { range: '30-40', count: 3 }, { range: '40-50', count: 4 }, { range: '50-60', count: 5 },
                    { range: '60-70', count: 4 }, { range: '70-80', count: 3 }, { range: '80-90', count: 1 },
                    { range: '90-100', count: 1 },
                ],
                skill_coverage: [
                    { skill: 'Python', matched: 20, total: 24, percent: 83.3 },
                    { skill: 'Django', matched: 14, total: 24, percent: 58.3 },
                    { skill: 'PostgreSQL', matched: 16, total: 24, percent: 66.7 },
                    { skill: 'Docker', matched: 11, total: 24, percent: 45.8 },
                    { skill: 'AWS', matched: 9, total: 24, percent: 37.5 },
                    { skill: 'React', matched: 18, total: 24, percent: 75.0 },
                ],
                experience_distribution: [
                    { range: '0-2', count: 5 }, { range: '3-5', count: 10 },
                    { range: '6-10', count: 7 }, { range: '10+', count: 2 },
                ],
                top_candidates: [
                    { candidate_id: 'c1', name: 'Alice Johnson', email: 'alice@test.com', overall_score: 0.94, skill_score: 0.96, experience_score: 0.90, education_score: 0.88, skills: ['Python', 'Django', 'AWS'], experience_years: 7, bias_adjusted: false, rank: 1 },
                    { candidate_id: 'c2', name: 'Bob Smith', email: 'bob@test.com', overall_score: 0.87, skill_score: 0.88, experience_score: 0.85, education_score: 0.80, skills: ['Python', 'React', 'Docker'], experience_years: 5, bias_adjusted: true, rank: 2 },
                    { candidate_id: 'c3', name: 'Carol Williams', email: 'carol@test.com', overall_score: 0.81, skill_score: 0.82, experience_score: 0.78, education_score: 0.85, skills: ['Python', 'PostgreSQL'], experience_years: 4, bias_adjusted: false, rank: 3 },
                ],
                sessions: [
                    { id: 's1', status: 'completed', total_candidates: 24, processed_candidates: 24, created_at: new Date().toISOString(), completed_at: new Date().toISOString() },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: '#6366f1' }} />
            </Box>
        );
    }

    if (!data) return null;
    const { job, summary } = data;

    const radarData = [
        { subject: 'Skills', A: summary.avg_skill_score * 100 },
        { subject: 'Experience', A: summary.avg_experience_score * 100 },
        { subject: 'Education', A: summary.avg_education_score * 100 },
        { subject: 'Semantic', A: summary.avg_semantic_score * 100 },
    ];

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ color: '#6366f1' }}>
                        <BackIcon />
                    </IconButton>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h4" sx={{
                            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>
                            {job.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                            {job.company}{job.department ? ` • ${job.department}` : ''} • Analytics Dashboard
                        </Typography>
                    </Box>
                    <Chip label={job.status} size="small" sx={{
                        fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem',
                        background: job.status === 'compressed' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                        color: job.status === 'compressed' ? '#10b981' : '#6366f1',
                    }} />
                </Box>
            </motion.div>

            {/* Summary Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<PeopleIcon />} label="Total Matched" value={summary.total_matched} color="#6366f1" />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<TrendIcon />} label="Avg Score" value={`${(summary.avg_overall_score * 100).toFixed(1)}%`} color="#10b981" />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<TrophyIcon />} label="Best Match" value={`${(summary.highest_score * 100).toFixed(1)}%`} color="#f59e0b" sub={`Lowest: ${(summary.lowest_score * 100).toFixed(1)}%`} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard icon={<ShieldIcon />} label="Bias Adjusted" value={summary.bias_adjusted_count} color="#ec4899" sub={`of ${summary.total_matched} results`} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Score Distribution Chart */}
                <Grid item xs={12} md={7}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    📊 Score Distribution
                                </Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={data.score_distribution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Candidates" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Average Scores Radar */}
                <Grid item xs={12} md={5}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🎯 Average Scores
                                </Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="rgba(0,0,0,0.08)" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                        <Radar name="Avg Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Skill Coverage */}
                <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🛠️ Skill Coverage
                                </Typography>
                                {(data.skill_coverage || []).length > 0 ? data.skill_coverage.map((sk, i) => (
                                    <Box key={sk.skill} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{sk.skill}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: BRIGHT_COLORS[i % BRIGHT_COLORS.length] }}>
                                                {sk.matched}/{sk.total} ({sk.percent}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={sk.percent}
                                            sx={{
                                                height: 10, borderRadius: 5,
                                                backgroundColor: 'rgba(0,0,0,0.06)',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 5,
                                                    background: `linear-gradient(90deg, ${BRIGHT_COLORS[i % BRIGHT_COLORS.length]}, ${BRIGHT_COLORS[(i + 1) % BRIGHT_COLORS.length]})`,
                                                },
                                            }}
                                        />
                                    </Box>
                                )) : (
                                    <Typography variant="body2" color="text.secondary">No skill data available</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Experience Distribution */}
                <Grid item xs={12} md={6}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    📈 Experience Distribution
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={data.experience_distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            dataKey="count"
                                            nameKey="range"
                                            label={({ range, count }) => count > 0 ? `${range}y (${count})` : ''}
                                        >
                                            {(data.experience_distribution || []).map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Top Candidates */}
                <Grid item xs={12}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🏆 Top Candidates
                                </Typography>
                                {(data.top_candidates || []).length > 0 ? data.top_candidates.map((c, idx) => {
                                    const medals = ['🥇', '🥈', '🥉'];
                                    const scoreColor = c.overall_score >= 0.8 ? '#10b981' : c.overall_score >= 0.6 ? '#f59e0b' : '#ef4444';
                                    return (
                                        <motion.div key={c.candidate_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1, borderRadius: 2,
                                                background: idx < 3 ? `${scoreColor}08` : 'transparent',
                                                border: `1px solid ${idx < 3 ? scoreColor + '20' : 'rgba(0,0,0,0.06)'}`,
                                                transition: 'all 200ms ease',
                                                '&:hover': { borderColor: '#6366f1', background: 'rgba(99,102,241,0.04)' },
                                            }}>
                                                <Typography sx={{ fontSize: '1.4rem', width: 36, textAlign: 'center' }}>
                                                    {medals[idx] || `#${idx + 1}`}
                                                </Typography>
                                                <Avatar sx={{ background: `${scoreColor}20`, color: scoreColor, fontWeight: 700 }}>
                                                    {(c.name || '?')[0]}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                        {c.email} • {c.experience_years}y exp
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                                        {(c.skills || []).slice(0, 4).map(sk => (
                                                            <Chip key={sk} label={sk} size="small" sx={{
                                                                height: 18, fontSize: '0.6rem', fontWeight: 600,
                                                                background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                                                            }} />
                                                        ))}
                                                    </Box>
                                                </Box>
                                                {/* Score bars */}
                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h5" sx={{ fontWeight: 800, color: scoreColor, fontFamily: "'Outfit', sans-serif" }}>
                                                            {(c.overall_score * 100).toFixed(0)}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem' }}>SCORE</Typography>
                                                    </Box>
                                                    {c.bias_adjusted && (
                                                        <Tooltip title="Bias adjusted">
                                                            <ShieldIcon sx={{ fontSize: 16, color: '#ec4899' }} />
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="View Profile">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => navigate(`/candidate/${c.candidate_id}`)}
                                                            sx={{ color: '#6366f1', background: 'rgba(99,102,241,0.08)', '&:hover': { background: 'rgba(99,102,241,0.15)' } }}
                                                        >
                                                            <PersonSearchIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    );
                                }) : (
                                    <Typography variant="body2" color="text.secondary">No candidates matched yet</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Match Sessions */}
                <Grid item xs={12}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🕓 Match Sessions
                                </Typography>
                                {(data.sessions || []).length > 0 ? data.sessions.map((s, i) => (
                                    <Box key={s.id} sx={{
                                        display: 'flex', alignItems: 'center', gap: 2, p: 1.5, mb: 1, borderRadius: 2,
                                        border: '1px solid rgba(0,0,0,0.06)',
                                    }}>
                                        <Chip
                                            label={s.status}
                                            size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase',
                                                background: s.status === 'completed' ? 'rgba(16,185,129,0.12)' : s.status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                                                color: s.status === 'completed' ? '#10b981' : s.status === 'failed' ? '#ef4444' : '#f59e0b',
                                            }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                            {s.processed_candidates}/{s.total_candidates} candidates processed
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                                        </Typography>
                                    </Box>
                                )) : (
                                    <Typography variant="body2" color="text.secondary">No sessions yet</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
}

export default JobAnalyticsPage;
