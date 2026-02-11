/**
 * RSA MVP Enhanced — MUI Theme Configuration
 * ============================================
 * Premium dark theme with custom palette, typography, and component overrides.
 */

import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'dark',
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
            default: '#0f0f1a',
            paper: '#1a1a2e',
        },
        text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
        },
        divider: 'rgba(255, 255, 255, 0.08)',
    },

    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        h1: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 800,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 700,
        },
        h4: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
        },
        h5: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
        },
        h6: {
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 600,
        },
        button: {
            fontWeight: 600,
            textTransform: 'none',
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
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.25)',
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    },
                },
                outlined: {
                    borderColor: 'rgba(99, 102, 241, 0.5)',
                    '&:hover': {
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: 'rgba(26, 26, 46, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        boxShadow: '0 0 30px rgba(99, 102, 241, 0.1)',
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: 'rgba(26, 26, 46, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(99, 102, 241, 0.5)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#6366f1',
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    fontWeight: 500,
                },
                filled: {
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.25)',
                    },
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    height: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
                    backgroundColor: '#1a1a2e',
                    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(15, 15, 26, 0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: 'none',
                },
            },
        },
    },
});

export default theme;
