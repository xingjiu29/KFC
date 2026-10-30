var req = $request || {};
var url = req.url || "";
var headers = req.headers || {};

var target =
  /^https:\/\/res\.kfc\.com\.cn\/CRM\/kfcad\/(?:apphome6\/apphome_[^/?]+\.json|bootStrap\/(?:bootStrap_[^/?]+\.json|rn))(?:\?.*)?$/i;

if (!target.test(url)) {
  $done({});
} else {
  var cleanHeaders = {};

  Object.keys(headers).forEach(function (key) {
    var lower = key.toLowerCase();

    if (
      lower !== "if-modified-since" &&
      lower !== "if-none-match" &&
      lower !== "cache-control" &&
      lower !== "pragma"
    ) {
      cleanHeaders[key] = headers[key];
    }
  });

  cleanHeaders["Cache-Control"] = "no-cache, no-store";
  cleanHeaders["Pragma"] = "no-cache";

  // apphome/bootstrap JSON 使用唯一查询参数，避免沿用 304 缓存。
  if (/\.json(?:\?.*)?$/i.test(url)) {
    var separator = url.indexOf("?") >= 0 ? "&" : "?";
    url += separator + "_loon_kfc_filter=" + Date.now();
  }

  console.log("KFC startup config request: " + url);
  $done({
    url: url,
    headers: cleanHeaders
  });
}
