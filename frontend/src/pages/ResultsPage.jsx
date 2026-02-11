/**
 * RSA MVP Enhanced — Results Page
 * ==================================
 * Animated results with:
 * - Score cards that animate from 0 to final value
 * - Interactive React Flow diagram (Match Journey)
 * - Export report functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { Background, Controls, MiniMap } from 'react-flow-renderer';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    Chip, Avatar, Select, MenuItem, FormControl, InputLabel,
    LinearProgress, Tabs, Tab, Divider, IconButton,
    Dialog, DialogTitle, DialogContent, Tooltip,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    EmojiEvents as TrophyIcon,
    AccountTree as FlowIcon,
    TableChart as TableIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { matchApi, reportApi } from '../services/api';

// Animated score that counts up from 0
function AnimatedScore({ score, delay = 0, size = 'medium' }) {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            let current = 0;
            const target = score * 100;
            const increment = target / 60;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    setDisplayScore(target);
                    clearInterval(timer);
                } else {
                    setDisplayScore(current);
                }
            }, 16);
            return () => clearInterval(timer);
        }, delay * 1000);
        return () => clearTimeout(timeout);
    }, [score, delay]);

    const getScoreColor = (s) => {
        if (s >= 80) return '#10b981';
        if (s >= 60) return '#06b6d4';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <Typography
            variant={size === 'large' ? 'h3' : size === 'medium' ? 'h5' : 'body1'}
            sx={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                color: getScoreColor(displayScore),
            }}
        >
            {displayScore.toFixed(1)}%
        </Typography>
    );
}

// Candidate Result Card with animations
function CandidateCard({ result, index }) {
    const [expanded, setExpanded] = useState(false);

    const getRankBadge = (rank) => {
        if (rank === 1) return { emoji: '🥇', color: '#f59e0b' };
        if (rank === 2) return { emoji: '🥈', color: '#94a3b8' };
        if (rank === 3) return { emoji: '🥉', color: '#cd7f32' };
        return { emoji: `#${rank}`, color: '#64748b' };
    };

    const badge = getRankBadge(result.rank);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
            <Card
                sx={{
                    mb: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'visible',
                    '&::before': result.rank <= 3 ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${badge.color}, transparent)`,
                        borderRadius: '16px 16px 0 0',
                    } : undefined,
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Rank */}
                        <Box sx={{ textAlign: 'center', minWidth: 50 }}>
                            <Typography sx={{ fontSize: '1.5rem', lineHeight: 1 }}>{badge.emoji}</Typography>
                            {result.rank > 3 && (
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                                    #{result.rank}
                                </Typography>
                            )}
                        </Box>

                        {/* Avatar */}
                        <Avatar
                            sx={{
                                width: 50,
                                height: 50,
                                background: result.rank <= 3
                                    ? `linear-gradient(135deg, ${badge.color}, ${badge.color}88)`
                                    : 'rgba(99,102,241,0.15)',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                            }}
                        >
                            {result.candidate_name?.[0] || '?'}
                        </Avatar>

                        {/* Name & Info */}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {result.candidate_name || 'Candidate'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {result.candidate_email || 'No email'}
                                {result.candidate_experience_years && ` • ${result.candidate_experience_years} years exp.`}
                            </Typography>
                        </Box>

                        {/* Overall Score */}
                        <Box sx={{ textAlign: 'center' }}>
                            <AnimatedScore score={result.overall_score} delay={index * 0.1} />
                            <Typography variant="caption" color="text.secondary">Overall</Typography>
                        </Box>

                        {/* Bias Badge */}
                        {result.bias_adjusted && (
                            <Tooltip title="Bias mitigation applied">
                                <Chip
                                    label="🛡️"
                                    size="small"
                                    sx={{ fontSize: '0.8rem', height: 28, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}
                                />
                            </Tooltip>
                        )}
                    </Box>

                    {/* Score Bars */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Skills', score: result.skill_score, color: '#6366f1' },
                            { label: 'Experience', score: result.experience_score, color: '#06b6d4' },
                            { label: 'Education', score: result.education_score, color: '#10b981' },
                            { label: 'Semantic', score: result.semantic_score, color: '#f59e0b' },
                        ].map((dim) => (
                            <Box key={dim.label} sx={{ flex: '1 1 120px', minWidth: 100 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>{dim.label}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: dim.color }}>
                                        {(dim.score * 100).toFixed(0)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={dim.score * 100}
                                    sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: 'rgba(255,255,255,0.06)',
                                        '& .MuiLinearProgress-bar': { background: dim.color, borderRadius: 3 },
                                    }}
                                />
                            </Box>
                        ))}
                    </Box>

                    {/* Skills */}
                    <AnimatePresence>
                        {expanded && result.candidate_skills?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                                    Candidate Skills
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {result.candidate_skills.map((skill) => (
                                        <Chip key={skill} label={skill} size="small" sx={{ fontSize: '0.7rem', height: 24 }} />
                                    ))}
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}

