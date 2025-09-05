# /api/api_server.py
from pathlib import Path
import sys

# --- 프로젝트 루트(= api의 부모)를 모듈 경로에 추가 ---
ROOT = Path(__file__).resolve().parents[1]   # C:\eldorado\wisesaying
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# 뉴스 크롤러 임포트
from newscrawling.crawl_naver_news import fetch_center_titles

app = Flask(__name__)
# '/api/xxx/' 끝 슬래시도 허용
app.url_map.strict_slashes = False
# 개발용 CORS (배포 시 도메인 제한 권장)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ---------------------------
# (데모용) 인메모리 사용자 저장소
# ---------------------------
USERS: dict[str, dict] = {}  # key=email(lowercased), value={"email","nickname","password"}

# ---------------------------
# 공통 유틸
# ---------------------------
def dedupe(rows):
    seen = set()
    uniq = []
    for r in rows:
        key = r.get("aid") or r.get("link")
        if key in seen:
            continue
        seen.add(key)
        uniq.append(r)
    return uniq

def is_api_request() -> bool:
    return (request.path or "").startswith("/api/")

def _merge_json_form_args() -> dict:
    """
    요청 본문을 JSON -> (중첩 래퍼 해제: data/payload/formData/body) -> form -> querystring 순서로 병합
    """
    merged: dict = {}

    # 1) JSON
    j = request.get_json(silent=True)
    if isinstance(j, dict):
        merged.update(j)
        # 한 단계 래퍼만 싸여온 케이스 {data:{...}} 등 풀기
        if len(j) == 1:
            only_v = next(iter(j.values()))
            if isinstance(only_v, dict):
                merged.update(only_v)
        # 흔한 래퍼 키들
        for k in ("data", "payload", "formData", "body"):
            v = j.get(k)
            if isinstance(v, dict):
                merged.update(v)

    # 2) form (application/x-www-form-urlencoded, multipart/form-data)
    if request.form:
        merged.update(request.form.to_dict())

    # 3) querystring (실수로 GET으로 보냈을 때를 위해)
    if request.args:
        merged.update(request.args.to_dict())

    return merged

def _pick_first(merged: dict, keys: list[str]) -> str:
    for k in keys:
        v = merged.get(k)
        if isinstance(v, str):
            v = v.strip()
        if v:
            return v
    return ""

def read_credentials():
    """
    로그인 credentials 추출:
    - 아이디: email/id/userId/username/login/user/loginId 등
    - 비밀번호: password/pwd/pass 등
    """
    merged = _merge_json_form_args()
    email_or_id = _pick_first(merged, ["email", "id", "userId", "username", "login", "user", "loginId"])
    password    = _pick_first(merged, ["password", "pwd", "pass"])
    return email_or_id, password, merged

def read_signup_fields():
    """
    회원가입 필드 추출:
    - email: email/id/username 중 우선
    - password: password/pwd/pass
    - nickname: nickname/name/nick/displayName
    """
    merged = _merge_json_form_args()
    email    = _pick_first(merged, ["email", "id", "username"])
    password = _pick_first(merged, ["password", "pwd", "pass"])
    nickname = _pick_first(merged, ["nickname", "name", "nick", "displayName"])
    return email, password, nickname, merged

# ─────────────────────────────────────────────────────
# 디버그: 크롤러 소스코드 내려주기
# ─────────────────────────────────────────────────────
@app.get("/api/debug/crawler")
def api_debug_crawler():
    """
    crawl_naver_news.py 원본을 text/plain 으로 반환
    오류 시 JSON으로 에러/경로 반환
    """
    try:
        p = ROOT / "newscrawling" / "crawl_naver_news.py"
        text = p.read_text(encoding="utf-8")
        return Response(text, mimetype="text/plain; charset=utf-8")
    except Exception as e:
        return jsonify({"error": f"{type(e).__name__}: {e}", "path": str(p)}), 500
        
# ---------------------------
# 에러 핸들러 (API는 HTML 대신 JSON 응답)
# ---------------------------
@app.errorhandler(404)
def err_404(e):
    if is_api_request():
        return jsonify({"error": "NOT_FOUND", "path": request.path}), 404
    return e

@app.errorhandler(405)
def err_405(e):
    if is_api_request():
        return jsonify({"error": "METHOD_NOT_ALLOWED", "path": request.path}), 405
    return e

# ---------------------------
# 헬스체크 / 디버그
# ---------------------------
@app.get("/api/health")
def api_health():
    return jsonify({"ok": True})

@app.post("/api/_echo")
def api_echo():
    payload = {
        "content_type": request.headers.get("content-type", ""),
        "merged": _merge_json_form_args(),
    }
    print("[ECHO]", payload)
    return jsonify(payload)

# ---------------------------
# 뉴스 API
# ---------------------------
@app.get("/api/news")
def api_news():
    """GET /api/news?date=YYYYMMDD&debug=true"""
    try:
        date = request.args.get("date")
        debug = str(request.args.get("debug", "false")).lower() == "true"

        # 간단 형식 검증
        if date and (len(date) != 8 or not date.isdigit()):
            return jsonify({"error": "INVALID_DATE_FORMAT", "hint": "YYYYMMDD"}), 400

        rows = fetch_center_titles(date_str=date, debug=debug)   # title, link, press, time, aid...
        items = dedupe(rows)
        return jsonify({"count": len(items), "items": items})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": f"{type(e).__name__}: {e}"}), 500

# ---------------------------
# 회원가입 API
# ---------------------------
@app.post("/api/signup")
def api_signup():
    """
    회원가입: POST /api/signup
    Body: JSON/form/querystring 모두 허용
          { email|id|username, password|pwd|pass, nickname|name|nick|displayName }
    """
    email, password, nickname, merged = read_signup_fields()

    if not email or not password or not nickname:
        return jsonify({"ok": False, "error": "MISSING_FIELDS", "merged_keys": list(merged.keys())}), 400

    email_l = email.lower()
    if email_l in USERS:
        return jsonify({"ok": False, "error": "ALREADY_EXISTS"}), 409

    USERS[email_l] = {"email": email_l, "nickname": nickname, "password": password}
    return jsonify({"ok": True, "user": {"email": email_l, "nickname": nickname}}), 201

# ---------------------------
# 로그인 API
# ---------------------------
@app.post("/api/login")
def api_login():
    """
    로그인: POST /api/login
    Body: JSON/form/querystring 모두 허용
          { email|id|userId|username|login|user|loginId, password|pwd|pass }
    """
    email_raw, password, merged = read_credentials()
    email_l = (email_raw or "").lower()

    # 디버그 로그 (무슨 키로 들어왔는지 바로 확인)
    print("[LOGIN]", {
        "ct": request.headers.get("content-type", ""),
        "email_raw": email_raw,
        "merged_keys": list(merged.keys())
    })

    if not email_l or not password:
        return jsonify({"ok": False, "error": "MISSING_CREDENTIALS"}), 400

    # 가입 사용자 우선
    user = USERS.get(email_l)
    if user and user.get("password") == password:
        return jsonify({"ok": True, "user": {"nickname": user["nickname"], "email": user["email"]}})

    # 데모 계정
    if email_l == "test@example.com" and password == "pass1234":
        return jsonify({"ok": True, "user": {"nickname": "테스트유저", "email": email_raw}})

    return jsonify({"ok": False, "error": "INVALID_CREDENTIALS"}), 401

# ---------------------------
# 서버 실행
# ---------------------------
if __name__ == "__main__":
    # 루트에서 실행:  python api\api_server.py
    app.run(host="127.0.0.1", port=5000, debug=True)
