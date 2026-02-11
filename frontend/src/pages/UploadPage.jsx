/**
 * RSA MVP Enhanced — Upload Page
 * =================================
 * Drag-and-drop resume upload with animated storytelling timeline
 * showing the processing journey: Upload → Parse → Compress → Ready.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    LinearProgress, Chip, TextField, Alert, IconButton,
    List, ListItem, ListItemIcon, ListItemText, Avatar,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    InsertDriveFile as FileIcon,
    CheckCircle as CheckIcon,
    Error as ErrorIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Description as DocIcon,
    PictureAsPdf as PdfIcon,
    TextSnippet as TxtIcon,
} from '@mui/icons-material';
import { resumeApi } from '../services/api';

// Processing step timeline data
const PROCESSING_STEPS = [
    { id: 1, label: 'Upload', description: 'File received & validated', icon: '📤' },
    { id: 2, label: 'Parse', description: 'Extracting text from document', icon: '📄' },
    { id: 3, label: 'Analyze', description: 'NLP bias detection & neutralization', icon: '🔍' },
    { id: 4, label: 'Compress', description: 'AI extracts skills & experience', icon: '🧠' },
    { id: 5, label: 'Embed', description: 'Generating semantic vectors', icon: '🔢' },
    { id: 6, label: 'Ready', description: 'Candidate ready for matching!', icon: '✅' },
];

function getFileIcon(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'pdf': return <PdfIcon sx={{ color: '#ef4444' }} />;
        case 'docx': case 'doc': return <DocIcon sx={{ color: '#3b82f6' }} />;
        case 'txt': return <TxtIcon sx={{ color: '#10b981' }} />;
        default: return <FileIcon sx={{ color: '#94a3b8' }} />;
    }
}

// Animated processing timeline component
function ProcessingTimeline({ currentStep }) {
    return (
        <Box sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {/* Connection line */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '5%',
                        right: '5%',
                        height: 2,
                        background: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-50%)',
                        zIndex: 0,
                    }}
                />
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '5%',
                        height: 2,
                        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                        transform: 'translateY(-50%)',
                        zIndex: 1,
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(100, ((currentStep - 1) / (PROCESSING_STEPS.length - 1)) * 90)}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                />

                {PROCESSING_STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = step.id < currentStep;
                    const isPending = step.id > currentStep;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            style={{ zIndex: 2, textAlign: 'center', flex: 1 }}
                        >
                            <motion.div
                                animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
                            >
                                <Box
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mx: 'auto',
                                        mb: 1,
                                        fontSize: '1.3rem',
                                        background: isCompleted
                                            ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                                            : isActive
                                                ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                                                : 'rgba(255,255,255,0.06)',
                                        border: isActive ? '2px solid #818cf8' : '2px solid transparent',
                                        boxShadow: isActive ? '0 0 20px rgba(99,102,241,0.4)' : 'none',
                                        transition: 'all 300ms ease',
                                    }}
                                >
                                    {isCompleted ? '✓' : step.icon}
                                </Box>
                            </motion.div>
                            <Typography
                                variant="caption"
                                sx={{
                                    display: 'block',
                                    fontWeight: isActive || isCompleted ? 600 : 400,
                                    color: isActive ? '#818cf8' : isCompleted ? '#34d399' : '#64748b',
                                    fontSize: '0.7rem',
                                }}
                            >
                                {step.label}
                            </Typography>
                        </motion.div>
                    );
                })}
            </Box>
        </Box>
    );
}