// React Flow Match Journey Diagram
function MatchJourneyFlow({ results, jobTitle }) {
    const topResults = results.slice(0, 5);

    const nodes = [
        // JD Node
        {
            id: 'jd',
            type: 'default',
            position: { x: 50, y: 150 },
            data: { label: `📋 ${jobTitle || 'Job Description'}` },
            style: {
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 600,
                fontSize: 12,
                width: 200,
            },
        },
        // Matching Engine
        {
            id: 'engine',
            type: 'default',
            position: { x: 350, y: 150 },
            data: { label: '🧠 AI Matching Engine' },
            style: {
                background: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 600,
                fontSize: 12,
                width: 200,
            },
        },
        // Candidate nodes
        ...topResults.map((result, index) => ({
            id: `candidate-${index}`,
            type: 'default',
            position: { x: 650, y: 40 + index * 70 },
            data: {
                label: `${result.rank <= 3 ? ['🥇', '🥈', '🥉'][result.rank - 1] : `#${result.rank}`} ${result.candidate_name || 'Candidate'} • ${(result.overall_score * 100).toFixed(0)}%`,
            },
            style: {
                background: result.rank === 1
                    ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))'
                    : 'rgba(26, 26, 46, 0.9)',
                color: '#f1f5f9',
                border: result.rank === 1 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '8px 16px',
                fontWeight: result.rank <= 3 ? 600 : 400,
                fontSize: 11,
                width: 250,
            },
        })),
    ];

    const edges = [
        { id: 'e-jd-engine', source: 'jd', target: 'engine', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
        ...topResults.map((_, index) => ({
            id: `e-engine-c${index}`,
            source: 'engine',
            target: `candidate-${index}`,
            animated: true,
            style: { stroke: '#06b6d4', strokeWidth: 1.5 },
        })),
    ];

    return (
        <Box sx={{ height: 450, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                attributionPosition="bottom-left"
                style={{ background: '#0f0f1a' }}
            >
                <Background color="rgba(255,255,255,0.03)" gap={20} />
                <Controls style={{ background: '#1a1a2e', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }} />
            </ReactFlow>
        </Box>
    );
}

function ResultsPage() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewTab, setViewTab] = useState(0);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await matchApi.getSessions();
            setSessions(response.data || []);
        } catch (err) {
            // Demo fallback
            setSessions([
                { id: 'demo-1', job_title: 'Senior Python Developer', status: 'completed', total_candidates: 42, created_at: new Date().toISOString() },
                { id: 'demo-2', job_title: 'Full Stack Engineer', status: 'completed', total_candidates: 38, created_at: new Date().toISOString() },
            ]);
        }
    };

    const handleLoadResults = async (sessionId) => {
        setSelectedSession(sessionId);
        setLoading(true);

        try {
            const response = await matchApi.getResults(sessionId);
            setResults(response.data);
        } catch (err) {
            // Demo data
            setResults({
                session: {
                    id: sessionId, job_title: 'Senior Python Developer',
                    status: 'completed', total_candidates: 8, processed_candidates: 8,
                },
                results: [
                    { id: '1', rank: 1, candidate_name: 'Alice Johnson', candidate_email: 'alice@email.com', overall_score: 0.94, skill_score: 0.95, experience_score: 1.0, education_score: 1.0, semantic_score: 0.78, bias_adjusted: false, candidate_skills: ['Python', 'Django', 'AWS', 'Docker', 'PostgreSQL', 'React'], candidate_experience_years: 7 },
                    { id: '2', rank: 2, candidate_name: 'Bob Smith', candidate_email: 'bob@email.com', overall_score: 0.87, skill_score: 0.82, experience_score: 0.90, education_score: 1.0, semantic_score: 0.71, bias_adjusted: false, candidate_skills: ['Python', 'FastAPI', 'AWS', 'MongoDB'], candidate_experience_years: 5 },
                    { id: '3', rank: 3, candidate_name: 'Carol Williams', candidate_email: 'carol@email.com', overall_score: 0.81, skill_score: 0.78, experience_score: 0.85, education_score: 0.7, semantic_score: 0.82, bias_adjusted: true, candidate_skills: ['Python', 'Flask', 'GCP', 'Docker', 'TensorFlow'], candidate_experience_years: 6 },
                    { id: '4', rank: 4, candidate_name: 'David Brown', candidate_email: 'david@email.com', overall_score: 0.74, skill_score: 0.70, experience_score: 0.80, education_score: 1.0, semantic_score: 0.55, bias_adjusted: false, candidate_skills: ['Python', 'Django', 'MySQL'], candidate_experience_years: 4 },
                    { id: '5', rank: 5, candidate_name: 'Eva Davis', candidate_email: 'eva@email.com', overall_score: 0.69, skill_score: 0.65, experience_score: 0.60, education_score: 1.0, semantic_score: 0.68, bias_adjusted: false, candidate_skills: ['JavaScript', 'React', 'Node.js', 'Python'], candidate_experience_years: 3 },
                    { id: '6', rank: 6, candidate_name: 'Frank Miller', candidate_email: 'frank@email.com', overall_score: 0.62, skill_score: 0.58, experience_score: 0.70, education_score: 0.7, semantic_score: 0.52, bias_adjusted: false, candidate_skills: ['Java', 'Spring', 'Python'], candidate_experience_years: 8 },
                    { id: '7', rank: 7, candidate_name: 'Grace Wilson', candidate_email: 'grace@email.com', overall_score: 0.55, skill_score: 0.50, experience_score: 0.45, education_score: 1.0, semantic_score: 0.60, bias_adjusted: true, candidate_skills: ['Python', 'Data Science', 'Pandas'], candidate_experience_years: 2 },
                    { id: '8', rank: 8, candidate_name: 'Henry Taylor', candidate_email: 'henry@email.com', overall_score: 0.43, skill_score: 0.35, experience_score: 0.30, education_score: 0.7, semantic_score: 0.55, bias_adjusted: false, candidate_skills: ['C++', 'Embedded'], candidate_experience_years: 10 },
                ],
                total: 8,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format) => {
        try {
            const response = await reportApi.export(selectedSession, format);
            if (format === 'pdf') {
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                window.open(url);
            } else if (format === 'csv') {
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${selectedSession}.csv`;
                a.click();
            }
        } catch (err) {
            console.error('Export error:', err);
        }
    };

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800,
                        mb: 1,
                        background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Results & Reports
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    View ranked candidates, explore the match journey, and export reports
                </Typography>
            </motion.div>

            {/* Session Selector */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Matching Session</InputLabel>
                                    <Select
                                        value={selectedSession}
                                        onChange={(e) => handleLoadResults(e.target.value)}
                                        label="Select Matching Session"
                                    >
                                        {sessions.filter((s) => s.status === 'completed').map((session) => (
                                            <MenuItem key={session.id} value={session.id}>
                                                {session.job_title || 'Session'} — {session.total_candidates} candidates
                                                ({new Date(session.created_at).toLocaleDateString()})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleExport('csv')}
                                        disabled={!results}
                                    >
                                        CSV
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleExport('pdf')}
                                        disabled={!results}
                                    >
                                        PDF
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<DownloadIcon />}
                                        onClick={() => handleExport('json')}
                                        disabled={!results}
                                    >
                                        JSON
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </motion.div>

            {/* View Tabs */}
            {results && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Tabs
                        value={viewTab}
                        onChange={(_, v) => setViewTab(v)}
                        sx={{
                            mb: 3,
                            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minHeight: 48 },
                            '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #6366f1, #06b6d4)', height: 3, borderRadius: 2 },
                        }}
                    >
                        <Tab icon={<TableIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ranked Results" />
                        <Tab icon={<FlowIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Match Journey" />
                    </Tabs>
                </motion.div>
            )}

            {/* Loading State */}
            {loading && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <LinearProgress sx={{ mb: 2, maxWidth: 300, mx: 'auto' }} />
                    <Typography color="text.secondary">Loading results...</Typography>
                </Box>
            )}

            {/* Results Content */}
            {results && !loading && (
                <AnimatePresence mode="wait">
                    {viewTab === 0 ? (
                        <motion.div
                            key="results-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {/* Summary */}
                            <Card sx={{ mb: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">Total Candidates</Typography>
                                            <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#6366f1' }}>
                                                {results.total}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">Avg Score</Typography>
                                            <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#06b6d4' }}>
                                                {results.results.length > 0
                                                    ? (results.results.reduce((sum, r) => sum + r.overall_score, 0) / results.results.length * 100).toFixed(1)
                                                    : 0}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">Top Score</Typography>
                                            <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#10b981' }}>
                                                {results.results.length > 0 ? (results.results[0].overall_score * 100).toFixed(1) : 0}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="caption" color="text.secondary">Bias Adjusted</Typography>
                                            <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: '#f59e0b' }}>
                                                {results.results.filter((r) => r.bias_adjusted).length}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Candidate Cards */}
                            {results.results.map((result, index) => (
                                <CandidateCard key={result.id} result={result} index={index} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="match-journey"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Card>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 2 }}>
                                        🗺️ Match Journey — Interactive Flow
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                        Visualize how the job description flows through the AI matching engine to rank candidates.
                                        Drag and zoom to explore.
                                    </Typography>
                                    <MatchJourneyFlow
                                        results={results.results}
                                        jobTitle={results.session?.job_title}
                                    />
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Empty State */}
            {!results && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <TrophyIcon sx={{ fontSize: 80, color: '#64748b', opacity: 0.3, mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                            Select a matching session to view results
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Run matching from the "Run Matching" page first
                        </Typography>
                    </Box>
                </motion.div>
            )}
        </Box>
    );
}

export default ResultsPage;
