So you're at the gate, wanting to know how to get in. Luckily, you have all this documentation to tell you how to properly connect to Bongo Chat to send and receive messages.  
To actually send messages (after you [identify](#identifying)), see the [Resources page.](Resources.md)  

# Data Structure
| Field   | Type           | Description           |
|---------|----------------|-----------------------|
| code *  | integer        | code for the event    |
| event   | string         | the name of the event |
| payload | any json value | event data            |  

\* `code` is only sent to the client if the `event` is `invalid` or `method` to know which data sent to the server caused it.

## Sending Data
Data sent *should* be valid JSON if parsed, or the server will send an `invalid` event with code `0`.  
They should also have all fields defined in the [data structure](#data-structure) or the server will again respond with `invalid` event and code `1`

## Receiving Data
As a client, receiving data is fairly simple. The server always sends stringified JSON that you should be able to parse.  
As said above, you will not always receive a `code` so don't rely on that for handling events. Instead, just look at `event` for the name.  
`code` is only sent for `invalid` and `method` events.

# Connecting
If you can find a server's IP/domain, you can easily make a GET request to `/url`. It should send back JSON with the field `url`. Example:
```json
{
	"url": "ws://example.com:8080"
}
```  
You can then use this URL to connect via websocket.  

Once connected, you should receive a `welcome` event with an empty `payload`.  

### Example Welcome
```json
{
	"event": "welcome",
	"payload": {}
}
```  

Then the client should [`identify`](#identifying)  

## Identifying
Here you can choose whether to register or login. If logging in, the client should send the `identify` data with the login data. An example is shown here:  

### Example Identify for Login
```json
{
	"event": "identify",
	"payload": {
		"accountName": "bongocat",
		"password": "bongobongobongo"
	}
}
```  

And for registration:  
```json
{
	"event": "identify",
	"payload": {
		"accountName": "bongocat",
		"username": "Bongo Cat",
		"tag": "cat",
		"password": "bongobongobongo"
	}
}
``` 
Yes, `tag` can be any 1-4 alphanumeric characters.

If registered or logging in was successful, you will get a [`ready`](#ready) event with the user's data.  

# Errors, Codes and Request Types
Whenever **you** (the client) do something that doesn't make sense or isn't valid (say, you don't send payload data, or the required data for a specific event) you will get an `invalid` event sent back.  

You can see details of the event [here.](#invalid)  

## Request Types
Whenever you send an event to get data, it may need a payload `type` to say what type of data you want to receive.  
Each type meaning can be based on the event, so look at them each to find out what their types mean.  

# Events
All events, sent and received, should be camelCase.  

### Welcome
Used to confirm the client has connected. You should initialize identification.  

### Identify
Used to login (or register) a user.

#### Identify Structure
| Field       | Type   | Description                                |
|-------------|--------|--------------------------------------------|
| accountName | string | the user's account name                    |
| username?   | string | user's desired username (for registration) |
| tag?        | string | user's desired tag (for registration)      |
| password    | string | the user's account password                |  

### Ready
Sends user information.  

#### Ready Structure
| Field       | Type   | Description                                |
|-------------|--------|--------------------------------------------|
| user        | object | user's information                         |  

#### Ready User Information
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| sessionID   | string  | session id                                 |  
| id          | integer | snowflake id of the user                   |  
| username    | string  | user's username                            |
| tag         | string  | user's tag                                 |  

### Invalid
Sent when the client sends invalid, incorrect or insufficient data.  

#### Example Invalid 
```json
{
	"code": 1,
	"event": "invalid",
	"payload": {
		"reason": "insufficientData",
		"message": "You didn't give me the event, or any event/payload data."
	}
}
```  

#### Invalid Structure
| Field       | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| code        | integer | [invalid code](#invalid-codes)             |  
| payload     | object  | payload data                               |  

Payload data:
| Field       | Type    | Description                                      |
|-------------|---------|--------------------------------------------------|
| reason      | string  | reason to the event                              |
| message     | string  | detailed message saying why you received invalid |  

#### Invalid Codes
Codes are used to know which event triggered the invalid event response. You should look at both the code and message to inform a user to why this happened.
| Code        | Description                                          |
|-------------|------------------------------------------------------|
| 0           | data sent was not json                               |  
| 1           | the payload or event name was missing                |  
| 2           | identify event (registration)                        |  
| 3           | identify event                                       |  
| 4           | messageCreate event                                  | 
| 5           | fetch event                                          |   

### Message Create
A message sent in the server. The payload is a [`message create`](Resources/Message.md#message-create-structure) structure.  

