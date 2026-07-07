from django.urls import path

from finance.views.admin_views import AdminConfigView, AdminDashboardView, AdminVoiceStatsView
from finance.views.ai_views import AiAdviceView, AiChatView, AiHistoryView
from finance.views.auth_views import LoginView, LogoutView, RefreshView, RegisterView
from finance.views.budget_views import BudgetDetailView, BudgetListCreateView
from finance.views.category_views import CategoryDetailView, CategoryListCreateView
from finance.views.expense_views import ExpenseBulkDeleteView, ExpenseDetailView, ExpenseListCreateView
from finance.views.stats_views import (
    StatsAnnualView,
    StatsDailyView,
    StatsMonthlyView,
    StatsSummaryView,
    StatsWeeklyView,
)
from finance.views.user_views import MeView, UserDetailView, UserListView
from finance.views.voice_log_views import VoiceLogDetailView, VoiceLogListView
from finance.views.voice_views import VoiceLogConfirmView, VoiceParseView, VoiceTranscribeView

urlpatterns = [
    # auth
    path('auth/register/', RegisterView.as_view()),
    path('auth/login/', LoginView.as_view()),
    path('auth/refresh/', RefreshView.as_view()),
    path('auth/logout/', LogoutView.as_view()),
    # users
    path('users/me/', MeView.as_view()),
    path('users/', UserListView.as_view()),
    path('users/<int:pk>/', UserDetailView.as_view()),
    # categories
    path('categories/', CategoryListCreateView.as_view()),
    path('categories/<int:pk>/', CategoryDetailView.as_view()),
    # expenses
    path('expenses/', ExpenseListCreateView.as_view()),
    path('expenses/bulk-delete/', ExpenseBulkDeleteView.as_view()),
    path('expenses/<int:pk>/', ExpenseDetailView.as_view()),
    # stats
    path('stats/summary/', StatsSummaryView.as_view()),
    path('stats/daily/', StatsDailyView.as_view()),
    path('stats/weekly/', StatsWeeklyView.as_view()),
    path('stats/monthly/', StatsMonthlyView.as_view()),
    path('stats/annual/', StatsAnnualView.as_view()),
    # budgets
    path('budgets/', BudgetListCreateView.as_view()),
    path('budgets/<int:pk>/', BudgetDetailView.as_view()),
    # ai
    path('ai/chat/', AiChatView.as_view()),
    path('ai/advice/', AiAdviceView.as_view()),
    path('ai/history/', AiHistoryView.as_view()),
    # voice
    path('voice/parse/', VoiceParseView.as_view()),
    path('voice/transcribe/', VoiceTranscribeView.as_view()),
    path('voice/logs/', VoiceLogListView.as_view()),
    path('voice/logs/<int:log_id>/', VoiceLogDetailView.as_view()),
    path('voice/logs/<int:log_id>/confirm/', VoiceLogConfirmView.as_view()),
    # admin
    path('admin/dashboard/', AdminDashboardView.as_view()),
    path('admin/stats/voice-usage/', AdminVoiceStatsView.as_view()),
    path('admin/voice-stats/', AdminVoiceStatsView.as_view()),
    path('admin/config/', AdminConfigView.as_view()),
]
