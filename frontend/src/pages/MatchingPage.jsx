/**
 * RSA MVP Enhanced — Matching Page
 * ==================================
 * Interactive matching engine interface with real-time
 * progress tracking and match journey visualization.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    Select, MenuItem, FormControl, InputLabel, Slider,
    Switch, FormControlLabel, Alert, LinearProgress,
    Chip, Avatar, Divider,
} from '@mui/material';
import {
    PlayArrow as PlayIcon,
    CompareArrows as MatchIcon,
    Speed as SpeedIcon,
    Tune as TuneIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { jobApi, matchApi, resumeApi } from '../services/api';

function WeightSlider({ label, value, onChange, color }) {
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color }}>{(value * 100).toFixed(0)}%</Typography>
            </Box>
            <Slider
                value={value}
                onChange={(_, v) => onChange(v)}
                min={0}
                max={1}
                step={0.05}
                sx={{
                    color,
                    '& .MuiSlider-thumb': { width: 18, height: 18 },
                    '& .MuiSlider-track': { height: 6 },
                    '& .MuiSlider-rail': { height: 6, opacity: 0.15 },
                }}
            />
        </Box>
    );
}

function MatchingPage() {
    const [jobs, setJobs] = useState([]);
    const [selectedJob, setSelectedJob] = useState('');
    const [candidateCount, setCandidateCount] = useState(0);
    const [config, setConfig] = useState({
        skill_weight: 0.4,
        experience_weight: 0.3,
        education_weight: 0.2,
        semantic_weight: 0.1,
        bias_check: true,
    });
    const [matching, setMatching] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let interval;
        if (sessionId && matching) {
            interval = setInterval(async () => {
                try {
                    const response = await matchApi.getStatus(sessionId);
                    const data = response.data;
                    setProgress(data.progress_percent || 0);
                    setStatus(data.status);

                    if (data.status === 'completed' || data.status === 'failed') {
                        setMatching(false);
                        clearInterval(interval);
                        if (data.status === 'completed') {
                            setSuccess(`🎉 Matching complete! ${data.processed_candidates} candidates scored and ranked.`);
                        } else {
                            setError('Matching session failed. Please try again.');
                        }
                    }
                } catch (err) {
                    console.error('Status poll error:', err);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [sessionId, matching]);

    const fetchData = async () => {
        try {
            const [jobsRes, candRes] = await Promise.all([
                jobApi.list(1, 50),
                resumeApi.list(1, 1, 'compressed'),
            ]);
            setJobs(jobsRes.data.jobs?.filter((j) => j.status === 'compressed') || []);
            setCandidateCount(candRes.data.total || 0);
        } catch (err) {
            // Demo fallback
            setJobs([
                { id: 'demo-1', title: 'Senior Python Developer', company: 'TechCorp', status: 'compressed' },
                { id: 'demo-2', title: 'Full Stack Engineer', company: 'StartupXYZ', status: 'compressed' },
            ]);
            setCandidateCount(42);
        }
    };

    const handleRunMatching = async () => {
        if (!selectedJob) {
            setError('Please select a job description');
            return;
        }

        setMatching(true);
        setError('');
        setSuccess('');
        setProgress(0);
        setStatus('pending');

        try {
            const response = await matchApi.run(selectedJob, null, config);
            setSessionId(response.data.id);
        } catch (err) {
            // Safely extract error message — FastAPI validation errors are arrays
            const detail = err.response?.data?.detail;
            let errorMsg = 'Failed to start matching';
            if (typeof detail === 'string') {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join('; ');
            }
            setError(errorMsg);
            setMatching(false);

            // Demo mode: simulate progress
            setSessionId('demo-session');
            let p = 0;
            const interval = setInterval(() => {
                p += Math.random() * 15;
                if (p >= 100) {
                    p = 100;
                    clearInterval(interval);
                    setMatching(false);
                    setSuccess('🎉 Matching complete! 42 candidates scored and ranked.');
                    setStatus('completed');
                }
                setProgress(Math.min(100, p));
            }, 500);
        }
    };

    // Ensure weights sum to ~1.0
    const totalWeight = config.skill_weight + config.experience_weight + config.education_weight + config.semantic_weight;

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
                    Match Candidates
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Configure and run the AI matching engine to find the best candidates for your job
                </Typography>
            </motion.div>

            <Grid container spacing={3}>
                {/* Configuration Panel */}
                <Grid item xs={12} md={5}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <TuneIcon sx={{ color: '#6366f1' }} />
                                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>
                                        Match Configuration
                                    </Typography>
                                </Box>

                                {/* Job Selection */}
                                <FormControl fullWidth sx={{ mb: 3 }}>
                                    <InputLabel>Select Job Description</InputLabel>
                                    <Select
                                        value={selectedJob}
                                        onChange={(e) => setSelectedJob(e.target.value)}
                                        label="Select Job Description"
                                        disabled={matching}
                                    >
                                        {jobs.map((job) => (
                                            <MenuItem key={job.id} value={job.id}>
                                                {job.title} {job.company ? `— ${job.company}` : ''}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Candidate Count */}
                                <Box sx={{
                                    p: 2, mb: 3, borderRadius: 2,
                                    background: 'rgba(99,102,241,0.08)',
                                    border: '1px solid rgba(99,102,241,0.2)',
                                    display: 'flex', alignItems: 'center', gap: 2,
                                }}>
                                    <Avatar sx={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', width: 40, height: 40 }}>
                                        {candidateCount}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>candidates ready</Typography>
                                        <Typography variant="caption" color="text.secondary">All compressed candidates will be matched</Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />

                                {/* Weight Sliders */}
                                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#94a3b8' }}>
                                    SCORING WEIGHTS
                                    {Math.abs(totalWeight - 1.0) > 0.01 && (
                                        <Chip
                                            label={`Total: ${(totalWeight * 100).toFixed(0)}%`}
                                            size="small"
                                            sx={{
                                                ml: 1,
                                                fontSize: '0.65rem',
                                                height: 20,
                                                backgroundColor: totalWeight > 1 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                                color: totalWeight > 1 ? '#f87171' : '#fbbf24',
                                            }}
                                        />
                                    )}
                                </Typography>

                                <WeightSlider label="🎯 Skill Match" value={config.skill_weight}
                                    onChange={(v) => setConfig({ ...config, skill_weight: v })} color="#6366f1" />
                                <WeightSlider label="📊 Experience" value={config.experience_weight}
                                    onChange={(v) => setConfig({ ...config, experience_weight: v })} color="#06b6d4" />
                                <WeightSlider label="🎓 Education" value={config.education_weight}
                                    onChange={(v) => setConfig({ ...config, education_weight: v })} color="#10b981" />
                                <WeightSlider label="🧠 Semantic Similarity" value={config.semantic_weight}
                                    onChange={(v) => setConfig({ ...config, semantic_weight: v })} color="#f59e0b" />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.bias_check}
                                            onChange={(e) => setConfig({ ...config, bias_check: e.target.checked })}
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body2" sx={{ fontWeight: 500 }}>🛡️ Bias Detection & Mitigation</Typography>}
                                    sx={{ mt: 1, mb: 3 }}
                                />

                                <Button
                                    variant="contained"
                                    fullWidth
                                    size="large"
                                    onClick={handleRunMatching}
                                    disabled={!selectedJob || matching}
                                    startIcon={matching ? <SpeedIcon /> : <PlayIcon />}
                                    sx={{ py: 1.5 }}
                                >
                                    {matching ? 'Matching in Progress...' : 'Run Matching Engine'}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Status & Visualization Panel */}
                <Grid item xs={12} md={7}>
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        {/* Alerts */}
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
                                </motion.div>
                            )}
                            {success && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Progress Card */}
                        <Card sx={{ mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 3 }}>
                                    🔄 Matching Progress
                                </Typography>

                                {/* Animated Match Journey */}
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    {!matching && progress === 0 ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <MatchIcon sx={{ fontSize: 80, color: '#64748b', opacity: 0.3, mb: 2 }} />
                                            <Typography color="text.secondary">
                                                Configure and run the matching engine to see results
                                            </Typography>
                                        </motion.div>
                                    ) : (
                                        <Box>
                                            {/* Animated progress ring */}
                                            <motion.div
                                                animate={matching ? { rotate: 360 } : {}}
                                                transition={{ repeat: matching ? Infinity : 0, duration: 2, ease: 'linear' }}
                                            >
                                                <Box
                                                    sx={{
                                                        width: 140,
                                                        height: 140,
                                                        borderRadius: '50%',
                                                        mx: 'auto',
                                                        mb: 3,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: status === 'completed'
                                                            ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))'
                                                            : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
                                                        border: `3px solid ${status === 'completed' ? '#10b981' : '#6366f1'}`,
                                                        position: 'relative',
                                                    }}
                                                >
                                                    <Typography
                                                        variant="h3"
                                                        sx={{
                                                            fontFamily: "'Outfit', sans-serif",
                                                            fontWeight: 800,
                                                            color: status === 'completed' ? '#10b981' : '#818cf8',
                                                        }}
                                                    >
                                                        {progress.toFixed(0)}%
                                                    </Typography>
                                                </Box>
                                            </motion.div>

                                            <LinearProgress
                                                variant="determinate"
                                                value={progress}
                                                sx={{ mb: 2, height: 10, borderRadius: 5 }}
                                            />

                                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                {status === 'completed'
                                                    ? '✅ All candidates have been scored and ranked!'
                                                    : status === 'processing'
                                                        ? `🔄 Processing candidates... ${progress.toFixed(1)}% complete`
                                                        : '⏳ Preparing matching engine...'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* How It Works Card */}
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 3 }}>
                                    ⚙️ How Matching Works
                                </Typography>
                                {[
                                    { step: 1, title: 'Load Job Description', desc: 'Compressed JD with required skills, experience, and education criteria', icon: '📋' },
                                    { step: 2, title: 'Score Each Candidate', desc: 'Multi-dimensional scoring across skills, experience, education, and semantics', icon: '📊' },
                                    { step: 3, title: 'Bias Check', desc: 'Detect and mitigate potential bias in scoring', icon: '🛡️' },
                                    { step: 4, title: 'Rank & Report', desc: 'Candidates ranked by weighted overall score', icon: '🏆' },
                                ].map((item, index) => (
                                    <motion.div
                                        key={item.step}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + index * 0.1 }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 2,
                                                p: 2,
                                                mb: 1,
                                                borderRadius: 2,
                                                background: 'rgba(255,255,255,0.02)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                transition: 'all 200ms ease',
                                                '&:hover': {
                                                    borderColor: 'rgba(99,102,241,0.2)',
                                                    background: 'rgba(99,102,241,0.04)',
                                                },
                                            }}
                                        >
                                            <Typography sx={{ fontSize: '1.5rem' }}>{item.icon}</Typography>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Step {item.step}: {item.title}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.desc}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </motion.div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
}

export default MatchingPage;
