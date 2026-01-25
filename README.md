# CashOps 💸

**CashOps** is a modern, high-performance personal finance dashboard designed for speed and clarity. Built with Next.js 14, Tailwind CSS, and Prisma, it helps you track expenses, analyze burn rates, and manage your financial health with an agentic-first workflow.

![CashOps Dashboard](https://your-screenshot-url-here.com)

## 🚀 Features

-   **High-Velocity Logging**:
    -   **Global Shortcut**: Press `Cmd+K` (or `Ctrl+K`) anywhere to log a transaction instantly.
    -   **Bulk Import**: Drag-and-drop CSV files to ingest bank statements in seconds.
-   **Smart Automation**:
    -   **Recurring Transactions**: Automatically generates fixed expenses (e.g., Rent, Netflix) when you log in.
-   **Deep Analytics**:
    -   **Burn Rate Chart**: Visualizes your daily spending velocity over the last 30 days (Red).
    -   **Income Rate Chart**: Tracks your daily earning velocity (Green).
    -   **Insight Cards**: Monthly breakdown, total balance, and category distribution.
-   **Privacy First**:
    -   **Guest Mode**: try it out instantly with local storage (no login required).
    -   **Secure Auth**: User accounts powered by NextAuth.js.
-   **Premium UX**:
    -   **Dark Mode**: Fully adaptive themes (Slate/Zinc).
    -   **Responsive**: Optimized for mobile and desktop.

## 🛠️ Tech Stack

-   **Framework**: Next.js 14 (App Router)
-   **Styling**: Tailwind CSS v4, Lucide Icons, Recharts
-   **Database**: SQLite (Dev) / PostgreSQL (Prod) via Prisma ORM
-   **Auth**: NextAuth.js
-   **Forms**: React Hook Form + Zod

## 🏁 Getting Started

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/AlfazMahmudRizve/CashOps.app.git
    cd CashOps.app
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Database**:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Run the app**:
    ```bash
    npm run dev
    ```

## 📖 User Manual

Check out the built-in [User Guide](/guide) (accessible via the sidebar) for details on shortcuts and advanced features.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)
