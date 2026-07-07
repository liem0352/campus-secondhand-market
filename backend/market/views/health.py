"""
健康检查视图 — 提供给 k8s / 负载均衡 / 前端探活使用。

说明：
    - 该文件提前在 market.views 包内创建，确保 config/urls.py 的 include 与
      health_check 引用不会因为 views 包空导致 import 失败。
    - 后续业务 agent 可在 views 包下继续追加 *_views.py 子模块。
"""
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """最简的 GET /api/health/ 探活接口。

    函数功能：
        - 不依赖数据库（避免 DB 抖动时探活误报）；
        - 始终返回 200 + {status: ok}。
    """

    # 显式声明无需鉴权，便于监控系统匿名调用
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, *args, **kwargs):
        """处理 GET 请求：返回服务存活状态。"""
        # 业务码 0 + 业务消息 ok + data 信封（与 market.response 保持一致）
        return Response({
            'code': 0,
            'message': 'ok',
            'data': {'status': 'ok', 'service': 'campus-market'},
        })


def health_check(request, *args, **kwargs):
    """函数式健康检查入口 — 与 HealthCheckView 行为一致。

    使用 JsonResponse 而非 DRF Response，因为函数式视图不会被 DRF 的
    renderer/context 流程处理，直接返回 DRF Response 会触发
    ``.accepted_renderer not set on Response`` 异常。
    """
    return JsonResponse({
        'code': 0,
        'message': 'ok',
        'data': {'status': 'ok', 'service': 'campus-market'},
    })
