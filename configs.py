

import os

class Configs:
    # 全局数据库：登录用
    GLOBAL_DB: str = os.getenv("GLOBAL_DB_PATH", "dbs/global.db")
    USER_DB_PATH: str = os.getenv("USER_DB_PATH", "dbs/user_dbs/")

    # DeepSeek 配置（从环境变量读取）
    API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
    BASE_URL: str = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
    MODEL_NAME: str = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

configs = Configs()