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

const argon2 = require("argon2")
const FlakeId = require("flakeid")
const flake = new FlakeId({
	timeOffset: (2020 - 1970) * 31536000 * 1000 + (31536000 * 400)
})

class userHandle {
	constructor(Database) {
		this.Database = Database
	}

	login(accountName, password) {
		return new Promise(async (resolve, reject) => {
			const user = this.Database.prepare("SELECT * FROM users WHERE accountName=?;").get(accountName)
			if (!user) return resolve({err: {
				reason: "userNotExists",
				message: "This user does not exist."
			}})
			try {
				if (await argon2.verify(user.passwordHash, password)) {
					const { ["passwordHash"]: _, ["accountName"]: __, ..._user } = user
				    resolve({matched: true, user: _user})
				} else {
				    resolve({matched: false})
				}
			} catch (err) {
				reject(err)
			}
		})
	}
	register(accountName, username, tag, password) {
		return new Promise(async (resolve, reject) => {
			try {
				const hash = await argon2.hash(password)
				const id = flake.gen()
				this.Database.prepare("INSERT INTO users (id, accountName, username, tag, passwordHash) VALUES (?, ?, ?, ?, ?);").run(id, accountName, username, tag, hash)
				resolve(id)
			} catch (err) {
				reject(err)
			}
		})
	}
}

module.exports = userHandle;