/**
 * RSA MVP Enhanced — Candidate Detail Page
 * ==========================================
 * Detailed view of a candidate profile with:
 * - Workable-inspired 3-column layout
 * - Resume summary, skills, experience, and education
 * - Role-based actions (Delete)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    Chip, Avatar, Divider, IconButton, Tab, Tabs,
    LinearProgress, List, ListItem, ListItemText, ListItemIcon,
    Alert, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText
} from '@mui/material';
import {
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    CloudDownload as DownloadIcon,
    Delete as DeleteIcon,
    ArrowBack as BackIcon,
    Work as WorkIcon,
    School as SchoolIcon,
    Code as SkillIcon,
    Description as FileIcon,
    Timeline as TimelineIcon,
    VerifiedUser as VerifiedIcon,
    Warning as WarningIcon,
    Event as DateIcon,
    AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { resumeApi } from '../services/api';

// --- Components ---

function InfoRow({ icon, label, value }) {
    if (!value) return null;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ color: 'text.secondary', mr: 1.5, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={500}>{value}</Typography>
            </Box>
        </Box>
    );
}

function ExperienceItem({ exp, isLast }) {
    return (
        <Box sx={{ position: 'relative', pl: 3, pb: isLast ? 0 : 3 }}>
            {/* Timeline Line */}
            {!isLast && (
                <Box sx={{
                    position: 'absolute', left: 11, top: 24, bottom: 0,
                    width: 2, background: 'rgba(0,0,0,0.06)'
                }} />
            )}
            {/* Timeline Dot */}
            <Box sx={{
                position: 'absolute', left: 0, top: 4,
                width: 24, height: 24, borderRadius: '50%',
                background: '#f0f4ff', color: '#6366f1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem'
            }}>
                <WorkIcon fontSize="inherit" />
            </Box>

            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {exp.title || 'Role Not Specified'}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
                {exp.company}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <DateIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                    {exp.duration || 'Date Unknown'}
                </Typography>
            </Box>
            {exp.description && (
                <Typography variant="body2" color="text.secondary" sx={{
                    background: '#f8fafc', p: 1.5, borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.04)'
                }}>
                    {exp.description}
                </Typography>
            )}
        </Box>
    );
}

