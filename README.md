
# Getting Started

## Prerequisites

Make sure you have the following installed:
- **Node.js** (Latest LTS version recommended)
- **npm**

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/kitahara1/time-tracking-senja.git
   cd time-tracking-fe-1
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

## Running the Application

### Development Mode
Run the following command to start the development server:
   ```sh
   npm run dev
   ```
The application will be available at `http://localhost:3000`.

### Production Mode
To build and run the application in production mode:
   ```sh
   npm run build
   npm run start
   ```

## Environment Variables
Create a `.env` file and configure the required environment variables:
   ```sh
   NEXT_PUBLIC_API_URL=http://localhost:3003/api/v1
   ```

## Linting and Formatting
Run the following command to check and fix linting issues:
   ```sh
   npm run lint
   ```