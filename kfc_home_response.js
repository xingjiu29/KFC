var req = $request || {};
var res = $response || {};
var url = req.url || "";
var target = /^https:\/\/res\.kfc\.com\.cn\/CRM\/kfcad\/apphome6\/apphome_[^/?]+\.json(?:\?.*)?$/i;

if (!target.test(url) || res.status !== 200 || typeof res.body !== "string") {
  console.log("KFC home response skipped; status=" + String(res.status));
  $done({});
} else {
  try {
    var json = JSON.parse(res.body);

    if (!json || typeof json !== "object" || !json.data || typeof json.data !== "object") {
      console.log("KFC home JSON has no data object");
      $done({});
    } else {
      var keys = [
        "app6_bootStrapAd",
        "app6_tab2",
        "app6_tab3",
        "app6_tab5Ai",
        "app6_tab5AiUnlogin"
      ];
      var removed = [];

      keys.forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(json.data, key)) {
          delete json.data[key];
          removed.push(key);
        }
      });

      var headers = {};
      Object.keys(res.headers || {}).forEach(function (key) {
        var lower = key.toLowerCase();
        if (
          lower !== "content-length" &&
          lower !== "content-encoding" &&
          lower !== "etag" &&
          lower !== "last-modified"
        ) {
          headers[key] = res.headers[key];
        }
      });

      headers["Content-Type"] = "application/json; charset=utf-8";
      headers["Cache-Control"] = "no-store";

      console.log("KFC home config cleaned: " + removed.join(","));
      $done({
        status: 200,
        headers: headers,
        body: JSON.stringify(json)
      });
    }
  } catch (e) {
    console.log("KFC home JSON parse failed: " + String(e));
    $done({});
  }
}
