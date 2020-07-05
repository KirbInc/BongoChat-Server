# User Resource
If you are using Bongo Chat, you are a user. There are also other users, if anyone else uses your own Bongo Chat server.  

## Fetch User
`fetch` should be sent, with a `type` of 0.  
Gets a user by their `id`.
Sends back the same event with a [User Structure.](#user-structure)

### User Structure
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| id          | integer | snowflake id of the user                   |  
| username    | string  | username                                   |
| tag         | string  | tag                                        |  

## User Joined
`userJoin` is received.  
This can be received any time a person joins the server.  

Contains the [User Structure](#user-structure) and a `unique` field.  
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| unique      | boolean | whether the user joined for the first time |  

## User Left
`userLeave` is received.  
Any time a user leaves the server.  

Contains the [User Structure.](#user-structure)