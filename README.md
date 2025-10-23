# Tactorius / Arcane Chess

[![License: GNU GPL](https://img.shields.io/badge/License-GPL-blue.svg)](LICENSE)

![Screenshot of Arcane Chess](https://github.com/medavas/arcane-chess/blob/main/public/assets/pages/cerulean-boss.webp)

## Overview

Tactorius is a free, open-source, full-stack JavaScript spell chess variant platform featuring a single-player campaign and a built-in component library. It delivers an immersive chess experience with a comprehensive knowledge base covering rules, strategies, and philosophies.

## Features

- **Single-Player Campaign:** Dive into a narrative-driven chess experience against an AI.
- **Custom Component Library:** Leverage a set of reusable UI components.
- **Chess Knowledge Base:** Access detailed content on chess rules and strategies.

## Opportunities for Future Improvement

We welcome contributions to expand and enhance the project. Future work areas include:

- **Design & Styling:** Enhancements to the UI/UX.
- **Developer Guides:** Expanded documentation and tutorials for new contributors.
- **Automated Testing:** Improved testing infrastructure and coverage.
- **Multiplayer Exploration:** A spike to investigate the potential for multiplayer features.
- **Story Writing & Gameplay Adjustments:** Refining the narrative and tweaking gameplay mechanics.
- **Quality of Life Improvements:** General enhancements to usability and maintainability.
- **Game Mode Suggestions:** Ideas for additional or alternative game modes.

## Getting Started

### Prerequisites

- **Node.js:** Version v18.16.0 was used in local development.
- **npm:** Installed with Node.js.

### Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/medavas/arcane-chess.git
   cd arcane-chess
   ```

2. **Install Dependencies:**

   Using npm:

   ```bash
   npm install
   ```

3. **Running the Project Locally**

   **Frontend**

   Start the frontend development server:

   ```bash
   npm run dev
   ```

   **Backend**

   Start the backend server:

   ```bash
   npm run server
   ```

After launching both servers, refer to your project configuration for the correct local URLs.

## Project Structure

A brief overview of the project's folder layout:

```plaintext
arcane-chess/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application pages and routing
│   ├── services/           # API calls and business logic
│   ├── styles/             # Global and component-specific styles
│   └── utils/              # Utility functions and helpers
├── public/                 # Static assets (images, fonts, etc.)
├── docs/                   # Additional documentation
├── package.json            # Project metadata and scripts
└── README.md               # Project overview and setup guide
```

## Contact

For questions or further assistance, please open an issue or contact the maintainers.

## Acknowledgements

We would like to extend our gratitude to the open source Lichess projects for their incredible work and inspiration. Their contributions have greatly influenced our approach and continue to empower the chess community.

Special thanks to the maintainers of the puzzle database, and to this fork that leads to the [Chessground repository](https://github.com/medavas/night-chess-ui-2) for their valuable contributions.

For further thanks, please see the CREDITS.md file, and in the app: Manifest -> About
