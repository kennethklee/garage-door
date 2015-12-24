#include <ESP8266WiFi.h>      // https://github.com/esp8266/Arduino
//#include <WiFiClientSecure.h> // https://github.com/esp8266/Arduino

#define DEBUG false

#define DOOR_OPEN HIGH
#define DOOR_CLOSE LOW
#define DOOR_INPUT 2

// GPIO1
#define LED_ON LOW
#define LED_OFF HIGH

// https://home.konquest.com/state
const PROGMEM char* WIFI[] = { "lee++", "letmein!" };
const PROGMEM char* NOTIFY_HOST = "downloads.konquest.com";
const PROGMEM char* NOTIFY_URI = "/state";
//const PROGMEM int NOTIFY_PORT = 443;
const PROGMEM int NOTIFY_PORT = 80;

const PROGMEM int RESTART_INTERVAL = 1000 * 60 * 60; // 1 hour
const PROGMEM int POLL_INTERVAL = 1000 * 1; // 1 second
const PROGMEM int UPDATE_INTERVAL = 1000 * 20; // 20 seconds

int last_check = 0;
int last_update = 0;
bool last_is_open = false;
bool isError = false;

void log(String message) {
  if (DEBUG) {
    Serial.print("[");
    Serial.print((double)millis() / 1000);
    Serial.print("s] ");
    Serial.println(message);
  }
}

bool notifyState(bool isOpen) {
//  WiFiClientSecure request;
  WiFiClient request;
  if (!request.connect(NOTIFY_HOST, NOTIFY_PORT)) {
    log(String("Failed to connect to ") + NOTIFY_HOST);
    isError = true;
    return false;
  }
  
//  if (!request.verify("3A A9 66 D5 E7 80 94 E4 AF CD 0A 7D E7 E4 B6 27 A5 AA D4 22", NOTIFY_HOST)) {
//    log("SSL verification failed");
//    isError = true;
//    return false;
//  }

  // {"garage":{"door":"open/close"}}
  String postData = String("{\"garage\":{\"door\":\"") + (isOpen ? "open" : "close") + "\"}}";
  request.print(String("POST ") + NOTIFY_URI + " HTTP/1.1\r\n" +
    "Host: " + NOTIFY_HOST + "\r\n" +
    "User-Agent: ESP8266\r\n" +
    "Connection: close\r\n" +
    "Content-Type: application/json\r\n" +
    "Content-Length: " + postData.length() + "\r\n\r\n" +
    postData);

//  while (request.available()) {
//    String responseLine = request.readStringUntil('\r');
//    log(responseLine);
//  }
//  String response = request.readString();
//  log(response);
  log(String("notified home: garage door ") + (isOpen ? "opened" : "closed"));
  return true;
}

void connectToWifi() {
  int now = millis();
  
  log(String("Connecting to ") + WIFI[0] + "...");
  WiFi.begin(WIFI[0], WIFI[1]);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);

    if ((millis() - now) > 300000) {  // 5 minutes
      log("Could not connect. Restarting...");
      ESP.restart();  // Try again every 5 mins
    }
  }
  log("Connected!");
  IPAddress ip = WiFi.localIP();
  log("ip address: " + String(ip[0]) + '.' + String(ip[1]) + '.' + String(ip[2]) + '.' + String(ip[3]));
}

bool checkDoor() {
  bool isOpen;
  if (digitalRead(DOOR_INPUT) == DOOR_OPEN) {
    log("open");
    isOpen = true;
  } else if (digitalRead(DOOR_INPUT) == DOOR_CLOSE) {
    log("close");
    isOpen = false;
  }
 
  if (!DEBUG) {
    digitalWrite(BUILTIN_LED, isOpen ? LED_ON : LED_OFF);
  }

  return isOpen;
}

void setup() {
  if (DEBUG) {
    Serial.begin(115200);
    Serial.println();
    Serial.println();
  } else {
    pinMode(BUILTIN_LED, OUTPUT);
  }
  
  connectToWifi();

  pinMode(DOOR_INPUT, INPUT_PULLUP);
}

void loop() {
  if (isError) {
    digitalWrite(BUILTIN_LED, LED_ON);
    delay(500);
    digitalWrite(BUILTIN_LED, LED_OFF);
    delay(500);
  }

  if (WiFi.status() != WL_CONNECTED) {
    log("WiFi disconnected. Restarting...");
    ESP.restart();
  }

  int now = millis();
  if (now - last_check >= POLL_INTERVAL) {
    last_is_open = checkDoor();
    last_check = now;
  }
  
  if (now - last_update >= UPDATE_INTERVAL) {
    notifyState(last_is_open);
    last_update = now;
  }

  // Restart once in awhile to make sure the timers and such are clean
  if (now >= RESTART_INTERVAL) {
    log("Restart needed. Restarting...");
    ESP.restart();
  }
}
