/*
    Bongo Chat Server is the server software for Bongo Chat.
    Copyright (C) 2020 Terminalfreaks

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const WebSocket = require("ws")
const fs = require("fs")
const crypto = require("crypto")
const http = require("http")
const Flake = require("flakeid")
const Database = require("better-sqlite3")
const Utils = require("./src/Utils")
const Config = require("./config.json")

if (!fs.existsSync(`${__dirname}/Databases`)) fs.mkdirSync(`${__dirname}/Databases`)
const UserDB = new Database("./Databases/BongoChat_Users.db")
const User = new Utils.userHandle(UserDB)
const server = http.createServer()
const wss = new WebSocket.Server({
	clientTracking: true,
	port: Config.port
})
const flake = new Flake({
	timeOffset: (2020 - 1970) * 31536000 * 1000 + (31536000 * 400)
})
/*
	for use later....
	
let zlib = require("fast-zlib");
 
let deflate = zlib("deflate");
let inflate = zlib("inflate")
*/

let sessions = []
wss.on("connection", (ws) => {
	console.log("A client has connected.")

	// For the client to ensure they connected.
	ws.send(JSON.stringify({
		event: "welcome",
		payload: {}
	}))

	// Turns everything into an emitted event.
	// Makes everything easier to manage, and here we check if received data can be parsed,
	// And has enough fields.
	ws.on("message", eventHandle)

	// Identify: The client registers/logs in here.
	ws.on("identify", (p) => {
		// Registration portion.
		if(p.register) {
			let { accountName, username, tag, password } = p
			if (!accountName || !username || !tag || !password) return ws.send(JSON.stringify({
				code: 2,
				event: "invalid",
				payload: {
					reason: "insufficientData",
					message: "You didn't send enough (or any) data."
				}
			}))
			accountName = accountName.trim(), username = username.trim(), tag = tag.trim(), password = password.trim()
			if (!["accountName", "username", "tag", "password"].every((k) => k in p) || [accountName, username, tag, password].some(str => str === "")) return ws.send(JSON.stringify({
				code: 2,
				event: "invalid",
				payload: {
					reason: "insufficientData",
					message: "You didn't send enough (or any) data."
				}
			}))
			
			if(!tag.match(/^[a-zA-Z0-9\-_]/g) || tag.length > 4) return ws.send(JSON.stringify({
				code: 2,
				event: "invalid",
				payload: {
					reason: "invalidTag",
					message: "A tag must be 1-4 alphanumeric characters."
				}
			}))

			User.register(accountName, username, tag, password).then(id => {
				if(res.err) return ws.send(JSON.stringify({
					code: 2,
					event: "method",
					payload: {
						...res.err
					}
				}))

				ws.sessionID = crypto.randomBytes(24).toString("hex")
				sessions.push({sessionID: ws.sessionID, ...res.user})
				
				ws.send(JSON.stringify({
					event: "ready", 
					payload: {
						user: {
							sessionID: ws.sessionID,
							id: parseInt(id),
							username,
							tag
						}
					}
				}))
			})
		} else { // Login portion.
			let { accountName, password } = p
			if (!accountName || !password) return ws.send(JSON.stringify({
				code: 3,
				event: "invalid",
				payload: {
					reason: "insufficientData",
					message: "You didn't send enough (or any) data."
				}
			}))
			User.login(p.accountName, p.password).then((res) => {
				if(res.err) return ws.send(JSON.stringify({
					code: 3,
					event: "method",
					payload: {
						...res.err
					}
				}))

				if(res.matched) {
					ws.sessionID = crypto.randomBytes(24).toString("hex")
					sessions.push({sessionID: ws.sessionID, ...res.user})

					ws.send(JSON.stringify({
						event: "ready", 
						payload: {
							user: {
								sessionID: ws.sessionID,
								...res.user
							}
						}
					}))
				} else {
					ws.send(JSON.stringify({
						code: 3,
						event: "method",
						payload: {
							reason: "invalidCredentials",
							message: "The password is invalid/incorrect."
						}
					}))
				}
			})
		}
	})

	// Message Create: When a message has been sent.
	ws.on("messageCreate", (p) => {
		if(!p.sessionID || !sessions.find(c => c.sessionID === p.sessionID)) return ws.send(JSON.stringify({
			code: 4,
			event: "invalid",
			payload: {
				reason: "invalidSessionID",
				message: "You didn't send your session ID, or a valid one."
			}
		}))
		if(!p.content || typeof p.content !== "string" || p.content.trim() === "") return ws.send(JSON.stringify({
			code: 4,
			event: "invalid",
			payload: {
				reason: "invalidContent",
				message: "The message content has to be provided, and be a string."
			}
		}))

		const session = sessions.find(c => c.sessionID === p.sessionID)
		const id = flake.gen()
		wss.clients.forEach(c => {
			if(!c.sessionID) return;
			if(c.readyState === WebSocket.OPEN) c.send(JSON.stringify({
				event: "messageCreate",
				payload: {
					content: p.content.trim(),
					id,
					author: {
						id: session.id,
						username: session.username,
						tag: session.tag
					},
					timestamp: new Date(),
					type: 1
				}
			}))
		})
	})

	// Fetch: Gets certain types of data.
	ws.on("fetch", (p) => {
		if(!p.type || typeof p.type !== "integer") return ws.send(JSON.stringify({
			code: 5,
			event: "invalid",
			payload: {
				reason: "invalidType",
				message: "The client didn't provide the type of data to fetch, or it wasn't an integer."
			}
		}))
		switch(p.type) {
			case 0:
				Utils.fetchUser(p.id).then(user => {
					ws.send(JSON.stringify({
						event: "fetch",
						payload: {
							user
						}
					}))
				})
			break;

			default:
				ws.send(JSON.stringify({
					code: 5,
					event: "invalid",
					payload: {
						reason: "notAType",
						message: "The client provided a type that doesn't exist."
					}
				}))
			break;
		}
	})

	// Invalid: More or less a self emitted event (check the eventHandle function below).
	// Used to tell the client they sent missing or invalid data.
	ws.on("invalid", (i) => {
		switch(i.code) {
			case 0:
				ws.send(JSON.stringify({
					code: 0,
					event: "invalid",
					payload: {
						reason: "invalidData",
						message: "The data sent was not JSON."
					}
				}))
			break;

			case 1:
				ws.send(JSON.stringify({
					code: 1,
					event: "invalid",
					payload: {
						reason: "insufficientData",
						message: "You didn't give me the event, or any event/payload data."
					}
				}))
			break;
		}
	})

	// Close: When a ws connection has been closed (or simply, they disconnected).
	ws.on("close", () => {
		let sessionIndex = sessions.findIndex(s => s.sessionID == ws.sessionID)
		if (sessionIndex === -1) return console.log("A user has disconnected.")
		let session = sessions.splice(sessionIndex, 1)[0]
		console.log(`${session.username}#${session.tag} has disconnected.`)
	})

	function eventHandle(data) {
		try {
			const { event, payload } = JSON.parse(data)
			if(!event || !payload) return this.emit("invalid", {code: 1})
			return ws.emit(event, payload)
		} catch(e) {
			console.log(e)
			return ws.emit("invalid", {code: 0})
		}
	}
})

// Sets upthe server to listen to our port.
// Why a HTTP server? For certain routes for later (like an easy way of getting the IP for ws connect)
server.listen(80, () => {
	const userTable = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()
	if (!userTable["count(*)"]) {
		UserDB.prepare("CREATE TABLE users (id INTEGER PRIMARY KEY, accountName TEXT, username TEXT, tag TEXT, passwordHash TEXT);").run();
		UserDB.prepare("CREATE UNIQUE INDEX idx_user_id ON users (id);").run()
		UserDB.pragma("synchronous = 1")
		UserDB.pragma("journal_mode = wal")
		console.log("Created SQLite DB and Users table.")
	}

	console.log("Bongo Chat Server is up!")
})

// Event that handles HTTP requests.
server.on("request", (req, res) => {
	// Sends the URL to connect via ws.
	if(req.url === "/url" && req.method === "GET") {
		res.writeHead(200, { "Content-Type": "application/json"})
		return res.end(JSON.stringify({url: `ws://${req.headers.host}:${Config.port}`}))
	}
	// Sends "Hello, world!" to any other route.
	res.writeHead(200)
	res.end("Hello, world!")
})