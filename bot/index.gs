var CHANNEL_ACCESS_TOKEN = 'XXXXXXXXXXXXXXXXXXX';
var line_endpoint = 'https://api.line.me/v2/bot/message/reply';
var line_userendpoint = 'https://api.line.me/v2/bot/profile/';
var line_endpoint_profile = 'https://api.line.me/v2/bot/profile';
var YAHOO_CLIENT_ID = 'XXXXXXXXXXXXXXXXXXX';
var YAHOO_SEARCH_URL = 'https://map.yahooapis.jp/search/local/V1/localSearch';
var YAHOO_DIST_URL = 'https://map.yahooapis.jp/dist/V1/distance';

function getSpreadSheet() {
  var sid = 'XXXXXXXXXXXXXXXXXXX';
  return SpreadsheetApp.openById(sid);
}

function cacheGet(keyStr, cache, userId){
  var value;
  var key = keyStr + "-" + userId;
  value = cache.get(key);
  return value;
}

function cachePut(keyStr, valueStr, cache, userId){
  var key = keyStr + "-" + userId;
  cache.put(key, valueStr);
}

function cacheRemove(keyStr, cache, userId){
  var key = keyStr + "-" + userId;
  cache.remove(key);
}


function replyAskLoc(reply_token, reply_messages) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": [{
        "type": "template",
        "altText": "位置情報を送ってください",
        "template": {
          "type": "buttons",
          "title": "位置情報",
          "text": reply_messages + "の位置情報を送ってください",
          "actions": [
            {label: '位置情報を送る', type: 'uri', uri: 'line://nv/location' },
          ]
        }
      }]
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function replyMessage(reply_token, reply_messages) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": [{
        "type": "text",
        "text": reply_messages,
      }],
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function replyButtonMessage(reply_token, altMessage, titleMessage, userMessage, labelMessage, textMessage) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": [{
        "type": "template",
        "altText": altMessage,
        "template": {
          "type": "buttons",
          "title": titleMessage,
          "text": userMessage,
          "actions": [
            {label: labelMessage, type: 'message', text: textMessage },
          ]
        }
      }]
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function replyLocMessage(reply_token, replyinfo) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": [{
        "type": "text",
        "text": "更新日：" + Utilities.formatDate(replyinfo[2], "JST", "yyyy/MM/dd(E) HH:mm:ss") + "\nメッセージ：" + replyinfo[3], 
      },{
        "type": "text",
        "text": "無事が報告された場所はこちらです。",
      },{
        "type": "location",
        "title": "無事が報告された場所",
        "address": replyinfo[4],
        "latitude": replyinfo[5],
        "longitude": replyinfo[6],
      }],
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function replyLocMessageFromBeacon(reply_token,bmessage,emessage,userinfoOfLastUpdate) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": [{
        "type": "text",
        "text": bmessage,
      },{
        "type": "location",
        "title": "最後に無事が報告された場所",
        "address": userinfoOfLastUpdate[2],
        "latitude": userinfoOfLastUpdate[3],
        "longitude": userinfoOfLastUpdate[4],
      },{
        "type": "template",
        "altText": "ブジデスに無事を報告しますか？",
        "template": {
          "type": "buttons", 
          "size": "sm",
          "title": "無事の報告",
          "text": emessage,
          "actions": [
            {label: "無事を報告する", type: "message", text: "無事を報告する" },
          ]
        }
      }],
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function findRow(sheet, finddata,col) {
  var dat = sheet.getDataRange().getValues(); 
  for (var i=1; i<dat.length; i++) {
    if(dat[i][col-1] === finddata){
      return [i+1,dat[i][col],dat[i][col+1],dat[i][col+2],dat[i][col+3],dat[i][col+4],dat[i][col+5]];
    }
  }
  return [0,0,0,0,0,0,0];
}
function findRow2(sheet, finddata,col) {
  var dat = sheet.getDataRange().getValues(); 
  for (var i=1; i<dat.length; i++) {
    if(dat[i][col-1] === finddata){
      return [i+1,dat[i][col-1],dat[i][col],dat[i][col+1],dat[i][col+2],dat[i][col+3],dat[i][col+4]];
    }
  }
  return [0,0,0,0,0,0];
}

