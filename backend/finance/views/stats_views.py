from datetime import date

from rest_framework.response import Response
from rest_framework.views import APIView

from finance.response import ok
from finance.services.stats_service import StatsService


def _parse_user_id(request):
    uid = request.query_params.get('user_id')
    return int(uid) if uid else None


class StatsSummaryView(APIView):
    def get(self, request):
        return ok(StatsService().summary(_parse_user_id(request)))


class StatsDailyView(APIView):
    def get(self, request):
        d = request.query_params.get('date') or date.today().isoformat()
        try:
            target = date.fromisoformat(d)
        except ValueError:
            return Response({'code': 40001, 'message': 'date 格式错误', 'data': None}, status=400)
        return ok(StatsService().daily(target, _parse_user_id(request)))


class StatsWeeklyView(APIView):
    def get(self, request):
        ws = request.query_params.get('week_start')
        if not ws:
            return Response({'code': 40001, 'message': '缺少 week_start', 'data': None}, status=400)
        try:
            week_start = date.fromisoformat(ws)
        except ValueError:
            return Response({'code': 40001, 'message': 'week_start 格式错误', 'data': None}, status=400)
        return ok(StatsService().weekly(week_start, _parse_user_id(request)))


class StatsMonthlyView(APIView):
    def get(self, request):
        month = request.query_params.get('month')
        if not month:
            return Response({'code': 40001, 'message': '缺少 month', 'data': None}, status=400)
        return ok(StatsService().monthly(month, _parse_user_id(request)))


class StatsAnnualView(APIView):
    def get(self, request):
        year = request.query_params.get('year')
        if not year:
            return Response({'code': 40001, 'message': '缺少 year', 'data': None}, status=400)
        return ok(StatsService().annual(int(year), _parse_user_id(request)))
