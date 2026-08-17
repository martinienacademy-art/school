// ============================================================
// CONFIGURATION GLOBALE DU BACKEND
// ============================================================

module.exports = {
    PORT: process.env.PORT || 3001,
    JWT_SECRET: process.env.JWT_SECRET || 'masterflow_secret_jwt_2025',
    JWT_EXPIRES: '7d',
};