function getLastUpdateUserinfo(sheet,finddata,col){
  var last_update = 0;
  var rownums = 0;
  var latitude = 0;
  var longuitude = 0;
  var address = 0;
  var dat = sheet.getDataRange().getValues(); 
  for (var i=1; i<dat.length; i++) {
    if(dat[i][col-1] === finddata) {
      if ((dat[i][col] - last_update) > 0) {
        last_update = dat[i][col];
        rownums = i+1;
        address = dat[i][col+2];
        latitude = dat[i][col+3];
        longuitude = dat[i][col+4];
      }
    }
  }
  return [rownums, last_update, address, latitude, longuitude];
}

function deleteRow(sheet, delrown) {
  sheet.deleteRows(delrown);
}

function setRow(sheet, user_id, locationInfo, col) {
  var cache = CacheService.getScriptCache();
  var tel_number = cacheGet("tel_number",cache,user_id);
  var umessage = cacheGet("message",cache,user_id);
  var today = new Date();
  var changeRow = findRow(sheet, tel_number, col);

  if (changeRow[0] === 0) {
    sheet.appendRow(["'" + tel_number, user_id, today, umessage, locationInfo]);
  } else{
    sheet.getRange(changeRow[0], 2).setValue(user_id);
    sheet.getRange(changeRow[0], 3).setValue(today);
    sheet.getRange(changeRow[0], 4).setValue(umessage);
    sheet.getRange(changeRow[0], 5).setValue(locationInfo);
    sheet.getRange(changeRow[0], 6).clearContent();
    sheet.getRange(changeRow[0], 7).clearContent();
  }
}

function setBeaconAdm(sheet, user_id, display_name, tel_number, col) {
  var today = new Date();
  var changeRow = findRow(sheet, tel_number, col);

  if (changeRow[0] === 0) {
    sheet.appendRow([user_id, "'" + tel_number, display_name, today]);
  } else{
    sheet.getRange(changeRow[0], 1).setValue(user_id);
    sheet.getRange(changeRow[0], 2).setValue("'" + tel_number);
    sheet.getRange(changeRow[0], 3).setValue(display_name);
    sheet.getRange(changeRow[0], 4).setValue(today);
    sheet.getRange(changeRow[0], 5).clearContent();
  }
}

function setLocation(sheet, user_id, addressinfo, latitudeinfo, longitudeinfo, col) {
  var cache = CacheService.getScriptCache();
  var telnumber = cacheGet("tel_number",cache,user_id);
  var umessage = cacheGet("message",cache,user_id);
  var today = new Date();
  var changeRow = findRow(sheet, telnumber, col);
  if (changeRow[0] === 0) {
    sheet.appendRow(["'" + telnumber, user_id, today, umessage, addressinfo, latitudeinfo, longitudeinfo]);
  } else{
    sheet.getRange(changeRow[0], 2).setValue(user_id);
    sheet.getRange(changeRow[0], 3).setValue(today);
    sheet.getRange(changeRow[0], 4).setValue(umessage);
    sheet.getRange(changeRow[0], 5).setValue(addressinfo);
    sheet.getRange(changeRow[0], 6).setValue(latitudeinfo);
    sheet.getRange(changeRow[0], 7).setValue(longitudeinfo);
  }
}


// Yahooから座標情報を取得
var Shelter = function(uid, name, telnumber, address, distance, googleSearchUrl, googleMapRouteUrl) {
  this.uid = uid;
  this.name = name;
  this.telnumber = telnumber;
  this.address = address;
  this.distance = distance;
  this.googleSearchUrl = googleSearchUrl;
  this.googleMapRouteUrl = googleMapRouteUrl;
};
function getNearShelter(latitude, lonitude) {
  var url = YAHOO_SEARCH_URL
          + '?appid=' + YAHOO_CLIENT_ID
          + '&dist=50'     // 検索範囲；50km
          + '&gc=0425001' // 業種コード: 避難場所
          + '&results=5'  // num_rows：5件
          + '&lat=' + latitude
          + '&lon=' + lonitude
          + '&output=json'
          + '&sort=geo'; // 球面三角法による2点間の距離順 2点間の直線距離ならdist
  var response = UrlFetchApp.fetch(url);
  
  var shelter = [];
  var gcount = JSON.parse(response.getContentText('UTF-8'))['ResultInfo'];
  if (gcount.Count === 0) {
    shelter.push(new Shelter(0,0,0,0,0,0,0));
  } else {
    var features = JSON.parse(response.getContentText('UTF-8'))['Feature'];
    for (i = 0; i < features.length; i++) {
      var uid = features[i]['Property'].Uid;
      var name = features[i].Name;
      var address = features[i]['Property'].Address;
      var coords = features[i]['Geometry'].Coordinates.split(',');
      var telnumber = features[i]['Property'].Tel1;
      var shelter_lonitude = coords[0];
      var shelter_latitude = coords[1];
      var distance = getDistanceKM(shelter_latitude, shelter_lonitude, latitude, lonitude);
      var googleSearchUrl = getGoogleSearchUrl(name + ' ' + address);
      var googleMapRouteUrl = getGoogleMapRouteUrl(shelter_latitude, shelter_lonitude, latitude, lonitude);
      shelter.push(new Shelter(uid, name, telnumber, address, distance, googleSearchUrl, googleMapRouteUrl));
    }
  }
  return shelter;
}

