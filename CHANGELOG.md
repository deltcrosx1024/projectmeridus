# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Comprehensive input validation for Discord interactions (headers, timestamps, body size)
- Request size limits (1MB) and timeout handling for external API calls
- Enhanced error handling with better context, logging, and actionable error messages
- Production-safe configuration defaults in next.config.ts
- Security headers and best practices for production deployment
- Detailed README documentation covering architecture, setup, and usage
- Structured error responses with specific guidance for common failure scenarios
- Input validation for all GitHub API operations (repo format, PR numbers, titles, etc.)
- Fetch timeout wrapper to prevent hanging requests
- Command execution timing and performance monitoring
- Improved OAuth handling with better error recovery and validation

### Changed
- Updated error handling across services to provide more context and better debugging information
- Improved validation in verifyDiscordRequest function with timestamp tolerance checking
- Enhanced GitHub API functions with proper input validation and timeout handling
- Updated Next.js configuration for production readiness (security headers, compression, etc.)
- Improved logging throughout the application with contextual information
- Refactored error responses to be more user-friendly and actionable

### Fixed
- Potential timestamp validation bypass in Discord signature verification
- Missing input validation in various API endpoints
- Inadequate error handling that could leak internal details
- Missing timeout protection for external API calls
- Inconsistent error messaging and logging
- Security headers missing from Next.js configuration

### Security
- Added request size limits to prevent abuse
- Implemented proper timestamp validation to prevent replay attacks
- Enhanced input validation across all external interfaces
- Improved error handling to prevent information leakage
- Added security headers (HSTS, CSP, X-Frame-Options, etc.)
- Implemented proper abort controller usage for fetch requests

## [Previous Versions]
*Previous versions not tracked in this changelog*