function UploadPage() {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState([]);
    const [processingStep, setProcessingStep] = useState(0);
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [error, setError] = useState('');

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setError('');
        if (rejectedFiles.length > 0) {
            setError('Some files were rejected. Only PDF, DOCX, TXT files up to 10MB are allowed.');
        }
        setFiles((prev) => [...prev, ...acceptedFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/msword': ['.doc'],
        },
        maxSize: 10 * 1024 * 1024,
        multiple: true,
    });

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        setUploadResults([]);

        // Animate through processing steps
        const animateSteps = () => {
            let step = 1;
            const interval = setInterval(() => {
                setProcessingStep(step);
                step++;
                if (step > PROCESSING_STEPS.length) {
                    clearInterval(interval);
                }
            }, 800);
            return interval;
        };

        const stepInterval = animateSteps();

        try {
            if (files.length === 1) {
                const response = await resumeApi.upload(files[0], candidateName, candidateEmail);
                setUploadResults([{ filename: files[0].name, status: 'success', data: response.data }]);
            } else {
                const response = await resumeApi.uploadBatch(files);
                const results = (response.data.queued || []).map((r) => ({ ...r, status: 'success' }));
                const errors = (response.data.errors || []).map((e) => ({ ...e, status: 'error' }));
                setUploadResults([...results, ...errors]);
            }
        } catch (err) {
            const detail = err.response?.data?.detail;
            let errorMsg = 'Upload failed. Please try again.';
            if (typeof detail === 'string') errorMsg = detail;
            else if (Array.isArray(detail)) errorMsg = detail.map(d => d.msg || JSON.stringify(d)).join('; ');
            setError(errorMsg);
            clearInterval(stepInterval);
            setProcessingStep(0);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFiles([]);
        setUploadResults([]);
        setProcessingStep(0);
        setCandidateName('');
        setCandidateEmail('');
        setError('');
    };

    return (
        <Box>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
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
                    Upload Resumes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Drop your candidate resumes here — our AI will extract skills, experience, and prepare them for matching
                </Typography>
            </motion.div>

            {/* Processing Timeline (shows during upload) */}
            <AnimatePresence>
                {processingStep > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Card sx={{ mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 2 }}>
                                    🚀 Processing Journey
                                </Typography>
                                <ProcessingTimeline currentStep={processingStep} />
                                {processingStep < PROCESSING_STEPS.length && (
                                    <LinearProgress
                                        variant="determinate"
                                        value={(processingStep / PROCESSING_STEPS.length) * 100}
                                        sx={{ mt: 2, borderRadius: 2 }}
                                    />
                                )}
                                {processingStep >= PROCESSING_STEPS.length && (
                                    <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                                        All files processed successfully! Candidates are now ready for matching.
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Grid container spacing={3}>
                {/* Drop Zone */}
                <Grid item xs={12} md={7}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card>
                            <CardContent sx={{ p: 0 }}>
                                <Box
                                    {...getRootProps()}
                                    sx={{
                                        p: 6,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        borderRadius: 3,
                                        border: '2px dashed',
                                        borderColor: isDragActive ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                        background: isDragActive
                                            ? 'rgba(99,102,241,0.08)'
                                            : 'rgba(255,255,255,0.02)',
                                        transition: 'all 300ms ease',
                                        '&:hover': {
                                            borderColor: 'rgba(99,102,241,0.5)',
                                            background: 'rgba(99,102,241,0.04)',
                                        },
                                        mx: 2,
                                        my: 2,
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    <motion.div
                                        animate={isDragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <UploadIcon
                                            sx={{
                                                fontSize: 64,
                                                color: isDragActive ? '#6366f1' : '#64748b',
                                                mb: 2,
                                            }}
                                        />
                                    </motion.div>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                        {isDragActive ? '🎯 Drop files here!' : 'Drag & drop resumes'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        or click to browse • PDF, DOCX, TXT • Max 10MB each
                                    </Typography>
                                </Box>

                                {/* File List */}
                                <AnimatePresence>
                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <List sx={{ px: 2, pb: 2 }}>
                                                {files.map((file, index) => (
                                                    <motion.div
                                                        key={`${file.name}-${index}`}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                    >
                                                        <ListItem
                                                            sx={{
                                                                borderRadius: 2,
                                                                mb: 1,
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                            }}
                                                            secondaryAction={
                                                                <IconButton edge="end" onClick={() => removeFile(index)} disabled={uploading}>
                                                                    <DeleteIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                                                                </IconButton>
                                                            }
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                                {getFileIcon(file.name)}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={file.name}
                                                                secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                                                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                                                                secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                                            />
                                                        </ListItem>
                                                    </motion.div>
                                                ))}
                                            </List>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Candidate Info & Actions */}
                <Grid item xs={12} md={5}>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Card sx={{ mb: 3 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 2 }}>
                                    Candidate Details (Optional)
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Candidate Name"
                                    value={candidateName}
                                    onChange={(e) => setCandidateName(e.target.value)}
                                    sx={{ mb: 2 }}
                                    size="small"
                                    disabled={uploading || files.length > 1}
                                    helperText={files.length > 1 ? "Names extracted automatically for batch uploads" : ""}
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={candidateEmail}
                                    onChange={(e) => setCandidateEmail(e.target.value)}
                                    sx={{ mb: 3 }}
                                    size="small"
                                    disabled={uploading || files.length > 1}
                                />

                                {error && (
                                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                        {error}
                                    </Alert>
                                )}

                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        onClick={handleUpload}
                                        disabled={files.length === 0 || uploading}
                                        startIcon={uploading ? null : <UploadIcon />}
                                        sx={{ py: 1.5 }}
                                    >
                                        {uploading ? 'Processing...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
                                    </Button>
                                    {(files.length > 0 || uploadResults.length > 0) && (
                                        <Button
                                            variant="outlined"
                                            onClick={resetForm}
                                            disabled={uploading}
                                            sx={{ minWidth: 'auto', px: 2 }}
                                        >
                                            <RefreshIcon />
                                        </Button>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Upload Results */}
                        <AnimatePresence>
                            {uploadResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card>
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, mb: 2 }}>
                                                Upload Results
                                            </Typography>
                                            {uploadResults.map((result, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            p: 1.5,
                                                            mb: 1,
                                                            borderRadius: 2,
                                                            background: result.status === 'success'
                                                                ? 'rgba(16,185,129,0.08)'
                                                                : 'rgba(239,68,68,0.08)',
                                                            border: `1px solid ${result.status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                                        }}
                                                    >
                                                        {result.status === 'success' ? (
                                                            <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} />
                                                        ) : (
                                                            <ErrorIcon sx={{ color: '#ef4444', fontSize: 20 }} />
                                                        )}
                                                        <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
                                                            {result.filename || result.id}
                                                        </Typography>
                                                        <Chip
                                                            label={result.status}
                                                            size="small"
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                height: 20,
                                                                fontWeight: 600,
                                                                backgroundColor: result.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                                                color: result.status === 'success' ? '#34d399' : '#f87171',
                                                            }}
                                                        />
                                                    </Box>
                                                </motion.div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
}

export default UploadPage;