function getDistanceKM(latitudeinfo1, longitudeinfo1, latitudeinfo2, longitudeinfo2) {
  var url = YAHOO_DIST_URL
          + '?appid=' + YAHOO_CLIENT_ID
          + '&coordinates=' + longitudeinfo1 + ',' + latitudeinfo1 + encodeURIComponent(' ') + longitudeinfo2 + ',' + latitudeinfo2
          + '&output=json';
  var response = UrlFetchApp.fetch(url);
  var distance = JSON.parse(response.getContentText('UTF-8'))['Feature'][0]['Geometry'].Distance;
  return Math.round(distance * 100) / 100; // 小数点2ケタに四捨五入
 }

 function getGoogleSearchUrl(query) {
  return 'https://www.google.co.jp/search?q=' + encodeURIComponent(query) + '&ie=UTF-8';
}

function getGoogleMapRouteUrl(destLatitude, destLongitude, srcLatitude, srcLongitude) {
  return 'http://maps.google.com/maps'
         + '?saddr=' + srcLatitude + ',' + srcLongitude
         + '&daddr=' + destLatitude + ',' + destLongitude
         + '&dirflg=w';   // 徒歩
}

function replyCarousel(reply_token, reply_messages) {
  UrlFetchApp.fetch(line_endpoint, {
    'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': reply_token,
      "messages": reply_messages,
    }),
  });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
}

