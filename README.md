
# 📱 Filuick Pay - AuthDemo

![Angular](https://img.shields.io/badge/Angular-v18.2.5-red) ![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

**Filuick Pay AuthDemo** is a dynamic Angular application showcasing a complete authentication flow along with a responsive dashboard layout. This project was built using Angular CLI version 18.2.5 and follows a modular architecture pattern, making it easy to extend and maintain.

## 🚀 Project Overview

The Filuick Pay AuthDemo provides a clean and structured authentication system that includes user registration, login, and role-based dashboard access. It incorporates multiple modules for a seamless user experience, such as:

- **Policies Management**
- **Payments Handling**
- **Claims Processing**
- **Customer Support**
- **User Profile Management**

## ✨ Key Features

- **🔑 User Authentication**: Handles user registration, login, and session management.
- **📱 Responsive Design**: The application layout is optimized for all screen sizes.
- **📁 Modular Structure**: Separates functionality into various modules for better code organization.
- **🔔 Toast Notifications**: Integrated `ngx-toastr` for clean and intuitive alerts.
- **🗂️ Clean Architecture**: Structured folder layout and reusable components.

## 📋 Table of Contents

- [Installation](#installation)
- [Development Server](#development-server)
- [Build](#build)
- [Running Unit Tests](#running-unit-tests)
- [Running End-to-End Tests](#running-end-to-end-tests)
- [Routing & Navigation](#routing--navigation)
- [Additional Features](#additional-features)
- [Further Help](#further-help)
- [License](#license)

## 🛠️ Installation

To set up the project locally, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/auth-demo.git
   ```

2. **Navigate to the project directory**:
   ```bash
   cd auth-demo
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

## 🔧 Development Server

To start the development server, run the following command:

```bash
ng serve
```

Open your browser and navigate to http://localhost:4200/. The application will automatically reload if you make changes to any source files.

## 🏗️ Build

To build the project, use:

```bash
ng build
```

The build artifacts will be stored in the dist/ directory. For production builds, run:

## ✅ Running Unit Tests

Execute the unit tests using Karma:

```bash
ng test
```

To see a code coverage report, run:

```bash
ng test --code-coverage

```

## 🌐 Running End-to-End Tests

Run end-to-end tests using a preferred testing platform (e.g., Protractor or Cypress):

```bash
ng e2e

```

Note: You may need to install a package that supports end-to-end testing capabilities.

## 🚦 Routing & Navigation

The application uses Angular Router to navigate between different routes:

- [/login](#login) - Login page
- [/register](#register) - Registration page
- [/dashboard](#dashboard) - Main dashboard after login
- [/policies](#policies) - Policies management page
- [/payments](#payments) - Payments overview
- [/claims](#claims) - Claims handling
- [/profile](#profile) - User profile management
- [/support](#support) - Customer support page

## Additional Features

Global Styling and Theming: Uses Nunito fonts, custom CSS, and FontAwesome icons for a modern UI.
Form Validation: Built-in form validation for secure and smooth login/registration experience.
Responsive Layout: Adapts to different screen sizes for a consistent look and feel.
Reusable Components: The dashboard and related modules are wrapped inside a LayoutComponent to ensure UI consistency.

## 📚 Further Help

For more information on Angular CLI commands, refer to the official [Angular CLI Overview and Command Reference](https://angular.dev/cli).

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
