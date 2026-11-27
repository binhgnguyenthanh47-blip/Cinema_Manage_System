
// Danh sách kết nối của quản trị viên
const clients = new Set();

// Danh sách kết nối của khách hàng
const seatClients = new Set();

// Khởi tạo kết nối SSE
function createSseConnection(req, res, clientSet) {
    res.setHeader(
        'Content-Type',
        'text/event-stream; charset=utf-8'
    );
    res.setHeader(
        'Cache-Control',
        'no-cache, no-transform'
    );
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const client = {
        id: Date.now() + Math.random(),
        res
    };

    clientSet.add(client);

    res.write(
        `event: connected\ndata: ${JSON.stringify({
            connected: true,
            time: new Date().toISOString()
        })}\n\n`
    );

    const heartbeat = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch (err) {
            cleanup();
        }
    }, 25000);

    function cleanup() {
        clearInterval(heartbeat);
        clientSet.delete(client);
    }

    res.on('close', cleanup);
    res.on('error', cleanup);
}

// Kết nối realtime dành cho Admin
function sseHandler(req, res) {
    createSseConnection(req, res, clients);
}

// Kết nối realtime dành cho khách hàng
function seatSseHandler(req, res) {
    createSseConnection(req, res, seatClients);
}

// Gửi sự kiện đến một nhóm kết nối
function sendEvent(clientSet, event, payload = {}) {
    const message = `event: ${event}\ndata: ${JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
    })}\n\n`;

    for (const client of clientSet) {
        try {
            client.res.write(message);
        } catch (err) {
            clientSet.delete(client);
        }
    }
}

// Phát thông báo realtime
function broadcast(event, payload = {}) {
    // Giữ nguyên thông báo cho Admin
    sendEvent(clients, event, payload);

    // Thông báo thay đổi ghế cho khách hàng
    if (event === 'booking_created') {
        const showId = Number(payload.show_id);

        if (Number.isSafeInteger(showId) && showId > 0) {
            sendEvent(seatClients, 'seats_updated', {
                show_id: showId
            });
        }
    }
}

module.exports = {
    sseHandler,
    seatSseHandler,
    broadcast
};
