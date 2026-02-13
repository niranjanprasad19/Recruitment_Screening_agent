/**
 * RSA MVP Enhanced — Jobs Page
 * ==============================
 * Create and manage job descriptions with
 * text input and file upload support.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    TextField, Chip, Alert, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Skeleton,
} from '@mui/material';
import {
    Add as AddIcon,
    Work as WorkIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Schedule as ScheduleIcon,
    Assessment as AnalyticsIcon,
} from '@mui/icons-material';
import { jobApi } from '../services/api';

function JobCard({ job, onDelete, index, navigate }) {
    const statusColors = {
        uploaded: '#3b82f6',
        parsing: '#f59e0b',
        parsed: '#f59e0b',
        compressing: '#8b5cf6',
        compressed: '#10b981',
        error: '#ef4444',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            layout
        >
            <Card
                sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${statusColors[job.status] || '#64748b'}, transparent)`,
                        borderRadius: '16px 16px 0 0',
                    },
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', flex: 1, mr: 1 }}>
                            {job.title}
                        </Typography>
                        <IconButton size="small" onClick={() => onDelete(job.id)} sx={{ color: '#ef4444', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                            <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>

                    {job.company && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            🏢 {job.company} {job.department ? `• ${job.department}` : ''}
                        </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <span className={`status-badge ${job.status}`}>
                            {job.status === 'compressed' ? '✓ ' : job.status === 'error' ? '✗ ' : ''}
                            {job.status}
                        </span>
                        {job.experience_range && (
                            <Chip
                                icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                                label={job.experience_range}
                                size="small"
                                sx={{ fontSize: '0.7rem', height: 24 }}
                            />
                        )}
                    </Box>

                    {/* Skills */}
                    {(job.required_skills?.length > 0 || job.preferred_skills?.length > 0) && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                                Required Skills
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {(job.required_skills || []).slice(0, 6).map((skill) => (
                                    <Chip
                                        key={skill}
                                        label={skill}
                                        size="small"
                                        sx={{
                                            fontSize: '0.65rem',
                                            height: 22,
                                            background: 'rgba(99,102,241,0.08)',
                                            color: '#6366f1',
                                        }}
                                    />
                                ))}
                                {(job.required_skills || []).length > 6 && (
                                    <Chip label={`+${job.required_skills.length - 6}`} size="small" sx={{ fontSize: '0.65rem', height: 22 }} />
                                )}
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <Typography variant="caption" color="text.secondary">
                            Created: {new Date(job.created_at).toLocaleDateString()}
                        </Typography>
                        <Button
                            size="small"
                            startIcon={<AnalyticsIcon sx={{ fontSize: 16 }} />}
                            onClick={() => navigate(`/job/${job.id}/analytics`)}
                            sx={{
                                fontSize: '0.7rem', textTransform: 'none', fontWeight: 600,
                                color: '#6366f1', borderRadius: 2,
                                '&:hover': { background: 'rgba(99,102,241,0.08)' },
                            }}
                        >
                            Analytics
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function JobsPage() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        department: '',
        description_text: '',
    });

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const response = await jobApi.list();
            setJobs(response.data.jobs || []);
        } catch (err) {
            // Demo data fallback
            setJobs([
                {
                    id: '1', title: 'Senior Python Developer', company: 'TechCorp', department: 'Engineering',
                    status: 'compressed', required_skills: ['Python', 'Django', 'AWS', 'Docker', 'PostgreSQL'],
                    preferred_skills: ['React', 'Kubernetes'], experience_range: '5-8 years',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '2', title: 'Full Stack Engineer', company: 'StartupXYZ', department: 'Product',
                    status: 'compressed', required_skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
                    preferred_skills: ['TypeScript', 'GraphQL'], experience_range: '3-5 years',
                    created_at: new Date().toISOString(),
                },
                {
                    id: '3', title: 'ML Engineer', company: 'DataCo', department: 'AI Research',
                    status: 'compressing', required_skills: ['Python', 'PyTorch', 'TensorFlow'],
                    preferred_skills: ['NLP', 'Computer Vision'], experience_range: '4-7 years',
                    created_at: new Date().toISOString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.title.trim()) {
            setError('Job title is required');
            return;
        }

        try {
            await jobApi.create(formData);
            setSuccess('Job description created and queued for processing!');
            setDialogOpen(false);
            setFormData({ title: '', company: '', department: '', description_text: '' });
            fetchJobs();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create job description');
        }
    };

    const handleDelete = async (id) => {
        try {
            await jobApi.delete(id);
            setJobs((prev) => prev.filter((j) => j.id !== id));
            setSuccess('Job description deleted');
        } catch (err) {
            setError('Failed to delete job description');
        }
    };

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
                            Job Descriptions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage job descriptions for candidate matching
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" onClick={fetchJobs} startIcon={<RefreshIcon />}>
                            Refresh
                        </Button>
                        <Button variant="contained" onClick={() => setDialogOpen(true)} startIcon={<AddIcon />}>
                            New Job
                        </Button>
                    </Box>
                </Box>
            </motion.div>

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

            {/* Jobs Grid */}
            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rounded" height={250} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : jobs.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <WorkIcon sx={{ fontSize: 64, color: '#64748b', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            No job descriptions yet
                        </Typography>
                        <Button variant="contained" onClick={() => setDialogOpen(true)} startIcon={<AddIcon />}>
                            Create Your First Job Description
                        </Button>
                    </Box>
                </motion.div>
            ) : (
                <Grid container spacing={3}>
                    <AnimatePresence>
                        {jobs.map((job, index) => (
                            <Grid item xs={12} sm={6} md={4} key={job.id}>
                                <JobCard job={job} onDelete={handleDelete} index={index} navigate={navigate} />
                            </Grid>
                        ))}
                    </AnimatePresence>
                </Grid>
            )}

            {/* Create Job Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    Create New Job Description
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1 }}>
                        <TextField
                            fullWidth
                            label="Job Title *"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Company"
                                    value={formData.company}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    label="Department"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                        <TextField
                            fullWidth
                            label="Job Description"
                            multiline
                            rows={10}
                            value={formData.description_text}
                            onChange={(e) => setFormData({ ...formData, description_text: e.target.value })}
                            placeholder="Paste the full job description here. Include required skills, experience, responsibilities, and education requirements..."
                            helperText="Our AI will automatically extract skills, experience requirements, and more."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleCreate} variant="contained" startIcon={<AddIcon />}>
                        Create & Process
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default JobsPage;
