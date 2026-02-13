/**
 * RSA MVP Enhanced — Candidate Detail Page
 * ==========================================
 * Full resume viewer for recruiters to inspect individual candidates:
 * - Profile header with status badge
 * - Extracted skills (chips)
 * - Experience & education sections
 * - AI-compressed structured data
 * - Bias analysis report
 * - Original resume text
 * - File metadata & timestamps
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Chip,
    Avatar, Button, LinearProgress, Divider, IconButton,
    Tooltip, Alert, Tab, Tabs, Collapse,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Star as StarIcon,
    School as SchoolIcon,
    Work as WorkIcon,
    Code as SkillIcon,
    Description as FileIcon,
    Schedule as TimeIcon,
    Psychology as AIIcon,
    Shield as BiasIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { resumeApi } from '../services/api';

// -- Status styles --
const statusConfig = {
    uploaded: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Uploaded', icon: <TimeIcon sx={{ fontSize: 14 }} /> },
    parsing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Parsing', icon: <TimeIcon sx={{ fontSize: 14 }} /> },
    parsed: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: 'Parsed', icon: <CheckIcon sx={{ fontSize: 14 }} /> },
    compressing: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Compressing', icon: <AIIcon sx={{ fontSize: 14 }} /> },
    compressed: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Ready', icon: <CheckIcon sx={{ fontSize: 14 }} /> },
    error: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Error', icon: <ErrorIcon sx={{ fontSize: 14 }} /> },
};

// -- Skill color palette --
const skillColors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#84cc16',
];

function CandidateDetailPage() {
    const { candidateId } = useParams();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [showFullText, setShowFullText] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchCandidate();
    }, [candidateId]);

    const fetchCandidate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await resumeApi.get(candidateId);
            setCandidate(res.data);
        } catch (err) {
            setError(err.safeMessage || 'Failed to load candidate');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 2 }} />
                <Typography color="text.secondary">Loading candidate profile…</Typography>
            </Box>
        );
    }

    if (error || !candidate) {
        return (
            <Box sx={{ py: 6 }}>
                <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>{error || 'Candidate not found'}</Alert>
                <Button startIcon={<BackIcon />} onClick={() => navigate(-1)} variant="outlined">Go Back</Button>
            </Box>
        );
    }

    const c = candidate;
    const st = statusConfig[c.status] || statusConfig.uploaded;
    const compressed = c.compressed_data || {};
    const bias = c.bias_flags || {};

    return (
        <Box>
            {/* Back button */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3, color: '#94a3b8', textTransform: 'none', fontWeight: 500 }}
                >
                    Back to Candidates
                </Button>
            </motion.div>

            {/* ============ Profile Header ============ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card sx={{
                    mb: 3,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(6,182,212,0.02))',
                    border: '1px solid rgba(99,102,241,0.08)',
                }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
                            {/* Avatar */}
                            <Avatar sx={{
                                width: 80, height: 80,
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                fontSize: '2rem', fontWeight: 800,
                                fontFamily: "'Outfit', sans-serif",
                            }}>
                                {(c.name || '?')[0]?.toUpperCase()}
                            </Avatar>

                            {/* Info */}
                            <Box sx={{ flex: 1, minWidth: 200 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="h4" sx={{
                                        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                                        background: 'linear-gradient(135deg, #1e293b, #475569)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>
                                        {c.name || 'Unknown Candidate'}
                                    </Typography>
                                    <Chip
                                        icon={st.icon}
                                        label={st.label}
                                        size="small"
                                        sx={{
                                            background: st.bg, color: st.color,
                                            fontWeight: 600, fontSize: '0.7rem',
                                            border: `1px solid ${st.color}33`,
                                        }}
                                    />
                                </Box>

                                {/* Contact details */}
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                                    {c.email && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <EmailIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                                        </Box>
                                    )}
                                    {c.phone && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <PhoneIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <Typography variant="body2" color="text.secondary">{c.phone}</Typography>
                                        </Box>
                                    )}
                                    {c.file_name && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <FileIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {c.file_name} {c.file_type && `(${c.file_type.toUpperCase()})`}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {/* Quick stats */}
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    <Chip
                                        icon={<WorkIcon sx={{ fontSize: 14 }} />}
                                        label={`${c.experience_years || 0} yrs experience`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.7rem' }}
                                    />
                                    <Chip
                                        icon={<SkillIcon sx={{ fontSize: 14 }} />}
                                        label={`${(c.skills || []).length} skills`}
                                        size="small"
                                        variant="outlined"
                                        sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '0.7rem' }}
                                    />
                                    {c.created_at && (
                                        <Chip
                                            icon={<TimeIcon sx={{ fontSize: 14 }} />}
                                            label={`Uploaded ${new Date(c.created_at).toLocaleDateString()}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ borderColor: 'rgba(0,0,0,0.1)', color: '#64748b', fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>

            {/* ============ Tabs ============ */}
            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                    mb: 3,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' },
                    '& .Mui-selected': { color: '#6366f1 !important' },
                    '& .MuiTabs-indicator': { backgroundColor: '#6366f1' },
                }}
            >
                <Tab label="📋 Profile & Skills" />
                <Tab label="🤖 AI Analysis" />
                <Tab label="🛡️ Bias Report" />
                <Tab label="📄 Original Resume" />
            </Tabs>

            {/* ============ TAB 0: Profile & Skills ============ */}
            {activeTab === 0 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <Grid container spacing={3}>
                        {/* Skills */}
                        <Grid item xs={12} md={7}>
                            <Card>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{
                                        fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <SkillIcon sx={{ color: '#6366f1' }} /> Technical Skills
                                        <Chip label={`${(c.skills || []).length}`} size="small" sx={{
                                            ml: 1, height: 22, fontSize: '0.7rem', fontWeight: 700,
                                            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                                        }} />
                                    </Typography>

                                    {(c.skills || []).length > 0 ? (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {c.skills.map((skill, i) => (
                                                <motion.div
                                                    key={skill}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.03 }}
                                                >
                                                    <Chip
                                                        label={skill}
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '0.75rem',
                                                            background: `${skillColors[i % skillColors.length]}15`,
                                                            color: skillColors[i % skillColors.length],
                                                            border: `1px solid ${skillColors[i % skillColors.length]}30`,
                                                            '&:hover': {
                                                                background: `${skillColors[i % skillColors.length]}25`,
                                                                transform: 'translateY(-2px)',
                                                            },
                                                            transition: 'all 200ms ease',
                                                        }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No skills extracted yet. Resume may still be processing.
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Experience & Education */}
                        <Grid item xs={12} md={5}>
                            <Card sx={{ mb: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{
                                        fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <WorkIcon sx={{ color: '#f59e0b' }} /> Experience
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'baseline', gap: 1, mb: 1,
                                    }}>
                                        <Typography variant="h3" sx={{
                                            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                                            color: '#f59e0b',
                                        }}>
                                            {c.experience_years || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            years of experience
                                        </Typography>
                                    </Box>

                                    {/* Experience entries from compressed data */}
                                    {compressed.experience && Array.isArray(compressed.experience) && compressed.experience.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            {compressed.experience.map((exp, i) => (
                                                <Box key={i} sx={{
                                                    py: 1.2, borderBottom: i < compressed.experience.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                                                }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                                        {exp.title || exp.role || exp.company || `Position ${i + 1}`}
                                                    </Typography>
                                                    {exp.company && exp.title && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {exp.company} {exp.duration && `• ${exp.duration}`}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{
                                        fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                    }}>
                                        <SchoolIcon sx={{ color: '#06b6d4' }} /> Education
                                    </Typography>
                                    {c.education ? (
                                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
                                            {typeof c.education === 'string'
                                                ? c.education
                                                : Array.isArray(c.education)
                                                    ? c.education.map(e => typeof e === 'string' ? e : (e.degree || e.institution || JSON.stringify(e))).join('\n')
                                                    : JSON.stringify(c.education)
                                            }
                                        </Typography>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                            No education data extracted
                                        </Typography>
                                    )}

                                    {/* Education entries from compressed data */}
                                    {compressed.education && Array.isArray(compressed.education) && compressed.education.length > 0 && (
                                        <Box sx={{ mt: 2 }}>
                                            {compressed.education.map((edu, i) => (
                                                <Box key={i} sx={{
                                                    py: 1, borderBottom: i < compressed.education.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                                        {edu.degree || edu.institution || `Education ${i + 1}`}
                                                    </Typography>
                                                    {edu.institution && edu.degree && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {edu.institution} {edu.year && `(${edu.year})`}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </motion.div>
            )}

            {/* ============ TAB 1: AI Analysis ============ */}
            {activeTab === 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{
                                fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 1,
                                display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <AIIcon sx={{ color: '#8b5cf6' }} /> AI-Compressed Profile
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                                Structured data extracted by the NLP compression engine
                            </Typography>

                            {Object.keys(compressed).length > 0 ? (
                                <Grid container spacing={3}>
                                    {/* Summary */}
                                    {compressed.summary && (
                                        <Grid item xs={12}>
                                            <Box sx={{
                                                p: 2.5, borderRadius: 2,
                                                background: 'rgba(139,92,246,0.06)',
                                                border: '1px solid rgba(139,92,246,0.15)',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: '#a78bfa', mb: 1, fontWeight: 600 }}>
                                                    📝 Summary
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.7 }}>
                                                    {compressed.summary}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Name */}
                                    {compressed.name && (
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                                    Extracted Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{compressed.name}</Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Total Experience */}
                                    {compressed.total_experience_years !== undefined && (
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                                    Total Experience
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{compressed.total_experience_years} years</Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Skills from compressed */}
                                    {compressed.skills && compressed.skills.length > 0 && (
                                        <Grid item xs={12}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                                                    Extracted Skills ({compressed.skills.length})
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                                                    {compressed.skills.map((s, i) => (
                                                        <Chip key={s} label={s} size="small" sx={{
                                                            fontSize: '0.7rem', fontWeight: 500,
                                                            background: `${skillColors[i % skillColors.length]}12`,
                                                            color: skillColors[i % skillColors.length],
                                                        }} />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Certifications */}
                                    {compressed.certifications && compressed.certifications.length > 0 && (
                                        <Grid item xs={12}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                                                    Certifications
                                                </Typography>
                                                {compressed.certifications.map((cert, i) => (
                                                    <Chip key={i} label={cert} size="small" sx={{
                                                        mr: 0.8, mb: 0.5, fontSize: '0.7rem',
                                                        background: 'rgba(16,185,129,0.1)', color: '#34d399',
                                                    }} />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Raw JSON */}
                                    <Grid item xs={12}>
                                        <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                                    Full JSON Output
                                                </Typography>
                                                <Tooltip title={copied ? 'Copied!' : 'Copy JSON'}>
                                                    <IconButton size="small" onClick={() => copyToClipboard(JSON.stringify(compressed, null, 2))}>
                                                        <CopyIcon sx={{ fontSize: 14, color: '#64748b' }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                            <Box sx={{
                                                p: 2, borderRadius: 1, maxHeight: 300, overflow: 'auto',
                                                background: 'rgba(0,0,0,0.03)',
                                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                                fontSize: '0.75rem', color: '#4f46e5', lineHeight: 1.6,
                                                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                            }}>
                                                {JSON.stringify(compressed, null, 2)}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <AIIcon sx={{ fontSize: 56, color: '#4a5568', opacity: 0.3, mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        AI analysis not available yet. Resume may still be processing.
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Current status: <strong>{st.label}</strong>
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ============ TAB 2: Bias Report ============ */}
            {activeTab === 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{
                                fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 1,
                                display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <BiasIcon sx={{ color: '#10b981' }} /> Bias Analysis Report
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                                Results from the automated bias detection engine
                            </Typography>

                            {Object.keys(bias).length > 0 ? (
                                <Grid container spacing={3}>
                                    {/* Risk Level */}
                                    {bias.risk_level && (
                                        <Grid item xs={12}>
                                            <Box sx={{
                                                p: 3, borderRadius: 2, textAlign: 'center',
                                                background: bias.risk_level === 'low'
                                                    ? 'rgba(16,185,129,0.08)'
                                                    : bias.risk_level === 'medium'
                                                        ? 'rgba(245,158,11,0.08)'
                                                        : 'rgba(239,68,68,0.08)',
                                                border: `1px solid ${bias.risk_level === 'low' ? '#10b98133'
                                                    : bias.risk_level === 'medium' ? '#f59e0b33'
                                                        : '#ef444433'
                                                    }`,
                                            }}>
                                                <Typography variant="overline" sx={{ color: '#94a3b8' }}>
                                                    Overall Bias Risk
                                                </Typography>
                                                <Typography variant="h3" sx={{
                                                    fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    color: bias.risk_level === 'low' ? '#10b981'
                                                        : bias.risk_level === 'medium' ? '#f59e0b'
                                                            : '#ef4444',
                                                }}>
                                                    {bias.risk_level}
                                                </Typography>
                                                {bias.risk_level === 'low' && (
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                        ✅ No significant bias indicators detected
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Detected Issues */}
                                    {bias.detected_items && bias.detected_items.length > 0 && (
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle2" sx={{ color: '#f59e0b', mb: 1.5, fontWeight: 600 }}>
                                                ⚠️ Detected Bias Indicators
                                            </Typography>
                                            {bias.detected_items.map((item, i) => (
                                                <Box key={i} sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                                    p: 1.5, mb: 1, borderRadius: 2,
                                                    background: 'rgba(245,158,11,0.06)',
                                                    border: '1px solid rgba(245,158,11,0.12)',
                                                }}>
                                                    <WarningIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                                            {item.type || item.category || 'Bias indicator'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.detail || item.description || JSON.stringify(item)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Grid>
                                    )}

                                    {/* Gendered terms */}
                                    {bias.gendered_terms && bias.gendered_terms.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                                                    Gendered Terms Found
                                                </Typography>
                                                {bias.gendered_terms.map((term, i) => (
                                                    <Chip key={i} label={term} size="small" sx={{
                                                        mr: 0.5, mb: 0.5, fontSize: '0.65rem',
                                                        background: 'rgba(236,72,153,0.1)', color: '#f472b6',
                                                    }} />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Age indicators */}
                                    {bias.age_indicators && bias.age_indicators.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                            <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                                                    Age Indicators Found
                                                </Typography>
                                                {bias.age_indicators.map((ind, i) => (
                                                    <Chip key={i} label={ind} size="small" sx={{
                                                        mr: 0.5, mb: 0.5, fontSize: '0.65rem',
                                                        background: 'rgba(245,158,11,0.1)', color: '#fbbf24',
                                                    }} />
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Full JSON */}
                                    <Grid item xs={12}>
                                        <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', mb: 1, display: 'block' }}>
                                                Full Bias Analysis JSON
                                            </Typography>
                                            <Box sx={{
                                                p: 2, borderRadius: 1, maxHeight: 200, overflow: 'auto',
                                                background: 'rgba(0,0,0,0.3)',
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '0.72rem', color: '#86efac', lineHeight: 1.6,
                                                whiteSpace: 'pre-wrap',
                                            }}>
                                                {JSON.stringify(bias, null, 2)}
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <BiasIcon sx={{ fontSize: 56, color: '#10b981', opacity: 0.2, mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        No bias analysis data available
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        This could mean analysis hasn't run yet or no issues were found
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ============ TAB 3: Original Resume ============ */}
            {activeTab === 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6" sx={{
                                    fontFamily: "'Outfit', sans-serif", fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 1,
                                }}>
                                    <FileIcon sx={{ color: '#94a3b8' }} /> Original Resume Text
                                </Typography>
                                {c.original_text && (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Tooltip title={copied ? 'Copied!' : 'Copy text'}>
                                            <IconButton size="small" onClick={() => copyToClipboard(c.original_text)}>
                                                <CopyIcon sx={{ fontSize: 16, color: '#64748b' }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>

                            {c.original_text ? (
                                <>
                                    <Box sx={{
                                        p: 3, borderRadius: 2,
                                        background: 'rgba(0,0,0,0.02)',
                                        border: '1px solid rgba(0,0,0,0.06)',
                                        maxHeight: showFullText ? 'none' : 500,
                                        overflow: 'hidden',
                                        position: 'relative',
                                    }}>
                                        <Typography variant="body2" sx={{
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            fontFamily: "'Inter', sans-serif",
                                            fontSize: '0.82rem',
                                            color: '#334155',
                                            lineHeight: 1.8,
                                        }}>
                                            {c.original_text}
                                        </Typography>
                                        {!showFullText && c.original_text.length > 1500 && (
                                            <Box sx={{
                                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                                height: 80,
                                                background: 'linear-gradient(transparent, rgba(255,255,255,0.95))',
                                            }} />
                                        )}
                                    </Box>
                                    {c.original_text.length > 1500 && (
                                        <Button
                                            onClick={() => setShowFullText(!showFullText)}
                                            startIcon={showFullText ? <CollapseIcon /> : <ExpandIcon />}
                                            sx={{ mt: 2, textTransform: 'none', color: '#6366f1' }}
                                        >
                                            {showFullText ? 'Show Less' : `Show Full Resume (${c.original_text.length.toLocaleString()} chars)`}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <FileIcon sx={{ fontSize: 56, color: '#4a5568', opacity: 0.3, mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Original text not available
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        The resume text may not have been extracted yet
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* ============ Footer Meta ============ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <Box sx={{
                    mt: 4, pt: 3,
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex', gap: 3, flexWrap: 'wrap',
                }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                        ID: {c.id}
                    </Typography>
                    {c.created_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Created: {new Date(c.created_at).toLocaleString()}
                        </Typography>
                    )}
                    {c.updated_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Updated: {new Date(c.updated_at).toLocaleString()}
                        </Typography>
                    )}
                    {c.expires_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            Expires: {new Date(c.expires_at).toLocaleString()} (GDPR)
                        </Typography>
                    )}
                </Box>
            </motion.div>
        </Box>
    );
}

export default CandidateDetailPage;
