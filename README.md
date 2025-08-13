# Ancient Lexicon CN (ALCN)

Welcome to [AncientLexiconCN (ALCN)](https://alcn.xinhe.de), a comprehensive dictionary dedicated to Greco-Roman name/term translations in Chinese with community-driven features, designed to help scholars, students, and enthusiasts navigate the complex world of ancient terminology.

## Features

- **Dictionary Management**: Create and manage Greco-Roman entries with etymological information
- **Community Translations**: Users can contribute translations with voting and preference systems
- **Advanced Search**: Full-text and fuzzy search capabilities across all content
- **Discussion System**: Nested comments on entries for scholarly discussion
- **Activity Dashboard**: Track recent entries, translations, and community activity
- **Multi-language Support**: Built-in internationalization for global accessibility
- **Automated Backups**: Scheduled database backups with API management endpoints


## Tech Stack

**Backend**: FastAPI with Python 3.11 provides a robust REST API with automatic OpenAPI documentation and high-performance async capabilities. PostgreSQL 17 serves as the primary database with full-text search using tsvector for advanced lexicon queries. The application uses SQLAlchemy ORM with Alembic migrations for database management, while Pydantic handles data validation and serialization.

**Frontend**: Next.js 15.4.6 with React and TypeScript delivers a modern, type-safe user interface with server-side rendering capabilities. Tailwind CSS provides utility-first styling with a custom archaeological theme, while the app supports internationalization with built-in translation management for multiple languages.

**Infrastructure**: Docker containerization enables consistent deployment across environments, with docker-compose orchestrating the backend services and PostgreSQL database. The frontend deploys seamlessly to Vercel with automatic CI/CD, while the backend can be hosted on any VPS with Docker support.

**Authentication & Security**: Email-based verification system using 6-digit codes eliminates password complexity while maintaining security. Role-based access control (admin, verified_translator, contributor) manages user permissions, and CORS configuration ensures secure API access from the frontend.


## ALCN Beta
[ALCN Beta](https://xinhe-yu.github.io/ALCN/) is no longer under active development, it remains accessible as a testament to vanilla web development craftsmanship—built entirely without frameworks.
