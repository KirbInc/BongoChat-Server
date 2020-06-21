# Create
Send the `messageCreate` event.  
Sends back the same event with the [`message create`](#message-create-structure) structure.  

#### Message Create Structure
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| content     | string  | message content                            |  
| id          | integer | snowflake id of the message                |  
| username    | string  | username                                   |
| tag         | string  | tag                                        |  