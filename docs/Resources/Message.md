# Message Resource
Messages are how people on Bongo Chat communicate. It is a chat app after all. Messages are sent by a [`User`](User.md).  

## Create
Send the `messageCreate` event.  
Sends back the same event with the [`message create`](#message-create-structure) structure.  

#### Message Create Structure
| Field     | Type      | Description                    |
|-----------|-----------|--------------------------------|
| content   | string    | message content                |
| id        | integer   | snowflake id of the message    |
| author    | object    | [user](User.md#user-structure) |
| timestamp | timestamp | timestamp the message was sent |
| type      | integer   | type of message                |  