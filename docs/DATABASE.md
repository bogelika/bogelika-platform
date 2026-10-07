# DATABASE

## tg_reports_pilot

### Назначение
Основная таблица, в которой хранится полностью собранный отчёт мастера после завершения проверки.

### Что хранит
- полный текст отчёта
- информацию о студии
- мастере
- клиенте
- статусе отчёта
- ссылки на фотографии
- report_key
- даты создания и обновления
- связь с реестром сотрудников (новые поля, см. ниже)

### Основные поля
- id
- report_key
- studio
- master
- client
- report_text
- photo_links
- status
- created_at
- updated_at
- **master_staff_id** — id из `staff_directory_pilot` (планируется)
- **submitted_by_user_id** — Telegram user id отправителя (планируется)

### Возможные статусы
- pending — отчёт ещё собирается
- incomplete — ожидается дополнение
- completed — отчёт полностью заполнен
- cancelled — сессия завершена без сохранения (если появится)

### Кто использует
- Telegram Bot
- n8n Workflow «Приём отчётов мастеров» / единый бот
- Subflow поиска отчётов
- Google Sheets
- В будущем — YCLIENTS

---

## tg_report_sessions_pilot

### Назначение
Активная сессия пользователя в Telegram (отчёт, поиск, ожидание ввода).

### Планируемое расширение
- **mode** — `idle` | `report` | `search` (режим после нажатия «Мои отчёты»)

---

## tg_report_parts_pilot

Без изменений: части альбомов до сборки.

---

## staff_directory_pilot

### Назначение
Канонический реестр сотрудников с доступом к боту и личному кабинету.

### Основные поля
- id
- studio
- full_name
- role — `master` | `manager` | `admin`
- status — `active` | `disabled`
- telegram_user_id
- telegram_username
- hired_at
- left_at
- notes
- created_at
- updated_at

### Кто использует
- Subflow проверки доступа
- Поиск отчётов (фильтр по роли)
- Mini App / Cabinet API
- Управляющие (offboarding)

Подробнее: [UNIFIED_BOT_AND_CABINET.md](./UNIFIED_BOT_AND_CABINET.md)

---

## staff_access_events_pilot

### Назначение
Журнал изменений доступа (опционально, этап 1.1).

### Основные поля
- id
- staff_id
- event_type — `linked_telegram` | `disabled` | `enabled` | `role_changed`
- actor_staff_id
- payload_json
- created_at
