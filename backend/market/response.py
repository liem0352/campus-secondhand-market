"""
统一响应封装 — 避免每个视图重复构造信封。

约定：成功响应 code=0；业务异常由 exceptions 模块接管。

使用示例：
    from market.response import ok, created
    return ok({'id': 1})
    return created({'id': 1}, message='发布成功')
"""
from rest_framework.response import Response


def ok(data=None, message: str = 'ok', status: int = 200):
    """构造成功响应。

    参数：
        data: 业务数据（任意可序列化对象）。
        message: 人类可读的成功提示，默认 'ok'。
        status: HTTP 状态码，默认 200。

    返回：
        Response: 信封 {code:0, message, data}。
    """
    return Response({'code': 0, 'message': message, 'data': data}, status=status)


def created(data=None, message: str = 'ok'):
    """构造资源创建成功响应（HTTP 201）。"""
    return ok(data, message, status=201)


def accepted(data=None, message: str = 'accepted'):
    """构造请求已接受但尚未处理完成的响应（HTTP 202），用于异步任务。"""
    return ok(data, message, status=202)


def no_content(message: str = 'ok'):
    """构造无内容响应（HTTP 204），仍带 envelope 便于前端解析。"""
    return Response({'code': 0, 'message': message, 'data': None}, status=204)
