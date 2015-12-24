#include <SimpleTimer.h>      // https://github.com/infomaniac50/SimpleTimer
#include <ESP8266WiFi.h>      // https://github.com/esp8266/Arduino
#include <WiFiClientSecure.h> // https://github.com/esp8266/Arduino

const int POLL_INTERVAL = 10000; // 10 seconds polling
const double OPEN_TRIGGER_TIME = 60 * 1000 * 15; // 15 minute
const int DOOR_OPEN = HIGH;
const int DOOR_CLOSE = LOW;
const int DOOR_INPUT = 2; // GPIO2

double timeOpen = 0;
bool messageSent = false;

SimpleTimer timer;

String urlEncode(String input){
  input.replace("+","%2B");
  input.replace(" ","%20");
  return input;
}

void logtime() {
  Serial.print("[");
  Serial.print((double)millis() / 1000);
  Serial.print("s] ");
}

void log(String message) {
  logtime();
  Serial.println(message);
}

void sendSlack(String message) {
  const char* SLACK_HOST = "hooks.slack.com";
  String slackApiUrl = "/services/T080KFQD9/B0GHBF673/9dpsfrh2JfG8t5SNF1pztg2X";

  WiFiClientSecure request;
  
  if (!request.connect(SLACK_HOST, 443)) {
    log("connection failed.");
    return;
  }
  if (!request.verify("AB F0 5B A9 1A E0 AE 5F CE 32 2E 7C 66 67 49 EC DD 6D 6A 38", SLACK_HOST)) {
    log("certificate doesn't match. will not send message.");
    return;
  }
  
  String postData = urlEncode("payload={\"text\":\"" + message + ".\"}");
  request.print(String("POST ") + slackApiUrl + " HTTP/1.1\r\n" +
    "Host: " + SLACK_HOST + "\r\n" +
    "User-Agent: ESP8266\r\n" +
    "Content-Type: application/x-www-form-urlencoded\r\n" +
    "Content-Length: " + postData.length() + "\r\n" +
    "Connection: close\r\n\r\n" +
    postData);

  String response = request.readString();
  log(response);
  log("closing connection");  
}

void resetDoor() {
  timeOpen = 0;
  messageSent = false; 
}

void checkDoorStatus() {
  logtime();
  if( digitalRead(DOOR_INPUT) == DOOR_OPEN ) {
    timeOpen += POLL_INTERVAL;
    Serial.print("door open ");
    Serial.print(timeOpen / 1000);
    Serial.println("s");
  }
  if( digitalRead(DOOR_INPUT) == DOOR_CLOSE ) {
    resetDoor();
    Serial.println("door closed");
  }

  if( messageSent == false && 
    timeOpen >= OPEN_TRIGGER_TIME ) {
    sendSlack(String("@kenneth: Garage door has been open for ") + (timeOpen/6000) + " mins.");
    log("Sent Notification");
    messageSent = true;
  }
}

void setup() {
  Serial.begin(115200);   // for debugging
  Serial.println();

  const char* wifiCreds[] = { "lee++", "letmein!" };  
  logtime();
  Serial.print("Connecting to ");
  Serial.print(wifiCreds[0]);
  WiFi.begin(wifiCreds[0], wifiCreds[1]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.print("\n");
  logtime();
  Serial.print("ip address: ");
  Serial.println(WiFi.localIP());

  pinMode(DOOR_INPUT, INPUT_PULLUP);
  
  // poll the door
  timer.setInterval(POLL_INTERVAL, checkDoorStatus);
}

void loop() {
  timer.run();
}

