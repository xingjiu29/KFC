var req = $request || {};
var res = $response || {};
var url = req.url || "";

var target =
  /^https:\/\/res\.kfc\.com\.cn\/CRM\/kfcad\/(?:apphome6\/[^/?]+\.json|bootStrap\/rn\/[^/?]+\.json|notHomepage\/KFC\/rn\/[^/?]+\.json)(?:\?.*)?$/i.test(
    url
  );

function isAdItem(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  var marker =
    String(value.positionType || "") +
    " " +
    String(value.positionId || "") +
    " " +
    String(value.ccTag || "");

  return /bootstrap.*ad|app6_bootStrapAd/i.test(marker);
}

function cleanNode(value, removed) {
  if (Array.isArray(value)) {
    return value
      .filter(function (item) {
        if (isAdItem(item)) {
          removed.push("bootstrap-ad-item");
          return false;
        }

        return true;
      })
      .map(function (item) {
        return cleanNode(item, removed);
      });
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  var output = {};

  Object.keys(value).forEach(function (key) {
    if (/^(?:app6_)?tab(?:2|3|5Ai|5AiUnlogin)(?:_harmony)?$/i.test(key)) {
      removed.push(key);
      return;
    }

    if (
      /^(?:app6_)?(?:active)?bootstrapad$/i.test(key) ||
      /^newhomepage_.*bootstrapad/i.test(key)
    ) {
      removed.push(key);
      return;
    }

    output[key] = cleanNode(value[key], removed);
  });

  return output;
}

if (!target || res.status !== 200 || typeof res.body !== "string") {
  console.log(
    "KFC ad/tab response skipped; status=" +
      String(res.status) +
      "; url=" +
      url
  );
  $done({});
} else {
  try {
    var json = JSON.parse(res.body);
    var removed = [];
    var cleaned = cleanNode(json, removed);
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

    console.log(
      "KFC ad/tab JSON cleaned: " +
        (removed.length ? removed.join(",") : "no target keys present")
    );

    $done({
      status: 200,
      headers: headers,
      body: JSON.stringify(cleaned)
    });
  } catch (e) {
    console.log("KFC ad/tab JSON parse failed: " + String(e));
    $done({});
  }
}
