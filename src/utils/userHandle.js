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