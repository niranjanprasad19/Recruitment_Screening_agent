/**
 * RSA MVP Enhanced — MUI Theme Configuration
 * ============================================
 * Premium BRIGHT theme with custom palette, typography, and component overrides.
 */

import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#06b6d4',
            light: '#22d3ee',
            dark: '#0891b2',
            contrastText: '#ffffff',
        },
        error: {
            main: '#ef4444',
            light: '#f87171',
        },
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
        },
        success: {
            main: '#10b981',
            light: '#34d399',
        },
        info: {
            main: '#3b82f6',
            light: '#60a5fa',
        },
        background: {
            default: '#f8fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b',
            secondary: '#475569',
            disabled: '#94a3b8',
        },
        divider: 'rgba(0, 0, 0, 0.06)',
    },

    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        h1: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#1e293b',
        },
        h2: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: '#1e293b',
        },
        h3: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 700,
            color: '#1e293b',
        },
        h4: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
            color: '#1e293b',
        },
        h5: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
            color: '#1e293b',
        },
        h6: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
            color: '#1e293b',
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
        },
        body1: {
            color: '#334155',
        },
        body2: {
            color: '#475569',
        },
    },

    shape: {
        borderRadius: 12,
    },

    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    color: '#6366f1',
                    '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    },
                },
                text: {
                    color: '#6366f1',
                    '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: 16,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    border: 'none',
                },
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        backgroundColor: '#ffffff',
                        '& fieldset': {
                            borderColor: 'rgba(0, 0, 0, 0.12)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                        },
                        '& input': {
                            color: '#1e293b',
                        },
                    },
                    '& .MuiInputLabel-root': {
                        color: '#64748b',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#6366f1',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 600,
                },
                filled: {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: '#6366f1',
                    '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(0, 0, 0, 0.12)',
                    color: '#475569',
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                },
                bar: {
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                    color: '#1e293b',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    color: '#1e293b',
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                },
            },
        },
        MuiDialogTitle: {
            styleOverrides: {
                root: {
                    color: '#1e293b',
                    fontWeight: 700,
                },
            },
        },
        MuiDialogContent: {
            styleOverrides: {
                root: {
                    color: '#475569',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
                standardSuccess: {
                    backgroundColor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                },
                standardError: {
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                },
                standardWarning: {
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                },
                standardInfo: {
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                },
            },
        },
        MuiMenuItem: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.04)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        '&:hover': {
                            backgroundColor: 'rgba(99, 102, 241, 0.12)',
                        },
                    },
                },
            },
        },
    },
});

export default theme;
