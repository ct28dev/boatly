#!/usr/bin/env node
/**
 * BOATLY Socket.io Server
 * - Listens on port 3001
 * - Handles: sendLocation, sendMessage
 * - Rooms: booking_{id}
 */

const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');

const PORT = process.env.SOCKET_PORT || 3001;

// DB config: env or localhost/boatly/root/empty
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'boatly',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  charset: 'utf8mb4',
};

let pool;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

async function saveMessage(bookingId, senderType, senderId, message) {
  const conn = await (await getPool()).getConnection();
  try {
    const [result] = await conn.execute(
      'INSERT INTO messages (booking_id, sender_type, sender_id, message, created_at) VALUES (?, ?, ?, ?, NOW())',
      [bookingId, senderType, senderId || null, message]
    );
    return result.insertId;
  } finally {
    conn.release();
  }
}

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  socket.on('joinBooking', (bookingId) => {
    const id = parseInt(bookingId, 10);
    if (id > 0) {
      const room = `booking_${id}`;
      socket.join(room);
      socket.bookingId = id;
    }
  });

  socket.on('sendLocation', async (data) => {
    const { booking_id, lat, lng } = data || {};
    const bid = parseInt(booking_id, 10);
    if (bid <= 0 || lat == null || lng == null) return;
    const room = `booking_${bid}`;
    io.to(room).emit('boatLocation', { booking_id: bid, lat: parseFloat(lat), lng: parseFloat(lng) });
  });

  socket.on('sendMessage', async (data) => {
    const { booking_id, sender_type, message, sender_id } = data || {};
    const bid = parseInt(booking_id, 10);
    if (bid <= 0 || !message || !sender_type) return;
    const allowed = ['customer', 'crew', 'system'];
    if (!allowed.includes(sender_type)) return;

    try {
      const msgId = await saveMessage(bid, sender_type, sender_id || null, String(message).trim());
      const room = `booking_${bid}`;
      const payload = {
        id: msgId,
        booking_id: bid,
        sender_type: sender_type,
        sender_id: sender_id || null,
        message: String(message).trim(),
        created_at: new Date().toISOString(),
      };
      io.to(room).emit('newMessage', payload);
    } catch (err) {
      console.error('saveMessage error:', err.message);
      socket.emit('error', { message: 'Failed to save message' });
    }
  });

  socket.on('disconnect', () => {});
});

server.listen(PORT, () => {
  console.log(`BOATLY Socket.io server listening on port ${PORT}`);
});
