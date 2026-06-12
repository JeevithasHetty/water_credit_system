# AquaFlow V2 — Virtual Water Credit System

A full-stack real-time water trading platform where buyers, sellers, and transporters are connected on one platform. Orders are assigned in milliseconds, and status updates are pushed live via WebSocket — zero page refresh.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Styling | Custom CSS (no framework) |
| HTTP Client | Axios |
| Real-time | Socket.io (WebSocket) |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) |
| Password | bcryptjs |

---

## Project Structure

```
aquaflow-v2/
│
├── backend/
│   ├── config/
│   │   └── db.js                          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js              # Signup, Login, GetMe
│   │   ├── listingController.js           # CRUD for water listings
│   │   ├── orderController.js             # Checkout, buyer/seller orders
│   │   ├── transporterController.js       # Availability, order status
│   │   └── adminController.js             # Stats, verifications, all orders
│   ├── middleware/
│   │   └── auth.js                        # JWT protect + role guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Order.js
│   │   └── TransporterVerification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── listingRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── transporterRoutes.js
│   │   └── adminRoutes.js
│   ├── .env
│   ├── server.js                          # Main server + Socket.io
│   └── seed.js                            # Database seeder
│
└── frontend/
    ├── src/
    │   ├── api/index.js                   # Axios API calls
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── NotificationToasts.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── CartContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── MarketplacePage.jsx
    │   │   ├── CartPage.jsx
    │   │   ├── BuyerOrdersPage.jsx
    │   │   ├── SellerListingsPage.jsx
    │   │   ├── SellerOrdersPage.jsx
    │   │   ├── TransporterDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── AdminVerifications.jsx
    │   │   └── AdminOrders.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   └── socket.js
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) v6 or higher
- npm (comes with Node.js)

---

## Installation & Setup

### Step 1 — Start MongoDB

**Windows:**
```bash
net start MongoDB
```

---

### Step 2 — Backend Setup

```bash
cd aquaflow-v2/backend
npm install
mongosh --eval "use aquaflow_v2; db.dropDatabase();"
node seed.js
npm run dev
```

Backend runs on: **http://localhost:5000**

Expected output:
```
AquaFlow V2 running on http://localhost:5000
WebSocket server enabled
MongoDB connected: localhost
```

---

### Step 3 — Frontend Setup (new terminal)

```bash
cd aquaflow-v2/frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

### Step 4 — Open Browser

```
http://localhost:5173
```

---

## 3 Terminals Required

| Terminal | Command | Purpose |
|----------|---------|---------|
| Terminal 1 | `net start MongoDB` | Database |
| Terminal 2 | `cd aquaflow-v2/backend && npm run dev` | Backend + WebSocket |
| Terminal 3 | `cd aquaflow-v2/frontend && npm run dev` | Frontend UI |

---

## Login Credentials (password: `password123`)

| Role | Email | Status |
|------|-------|--------|
| Admin | admin@water.com | Full access |
| Buyer 1 | ravi@buyer.com | Active |
| Buyer 2 | priya@buyer.com | Active |
| Seller 1 | seller1@water.com | AquaPure Pvt Ltd |
| Seller 2 | seller2@water.com | HydroTech Solutions |
| Transporter 1 | ramesh@transporter.com | Unverified (Pending) |
| Transporter 2 | suresh@transporter.com | Verified + Online |

---

## Features

### Buyer
- Browse water listings by type: Drinking / Agricultural / Industrial / Rainwater
- Search listings by name or location
- Add to cart with custom quantity (litres)
- Checkout with delivery address
- Auto-assigned to nearest online verified transporter
- Live order tracking with animated progress bar
- Real-time WebSocket notifications for every status change
- Zero page refresh needed

### Seller
- Create water listings with type, price, quantity, location
- View and delete own listings
- View all incoming orders in real time
- New listings broadcast live to all buyers instantly

### Transporter
- Register with Aadhaar number + License number
- Receive admin verification — notified live via WebSocket
- Toggle online / offline availability
- Receive new order assignments instantly (no refresh)
- Accept → Start Delivery → Mark Delivered
- Status updates push live to buyer and admin

### Admin
- Live dashboard with platform stats
- Verify or reject transporter applications (live notification sent)
- View all orders with filters and search
- Real-time updates via WebSocket

---

## Order Status Flow

```
Pending → Assigned → Accepted → InTransit → Delivered
```

| Status | Meaning |
|--------|---------|
| Pending | Order placed, no transporter available |
| Assigned | Transporter auto-assigned |
| Accepted | Transporter accepted the job |
| InTransit | Transporter on the way |
| Delivered | Order delivered successfully |

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `order_placed` | Server → Buyer | Order confirmed |
| `order_status_updated` | Server → Buyer | Delivery status changed |
| `new_order_assigned` | Server → Transporter | New job assigned |
| `my_order_updated` | Server → Transporter | Own order updated |
| `verification_result` | Server → Transporter | Admin decision |
| `admin_new_order` | Server → Admin | New order placed |
| `admin_order_updated` | Server → Admin | Order status changed |
| `transporter_availability_changed` | Server → Admin | Transporter online/offline |
| `new_listing` | Server → All | New listing created |

---

## API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/signup` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Protected |

### Listings
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/listings` | Public |
| GET | `/api/listings/my` | Seller |
| POST | `/api/listings` | Seller |
| DELETE | `/api/listings/:id` | Seller |

### Orders
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/orders` | Buyer |
| GET | `/api/orders/buyer` | Buyer |
| GET | `/api/orders/seller` | Seller |

### Transporter
| Method | Endpoint | Access |
|--------|----------|--------|
| PUT | `/api/transporter/availability` | Transporter |
| GET | `/api/transporter/orders` | Transporter |
| PUT | `/api/transporter/orders/:id/status` | Transporter |
| PUT | `/api/transporter/location` | Transporter |

### Admin
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/admin/stats` | Admin |
| GET | `/api/admin/transporters` | Admin |
| GET | `/api/admin/verifications` | Admin |
| POST | `/api/admin/transporters/:id/decision` | Admin |
| GET | `/api/admin/orders` | Admin |

---

## View Database (MongoDB Shell)

```bash
mongosh
use aquaflow_v2

# All users
db.users.find({}, {name:1, email:1, role:1, verified:1, _id:0}).pretty()

# All listings
db.listings.find({}, {title:1, waterType:1, pricePerLitre:1, location:1, _id:0}).pretty()

# All orders
db.orders.find().pretty()

# Verifications
db.transporterverifications.find().pretty()

# Count documents
db.users.countDocuments()
db.listings.countDocuments()
db.orders.countDocuments()
```

---

## Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/aquaflow_v2
JWT_SECRET=aquaflow_socket_secret_2024
NODE_ENV=development
```

---

## Developer Notes

- **Vite proxy** forwards all `/api` requests from port 5173 → 5000 automatically (no CORS issues)
- **JWT tokens** stored in `localStorage` with key `aq_token`
- **Socket.io** authenticates every connection using JWT in handshake
- **Auto-assign** picks the first `online + verified` transporter on checkout
- Run `node seed.js` only once — it **clears all data** before seeding
- Never run `seed.js` in production

---

*AquaFlow V2 Virtual Water Credit System*