function replyBeaconMenu(reply_token, user_id) {
  // 避難所管理者シートにLINE UserのIDが存在するか確認する
  var spreadSheet = getSpreadSheet();
  var beaconadmin_sheet = spreadSheet.getSheetByName('避難所管理者');
  var linebeaconuser = findRow(beaconadmin_sheet, user_id,1);
  if (linebeaconuser[0] === 0){
    // 避難所管理者シートに存在していない場合は、避難所管理者を登録するという情報を投げる
    replyButtonMessage(reply_token, "管理者に登録されていません","エラー","避難所管理者として登録されていません。","避難所管理者に登録する", "！避難所管理者を追加/更新する！");
    return;
  } else {
    // 避難所管理者シートの情報から各種情報を抽出する
    // 管理者の電話番号：linebeaconuser[1]
    // 管理者のdisplay_name：linebeaconuser[2]
    // 管理者の更新日付：Utilities.formatDate(linebeaconuser[3], "JST", "yyyy/MM/dd(E) HH:mm:ss")

    var repmenumessage = [{  
      "type": "flex",
      "altText":"避難所管理者メニュー",
      "contents": 
        {
          "type": "bubble",
          "body": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "避難所管理者メニュー",
                "weight": "bold",
                "size": "xl"
              },
              {
                "type": "box",
                "layout": "vertical",
                "spacing": "sm",
                "contents": [
                  {
                    "type": "text",
                    "text": "Beaconの追加や変更を行えます",
                    "margin": "sm",
                    "flex": 0
                  }
                ]
              },
              {
                "type": "box",
                "layout": "vertical",
                "margin": "lg",
                "spacing": "sm",
                "contents": [
                  {
                    "type": "box",
                    "layout": "vertical",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "避難所管理者としての登録情報",
                        "color": "#905c44",
                        "size": "sm",
                        "margin": "sm",
                        "flex": 0
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "名前",
                        "color": "#aaaaaa",
                        "size": "sm",
                        "flex": 1
                      },
                      {
                        "type": "text",
                        "text": linebeaconuser[2],
                        "wrap": true,
                        "color": "#666666",
                        "size": "sm",
                        "flex": 5
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "Tel",
                        "color": "#aaaaaa",
                        "size": "sm",
                        "flex": 1
                      },
                      {
                        "type": "text",
                        "text": linebeaconuser[1],
                        "wrap": true,
                        "color": "#666666",
                        "size": "sm",
                        "flex": 5
                      }
                    ]
                  },
                  {
                    "type": "box",
                    "layout": "baseline",
                    "spacing": "sm",
                    "contents": [
                      {
                        "type": "text",
                        "text": "更新日",
                        "color": "#aaaaaa",
                        "size": "sm",
                        "flex": 1
                      },
                      {
                        "type": "text",
                        "text": Utilities.formatDate(linebeaconuser[3], "JST", "yyyy/MM/dd(E) HH:mm:ss"),
                        "wrap": true,
                        "color": "#666666",
                        "size": "sm",
                        "flex": 5
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "footer": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "contents": [
              {
                "type": "button",
                "color": "#905c44",
                "style": "primary",
                "height": "sm",
                "action": {
                  "type": "message",
                  "label": "避難所管理者を追加/更新する",
                  "text": "！避難所管理者を追加/更新する！"
                }
              },
              {
                "type": "button",
                "color": "#c38e77",
                "style": "secondary",
                "height": "sm",
                "action": {
                  "type": "message",
                  "label": "避難所管理者情報を確認する",
                  "text": "！避難所管理者情報を確認する！"
                }
              },
              {
                "type": "button",
                "color": "#905c44",
                "style": "primary",
                "height": "sm",
                "action": {
                  "type": "message",
                  "label": "避難所管理者情報を消す",
                  "text": "！避難所管理者を削除する！"
                }
              },
              {
                "type": "button",
                "color": "#c38e77",
                "style": "secondary",
                "height": "sm",
                "action": {
                  "type": "message",
                  "label": "Beaconを設置/情報更新する",
                  "text": "！新たにBeaconを設置/更新する！"
                }
              },
              {
                "type": "button",
                "color": "#905c44",
                "style": "primary",
                "height": "sm",
                "action": {
                  "type": "message",
                  "label": "設置されたBeacon情報を消す",
                  "text": "！設置されたBeacon情報を削除する！"
                }
              },
              {
                "type": "spacer",
                "size": "sm"
              }
            ],
            "flex": 0
          }
        }
    }];  
    UrlFetchApp.fetch(line_endpoint, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
      },
      'method': 'post',
      'payload': JSON.stringify({
        'replyToken': reply_token,
        "messages": repmenumessage
      }),
    });
  return ContentService.createTextOutput(JSON.stringify({'content': 'post ok'})).setMimeType(ContentService.MimeType.JSON);
  }
}


function getBeaconMenu(user_id){
  return user_id;
}

/////////////////////////////////////////////////////////////////////////////////////////

