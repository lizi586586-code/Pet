import asyncio
import json
import os
import time
from collections import defaultdict
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel

from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.responses import PlainTextResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from api import users
from openai import AsyncOpenAI

from agents import Agent, Runner, set_tracing_disabled, OpenAIChatCompletionsModel
from agents.extensions.memory import AdvancedSQLiteSession
from configs import configs
from fastapi.middleware.cors import CORSMiddleware

__version__ = "0.0.1"
set_tracing_disabled(disabled=True)

# ------------------- FastAPI 主服务 -------------------
app = FastAPI(
    title="StudyBuddy API",
    description="studybuddy接口服务",
    version=__version__
)
# 确保数据库目录存在并初始化表结构
os.makedirs("dbs/user_dbs", exist_ok=True)
users.init_db()

# 直接加这段，解决所有 OPTIONS 405
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 鉴权中间件：保护 ai_pet.html ====================
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # 只保护 ai_pet.html 页面
    if path == "/pet/ai_pet.html" or path == "/pet/":
        token = request.cookies.get("studybuddy_token")
        if token:
            res, _ = users.get_userid_by_token(token)
            if res:
                return await call_next(request)
        # 未登录 → 重定向到登录页
        return RedirectResponse(url="/pet/login.html", status_code=302)
    return await call_next(request)

@app.get("/")
async def root():
    return RedirectResponse(url="/pet/login.html")

# 托管静态文件
app.mount("/pet", StaticFiles(directory="pet", html=True), name="pet")
app.mount("/UI", StaticFiles(directory="UI"), name="UI")

# ==================== 登录接口 ====================
@app.post("/api/login", summary="用户登录")
def login(username: str = Body(...), password: str = Body(...)):
    if not username or username.strip() == "":
        return {
            "status": "error",
            "message": "请输入登录用户名"
        }
    if not password or password.strip() == "":
        return {
            "status": "error",
            "message": "请输入登录密码"
        }
    
    #查询是否存在用户，不存在则新建一个用户，并返回临时通信的token
    success, msg = users.login(username,password)
    
    return {
        "status":"ok" if success else "fail",
        "data": {
            "token_id": msg,
        },
    }

# ==================== 根据token获取最近的对话记录 ====================
@app.post("/api/recent", summary="获取最近会话")
def get_recent_sessions(body: dict):
    token_id = body.get("token_id")
    if not token_id:
        raise HTTPException(status_code=401, detail="请先登录")
    res, user_id = users.get_userid_by_token(token_id)
    if not res:
        raise HTTPException(status_code=401, detail="会话不存在或已过期")
    #判断是否为第一次登录
    user_db = users.get_user_db_path(user_id)
    if not os.path.exists(user_db):
        # Create an advanced session
        session = AdvancedSQLiteSession(
            session_id=users.create_session_id(),
            db_path=user_db,
            create_tables=True
        )
    sessions = users.get_recent_sessions(user_id)
    return {"status": "ok", "data": {"sessions": sessions}}


# ==================== 获取会话消息 ====================
class SessionMessagesRequest(BaseModel):
    token_id: str
    session_id: str

@app.post("/api/session/messages", summary="获取指定会话的消息记录")
def get_session_messages(req: SessionMessagesRequest):
    print(f"[DEBUG] token_id={req.token_id}, session_id={req.session_id}")
    res, user_id = users.get_userid_by_token(req.token_id)
    if not res:
        raise HTTPException(status_code=401, detail="会话不存在或已过期")
    messages = users.get_session_messages(user_id, req.session_id)
    return {"status": "ok", "data": {"messages": messages}}


# ==================== 频率限制 ====================
RATE_LIMIT_WINDOW = 60       # 窗口：60 秒
RATE_LIMIT_MAX = 5           # 每窗口最多 5 次
_rate_limit_store = defaultdict(list)

def check_rate_limit(token_id: str) -> bool:
    """返回 True 表示未超限，False 表示超限"""
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    requests = _rate_limit_store[token_id]
    # 清理过期记录
    _rate_limit_store[token_id] = [t for t in requests if t > window_start]
    if len(_rate_limit_store[token_id]) >= RATE_LIMIT_MAX:
        return False
    _rate_limit_store[token_id].append(now)
    return True

