# KidSafe · Bản xem trước cho phụ huynh

Mở link → đăng nhập KidSafe bằng tài khoản demo → vào **Tổng quan**. Menu giữ giao diện hiện tại của KidSafe và cho xem các trang lịch, ứng dụng, lọc web, yêu cầu, thiết bị, điều khiển, báo cáo và màn hình của trẻ. Tất cả dữ liệu đều là mẫu. Các thao tác lưu, ghép máy, gửi lệnh và xuất CSV chỉ có trên bản KidSafe chạy đầy đủ.

## Deploy miễn phí trên Streamlit Community Cloud

Nếu dùng nút **Choose your files** trên GitHub, giải nén `KidSafe-streamlit-upload.zip` và tải các tệp bên trong lên thư mục gốc của repo. Giữ nguyên tệp `dashboard-assets.zip` bên trong vì app đọc trực tiếp từ tệp này. Gói này dùng các thiết lập nền mặc định của Streamlit. Để tạo lại gói tệp rời, chạy `python -m scripts.package_streamlit_preview --flat` từ repo KidSafe. Sau khi tải tệp lên và bấm **Commit changes**, làm tiếp từ bước 3.

1. Giải nén `KidSafe-streamlit-preview.zip`. Nếu đang ở repo KidSafe và cần tạo lại ZIP sau khi sửa giao diện, chạy `python -m scripts.package_streamlit_preview` từ thư mục gốc.
2. Trên GitHub, tạo một repo **Private**, ví dụ `kidsafe-preview`, và chọn tạo README để có sẵn nhánh `main`. Trong GitHub Desktop, chọn **File → Clone repository** và chọn repo đó. Chép **nội dung đã giải nén** vào thư mục vừa clone, gồm `.streamlit` và `.gitignore`. `streamlit_app.py` và `requirements.txt` cần nằm ngay ở thư mục gốc. Trong GitHub Desktop, bấm **Commit to main → Push origin**.
3. Đăng nhập Streamlit Community Cloud bằng GitHub và cấp quyền cho repo private. Chọn **Create app → Yup, I have an app**. Chọn repo vừa tạo, nhánh `main` và nhập `streamlit_app.py` vào **Main file path**. [Tạo tài khoản và kết nối GitHub](https://docs.streamlit.io/deploy/streamlit-community-cloud/get-started/quickstart) · [Deploy app](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/deploy)
4. Mở **Advanced settings**, chọn **Python 3.12**, rồi nhập hai dòng bên dưới trong **Secrets**. Tự thay mật khẩu mẫu bằng mật khẩu riêng từ 12 ký tự trở lên. Bấm **Save → Deploy**. [Cấu hình Secrets](https://docs.streamlit.io/deploy/streamlit-community-cloud/deploy-your-app/secrets-management)

   ```toml
   demo_username = "parent-demo@kidsafe.example"
   demo_password = "THAY_BANG_MAT_KHAU_DEMO_MOI"
   ```

5. Trong workspace Streamlit, mở **App settings → Sharing**, kiểm tra **Only specific people can view this app**, rồi thêm email các bạn. Gửi link `*.streamlit.app` cùng tài khoản và mật khẩu demo bạn vừa đặt. Nhóm mở lời mời email trước, rồi nhập cặp tài khoản demo trên trang KidSafe. Streamlit Community Cloud cho phép một app riêng tư tại một thời điểm. [Chia sẻ app riêng tư](https://docs.streamlit.io/deploy/streamlit-community-cloud/share-your-app)
6. Thử trên cửa sổ ẩn danh với email đã được mời. Nhập sai mật khẩu để kiểm tra thông báo, sau đó nhập đúng để vào Tổng quan. Thử chuyển sang **Thời gian & lịch** hoặc **Báo cáo**, rồi chọn biểu tượng bánh răng → **Đăng xuất**. Phiên demo gắn với tab Streamlit. Tải lại trang sẽ yêu cầu đăng nhập lại.

Chỉ gửi mật khẩu của bản preview cho nhóm. Giữ `.streamlit/secrets.toml`, `.runtime/lab.json`, database KidSafe và khóa TLS ở máy bạn.

## Chạy thử trên Windows

Trong thư mục đã giải nén (hoặc `demo/streamlit_preview` ở repo KidSafe), mở PowerShell. Dùng Python 3.12 và đặt cấu hình demo ở `.streamlit/secrets.toml` theo mẫu trên. Sau đó chạy:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m streamlit run streamlit_app.py --server.address 127.0.0.1
```
