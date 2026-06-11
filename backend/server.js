require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const connectDB  = require('./config/db');
const jwt        = require('jsonwebtoken');
const User       = require('./models/User');

const app    = express();
const server = http.createServer(app);

// ─── Socket.io setup ─────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// ─── Socket.io JWT middleware ─────────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// ─── Socket.io connection handler ────────────────────────────────────────────
io.on('connection', (socket) => {
  const user = socket.user;
  console.log(`[WS] Connected: ${user.name} (${user.role}) — ${socket.id}`);

  // Personal room for every user
  socket.join(`user:${user._id}`);

  // Role-specific rooms
  if (user.role === 'transporter') socket.join('transporters');
  if (user.role === 'admin')       socket.join('admins');

  // Buyer tracks a specific order for live updates
  socket.on('track_order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`[WS] ${user.name} tracking order ${orderId}`);
  });

  socket.on('untrack_order', (orderId) => {
    socket.leave(`order:${orderId}`);
  });

  // Transporter sends GPS location updates
  socket.on('location_update', async ({ lat, lng }) => {
    try {
      await User.findByIdAndUpdate(user._id, {
        liveLocation: { lat, lng, updatedAt: new Date() },
      });
      io.to('admins').emit('transporter_location', {
        transporterId: user._id,
        name: user.name,
        lat,
        lng,
      });
    } catch (e) {
      console.error('[WS] location_update error:', e.message);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WS] Disconnected: ${user.name} — ${reason}`);
  });
});

// ─── Attach io to every request so controllers can use it ────────────────────
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Express middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());

// ─── REST routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/authRoutes'));
app.use('/api/listings',    require('./routes/listingRoutes'));
app.use('/api/orders',      require('./routes/orderRoutes'));
app.use('/api/transporter', require('./routes/transporterRoutes'));
app.use('/api/admin',       require('./routes/adminRoutes'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', websocket: 'enabled', time: new Date() })
);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`\n🚀 AquaFlow V2 running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server enabled`);
    console.log(`🗄️  MongoDB: ${process.env.MONGO_URI}\n`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
