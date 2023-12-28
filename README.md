# <img align="center" width=15% src="https://media.tenor.com/7GzWtl6kvcgAAAAi/bocchi-the-rock.gif"> TkVault | A Private File-Host Project
## Overview

This project is a private file-hosting website built using Express, Multer, and other dependencies. The website allows users to upload files, view uploaded files, and delete files using a password-based authentication system.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Routes](#routes)
- [Dependencies](#dependencies)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repository.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

The server will be accessible at `http://localhost:3000`.

## Configuration

The server can be configured using the `server.js` file. Modify the file as needed to adjust parameters such as port number, storage location, and rate limiting.

## Routes

- **Home Route** (`/`): Displays the list of uploaded files.t  

- **Delete Route** (`/delete/:fileName`):
  - Deletes an uploaded file using a provided password.

## Dependencies

- [Express](https://www.npmjs.com/package/express): Web application framework for Node.js.
- [Multer](https://www.npmjs.com/package/multer): Middleware for handling `multipart/form-data`.
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit): Middleware for rate limiting requests.
- [EJS](https://www.npmjs.com/package/ejs): Templating engine for rendering views.

## Notes

- Uploaded file information is stored in `uploadData.json`.
- Passwords are generated for each upload and required for deletion.

Feel free to explore and customize the code to fit your specific requirements. If you encounter any issues or have suggestions for improvement, please create an issue in the repository.
