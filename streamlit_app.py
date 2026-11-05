"""Authenticated, read-only UI preview for Streamlit Community Cloud."""

from base64 import b64encode
from hmac import compare_digest
from pathlib import Path
import re
from zipfile import ZipFile

from jinja2 import Environment
import streamlit as st
from streamlit.errors import StreamlitSecretNotFoundError

ROOT = Path(__file__).resolve().parent
ASSET_ARCHIVE = ROOT / "dashboard-assets.zip"
DASHBOARD = ROOT / "dashboard"
if not DASHBOARD.is_dir():
    DASHBOARD = ROOT.parents[1] / "dashboard"

VIEWS = {
    "overview": "Tổng quan",
    "time": "Thời gian & lịch",
    "apps": "Ứng dụng",
    "web": "Lọc website",
    "requests": "Yêu cầu từ con",
    "devices": "Thiết bị & ghép đôi",
    "quick-control": "Điều khiển nhanh",
    "reports": "Báo cáo",
    "privacy": "Minh bạch & dữ liệu",
}
CHILD = {"id": "demo", "name": "An · hồ sơ mẫu"}
ACTOR = {"username": "Phụ huynh demo", "role": "parent"}
CSP = (
    "default-src 'none'; img-src data:; script-src 'unsafe-inline'; "
    "style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"
)


def dashboard_asset(name):
    if ASSET_ARCHIVE.is_file():
        with ZipFile(ASSET_ARCHIVE) as archive:
            return archive.read(name)
    return (DASHBOARD / name).read_bytes()


@st.cache_data(show_spinner=False)
def render_page(view):
    template = {"login": "login.html", "child": "child.html"}.get(view, "parent.html")
    source = dashboard_asset(f"templates/{template}").decode("utf-8")
    html = Environment(autoescape=True).from_string(source).render(
        actor=ACTOR, children=[CHILD], child=CHILD, view=view,
        views=VIEWS, title=VIEWS.get(view, "Hôm nay của em"),
    )
    html = re.sub(r'<script src="/static/[^"]+" defer></script>', "", html)
    css = dashboard_asset("static/app.css").decode("utf-8")
    if view == "login":
        css += dashboard_asset("static/login.css").decode("utf-8")
        image = b64encode(dashboard_asset("static/images/login-family.png")).decode("ascii")
        html = html.replace("/static/images/login-family.png", f"data:image/png;base64,{image}")
        html = html.replace(
            "Dành cho phụ huynh và tài khoản riêng của trẻ.",
            "Bản xem trước dành cho phụ huynh. Dùng tài khoản demo được nhóm cung cấp.",
        )
        html = html.replace(
            'id="login-form"', 'id="login-form" autocomplete="off" method="post"'
        ).replace('autocomplete="current-password"', 'autocomplete="off"')
        html = html.replace('type="submit"', 'type="submit" disabled', 1)
    else:
        sample_data = (ROOT / "sample_data.js").read_text(encoding="utf-8")
        scripts = sample_data + "\n" + dashboard_asset("static/app.js").decode("utf-8")
        html = html.replace("</head>", f"<script>{scripts}</script></head>")
        label = (
            '<p class="preview-label" role="note">Bản xem trước · Dữ liệu minh họa · '
            'Thao tác ghi bị tắt</p>'
        )
        if view == "child":
            html = html.replace('<main class="child-canvas">', f'<main class="child-canvas">{label}')
            html = html.replace("</main>", '<p><a href="/app/overview">Về trang phụ huynh</a></p></main>')
        else:
            html = html.replace('<main id="content" class="canvas">', f'<main id="content" class="canvas">{label}')
        css += """
        .preview-label {
            margin: 0 0 14px;
            padding: 8px 12px;
            border-left: 3px solid var(--accent);
            background: var(--surface);
            font-size: 14px;
        }
        """
    html = re.sub(r'<link rel="stylesheet" href="/static/[^"]+">', "", html)
    head = f'<meta http-equiv="Content-Security-Policy" content="{CSP}"><style>{css}</style>'
    return html.replace("<head>", f"<head>{head}", 1)


def credentials():
    try:
        username, password = st.secrets["demo_username"], st.secrets["demo_password"]
    except (KeyError, StreamlitSecretNotFoundError):
        return None
    if (isinstance(username, str) and username and username == username.strip() and isinstance(password, str)
            and len(password) >= 12 and password != "THAY_BANG_MAT_KHAU_DEMO_MOI"):
        return username, password
    return None


def valid_login(submission, expected):
    if not isinstance(submission, dict) or expected is None:
        return False
    username, password = submission.get("username"), submission.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return False
    username_matches = compare_digest(username.strip().encode(), expected[0].encode())
    password_matches = compare_digest(password.encode(), expected[1].encode())
    return username_matches and password_matches


def handle_login():
    if st.session_state.get("preview_authenticated", False):
        return
    if valid_login(st.session_state.kidsafe_frame.login, credentials()):
        st.session_state.update(preview_authenticated=True, preview_view="overview", preview_login_error="")
    else:
        st.session_state.preview_login_error = "Tài khoản hoặc mật khẩu demo chưa đúng."


def handle_navigation():
    if not st.session_state.get("preview_authenticated", False):
        return
    target = st.session_state.kidsafe_frame.navigate
    if target == "logout":
        st.session_state.update(preview_authenticated=False, preview_login_error="")
    elif isinstance(target, str) and (target in VIEWS or target == "child"):
        st.session_state.preview_view = target


def main():
    st.set_page_config(page_title="KidSafe · Bản xem trước", layout="wide")
    st.html("""<style>
      [data-testid="stMainBlockContainer"] {max-width:none; padding:0;}
      [data-testid="stHeader"] {display:none;}
    </style>""")
    mount = st.components.v2.component(
        "kidsafe_preview",
        html='<iframe title="Giao diện KidSafe" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>',
        css="iframe {display:block; width:100%; height:100dvh; border:0; background:#f5efe6;}",
        js=(ROOT / "preview_frame.js").read_text(encoding="utf-8"),
    )
    expected = credentials()
    authenticated = st.session_state.get("preview_authenticated", False) and expected is not None
    view = st.session_state.get("preview_view", "overview") if authenticated else "login"
    notice = st.session_state.get("preview_login_error", "")
    if expected is None:
        notice = "Bản xem trước đang chờ cấu hình tài khoản demo."
    mount(
        key="kidsafe_frame",
        data={"html": render_page(view), "view": view, "notice": notice,
              "configured": expected is not None},
        on_login_change=handle_login,
        on_navigate_change=handle_navigation,
    )


if __name__ == "__main__":
    main()
