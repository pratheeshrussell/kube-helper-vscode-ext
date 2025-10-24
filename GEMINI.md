# GEMINI.md

## Project Overview

This project is a Visual Studio Code extension named "Kube Helper" that simplifies Kubernetes management. It provides a user-friendly interface within VSCode to interact with Kubernetes clusters, offering features like resource listing, editing, log viewing, and command execution.

The extension is built with TypeScript for the backend and Vue.js with PrimeVue for the frontend, which is displayed in a webview. The backend and frontend communicate through messages, and the extension uses the `kubectl` command-line tool to interact with Kubernetes clusters.

## Building and Running

### Prerequisites

*   Node.js and npm
*   `kubectl`

### Build

To build the extension and the webview, run the following command from the root directory:

```bash
npm run compile
```

This command will install the dependencies for both the extension and the webview, and then it will build both parts.

### Running in Development

To run the extension in a development environment, follow these steps:

1.  Open the project in Visual Studio Code.
2.  Press `F5` to start a new VSCode window with the extension loaded.
3.  The Kube Helper icon will appear in the activity bar. Click on it to open the sidebar.

### Testing

To run the tests for the extension, use the following command:

```bash
npm test
```

## Development Conventions

*   **Linting:** The project uses ESLint for code linting. To run the linter, use the command `npm run lint`.
*   **Type Checking:** The project uses TypeScript for static type checking. To check for type errors, use the command `npm run check-types`.
*   **Code Style:** The code follows the standard TypeScript and Vue.js conventions.
*   **Contribution:** Contributions are welcome. Please refer to the `README.md` file for more information.


To validate builds
run npm run compile:view from root folder. dont have to run the test command as there are no tests written