"""
统一分页 — 兼容 envelope 信封格式。

前端约定分页响应形如：
    {
        "code": 0,
        "message": "ok",
        "data": {
            "count": 123,
            "next": "...",
            "previous": "...",
            "results": [...]
        }
    }

本类直接重写 get_paginated_response，无需在每个视图里手动封装。
"""
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class EnvelopePageNumberPagination(PageNumberPagination):
    """带信封的页码分页器。

    属性：
        page_size_query_param: 前端可通过 ?page_size=xx 覆盖默认页大小。
        max_page_size: 单页最大条数，防止误传 100000 拉爆数据库。
    """

    # 允许通过 query string 动态指定页大小
    page_size_query_param = 'page_size'
    # 单页最大条目数（包含未登录测试场景）
    max_page_size = 100

    def get_paginated_response(self, data):
        """将 DRF 默认分页结果改写为 envelope 格式。

        参数：
            data (list): 当前页序列化后的对象列表。

        返回：
            Response: 形如 {code, message, data:{count,next,previous,results}}。
        """
        return Response({
            'code': 0,
            'message': 'ok',
            'data': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'results': data,
            },
        })
