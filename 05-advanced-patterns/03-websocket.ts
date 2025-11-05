/**
 * Advanced Pattern 3: WebSocket Real-time Updates
 * 
 * Concepts covered:
 * - WebSocket server setup
 * - Real-time bidirectional communication
 * - Broadcasting messages
 * - Client connection management
 * - Chat room example
 * 
 * Run: bun run 05-advanced-patterns/03-websocket.ts
 */

interface Message {
  type: "join" | "leave" | "message" | "users";
  username?: string;
  content?: string;
  users?: string[];
  timestamp: string;
}

interface Client {
  ws: any;
  username: string;
}

const clients = new Set<Client>();

function broadcast(message: Message, exclude?: Client) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client !== exclude) {
      try {
        client.ws.send(data);
      } catch (error) {
        console.error("Failed to send to client:", error);
      }
    }
  }
}

function getUsersList(): string[] {
  return Array.from(clients).map(c => c.username);
}

const server = Bun.serve({
  port: 3000,
  
  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket endpoint
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response("WebSocket upgrade failed", { status: 400 });
      }
      return undefined;
    }

    // Serve a simple chat client
    if (url.pathname === "/") {
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Chat</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f0f2f5; }
        #container { max-width: 800px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        #header { background: #007bff; color: white; padding: 20px; }
        #messages { height: 400px; overflow-y: auto; padding: 20px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 4px; background: #f8f9fa; }
        .message.system { background: #e7f3ff; font-style: italic; }
        .message .username { font-weight: bold; color: #007bff; }
        .message .timestamp { font-size: 0.8em; color: #666; margin-left: 10px; }
        #input-area { display: flex; padding: 20px; border-top: 1px solid #ddd; }
        #messageInput { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 10px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        #users { background: #f8f9fa; padding: 10px 20px; border-top: 1px solid #ddd; font-size: 0.9em; }
        #login { padding: 40px; text-align: center; }
        #usernameInput { padding: 10px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; }
    </style>
</head>
<body>
    <div id="container">
        <div id="header">
            <h1>💬 WebSocket Chat Room</h1>
        </div>
        
        <div id="login">
            <h2>Enter your username</h2>
            <input type="text" id="usernameInput" placeholder="Username" maxlength="20">
            <button onclick="connect()">Join Chat</button>
        </div>

        <div id="chat" style="display: none;">
            <div id="messages"></div>
            <div id="users"></div>
            <div id="input-area">
                <input type="text" id="messageInput" placeholder="Type a message..." disabled>
                <button onclick="sendMessage()" disabled id="sendBtn">Send</button>
            </div>
        </div>
    </div>

    <script>
        let ws;
        let username;

        function connect() {
            username = document.getElementById('usernameInput').value.trim();
            if (!username) {
                alert('Please enter a username');
                return;
            }

            document.getElementById('login').style.display = 'none';
            document.getElementById('chat').style.display = 'block';

            ws = new WebSocket(\`ws://\${window.location.host}/ws\`);

            ws.onopen = () => {
                ws.send(JSON.stringify({
                    type: 'join',
                    username: username
                }));
                document.getElementById('messageInput').disabled = false;
                document.getElementById('sendBtn').disabled = false;
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleMessage(message);
            };

            ws.onclose = () => {
                addSystemMessage('Disconnected from server');
                document.getElementById('messageInput').disabled = true;
                document.getElementById('sendBtn').disabled = true;
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                addSystemMessage('Connection error');
            };
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            
            if (!content) return;

            ws.send(JSON.stringify({
                type: 'message',
                content: content
            }));

            addMessage(username, content, new Date().toISOString(), true);
            input.value = '';
        }

        function handleMessage(message) {
            switch (message.type) {
                case 'join':
                    addSystemMessage(\`\${message.username} joined the chat\`);
                    break;
                case 'leave':
                    addSystemMessage(\`\${message.username} left the chat\`);
                    break;
                case 'message':
                    addMessage(message.username, message.content, message.timestamp);
                    break;
                case 'users':
                    updateUsers(message.users);
                    break;
            }
        }

        function addMessage(user, content, timestamp, isOwn = false) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            if (isOwn) messageDiv.style.background = '#e7f3ff';
            
            const time = new Date(timestamp).toLocaleTimeString();
            messageDiv.innerHTML = \`
                <span class="username">\${user}</span>
                <span class="timestamp">\${time}</span>
                <div>\${content}</div>
            \`;
            
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function addSystemMessage(text) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message system';
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateUsers(users) {
            const usersDiv = document.getElementById('users');
            usersDiv.textContent = \`👥 Online users (\${users.length}): \${users.join(', ')}\`;
        }

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') connect();
        });
    </script>
</body>
</html>
      `;

      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },

  websocket: {
    open(ws) {
      console.log("New WebSocket connection");
    },

    message(ws, message) {
      try {
        const data: any = JSON.parse(message as string);
        const client = Array.from(clients).find(c => c.ws === ws);

        switch (data.type) {
          case "join":
            if (!client) {
              const newClient: Client = {
                ws,
                username: data.username || "Anonymous",
              };
              clients.add(newClient);

              // Notify others
              broadcast({
                type: "join",
                username: newClient.username,
                timestamp: new Date().toISOString(),
              }, newClient);

              // Send current users list to everyone
              broadcast({
                type: "users",
                users: getUsersList(),
                timestamp: new Date().toISOString(),
              });

              console.log(`${newClient.username} joined. Total users: ${clients.size}`);
            }
            break;

          case "message":
            if (client && data.content) {
              broadcast({
                type: "message",
                username: client.username,
                content: data.content,
                timestamp: new Date().toISOString(),
              }, client);
            }
            break;
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    },

    close(ws) {
      const client = Array.from(clients).find(c => c.ws === ws);
      if (client) {
        clients.delete(client);

        // Notify others
        broadcast({
          type: "leave",
          username: client.username,
          timestamp: new Date().toISOString(),
        });

        // Update users list
        broadcast({
          type: "users",
          users: getUsersList(),
          timestamp: new Date().toISOString(),
        });

        console.log(`${client.username} left. Total users: ${clients.size}`);
      }
    },
  },
});

console.log(`💬 WebSocket Chat Server running at http://localhost:${server.port}`);
console.log(`\nOpen http://localhost:${server.port} in multiple browser tabs to test!`);
console.log(`\nWebSocket endpoint: ws://localhost:${server.port}/ws`);
