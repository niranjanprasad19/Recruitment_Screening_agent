/**
 * RSA MVP Enhanced — GDPR Compliance Page
 * ==========================================
 * Interactive GDPR management dashboard showing:
 * - Compliance status overview
 * - Data retention policy details
 * - Consent management
 * - Right to access (data export)
 * - Right to erasure (data deletion)
 * - Audit trail viewer
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Box, Typography, Card, CardContent, Grid, Button,
    Chip, Avatar, TextField, Alert, LinearProgress,
    Divider, Switch, FormControlLabel, Dialog,
    DialogTitle, DialogContent, DialogActions, Tooltip,
    List, ListItem, ListItemIcon, ListItemText,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow,
} from '@mui/material';
import {
    Shield as ShieldIcon,
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    History as HistoryIcon,
    Gavel as GavelIcon,
    Storage as StorageIcon,
    Security as SecurityIcon,
    VerifiedUser as VerifiedIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { gdprApi, resumeApi } from '../services/api';

function GdprPage() {
    const [status, setStatus] = useState(null);
    const [policy, setPolicy] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, id: '', name: '' });
    const [alert, setAlert] = useState({ show: false, severity: 'success', message: '' });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statusRes, policyRes, auditRes, candRes] = await Promise.all([
                gdprApi.getStatus(),
                gdprApi.getRetentionPolicy(),
                gdprApi.getAuditTrail(null, null, 20),
                resumeApi.list(1, 50),
            ]);
            setStatus(statusRes.data);
            setPolicy(policyRes.data);
            setAuditLogs(auditRes.data.logs || []);
            setCandidates(candRes.data.candidates || []);
        } catch (err) {
            // Demo fallback data
            setStatus({
                compliance_features: {
                    consent_management: true,
                    right_to_access: true,
                    right_to_erasure: true,
                    data_retention_policy: true,
                    audit_trail: true,
                    auto_cleanup: true,
                },
                statistics: {
                    total_candidates: 42,
                    expired_awaiting_cleanup: 2,
                    consent_records: 38,
                    data_deletions: 5,
                    data_exports: 12,
                    retention_days: 90,
                },
            });
            setPolicy({
                retention_days: 90,
                auto_cleanup: true,
                data_categories: [
                    { category: 'Personal Information', includes: 'Name, Email, Phone', retention: '90 days' },
                    { category: 'Resume Content', includes: 'Original text, parsed data', retention: '90 days' },
                    { category: 'AI-Processed Data', includes: 'Skills, embeddings, bias flags', retention: '90 days' },
                    { category: 'Match Results', includes: 'Scores, rankings', retention: '90 days' },
                    { category: 'Audit Logs', includes: 'Consent, deletion logs', retention: 'Indefinite' },
                ],
            });
            setAuditLogs([
                { id: '1', action: 'consent_given', entity_type: 'candidate', entity_id: 'c-001', created_at: new Date().toISOString(), details: { purpose: 'recruitment_screening' } },
                { id: '2', action: 'data_exported', entity_type: 'candidate', entity_id: 'c-002', created_at: new Date().toISOString(), details: { purpose: 'gdpr_right_of_access' } },
                { id: '3', action: 'data_erased', entity_type: 'candidate', entity_id: 'c-003', created_at: new Date().toISOString(), details: { reason: 'user_request' } },
            ]);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = async (candidateId) => {
        try {
            const res = await gdprApi.exportData(candidateId);
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gdpr_export_${candidateId}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('success', 'Data exported successfully (GDPR Article 15)');
            fetchAll();
        } catch (err) {
            showAlert('error', 'Failed to export data');
        }
    };

    const handleDeleteData = async () => {
        try {
            await gdprApi.deleteData('candidate', deleteDialog.id, 'user_request');
            showAlert('success', `All data for candidate permanently deleted (GDPR Article 17)`);
            setDeleteDialog({ open: false, id: '', name: '' });
            fetchAll();
        } catch (err) {
            showAlert('error', 'Failed to delete data');
        }
    };

    const handleRecordConsent = async (candidateId, consent) => {
        try {
            await gdprApi.recordConsent('candidate', candidateId, consent);
            showAlert('success', `Consent ${consent ? 'recorded' : 'withdrawn'} (GDPR Article 6)`);
            fetchAll();
        } catch (err) {
            showAlert('error', 'Failed to record consent');
        }
    };

    const showAlert = (severity, message) => {
        setAlert({ show: true, severity, message });
        setTimeout(() => setAlert({ ...alert, show: false }), 4000);
    };

    const getActionStyle = (action) => {
        const styles = {
            consent_given: { color: '#10b981', icon: '✅', label: 'Consent Given' },
            consent_withdrawn: { color: '#f59e0b', icon: '⚠️', label: 'Consent Withdrawn' },
            data_exported: { color: '#06b6d4', icon: '📥', label: 'Data Exported' },
            data_erased: { color: '#ef4444', icon: '🗑️', label: 'Data Erased' },
            created: { color: '#6366f1', icon: '➕', label: 'Created' },
            processed: { color: '#6366f1', icon: '⚙️', label: 'Processed' },
        };
        return styles[action] || { color: '#64748b', icon: '📋', label: action };
    };

    if (loading) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <LinearProgress sx={{ maxWidth: 400, mx: 'auto', mb: 2 }} />
                <Typography color="text.secondary">Loading GDPR dashboard...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <ShieldIcon sx={{ fontSize: 32, color: '#10b981' }} />
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: "'Outfit', sans-serif",
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        GDPR Compliance
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Manage data privacy, consent, access rights, and deletion requests
                </Typography>
            </motion.div>

            {/* Alert */}
            <AnimatePresence>
                {alert.show && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
                            {alert.message}
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Compliance Status Cards */}
            {status && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                        { label: 'Consent Records', value: status.statistics.consent_records, icon: <VerifiedIcon />, color: '#10b981' },
                        { label: 'Data Exports', value: status.statistics.data_exports, icon: <DownloadIcon />, color: '#06b6d4' },
                        { label: 'Data Deletions', value: status.statistics.data_deletions, icon: <DeleteIcon />, color: '#ef4444' },
                        { label: 'Retention (Days)', value: status.statistics.retention_days, icon: <StorageIcon />, color: '#f59e0b' },
                    ].map((stat, index) => (
                        <Grid item xs={6} md={3} key={stat.label}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                                <Card sx={{
                                    background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                                    border: `1px solid ${stat.color}22`,
                                }}>
                                    <CardContent sx={{ py: 2.5, px: 3, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: 1 }}>
                                                    {stat.label}
                                                </Typography>
                                                <Typography variant="h4" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: stat.color, lineHeight: 1.2, mt: 0.5 }}>
                                                    {stat.value}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ background: `${stat.color}20`, color: stat.color, width: 44, height: 44 }}>
                                                {stat.icon}
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Grid container spacing={3}>
                {/* Compliance Features */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    🛡️ Compliance Features
                                </Typography>
                                {status && Object.entries(status.compliance_features).map(([key, enabled], i) => {
                                    const labels = {
                                        consent_management: 'Consent Management (Art. 6)',
                                        right_to_access: 'Right to Access (Art. 15)',
                                        right_to_erasure: 'Right to Erasure (Art. 17)',
                                        data_retention_policy: 'Data Retention (Art. 5)',
                                        audit_trail: 'Audit Trail (Art. 30)',
                                        auto_cleanup: 'Auto Data Cleanup',
                                    };
                                    return (
                                        <motion.div key={key} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', gap: 1.5,
                                                py: 1.2, borderBottom: i < Object.keys(status.compliance_features).length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                                            }}>
                                                {enabled ? (
                                                    <CheckIcon sx={{ color: '#10b981', fontSize: 20 }} />
                                                ) : (
                                                    <WarningIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                                                )}
                                                <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                                    {labels[key] || key}
                                                </Typography>
                                                <Chip
                                                    label={enabled ? 'Active' : 'Inactive'}
                                                    size="small"
                                                    sx={{
                                                        fontSize: '0.6rem', height: 20,
                                                        background: enabled ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                        color: enabled ? '#34d399' : '#fbbf24',
                                                    }}
                                                />
                                            </Box>
                                        </motion.div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* Data Retention Policy */}
                        {policy && (
                            <Card sx={{ mt: 3 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                        📅 Data Retention Policy
                                    </Typography>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Category</TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Retention</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {(policy.data_categories || []).map((cat, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                                            {cat.category}
                                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                                                                {cat.includes}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.75rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                                            <Chip label={cat.retention} size="small" sx={{
                                                                fontSize: '0.6rem', height: 20,
                                                                background: cat.retention === 'Indefinite' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                                                                color: cat.retention === 'Indefinite' ? '#fbbf24' : '#6366f1',
                                                            }} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
                    </motion.div>
                </Grid>

                {/* Candidate Data Management */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, mb: 2 }}>
                                    👤 Data Management
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Export or delete candidate data per GDPR rights
                                </Typography>

                                {candidates.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <SecurityIcon sx={{ fontSize: 48, color: '#64748b', opacity: 0.3, mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">No candidates to manage</Typography>
                                        <Typography variant="caption" color="text.secondary">Upload resumes to see them here</Typography>
                                    </Box>
                                ) : (
                                    candidates.slice(0, 8).map((candidate, i) => (
                                        <motion.div key={candidate.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                                            <Box sx={{
                                                display: 'flex', alignItems: 'center', gap: 1.5,
                                                p: 1.5, mb: 1, borderRadius: 2,
                                                background: 'rgba(0,0,0,0.02)',
                                                border: '1px solid rgba(0,0,0,0.06)',
                                            }}>
                                                <Avatar sx={{ width: 32, height: 32, background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {(candidate.name || '?')[0]}
                                                </Avatar>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {candidate.name || candidate.file_name || 'Unknown'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                                        {candidate.email || candidate.id?.slice(0, 8)}
                                                    </Typography>
                                                </Box>
                                                <Tooltip title="Export Data (Art. 15)">
                                                    <Button size="small" sx={{ minWidth: 'auto', p: 0.5 }} onClick={() => handleExportData(candidate.id)}>
                                                        <DownloadIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip title="Delete Data (Art. 17)">
                                                    <Button size="small" sx={{ minWidth: 'auto', p: 0.5 }} onClick={() => setDeleteDialog({ open: true, id: candidate.id, name: candidate.name || 'Unknown' })}>
                                                        <DeleteIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                                                    </Button>
                                                </Tooltip>
                                            </Box>
                                        </motion.div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </Grid>

                {/* Audit Trail */}
                <Grid item xs={12} md={4}>
                    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <HistoryIcon sx={{ color: '#6366f1' }} />
                                    <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                                        Audit Trail
                                    </Typography>
                                    <Chip label="Art. 30" size="small" sx={{
                                        ml: 'auto', fontSize: '0.6rem', height: 20,
                                        background: 'rgba(99,102,241,0.12)', color: '#6366f1',
                                    }} />
                                </Box>

                                {auditLogs.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <HistoryIcon sx={{ fontSize: 48, color: '#64748b', opacity: 0.3, mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary">No audit logs yet</Typography>
                                    </Box>
                                ) : (
                                    auditLogs.map((log, i) => {
                                        const style = getActionStyle(log.action);
                                        return (
                                            <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.05 }}>
                                                <Box sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.5,
                                                    py: 1.2, borderBottom: i < auditLogs.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                                                }}>
                                                    <Typography sx={{ fontSize: '1.1rem' }}>{style.icon}</Typography>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                                            {style.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                                                            {log.entity_type}:{log.entity_id?.slice(0, 8)} • {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                                                        </Typography>
                                                    </Box>
                                                    <Chip label={log.entity_type} size="small" sx={{
                                                        fontSize: '0.55rem', height: 18,
                                                        background: 'rgba(0,0,0,0.04)', color: '#64748b',
                                                    }} />
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
                <DialogTitle sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                    ⚠️ Confirm Data Deletion
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        You are about to permanently delete all data for <strong>{deleteDialog.name}</strong>.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        This action is irreversible and includes:
                    </Typography>
                    <List dense>
                        {['Personal information (name, email, phone)', 'Uploaded resume file', 'AI-processed data (skills, embeddings)', 'Bias analysis results', 'Match scores'].map((item) => (
                            <ListItem key={item} sx={{ py: 0.3 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <DeleteIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                                </ListItemIcon>
                                <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                            </ListItem>
                        ))}
                    </List>
                    <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                        A record of this deletion will be kept in the audit trail as required by GDPR Article 30.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteData} variant="contained" color="error" startIcon={<DeleteIcon />}>
                        Permanently Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default GdprPage;
