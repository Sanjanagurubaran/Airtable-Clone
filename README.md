# Airtable-Clone
Repository which consists the clone of airtable

 Airtable Clone – Project Overview:
This is a web-based Airtable Clone application that allows multiple users to create, manage, and edit their own tables online — just like Airtable or Excel.
Everything is personalized, secure, and easy to use.


1.User Login and Registration:
Each user must register using a unique username and password.
On successful registration, the user can log in.
After login, the user receives a JWT token that keeps them logged in securely.
All data (bases, tables, trash) is user-specific.
One user cannot see another user’s data.


2. Workspace Page :
Once logged in, the user is taken to the Workspace Page (airtablemain.html).
This page shows:
All active bases (tables) created by the user
A sidebar with:
  My Workspace – for current bases
  Trash – for deleted bases
  Logout – to end the session
Each Base is shown as a colorful card with a delete icon .
From here, users can:
  Create a new Base by clicking “Add Base”
  Open any Base and edit the table inside it
  Delete a Base, which sends it to the Trash
Go to Trash, view deleted Bases, and restore them anytime


3.Table Editor (createTable.html)
Each Base opens in a fully editable table page.
The editor allows users to design and fill custom tables with:
Adding Columns:
  Click on the “+” button to add a new column.
  Choose the field type:
    Text
    Number
    Dropdown (custom values)
    Checkbox
    Date
    Email
    Phone No
    URL
    Currency
    Rating
Adding Rows:
  Click “+ Add Row” to add more rows.
  For Dropdowns, the system will ask how many options you want to add.
  You can even add extra options later while adding rows.
Editing Table
  Every cell can be edited:
  Text fields allow typing
  Dropdowns allow selection
  Checkboxes can be ticked
  Numbers, Dates, etc. use appropriate input types
Saving Table
  The "Save Table" button will save:
  All headers
  All field types
  All rows and values
Saved data is stored in the MySQL database in this format:
Each table is saved along with the user ID and base name, ensuring privacy.


4.Trash System
  When a Base is deleted, it is not erased — it moves to the Trash.
  Trash only shows the logged-in user’s deleted bases.
  You can restore any Base from Trash anytime.

This avoids accidental loss of data and gives full control.



 5.Navigation
The sidebar in the workspace page includes:
My Workspace – View and open active bases

Trash – View and restore deleted bases
Logout – Clear session and go back to login
Navigation is simple, clear, and smooth!




6.Key Highlights
  Multi-user login using secure JWT authentication
  Every user’s data is private
  Beautiful workspace dashboard to manage all bases
  Full custom table editor with 10+ field types
  Editing, adding, and saving rows and columns is easy
  Trash and restore features included
  Data is stored in MySQL using JSON structure

 Made with: HTML, CSS, JS (Frontend) + Node.js, Express (Backend) + MySQL (Database)


