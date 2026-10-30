var req = $request || {};
var res = $response || {};
var url = req.url || "";

var isHome = /\/CRM\/kfcad\/apphome6\/[^/?]+\.json/i.test(url);
var isTarget =
  /^https:\/\/res\.kfc\.com\.cn\/CRM\/kfcad\/(?:apphome6\/[^/?]+\.json|bootStrap\/rn\/[^/?]+\.json|notHomepage\/KFC\/rn\/[^/?]+\.json)(?:\?.*)?$/i.test(url);

var homeTabs = [
  "app6_tab2",
  "app6_tab3",
  "app6_tab5Ai",
  "app6_tab5AiUnlogin"
];

var notHomeTabs = [
  "tab2",
  "tab3",
  "tab5Ai",
  "tab5AiUnlogin"
];

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

function blankTab(key) {
  return {
    positionType: key,
    positionId: key + "_hidden",
    title: "",
    subTitle: "",
    path: "",
    path2: "",
    path3: "",
    needLogin: false,
    wholeLifeFlag: false,
    show: false,
    isShow: false,
    visible: false,
    hidden: true,
    hide: true,
    action: { url: "" }
  };
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
    if (
      /^(?:app6_)?(?:active)?bootstrapad$/i.test(key) ||
      /^newhomepage_.*bootstrapad/i.test(key)
    ) {
      removed.push(key);
      return;
    }

    if (
      !isHome &&
      /^(?:app6_)?tab(?:2|3|5Ai|5AiUnlogin)(?:_harmony)?$/i.test(key)
    ) {
      removed.push(key + "=>[]");
      output[key] = [];
      return;
    }

    if (
      isHome &&
      /^(?:app6_)?tab(?:2|3|5Ai|5AiUnlogin)(?:_harmony)?$/i.test(key)
    ) {
      removed.push(key + "=>blank");
      output[key] = blankTab(key);
      return;
    }

    output[key] = cleanNode(value[key], removed);
  });

  return output;
}

if (!isTarget || res.status !== 200 || typeof res.body !== "string") {
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

    // 空白占位用于避免 App 回退到内置的默认底栏配置。
    if (!isHome && cleaned && cleaned.data && typeof cleaned.data === "object") {
      notHomeTabs.forEach(function (key) {
        cleaned.data[key] = [];
      });
      removed.push("notHomepage tabs=>[]");
    }

    if (isHome && cleaned && cleaned.data && typeof cleaned.data === "object") {
      homeTabs.forEach(function (key) {
        cleaned.data[key] = blankTab(key);
      });
      removed.push("apphome fallback tabs=>blank");
    }

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

    console.log("KFC ad/tab response: " + removed.join(","));

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
