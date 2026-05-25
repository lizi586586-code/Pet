"""
用户登录注册，获取用户模型配置信息
"""

import hashlib
import os
import sqlite3
import uuid
import datetime
import json
from configs import configs


#用户登录
def login(username: str, password: str):
    try:
        conn = sqlite3.connect(configs.GLOBAL_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT user_id, password_hash FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if not user:
            #return False, "用户不存在" 就注册一个，返回temptoken
            return register_user(username, password)

        #如果密码正确，则重新生成token，并更新数据库，返回最新的token，但是这样的话就会导致不同端被踢下
        user_id, pwd_hash = user
        if verify_password(password, pwd_hash):
            temp_token = str(uuid.uuid4())
            cursor.execute(
                "UPDATE users SET tmp_token = ? WHERE user_id = ?",
                (temp_token, user_id)
            )
            conn.commit()
            return True, temp_token  # 登录成功
        else:
            return False, "密码错误"
    finally:
        conn.close()

#用户注册
def register_user(username: str, password: str):
    # 1. 写入全局用户表
    conn = sqlite3.connect(configs.GLOBAL_DB)
    cursor = conn.cursor()
    hashed = hash_password(password)
    temp_token = str(uuid.uuid4())
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, tmp_token) VALUES (?, ?, ?)",
            (username, hashed, temp_token)
        )
        conn.commit()
        #cursor.execute("SELECT tmp_token FROM users WHERE username = ?", (username,))
        #user_id = cursor.fetchone()[0]
    finally:
        conn.close()

    return True, temp_token

#获取用户session数据库
def get_user_db_path(user_id: int) -> str:
    return f"{configs.USER_DB_PATH}user_{user_id}.db"

# 加密密码（绝不存明文）
def hash_password(password: str) -> str:
    salt = hashlib.sha256(os.urandom(32)).hexdigest()[:16]
    hash_obj = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${hash_obj.hex()}"

# 验证密码
def verify_password(password: str, hashed: str) -> bool:
    salt, stored_hash = hashed.split("$")
    computed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return computed == stored_hash

# ==================== 临时会话 Token 生成 ====================

def create_temp_token() -> str:
    """生成临时 Token"""
    temp_token = str(uuid.uuid4())
    return temp_token


def is_temp_token(token: str) -> bool:
    """判断是不是临时 Token"""
    return token and token.startswith("temp_")

#根据token获取用户id
def get_userid_by_token(token: str) -> str:
    """从临时 Token 拿到临时用户ID"""
    try:
        conn = sqlite3.connect(configs.GLOBAL_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT user_id FROM users WHERE tmp_token = ?", (token,))
        user_id = cursor.fetchone()

        if not user_id:
            #return False, "用户不存在" 返回null
            return False, "非法访问"

        return True,user_id[0]
    finally:
        conn.close()

#生成seesion_id
def create_session_id():
    # 1. 获取当前时间（精确到秒，不会重复）
    now = datetime.datetime.now()
    
    # 2. 格式化成字符串：年-月-日-时-分-秒
    time_str = now.strftime("%Y%m%d%H%M%S")  # 20251229153045
    return time_str


#根据userid获取该用户的按时间排序，取最近的10个会话记录，获取会话sessionid，和该次会话的第一次用户输入作为会话的标题
def get_recent_sessions(user_id: int, limit: int = 10):
    """获取用户最近的limit个会话记录，返回(session_id, 标题)列表"""
    try:
        conn = sqlite3.connect(get_user_db_path(user_id))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT session_id FROM agent_sessions ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        sessions = cursor.fetchall()
        result = []
        for (session_id,) in sessions:
            cursor.execute(
                "SELECT message_data FROM agent_messages WHERE session_id = ? ORDER BY id ASC LIMIT 1",
                (session_id,)
            )
            row = cursor.fetchone()
            title = ""
            if row:
                try:
                    data = json.loads(row[0])
                    content = data.get("content", "")
                    if isinstance(content, list):
                        title = content[0].get("text", "")[:50] if content else ""
                    elif isinstance(content, str):
                        title = content[:50]
                    if data.get("role") == "user":
                        title = content[:50] if isinstance(content, str) else ""
                except (json.JSONDecodeError, KeyError):
                    title = ""
            result.append((session_id, title))
        return result
    finally:
        conn.close()


def get_session_messages(user_id: int, session_id: str):
    """获取指定会话的所有消息记录"""
    try:
        conn = sqlite3.connect(get_user_db_path(user_id))
        cursor = conn.cursor()
        cursor.execute(
            "SELECT message_data FROM agent_messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,)
        )
        rows = cursor.fetchall()
        messages = []
        for (message_data,) in rows:
            try:
                data = json.loads(message_data)
                content = data.get("content", "")
                role = data.get("role", "assistant")
                if isinstance(content, list):
                    text = ""
                    for item in content:
                        if isinstance(item, dict) and "text" in item:
                            text += item["text"]
                    content = text
                messages.append({"role": role, "content": content})
            except (json.JSONDecodeError, KeyError):
                continue
        return messages
    finally:
        conn.close()