export default function ({ parentElement, data, setTriggerValue }) {
  const frame = parentElement.querySelector("iframe");
  frame.previewListeners?.abort();
  const listeners = new AbortController();
  frame.previewListeners = listeners;
  const options = { signal: listeners.signal };
  let wiredPage;

  function wirePage() {
    const page = frame.contentDocument;
    if (!page?.body || page === wiredPage) return;
    wiredPage = page;
    const notice = page.querySelector("#notice");
    const form = page.querySelector("#login-form");
    if (form) {
      notice.textContent = data.notice;
      notice.classList.toggle("error", Boolean(data.notice));
      form.querySelector("button").disabled = !data.configured;
      form.addEventListener("submit", (event) => {
        if (event.defaultPrevented) return;
        event.preventDefault();
        if (!data.configured) return;
        const fields = new FormData(form);
        setTriggerValue("login", {
          username: fields.get("username"),
          password: fields.get("password"),
        });
        form.elements.password.value = "";
      }, options);
    }

    page.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      if (event.target.closest('[data-action="logout"]')) {
        event.stopImmediatePropagation();
        setTriggerValue("navigate", "logout");
        return;
      }
      const link = event.target.closest("a[href]");
      const path = link?.getAttribute("href");
      if (!path || path.startsWith("#")) return;
      event.preventDefault();
      if (path === "/child" || path.startsWith("/child?")) {
        setTriggerValue("navigate", "child");
      } else if (path.startsWith("/app/")) {
        setTriggerValue("navigate", path.split("?")[0].slice(5));
      } else if (path === "/" && data.view !== "login") {
        setTriggerValue("navigate", "overview");
      } else if (path.endsWith("/reports.csv")) {
        notice.textContent = "Xuất CSV chỉ có trên bản KidSafe chạy đầy đủ.";
        notice.classList.add("error");
      }
    }, { ...options, capture: true });

    if (!form) {
      page.addEventListener("submit", (event) => {
        if (event.target.method === "dialog") return;
        event.preventDefault();
        event.stopImmediatePropagation();
        let message = event.target.querySelector(".preview-form-message");
        if (!message) {
          message = page.createElement("p");
          message.className = "preview-form-message";
          message.setAttribute("role", "alert");
          event.target.append(message);
        }
        message.textContent = "Bản xem trước chỉ hiển thị dữ liệu mẫu. Thay đổi chưa được lưu.";
      }, { ...options, capture: true });
    }
  }

  frame.addEventListener("load", wirePage, options);
  if (frame.srcdoc !== data.html) {
    frame.srcdoc = data.html;
  } else if (frame.contentDocument?.body) {
    wirePage();
  }
  return () => listeners.abort();
}