function EducationItem({ edu }) {
    return (
        <Card variant="outlined" sx={{ mb: 2, border: 'none', background: '#f8fafc' }}>
            <CardContent sx={{ p: '16px !important', display: 'flex', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#e0f2fe', color: '#0284c7', width: 40, height: 40 }}>
                    <SchoolIcon fontSize="small" />
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                        {edu.degree || 'Degree Not Specified'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {edu.institution || 'Institution Unknown'}
                    </Typography>
                    {edu.year && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Class of {edu.year}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}

// --- Main Page ---

function CandidateDetailPage() {
    const { candidateId } = useParams();
    const navigate = useNavigate();

    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Auth Check
    const user = JSON.parse(localStorage.getItem('rsa_user') || '{}');
    const canDelete = ['admin', 'recruiter', 'hiring_manager'].includes(user.role);

    useEffect(() => {
        fetchCandidate();
    }, [candidateId]);

    const fetchCandidate = async () => {
        try {
            const response = await resumeApi.get(candidateId);
            setCandidate(response.data);
        } catch (err) {
            setError('Failed to load candidate details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await resumeApi.delete(candidateId);
            navigate('/candidates'); // proper redirect
        } catch (err) {
            alert('Failed to delete candidate: ' + (err.safeMessage || 'Unknown error'));
        }
    };

    const handleDownload = async () => {
        try {
            const response = await resumeApi.download(candidateId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', candidate.file_name || `resume-${candidateId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to download resume. Ensure the file still exists on the server.');
        }
    };

    // Ensure weights sum to ~1.0
    // (This comment is from MatchingPage, but we are editing CandidateDetailPage... oh, I see. I'm just replacing the render.)

    if (loading) return <LinearProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!candidate) return <Alert severity="warning">Candidate not found</Alert>;

    const compressed = candidate.compressed_data || {};
    const experiences = compressed.experience || [];
    const education = compressed.education || [];
    // Clean up legacy parser artifacts
    const summary = (compressed.summary || 'No professional summary available.')
        .replace(/Resume contains \d+ words across \d+ sections\.?/g, '')
        .trim();

    return (
        <Box sx={{ pb: 5 }}>
            {/* 1. Hero Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Card sx={{ mb: 3, overflow: 'visible', borderRadius: 3 }}>
                    <Box sx={{
                        height: 120,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                        borderRadius: '12px 12px 0 0'
                    }} />
                    <CardContent sx={{ pt: 0, pb: 2, position: 'relative' }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'center', md: 'flex-end' }, mt: -6, px: 2 }}>
                            {/* Avatar */}
                            <Avatar
                                sx={{
                                    width: 120, height: 120,
                                    border: '4px solid white',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                    fontSize: '3rem',
                                    bgcolor: 'primary.main',
                                    mb: { xs: 2, md: 0 },
                                    mr: { md: 3 }
                                }}
                            >
                                {(candidate.name || '?')[0]}
                            </Avatar>

                            {/* Name & Title */}
                            <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' }, mb: { xs: 2, md: 1 } }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>
                                    {candidate.name}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {candidate.file_name?.split('.')[0] || 'Candidate'} • Added {new Date(candidate.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownload}
                                >
                                    Resume
                                </Button>
                                {canDelete && (
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => setOpenDeleteDialog(true)}
                                    >
                                        Delete
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>

            <Grid container spacing={3}>
                {/* 2. Main Content (Experience & Story) */}
                <Grid item xs={12} md={8}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                        {/* Summary Section */}
                        <Card sx={{ mb: 3, borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <WorkIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                    Professional Summary
                                </Typography>
                                <Typography variant="body1" sx={{ lineHeight: 1.7, color: 'text.primary' }}>
                                    {summary}
                                </Typography>
                            </CardContent>
                        </Card>

                        {/* Experience Section */}
                        <Card sx={{ mb: 3, borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center' }}>
                                    <TimelineIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                    Work Experience
                                </Typography>

                                {experiences.length > 0 ? (
                                    <Box sx={{ position: 'relative', borderLeft: '2px solid #e2e8f0', ml: 1, pl: 3, py: 1 }}>
                                        {experiences.map((exp, index) => (
                                            <Box key={index} sx={{ mb: 4, position: 'relative' }}>
                                                {/* Timeline Dot */}
                                                <Box sx={{
                                                    position: 'absolute', left: -31, top: 0,
                                                    width: 14, height: 14, borderRadius: '50%',
                                                    border: '2px solid white', bgcolor: 'primary.main',
                                                    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                                                }} />

                                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                                    {exp.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', mb: 0.5 }}>
                                                    {exp.company}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
                                                    {exp.duration || 'Dates not specified'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {exp.description}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined">No work experience extracted from resume.</Alert>
                                )}
                            </CardContent>
                        </Card>

                        {/* Education Section */}
                        <Card sx={{ borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <SchoolIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                                    Education
                                </Typography>
                                {education.length > 0 ? (
                                    education.map((edu, index) => (
                                        <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < education.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{edu.degree}</Typography>
                                            <Typography variant="body2" color="text.secondary">{edu.institution} • {edu.year}</Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No education details found.</Typography>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* 3. Right Sidebar (Facts & Stats) */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>

                        {/* Contact Info */}
                        <Card sx={{ mb: 3, borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>
                                    Contact Details
                                </Typography>
                                <InfoRow icon={<EmailIcon fontSize="small" />} label="Email" value={candidate.email} />
                                <InfoRow icon={<PhoneIcon fontSize="small" />} label="Phone" value={candidate.phone} />
                                <InfoRow icon={<LocationIcon fontSize="small" />} label="Status" value={
                                    <Chip label={candidate.status} size="small" color={candidate.status === 'compressed' ? 'success' : 'default'} />
                                } />
                            </CardContent>
                        </Card>

                        {/* Skills Cloud */}
                        <Card sx={{ mb: 3, borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2, textTransform: 'uppercase' }}>
                                    Skills
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {(candidate.skills && candidate.skills.length > 0) ? (
                                        candidate.skills.slice(0, 15).map((skill, idx) => (
                                            <Chip
                                                key={idx}
                                                label={skill}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#4f46e5', fontWeight: 500 }}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">No skills extracted.</Typography>
                                    )}
                                    {candidate.skills && candidate.skills.length > 15 && (
                                        <Chip label={`+${candidate.skills.length - 15} more`} size="small" variant="outlined" />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* AI Analysis Snapshot */}
                        <Card sx={{ mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
                            <CardContent>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center' }}>
                                    <AutoAwesomeIcon sx={{ fontSize: 16, mr: 1, color: '#8b5cf6' }} />
                                    AI Profile Analysis
                                </Typography>

                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">Total Experience</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {candidate.experience_years ? `${candidate.experience_years} Years` : 'N/A'}
                                    </Typography>
                                </Box>

                                {candidate.bias_flags && candidate.bias_flags.risk_level === 'high' && (
                                    <Alert severity="warning" sx={{ fontSize: '0.8rem' }}>
                                        Potential bias detected in resume wording.
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>

                    </motion.div>
                </Grid>
            </Grid>

            {/* Delete Confirmation */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Delete Candidate?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete <strong>{candidate.name}</strong>?
                        This action cannot be undone and will remove all associated data including resume files.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
                        Delete Permanently
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CandidateDetailPage;
