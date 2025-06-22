Airtable Clone-Project Overview"
About:
This project is a simplified Airtable-like web app built with HTML, JavaScript, Node.js, and MySQL.

1.User Login

Secure JWT-based login and register system.
Supports multiple users – each user sees only their own workspace and tables.


2.Workspace Page

Shows all saved bases (tables) for the logged-in user.

Includes Trash to view deleted bases and Restore them anytime.

Users can create new bases, open existing ones, or delete/restore them.


3.Table Editor

Inside a base, users can:

Add columns with different field types: Text, Number, Dropdown, Checkbox, Date, etc.

Add rows dynamically.

Edit cells directly inside the table.

Made with: HTML, CSS, JS (Frontend) + Node.js, Express (Backend) + MySQL (Database)

All table data (headers, types, and rows) is saved as JSON in MySQL.



4.Features

Easy navigation between Workspace and Trash.

Fast table editing and saving.

Each user has an isolated workspace.

