const clients = new Set();

function sseHandler(req, res) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client = { id: Date.now() + Math.random(), res };
    clients.add(client);

    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true, time: new Date().toISOString() })}\n\n`);

    const heartbeat = setInterval(() => {
        try {
            res.write(`: ping\n\n`);
        } catch (err) {
            clearInterval(heartbeat);
            clients.delete(client);
        }
    }, 25000);

    req.on('close', () => {
        clearInterval(heartbeat);
        clients.delete(client);
    });
}

function broadcast(event, payload = {}) {
    const message = `event: ${event}\ndata: ${JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString()
    })}\n\n`;

    for (const client of clients) {
        try {
            client.res.write(message);
        } catch (err) {
            clients.delete(client);
        }
    }
}

module.exports = { sseHandler, broadcast };