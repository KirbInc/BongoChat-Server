# User Resource
If you are using Bongo Chat, you are a user. There are also other users, if anyone else uses your own Bongo Chat server.  

## Fetch User
Send the `fetch` event with a `type` of `0`.
Sends back the same event with a [User Structure](#user-structure)

### User Structure
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| id          | integer | snowflake id of the user                   |  
| username    | string  | username                                   |
| tag         | string  | tag                                        |  