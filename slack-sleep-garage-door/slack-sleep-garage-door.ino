#include <ESP8266WiFi.h>      // https://github.com/esp8266/Arduino
#include <WiFiClientSecure.h> // https://github.com/esp8266/Arduino

#define DEBUG false
#define DOOR_OPEN HIGH
#define DOOR_CLOSE LOW
#define DOOR_INPUT 2

// GPIO1
#define LED_ON LOW
#define LED_OFF HIGH

const uint POLL_INTERVAL = 1000 * 10; // 10 seconds
const uint OPEN_TRIGGER_TIME = 60 * 1000 * 15; // 15 minute

bool isError = false;
bool isDoorOpen = false;
uint openTime = 0;
uint messageTime = 0;

const PROGMEM char* wifiCreds[] = { "lee++", "letmein!" };
const PROGMEM char* SLACK_HOST = "hooks.slack.com";
const PROGMEM char* SLACK_API_URL = "/services/T080KFQD9/B0GHBF673/9dpsfrh2JfG8t5SNF1pztg2X";

// Logging
void prelog() {
  if (DEBUG) {
    Serial.print("[");
    Serial.print((double)millis() / 1000);
    Serial.print("s] ");
  }
}

void log(String message) {
  if (DEBUG) {
    prelog();
    Serial.println(message);
  }
}

void logAppend(String message) {
  if (DEBUG) {
    Serial.print(message);
  }
}

// HTTP
String urlEncode(String input){
  input.replace("+","%2B");
  input.replace(" ","%20");
  return input;
}

void sendSlack(String message) {
//  const char* SLACK_HOST = "hooks.slack.com";
//  const char* SLACK_API_URL = "/services/T080KFQD9/B0GHBF673/9dpsfrh2JfG8t5SNF1pztg2X";

  WiFiClientSecure request;
  
  if (!request.connect(SLACK_HOST, 443)) {
    isError = true;
    return;
  }
  if (!request.verify("AB F0 5B A9 1A E0 AE 5F CE 32 2E 7C 66 67 49 EC DD 6D 6A 38", SLACK_HOST)) {
    isError = true;
    return;
  }
  
  String postData = urlEncode("payload={\"text\":\"" + message + "\"}");
  request.print(String("POST ") + SLACK_API_URL + " HTTP/1.1\r\n" +
    "Host: " + SLACK_HOST + "\r\n" +
    "User-Agent: ESP8266\r\n" +
    "Connection: close\r\n" +
    "Content-Type: application/x-www-form-urlencoded\r\n" +
    "Content-Length: " + postData.length() + "\r\n\r\n" +
    postData);

  String response = request.readString();
  log(response);
//  log("closing connection");
}

// Door
void checkDoorStatus(bool isChanged) {
  if (digitalRead(DOOR_INPUT) == DOOR_OPEN) {
    if (isChanged) {
      isDoorOpen = true;
      openTime = millis();
      messageTime = openTime + OPEN_TRIGGER_TIME;
      
      log("door open\n");
      if (!DEBUG) {
        digitalWrite(BUILTIN_LED, LED_ON);
      }
    } else {
      prelog();
      logAppend("door still open for ");
      logAppend(String("") + (millis() - openTime) / 1000);
      logAppend("s\n");
    }
  }
  
  if (digitalRead(DOOR_INPUT) == DOOR_CLOSE) {
    isDoorOpen = false;
    log("door closed");
    
    if (!DEBUG) {
      digitalWrite(BUILTIN_LED, LED_OFF);
    }
  }

  if (isDoorOpen == true && (millis() - openTime) >= messageTime ) {
    messageTime = millis() + OPEN_TRIGGER_TIME;
    sendSlack(String("@kenneth: Garage door has been open for ") + ((millis() - openTime)/60000) + " mins");
    log("Sent Notification");
  }
}

void onDoorChange() {
  checkDoorStatus(true);
}

void connectToWifi() {
  int now = millis();
  Serial.begin(115200);
  
  Serial.println();
  prelog();
  Serial.print("Connecting to ");
  Serial.print(wifiCreds[0]);
  WiFi.begin(wifiCreds[0], wifiCreds[1]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");

    if ((millis() - now) > 300000) {  // 5 minutes
      ESP.restart();  // Try again every 5 mins
    }
  }
  Serial.print("\n");
  prelog();
  Serial.print("ip address: ");
  Serial.println(WiFi.localIP());
}

void setup() {
  connectToWifi();

  pinMode(DOOR_INPUT, INPUT_PULLUP);
  if (!DEBUG) {
    pinMode(BUILTIN_LED, OUTPUT);
  }
  attachInterrupt(DOOR_INPUT, onDoorChange, CHANGE);

  checkDoorStatus(true);
}

void loop() {
  if (isError) {
    digitalWrite(BUILTIN_LED, LED_ON);
    delay(1000);
    digitalWrite(BUILTIN_LED, LED_OFF);
    delay(1000);
  } else {
    delay(POLL_INTERVAL);
    if (isDoorOpen) {
      checkDoorStatus(false);
    }

    if (WiFi.status() != WL_CONNECTED) {
      log("WiFi disconnected");
//      isError = true;
      ESP.restart();
    }
  }
}

