# Contact Us Assessment

A responsive contact form built with a separated React frontend and Express backend. The app lets a user type their name, email, and message, preview the email layout live, save the message to MongoDB, and send an email notification.

## Purpose

The project demonstrates a complete contact-support workflow:

- The frontend collects the user's contact details.
- The live preview shows how the message will look before sending.
- The backend validates the request.
- MongoDB stores the submitted contact message.
- Nodemailer sends a styled email notification.

## Stack

- Frontend: React, Vite, TypeScript
- Backend: Express, TypeScript
- Database: MongoDB Atlas through Mongoose
- Email: Nodemailer using Gmail credentials
- Package manager: pnpm workspaces

## Project Structure

```text
frontend/
  src/App.tsx                 Main contact form, live preview, and dark mode state
  src/styles.css              Layout, responsive design, themes, and visual styling
  src/api/contactSupport.ts   Frontend API request helper
  vite.config.ts              Vite dev server and API proxy

backend/
  src/index.ts                Express server, MongoDB connection, API route, email sending
  src/models/ContactSupport.ts MongoDB schema/model for contact messages
```

## Code Locations For Each Explanation

Use these locations when you need to explain or point to the exact code during review:

| Topic | File and location | Purpose |
| --- | --- | --- |
| Form state | `frontend/src/App.tsx` lines 10-23 | Creates the React state for `name`, `email`, and `message`, then updates that state when the user types. |
| Submit handling | `frontend/src/App.tsx` lines 25-39 | Prevents page reload, shows sending status, calls the API helper, resets the form, and handles errors. |
| Form inputs | `frontend/src/App.tsx` lines 72-113 | Renders the name, email, message fields, and submit button. |
| Live preview markup | `frontend/src/App.tsx` lines 116-124 | Shows the live preview using the same `form` state as the inputs. |
| Dark mode state and button | `frontend/src/App.tsx` lines 14 and 42-54 | Stores the current theme and toggles between `light` and `dark`. |
| Background design markup | `frontend/src/App.tsx` lines 56-62 | Adds the decorative background elements behind the page content. |
| API helper | `frontend/src/api/contactSupport.ts` lines 1-19 | Sends the form data from the frontend to `/api/contact`. |
| Vite API proxy | `frontend/vite.config.ts` lines 6-10 | Forwards frontend `/api` requests to the backend at `http://localhost:5000`. |
| Theme colors | `frontend/src/styles.css` lines 1-22 and 145-184 | Defines light theme variables and dark theme overrides. |
| Page shell and layout | `frontend/src/styles.css` lines 95-104 | Makes the app full width, centers the content, and adds responsive page padding. |
| Theme toggle styling | `frontend/src/styles.css` lines 106-143 and 170-184 | Styles the fixed light/dark mode switch. |
| Background design styling | `frontend/src/styles.css` lines 186-317 | Positions and colors the decorative background shapes for light and dark mode. |
| Contact card layout | `frontend/src/styles.css` lines 334-356 | Builds the main responsive card and dark-mode card colors. |
| Form styling | `frontend/src/styles.css` lines 399-555 | Styles the form grid, fields, inputs, textarea, focus states, and submit button. |
| Preview styling | `frontend/src/styles.css` lines 558-658 | Styles the side panel and live preview card to match the email output. |
| Animations | `frontend/src/styles.css` lines 674-718 | Defines entrance/status animations and motion behavior. |
| Responsive breakpoints | `frontend/src/styles.css` lines 720-982 | Adapts the layout for reduced motion, tablet, mobile, and very small screens. |
| Express setup | `backend/src/index.ts` lines 9-18 | Loads environment variables, creates the Express app, enables CORS/JSON, and defines constants. |
| HTML escaping | `backend/src/index.ts` lines 21-31 | Escapes user input before it is inserted into the email HTML. |
| Email template | `backend/src/index.ts` lines 34-61 | Builds the styled email HTML that matches the frontend preview. |
| MongoDB connection | `backend/src/index.ts` lines 76-78 | Connects the backend to MongoDB Atlas using `MONGO_URI`. |
| Email transporter | `backend/src/index.ts` lines 80-86 | Configures Nodemailer with Gmail credentials from `.env`. |
| API route | `backend/src/index.ts` lines 92-135 | Receives form submissions, validates input, saves to MongoDB, sends email, and returns a response. |
| Database save | `backend/src/index.ts` lines 102-106 | Creates a new contact-support document in MongoDB. |
| Email sending | `backend/src/index.ts` lines 108-119 | Sends the email notification after the message is saved. |
| Backend server start | `backend/src/index.ts` lines 137-139 | Starts the Express server. |
| MongoDB schema | `backend/src/models/ContactSupport.ts` lines 3-39 | Defines the contact message fields, timestamps, and `_mail` collection. |

