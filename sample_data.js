/* Synthetic read-only API for the original KidSafe renderers. No requests leave the frame. */
(() => {
  const timezone = "Asia/Ho_Chi_Minh";
  const now = Date.now();
  const dateKey = (date) => new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
  const today = dateKey(now);
  const dailySeconds = Object.fromEntries([68, 47, 73, 52, 75, 36, 42].map(
    (minutes, index) => [dateKey(now - (6 - index) * 86400000), minutes * 60],
  ));
  const domains = ["example.com", "wikipedia.org", "khanacademy.org"];
  const sampleApp = { name: "notepad.exe", sha256: "0".repeat(64) };
  const group = (options = {}) => ({
    enabled: true, mode: "daily", quota_sec: null, window: null, apps: [], message: "",
    ...options,
  });
  const policy = {
    timezone, weekday_quota_sec: 5400, weekend_quota_sec: 7200,
    entertainment_quota_sec: 2400, entertainment_apps: [],
    schedule: Array.from({ length: 7 }, (_, day) => Array.from({ length: 48 }, (_, slot) =>
      day < 5 ? slot >= 32 && slot < 42 : slot >= 16 && slot < 42)),
    app_mode: "blocklist", apps: [],
    app_groups: {
      study: group({ apps: [sampleApp] }), games: group({ mode: "entertainment" }),
      video: group({ mode: "entertainment" }), social: group(), blocked: group({ enabled: false }),
    },
    blocked_domains: [domains[0]], blocked_categories: ["age_inappropriate", "games"],
    safesearch: true,
  };
  const device = {
    id: "demo-pc", name: "Laptop của An · máy mẫu", last_seen: Math.floor(now / 1000) - 7200,
    reported_policy_version: 1, revoked: false,
    allocation: { weekday_sec: policy.weekday_quota_sec, weekend_sec: policy.weekend_quota_sec },
  };
  const requests = [{
    ts: new Date(now - 900000).toISOString(), device_id: device.id,
    requested_minutes: 10, status: "pending",
  }];
  const report = (days) => {
    const daily = days === 1 ? { [today]: dailySeconds[today] } : dailySeconds;
    const normal = Object.values(daily).reduce((total, seconds) => total + seconds, 0);
    const usedEntertainment = 18 * 60;
    return {
      through_date: today, daily_seconds: daily, exception_seconds: {},
      normal_seconds: normal, total_seconds: normal,
      entertainment_today: {
        quota_sec: policy.entertainment_quota_sec, used_sec: usedEntertainment,
        remaining_sec: policy.entertainment_quota_sec - usedEntertainment,
        reporting_devices: 1, devices_count: 1,
      },
      top_apps: [
        { subject: "msedge.exe", value: days === 1 ? 24 * 60 : normal - 92 * 60 },
        { subject: sampleApp.name, value: (days === 1 ? 18 : 92) * 60 },
      ],
      top_domains: [
        { subject: domains[2], value: days === 1 ? 5 : 24 },
        { subject: domains[1], value: days === 1 ? 3 : 16 },
      ],
      blocked_count: days === 1 ? 1 : 5, requests, pending_requests: requests,
    };
  };
  const samplePolicy = {
    policy, version: 1,
    stats: {
      controlled_app_count: Object.values(policy.app_groups).flatMap((item) => item.apps).length,
      blocked_domain_count: policy.blocked_domains.length,
    },
  };
  const fixtures = {
    policy: samplePolicy,
    devices: [device],
    "reports?days=1": report(1),
    "reports?days=7": report(7),
    "audit/recent": [],
    account: { username: "an-demo@kidsafe.example" },
    commands: [],
  };

  window.fetch = async (path, options = {}) => {
    if ((options.method ?? "GET") !== "GET") {
      return Response.json({ detail: "Bản xem trước không lưu thay đổi hay gửi lệnh." }, { status: 405 });
    }
    const endpoint = String(path).replace(/^\/api\/children\/demo\//, "");
    if (Object.hasOwn(fixtures, endpoint)) return Response.json(fixtures[endpoint]);
    return Response.json({ detail: "Thao tác này chỉ có trên bản KidSafe chạy đầy đủ." }, { status: 404 });
  };
})();
