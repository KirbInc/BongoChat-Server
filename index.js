const WebSocket = require("ws")
const fs = require("fs")
const crypto = require("crypto")
const Database = require("better-sqlite3")
const Utils = require("./src/Utils")

if (!fs.existsSync(`${__dirname}/Databases`)) fs.mkdirSync(`${__dirname}/Databases`)
const UserDB = new Database("./Databases/BongoChat_Users.db")
const User = new Utils.userHandle(UserDB)
const wss = new WebSocket.Server({port: 8080})
/*
	for use later....
	
let zlib = require("fast-zlib");
 
let deflate = zlib("deflate");
let inflate = zlib("inflate")
*/

console.log("Bongo Chat Server is up!")
wss.on("connection", function(ws, request) {
	console.log("A client has connected.")
	ws.isAlive = true
	ws.on("pong", () => {
		this.isAlive = true
		console.log("ponged")
	})

	ws.on("message", eventHandle)
	.on("welcome", () => {
		console.log("Welcomed a client.")
		ws.send(JSON.stringify({ event: "hello", payload: { pretoken: crypto.randomBytes(16).toString("hex") } }))
	})
	.on("identify", (p) => {
		if(!p.pretoken) return ws.send(JSON.stringify({ code: 2, event: "invalid", payload: { reason: "pretokenMissing", message: "I sent you a pretoken, but you didn't send it back. Send the pretoken." } }))
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

			User.register(accountName, username, tag, password).then(id => ws.send(JSON.stringify({
				event: "ready", 
				payload: {
					user: {
						sessionID: crypto.randomBytes(16).toString("hex"),
						id: id,
						username,
						tag
					}
				}
			})))
		} else {
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
					ws.send(JSON.stringify({
						event: "ready", 
						payload: {
							user: {
								sessionID: crypto.randomBytes(16).toString("hex"),
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
	.on("invalid", (i) => {
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
})

const userTable = UserDB.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'users';").get()

if (!userTable["count(*)"]) {
	UserDB.prepare("CREATE TABLE users (id INTEGER PRIMARY KEY, accountName TEXT, username TEXT, tag TEXT, passwordHash TEXT);").run();
	UserDB.prepare("CREATE UNIQUE INDEX idx_user_id ON users (id);").run()
	UserDB.pragma("synchronous = 1")
	UserDB.pragma("journal_mode = wal")
	console.log("Created SQLite DB and Users table.")
}

function eventHandle(data) {
	try {
		const { event, payload } = JSON.parse(data)
		if(!event || !payload) return this.emit("invalid", {code: 1})
		this.emit(event, payload)
	} catch {
		this.emit("invalid", {code: 0})
	}
}