## How The Frontend Works

The main UI is in `frontend/src/App.tsx`.

The form state is stored in React with:

```ts
const [form, setForm] = useState<ContactForm>(emptyForm);
```

Every input updates the same `form` object through `updateField`. When the user submits the form, `sendMessage` calls `saveContactSupport(form)`, which sends the data to the backend.

## How The Live Preview Works

The live preview uses the same React state as the form. This means the preview updates immediately while the user types.

Example:

```tsx
<p className="preview-name">{form.name || "Your Name"}</p>
```

If the user has typed a name, the preview shows it. If not, it shows placeholder text. The same pattern is used for email and message.

The preview is styled in `frontend/src/styles.css` with the `.preview`, `.preview-name`, `.preview-email`, and `.preview-message` classes. The backend email template uses a matching layout so the actual email looks like the frontend preview.

## How Dark Mode Works

Dark mode is controlled by this React state in `App.tsx`:

```ts
const [theme, setTheme] = useState<"light" | "dark">("light");
```

The theme value is placed on the main element:

```tsx
<main className="shell" data-theme={theme}>
```

The toggle button changes the theme between `light` and `dark`. CSS reads the value using selectors like:

```css
.shell[data-theme="dark"] {
  --ink: #f5f7ff;
  --paper: #151a29;
}
```

This changes the page colors, card colors, input colors, preview colors, and background design.

## How It Became Responsive

Responsiveness is handled in `frontend/src/styles.css`.

The design uses flexible sizing like:

- `clamp(...)` for text, padding, and card sizes
- `min(...)` to prevent elements from becoming too wide
- CSS Grid for desktop layout
- Media queries for tablet and mobile screens

On desktop, the form and preview sit side by side. On smaller screens, this media query changes the layout to one column:

```css
@media (max-width: 1080px) {
  .contact-card {
    grid-template-columns: 1fr;
  }
}
```

For mobile screens, the CSS reduces padding, shrinks the preview card, makes the submit button full width, and hides part of the dark-mode toggle on very small devices.

## How The Frontend Connects To The Backend

The frontend sends contact data through `frontend/src/api/contactSupport.ts`:

```ts
fetch("/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(form)
});
```

During development, Vite proxies `/api` requests to the backend. This is configured in `frontend/vite.config.ts`:

```ts
proxy: {
  "/api": "http://localhost:5000"
}
```

So the frontend can call `/api/contact`, and Vite forwards it to `http://localhost:5000/api/contact`.

## How The Backend Works

The backend is in `backend/src/index.ts`.

Express is used to create the API server:

```ts
const app = express();
app.use(cors());
app.use(express.json());
```

The contact form endpoint is:

```ts
app.post(CONTACT_ROUTES, async (req, res) => {
```

`CONTACT_ROUTES` supports both:

- `/api/contact`
- `/api/contact-support`

The backend checks that name, email, and message are present and that the email format is valid before saving.

## How It Connects To The Database

The app uses MongoDB Atlas through Mongoose.

The backend connects with:

```ts
mongoose.connect(MONGO_URI)
```

`MONGO_URI` comes from `backend/.env`.

The schema is defined in `backend/src/models/ContactSupport.ts`. It stores:

- `name`
- `email`
- `message`
- timestamps from Mongoose

When a form is submitted, the backend saves it with:

```ts
const contactSupport = await ContactSupport.create({
  name: name.trim(),
  email: email.trim(),
  message: message.trim(),
});
```

The collection name used by the model is `_mail`.

## How Email Sending Works

Email sending is handled with Nodemailer in `backend/src/index.ts`.

The transporter is configured with Gmail:

```ts
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

The email is only sent if `EMAIL_USER` and `EMAIL_PASS` are available in `backend/.env`.

The backend builds the email HTML using:

```ts
buildContactEmailHtml(previewName, previewEmail, previewMessage)
```

Before inserting user text into the email, the backend escapes HTML with `escapeHtml`. This helps prevent unsafe HTML from being injected into the email.

The email is sent with:

```ts
await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: 'randels1417@gmail.com',
  subject: `New contact support message from ${contactSupport.name}`,
  html: buildContactEmailHtml(previewName, previewEmail, previewMessage),
});
```

## Environment Variables

Create `backend/.env` and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

For Gmail, use an app password instead of your normal Gmail password.

## Install

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Check

```bash
pnpm --filter frontend typecheck
pnpm --filter frontend build
```

For backend TypeScript checking:

```bash
cd backend
node --max-old-space-size=4096 ..\node_modules\typescript\bin\tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck src\index.ts src\models\ContactSupport.ts
```