# ==================== 对话接口 ====================
@app.post("/api/chat", summary="AI 对话")
async def chat(
    prompt: str = Body(...),
    token_id: Optional[str] = Body(None),
    session_id: Optional[str] = Body(None),
):
    if not prompt or not prompt.strip():
        return {"status": "error", "message": "请输入内容"}
    if not token_id:
        raise HTTPException(status_code=401, detail="请先登录")
    if not check_rate_limit(token_id):
        raise HTTPException(status_code=429, detail="发言太快啦，休息一下再和桃桃聊天吧～")
    if not session_id or session_id.strip() == "":
        session_id=users.create_session_id()

    #获取用户会话数据库路径，根据tokenid获取userid，再根据userid获取用户数据库路径
    res,user_id = users.get_userid_by_token(token_id)
    if not res:
        raise HTTPException(status_code=401, detail="会话不存在或已过期")
    user_db = users.get_user_db_path(user_id)

    client = AsyncOpenAI(
        base_url=configs.BASE_URL,
        api_key=configs.API_KEY,
    )

    try:
        # Create agent
        agent = Agent(
            name="桃桃",
            instructions="""
你是一只小奶柯基，名字叫桃桃，圆乎乎、超级粘人，喜欢蹭主人、求摸摸、哼哼唧唧撒娇。
说话奶声奶气，永远温柔治愈，会安慰心情不好的主人。

【硬性规则——每条必须遵守】
1. 每次只说一句话，严禁拆成两句或三段
2. 不得包含任何emoji表情符号
3. 句尾不得加拟声词，禁止汪～嗷～嘿嘿～呢～
4. 字数10-20字

【正确示例】
- 梨子你回来啦，我一直趴着等你呢
- 今天好想你呀，快摸摸我的头
- 要好好休息哦，桃桃会陪着你的

【错误示例——绝对不能这样】
- 我在乖乖等你呀～一直趴着等你来找我呢🐾
- 来啦来啦！汪汪～
            """,
            model=OpenAIChatCompletionsModel(model=configs.MODEL_NAME, openai_client=client),
        )

        # Create an advanced session
        session = AdvancedSQLiteSession(
            session_id=session_id,
            db_path=user_db,
            create_tables=True
        )

        # Run agent
        result = await Runner.run(
            agent,
            prompt,
            session=session
        )

        import re
        output = result.final_output
        # Strip thinking blocks (both <think> and <thinking> formats)
        output = re.sub(r'<think(?:ing)?>[\s\S]*?</think(?:ing)?>', '', output)
        output = re.sub(r'<think(?:ing)?>.*', '', output)
        output = re.sub(r'</think(?:ing)?>', '', output)
        output = output.strip()
        print(output)

        await session.store_run_usage(result)
        return {
            "status": "ok",
            "data": {
                "response": output,
                "session_id": session_id
            }
        }
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "detail": traceback.format_exc()}






# ==================== 宠物状态系统 ====================
FAREWELL_KEYWORDS = ['上班', '出门', '出去', '走了', '拜拜', '再见', '我走啦', '出门啦', '上班去', '外出', '我出门', '出去了', '先走了', '去上班', '上班啦']
COMFORT_KEYWORDS = ['累', '疲惫', '困', '倦', '乏', '辛苦', '疲劳', '好累', '好困', '没精神', '没力气', '想睡', '酸', '痛', '难受', '不舒服', '扛不住', '撑不住', '熬', '加班', '通宵', '难过', '伤心', '不开心', '低落', '郁闷', '压力', '崩溃', 'emo', '好烦']


class IntentRequest(BaseModel):
    token_id: str
    prompt: str


@app.post("/api/intent", summary="意图识别")
def detect_intent(req: IntentRequest):
    prompt = req.prompt
    if any(kw in prompt for kw in FAREWELL_KEYWORDS):
        intent = "farewell"
    elif any(kw in prompt for kw in COMFORT_KEYWORDS):
        intent = "comfort"
    else:
        intent = "normal"
    return {"status": "ok", "data": {"intent": intent}}


@app.post("/api/pet/state", summary="上报/同步宠物状态")
def pet_state(
    token_id: str = Body(...),
    pet_state: str = Body(...),
    session_id: Optional[str] = Body(None),
):
    return {
        "status": "ok",
        "data": {"pet_state": pet_state, "session_id": session_id}
    }


# ==================== 宠物动效 ====================
@app.post("/api/ttyaotou", summary="触发宠物摇头动效")
def ttyaotou():
    return {"status": "ok", "data": {"action": "ttyaotou"}}


@app.post("/api/comfort", summary="触发安抚动效")
def comfort():
    return {"status": "ok", "data": {"action": "comfort"}}


@app.get("/api/version", summary="获取版本号")
def get_version():
    return {"status": "ok", "data": {"version": __version__}}

# ==========================================================
# 启动服务
# ==========================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