function doPost(e) {
  var json = JSON.parse(e.postData.contents);
  var reg = new RegExp(/^[0-9]{10}[0-9]?$/);
  var regc = new RegExp(/^.{10}$/);
  var reply_token= json.events[0].replyToken;
  var user_id = json.events[0].source.userId;
  var user_message;  
  var spreadSheet = getSpreadSheet();
  var busidesu_sheet = spreadSheet.getSheetByName('ブジデス');
  var beacon_sheet = spreadSheet.getSheetByName('LineBeacon設置場所');
  var log_sheet = spreadSheet.getSheetByName('log');
  var beaconadmin_sheet = spreadSheet.getSheetByName('避難所管理者');
  var cache = CacheService.getScriptCache();
  var type = cacheGet("type",cache,user_id);
  var searchstatus, response, display_name;
  var messagetype = json.events[0].type;
  var today = new Date();
  var beaconLoc, beaconhwid;
  
  log_sheet.appendRow([today, messagetype, user_id, json.events[0]]);

  if (typeof reply_token === 'undefined') {
    return;
  }

  if (messagetype === 'beacon') {
    // Beaconで検知した場合の動作

    // Beaconの設置情報を取得 hwidをキーにLineBeacon設置場所シートから行を抽出
    var linebeaconinfo = findRow(beacon_sheet, json.events[0].beacon.hwid, 1);

    // user_idからLINEユーザのDisplayNameを取得する
    url = line_userendpoint + user_id;
    response = UrlFetchApp.fetch(url, {
        'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
        },
    });
    display_name = JSON.parse(response).displayName;

    if (linebeaconinfo[0] === 0) {
      // 登録されていないBeaconを検知した場合の処理
      // もし避難所管理者に登録されていたらLineBeacon設置場所に登録するフラグ(type=1100)を立てる
      var linebeaconadmininfo = findRow(beaconadmin_sheet, user_id, 1);
      if (linebeaconadmininfo[0] > 0){
        replyMessage(reply_token, display_name + "さん、登録されていないBeaconを検知したよ！\nHWID:" + json.events[0].beacon.hwid + "\n設置した建物名を入力してください！");
        cachePut("type", 1100, cache, user_id);
        cachePut("hwid", json.events[0].beacon.hwid, cache, user_id);
      }      

    } else {
      // 登録されているユーザIDを検索 ブジデスシートの2列目から行を抽出
      var linebeaconuser = findRow(busidesu_sheet, user_id,2);
      if (linebeaconuser[0] === 0) {
        // まだブジデスに登録していないユーザに対し、登録しませんか？とお勧めする
        if (json.events[0].beacon.type === 'enter') {
          replyMessage(reply_token, display_name + "さん、ブジデスに無事を報告しませんか？\n報告したい場合は「ブジデス」と話しかけてください。");
        }

      } else if (json.events[0].beacon.type === 'enter') {
        // 既にブジデスに登録しているユーザに対し、最後に登録したのは〇〇ですけど登録しませんか？とお勧めする
        // 直近で登録したときの時間、座標を抽出。更新してから24時間以上たっている、かつ検知したBeaconの座標と比較して100m圏外の場合だけメッセージを伝える
        // ※ 移動していないならBeaconから登録してねとPushされないようにするため
        var userinfoOfLastUpdate = getLastUpdateUserinfo(busidesu_sheet, user_id,2);
        var bmessage = display_name + "さんが" + linebeaconinfo[1] + "にいることを検知しました。\n最後に登録した時間は" + Utilities.formatDate(userinfoOfLastUpdate[1], "JST", "yyyy/MM/dd(E) HH:mm:ss") + " です。\nその時の登録場所はこちらです。";
        var emessage = "あなたの無事を報告しますか？\n報告する場合は下のボタンを押すか、ブジデスと話しかけて下さい。";

        // ユーザ最後の情報：userinfoOfLastUpdate[3]：緯度 userinfoOfLastUpdate[4]：経度
        // 検知したBeaconの情報：linebeaconinfo[2]：緯度 linebeaconinfo[3]：経度
        // 100m誤差： 緯度=0.000898、経度=0.001097
        var clatitude = userinfoOfLastUpdate[3] - linebeaconinfo[3];
        var clongitude = userinfoOfLastUpdate[4] - linebeaconinfo[4];
        log_sheet.appendRow([today, messagetype, user_id, userinfoOfLastUpdate[3],userinfoOfLastUpdate[4],linebeaconinfo[3],linebeaconinfo[4],clatitude,clongitude,userinfoOfLastUpdate[1].getDate()]); //★
        if (clatitude <= -0.000898 || clatitude >= 0.000898){
          if(clongitude <= -0.001097 || clongitude >= 0.001097){
            // ユーザ最後の最終更新日時：userinfoOfLastUpdate[1] が 昨日よりも昔の場合に動作させる
            if (userinfoOfLastUpdate[1].getDate() < today.getDate() - 1) {
              replyLocMessageFromBeacon(reply_token,bmessage,emessage,userinfoOfLastUpdate);
            }
          }
        }
      }
    }
  } else {

    user_message = json.events[0].message.text;  

    // Beacon以外の動作
    if (type === null) {
      if (user_message === 'ヘルプ' || user_message === '?') {
        replyMessage(reply_token,"無事を確認したいときは「確認」\n無事を報告したい時は「ブジデス」\nデータを削除したいときは「削除」\n近くの避難所を検索したいときは「避難所」と話しかけてください。"); 
      } else if ('スプレッドシート' == user_message) {
        replyMessage(reply_token,spreadSheet.getUrl());
      } else if (user_message === '無事を確認する' || user_message === '確認') {
        cachePut("type", 10, cache, user_id);
        replyMessage(reply_token,"無事を確認したい人の電話番号を入力してください。"); 
      } else if (user_message === '無事を報告する' || user_message === 'ブジデス') {
        cachePut("type", 20, cache, user_id);
        replyMessage(reply_token,"無事を報告したい人の電話番号を入力してください。"); 
      } else if (user_message === 'データを削除する' || user_message === '削除'){
        cachePut("type", 30, cache, user_id);
        replyMessage(reply_token, "削除したいデータの電話番号を入力してください。");
      } else if (user_message === '近くの避難所を検索する' || user_message === '避難所'){
        cachePut("type", 40, cache, user_id);
        replyAskLoc(reply_token, 'あなた');
      } else if (user_message === '避難所管理者メニュー') {
        // 避難所管理者メニューを表示させます
        replyBeaconMenu(reply_token,user_id);
      } else if (user_message === '！避難所管理者を追加/更新する！'){
        // 避難所管理者シートにユーザ情報を登録する処理を追加
        cachePut("type", 1010, cache, user_id);
        replyMessage(reply_token, "追加/更新したい管理者の電話番号を入力してください。");
      } else if (user_message === '！避難所管理者情報を確認する！'){
        // 避難所管理者シートにユーザ情報を登録する処理を追加
        cachePut("type", 1011, cache, user_id);
        replyMessage(reply_token, "確認したい管理者の電話番号を入力してください。");
      } else if (user_message === '！避難所管理者を削除する！'){
        cachePut("type", 1012, cache, user_id);
        replyMessage(reply_token, "削除したい避難所管理者の電話番号を入力してください。");
      } else if (user_message === '！新たにBeaconを設置/更新する！'){
        cachePut("type", 1013, cache, user_id);
        replyMessage(reply_token, "設置するLINEBeaconに記載されている10桁のHWIDを入力してください。");
      } else if (user_message === '！設置されたBeacon情報を削除する！'){
        cachePut("type", 1014, cache, user_id);
        replyMessage(reply_token, "情報を削除したいLINEBeaconに記載されている10桁のHWIDを入力してください。");
      } else if (user_message === 'ストップ' || user_message === 'キャンセル' || user_message === 'クリア' || user_message === 'いいえ' || user_message === 'ちがう' || user_message === 'やめる'){
        replyMessage(reply_token, "処理をキャンセルしました。");
        cacheRemove("type", cache, user_id);
        cacheRemove("message", cache, user_id);
        cacheRemove("tel_number", cache, user_id);
        cacheRemove("hwid", cache, user_id);
        cacheRemove("beaconLocation", cache, user_id);
      } else {
        replyMessage(reply_token,"メニューから利用したいサービスをご選択ください。"); 
      }
    } else {
      if (user_message === 'ストップ' || user_message === 'キャンセル' || user_message === 'クリア' || user_message === 'いいえ' || user_message === 'ちがう' || user_message === 'やめる'){
        replyMessage(reply_token,"キャンセルしました。");
        cacheRemove("type", cache, user_id);
        cacheRemove("message", cache, user_id);
        cacheRemove("tel_number", cache, user_id);
        cacheRemove("hwid", cache, user_id);
        cacheRemove("beaconLocation", cache, user_id);
      } else {
        // 詳細な分岐
        switch(type) {
          case "10":
          // 「無事を確認したい」 と入力した場合
          // user_message: 確認したい人の電話番号
          user_message = user_message.replace(/-/g, '');
          // 入力されたメッセージが電話番号かを確認
          if (reg.test(user_message)) {
            // 入力された電話番号のを検索し、行番号を取得 （1：シートの1列目という意味）
            searchstatus = findRow(busidesu_sheet,user_message,1);
            if (searchstatus[0] === 0) {
              replyMessage(reply_token,"この番号の無事は報告されていません。\n電話番号：" + user_message);
            } else {
              if (searchstatus[5] === '') {
                replyMessage(reply_token,"無事が報告されています。\n更新日：" + Utilities.formatDate(searchstatus[2], "JST", "yyyy/MM/dd(E) HH:mm:ss") + "\nメッセージ：" + searchstatus[3] + "\n位置情報：" + searchstatus[4]);
                // replyMessage(reply_token,"確認したい人の電話番号っすね！\n" + searchstatus[0] + "行目っす！\n" + "更新日時：" + searchstatus[1].toFormat("YYYY/MM/DD HH24:MI:SS") + "\nステータス：" + searchstatus[2]);
              } else {
                replyLocMessage(reply_token, searchstatus);
              }
            }
            cacheRemove("type", cache, user_id);
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "20":
          // 無事を報告したい と入力した場合
          // user_message: 電話番号
          user_message = user_message.replace(/-/g, '');
          if (reg.test(user_message)) {
            cachePut("tel_number", user_message, cache, user_id);
            cachePut("type", 21, cache, user_id);
            replyMessage(reply_token,"続いて登録したいメッセージをご入力ください\n登録を辞める場合はキャンセルとご入力ください");
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "21":
          // 無事を報告 → 電話番号まで入力
          // user_message: 報告したいメッセージ
          cachePut("message", user_message, cache, user_id);
          cachePut("type", 22, cache, user_id);
          // replyMessage(reply_token,"最後に位置情報を入力してください\n＋ボタンにある「位置情報」を活用してください。");
          var telnumber = cacheGet("tel_number",cache,user_id);
          replyAskLoc(reply_token, telnumber + 'さん');
          break;

          case "22":
          // 無事を報告 → 電話番号 → メッセージまで入力
          // user_message: 位置情報
          if (json.events[0].message.type === "location") {
            replyMessage(reply_token,"情報を追加しました！");
            setLocation(busidesu_sheet, user_id, json.events[0].message.address, json.events[0].message.latitude, json.events[0].message.longitude, 1);
          } else {
            replyMessage(reply_token,"情報を追加しました！");
            setRow(busidesu_sheet, user_id, user_message,1);
          }
          // とりあえず今は何も考えずに追加
          // addToSpreadSheet(user_message);
          cacheRemove("type", cache, user_id);
          cacheRemove("message", cache, user_id);
          cacheRemove("tel_number", cache, user_id);
          break;

          case "30":
          // データを削除したい → 電話番号まで入力
          // user_message: 削除したい電話番号
          user_message = user_message.replace(/-/g, '');
          if (reg.test(user_message)) {
            var delrown = findRow(busidesu_sheet, user_message, 1);
            if (delrown[0] === 0) {
              replyMessage(reply_token, user_message + "のデータは既に削除されています。");
            } else {
              deleteRow(busidesu_sheet,delrown[0]);
              replyMessage(reply_token, user_message + "のデータを削除しました。");
            }
            cacheRemove("type", cache, user_id);
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "40":
          // 近くの避難所が知りたい → 位置情報を入力
          // user_message: undifined
          // json.events[0].message.address：住所
          // json.events[0].message.latitude：latitude
          // json.events[0].message.longitude：longuitude
          var ShelterInfo = getNearShelter(json.events[0].message.latitude, json.events[0].message.longitude);
          if (ShelterInfo[0].name === 0) {
            replyMessage(reply_token,"半径30km以内には登録されている避難所がありませんでした。\n申し訳ございませんが、お住いの自治体にお問い合わせください。");
          } else {
            var columns = ShelterInfo.map(function (v) {
              var title = v.name;
              return {
                'title': title,
                'text': 'ここから ' + v.distance + 'km\n' + v.address + '\n電話番号:' + v.telnumber,
                'actions': [
                  {
                    'type': 'uri',
                    'label': 'この避難所を検索',
                    'uri': v.googleSearchUrl
                  },
                  {
                    'type': 'uri',
                    'label': 'ここからのルート',
                    'uri': v.googleMapRouteUrl
                  }
                ]
              }
            });
            var altText = '';
            ShelterInfo.forEach(function(element, index, array) {
              altText += element.name + ' , ';
            });
            var messages = [
              {
                'type': 'template',
                'altText': altText,
                'template': {
                  'type': 'carousel',
                  'columns': columns
                }
              }
            ];
            replyCarousel(reply_token,messages);
          }
          cacheRemove("type", cache, user_id);
          break;

          case "1100":
          // 避難所管理者であると判断 → 設置場所を入力した状態
          // user_message: 設置したいBeaconの設置場所
          cachePut("beaconLocation", user_message, cache, user_id);
          replyAskLoc(reply_token, user_message);
          cachePut("type", 1101, cache, user_id);
          break;

          case "1101":
          // 避難所管理者が設置場所入力 → 座標を指定した状態
          // user_message: undifined
          // json.events[0].message.address：住所
          // json.events[0].message.latitude：latitude
          // json.events[0].message.longitude：longuitude
          beaconLoc = cacheGet("beaconLocation",cache,user_id);
          beaconhwid = cacheGet("hwid",cache,user_id);
          // beacon IDが存在する場合は削除してから挿入する
          var delbeacon = findRow(beacon_sheet,beaconhwid,1);
          if(delbeacon[0] === 0) {
            beacon_sheet.appendRow([beaconhwid, beaconLoc, json.events[0].message.address, json.events[0].message.latitude,json.events[0].message.longitude]);
            replyMessage(reply_token,"Beacon情報を追加しました！\nHWID:" + beaconhwid + "\n設置場所：" + beaconLoc + "\n" + json.events[0].message.address);
          } else {
            deleteRow(beacon_sheet, delbeacon[0]);
            beacon_sheet.appendRow([beaconhwid, beaconLoc, json.events[0].message.address, json.events[0].message.latitude,json.events[0].message.longitude]);
            replyMessage(reply_token,"Beacon情報を更新しました！\nHWID:" + beaconhwid + "\n設置場所：" + beaconLoc + "\n" + json.events[0].message.address);
          }
          cacheRemove("beaconLocation", cache, user_id);
          cacheRemove("hwid", cache, user_id);
          cacheRemove("type", cache, user_id);
          break;

          case "1010":
          // 避難所管理者を追加する ボタンを押して電話番号を入力した
          // user_message: 電話番号
          user_message = user_message.replace(/-/g, '');
          if (reg.test(user_message)) {
            url = line_userendpoint + user_id;
            response = UrlFetchApp.fetch(url, {
                'headers': {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
                },
            });
            display_name = JSON.parse(response).displayName;
            setBeaconAdm(beaconadmin_sheet,user_id, display_name, user_message, 2);
            replyButtonMessage(reply_token, "登録/更新完了","登録完了","避難所管理者に登録/更新しました。","管理者メニューを開く","避難所管理者メニュー");
            cacheRemove("type", cache, user_id);
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "1011":
          // 避難所管理者メニュー →「避難所管理者情報を確認する」 と入力した場合
          // user_message: 確認したい人の電話番号
          user_message = user_message.replace(/-/g, '');
          // 入力されたメッセージが電話番号かを確認
          if (reg.test(user_message)) {
            // 入力された電話番号のを検索し、行番号を取得 （2：シートの2列目という意味）
            searchstatus = findRow2(beaconadmin_sheet,user_message,2);
            if (searchstatus[0] === 0) {
              replyMessage(reply_token,"この番号は管理者として登録されていません。\n電話番号：" + user_message);
            } else {
              replyMessage(reply_token,"避難所管理者として登録されています。\nLINE登録名：" + searchstatus[2] + "\n電話番号：" + searchstatus[1] + "\n最終更新日：" + Utilities.formatDate(searchstatus[3], "JST", "yyyy/MM/dd(E) HH:mm:ss"));
            }
            cacheRemove("type", cache, user_id);
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "1012":
          // 避難所管理者を削除したい → 電話番号まで入力
          // user_message: 削除したい電話番号
          user_message = user_message.replace(/-/g, '');
          if (reg.test(user_message)) {
            var delrown = findRow(beaconadmin_sheet, user_message, 2);
            if (delrown[0] === 0) {
              replyMessage(reply_token, user_message + "のデータは既に削除されています。");
            } else {
              deleteRow(beaconadmin_sheet,delrown[0]);
              replyMessage(reply_token, user_message + "のデータを避難所管理者から削除しました。");
            }
            cacheRemove("type", cache, user_id);
          } else {
            replyMessage(reply_token,"電話番号は半角数字で入力してください。\n終了するときはキャンセルと入力してください。");
          }
          break;

          case "1013":
          // Beaconを設置する → HWIDまで入力
          // user_message: LINE BeaconのHWID
          // HWIDが10桁かを確認する
          if (regc.test(user_message)) {
            cachePut("hwid", user_message, cache, user_id);
            cachePut("type", 1100, cache, user_id);
            replyMessage(reply_token,"続いてLIEN Beaconを設置した建物名を入力してください！");
          } else {
            replyMessage(reply_token,"HWIDは１０桁の文字を入力してください。\nやめる場合はキャンセルと入力してください。");
          }
          break;
          
          case "1014":
          // Beaconの情報を削除する → HWIDまで入力
          // user_message: LINE BeaconのHWID
          var delbeacon = findRow(beacon_sheet, user_message, 1);
          if (delbeacon[0] === 0) {
            replyMessage(reply_token, user_message + "のBeaconデータは既に削除されています。");
          } else {
            deleteRow(beacon_sheet,delbeacon[0]);
            replyMessage(reply_token, user_message + "のデータをBeacon情報から削除しました。");
          }
          cacheRemove("type", cache, user_id);
          break;
          

        }
      }
    }
  }
}

